import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, createSessionToken } from "@/lib/auth/jwt";
import { createSessionCookieOptions } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/models/User";
import { devStore } from "@/lib/database/dev-store";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[0-9]/, "Password must include at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const lowerEmail = email.toLowerCase().trim();

    const db = await connectToDatabase();
    let userId = "";

    if (db) {
      const existingUser = await UserModel.findOne({ email: lowerEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await UserModel.create({
        name,
        email: lowerEmail,
        passwordHash: hashedPassword,
        authProvider: "credentials",
      });
      userId = newUser._id.toString();
    } else {
      const isLocalDev = !process.env.APP_URL || process.env.APP_URL.includes("localhost") || process.env.APP_URL.includes("127.0.0.1");
      if (process.env.NODE_ENV === "production" && !isLocalDev) {
        return NextResponse.json(
          { error: "Database service is currently unavailable. Please try again shortly." },
          { status: 503 }
        );
      }

      // Development-only store fallback
      if (devStore.users.has(lowerEmail)) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);
      userId = `usr_${Date.now()}`;
      devStore.users.set(lowerEmail, {
        id: userId,
        name,
        email: lowerEmail,
        passwordHash: hashedPassword,
        preferences: {
          theme: "dark",
          defaultLanguage: "python",
          fontSize: 14,
          minimap: true,
          wordWrap: true,
          aiModel: "gemini-3.5-flash",
          verbosity: "balanced",
        },
        createdAt: new Date().toISOString(),
      });
    }

    const token = await createSessionToken({
      userId,
      email: lowerEmail,
      name,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, name, email: lowerEmail },
      message: "Account created successfully.",
    });

    const isHttps = req.nextUrl.protocol === "https:";
    const cookieOpts = createSessionCookieOptions(true, isHttps);
    response.cookies.set(cookieOpts.name, token, cookieOpts);
    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
