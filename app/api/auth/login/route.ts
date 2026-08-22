import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword, createSessionToken, hashPassword } from "@/lib/auth/jwt";
import { createSessionCookieOptions } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/models/User";
import { devStore } from "@/lib/database/dev-store";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    let userObj: { id: string; name: string; email: string; passwordHash: string } | null = null;

    const db = await connectToDatabase();
    if (db) {
      let user = await UserModel.findOne({ email: lowerEmail });
      
      // Seed demo user in MongoDB Atlas if logging in as demo and not yet seeded
      if (!user && lowerEmail === "demo@codelynx.ai" && password === "Password123!") {
        const hashedDemoPassword = await hashPassword("Password123!");
        user = await UserModel.create({
          name: "Alex Lynx (Staff Engineer)",
          email: "demo@codelynx.ai",
          passwordHash: hashedDemoPassword,
          authProvider: "credentials",
          preferences: {
            theme: "codelynx-dark",
            defaultLanguage: "python",
            fontSize: 14,
            minimap: true,
            wordWrap: true,
            aiModel: "gemini-3.5-flash",
            verbosity: "balanced",
          },
        });
      }

      if (user) {
        userObj = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash || "",
        };
      }
    } else {
      const isLocalDev = !process.env.APP_URL || process.env.APP_URL.includes("localhost") || process.env.APP_URL.includes("127.0.0.1");
      if (process.env.NODE_ENV === "production" && !isLocalDev) {
        return NextResponse.json(
          { error: "Database service is currently unavailable. Please try again shortly." },
          { status: 503 }
        );
      }

      const devUser = devStore.users.get(lowerEmail);
      if (devUser) {
        userObj = {
          id: devUser.id,
          name: devUser.name,
          email: devUser.email,
          passwordHash: devUser.passwordHash,
        };
      }
    }

    if (!userObj) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password via bcrypt hash; only allow demo shortcut in non-production or if explicitly permitted
    const isBcryptValid = await verifyPassword(password, userObj.passwordHash);
    const allowDemo = process.env.ALLOW_DEMO_LOGIN === "true" || process.env.NODE_ENV !== "production";
    const isDemoOverride = allowDemo && password === "Password123!" && lowerEmail === "demo@codelynx.ai";

    if (!isBcryptValid && !isDemoOverride) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: userObj.id,
      email: userObj.email,
      name: userObj.name,
    });

    const isHttps = req.nextUrl.protocol === "https:";
    const cookieOpts = createSessionCookieOptions(rememberMe, isHttps);
    const response = NextResponse.json({
      success: true,
      user: {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
      },
      message: "Authentication successful",
    });

    response.cookies.set(cookieOpts.name, token, cookieOpts);
    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}
