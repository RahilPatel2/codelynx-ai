import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/models/User";
import { devStore } from "@/lib/database/dev-store";

export const dynamic = "force-dynamic";

const ProfileUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100, "Name too long").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").or(z.literal("")).optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  role: z.string().max(100, "Role too long").optional(),
  company: z.string().max(100, "Company too long").optional(),
  githubHandle: z.string().max(50, "GitHub handle too long").optional(),
});

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectToDatabase();
  let profileData: any = null;

  if (db) {
    let userDoc: any = null;
    try {
      userDoc = await UserModel.findById(sessionUser.userId);
    } catch {
      // Fallback if userId is not ObjectId
    }
    if (!userDoc && sessionUser.email) {
      userDoc = await UserModel.findOne({ email: sessionUser.email.toLowerCase().trim() });
    }
    if (userDoc) {
      profileData = {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        avatarUrl: userDoc.avatarUrl || "",
        authProvider: userDoc.authProvider || "credentials",
        subscription: userDoc.subscription || { plan: "FREE", status: "active" },
        createdAt: userDoc.createdAt ? userDoc.createdAt.toISOString() : new Date().toISOString(),
        bio: userDoc.bio || "",
        role: userDoc.role || "Software Engineer",
        company: userDoc.company || "",
        githubHandle: userDoc.githubHandle || "",
        status: userDoc.status || "active",
      };
    }
  } else {
    const devUser = devStore.users.get(sessionUser.email.toLowerCase().trim());
    if (devUser) {
      profileData = {
        id: devUser.id,
        name: devUser.name,
        email: devUser.email,
        avatarUrl: devUser.avatarUrl || "",
        authProvider: devUser.authProvider || "credentials",
        subscription: devUser.subscription || { plan: "FREE", status: "active" },
        createdAt: devUser.createdAt,
        bio: devUser.bio || "",
        role: devUser.role || "Software Engineer",
        company: devUser.company || "",
        githubHandle: devUser.githubHandle || "",
        status: devUser.status || "active",
      };
    }
  }

  if (!profileData) {
    // Return minimal session details if document not yet created
    profileData = {
      id: sessionUser.userId,
      name: sessionUser.name,
      email: sessionUser.email,
      avatarUrl: "",
      authProvider: "credentials",
      subscription: { plan: "FREE", status: "active" },
      createdAt: new Date().toISOString(),
      bio: "",
      role: "Software Engineer",
      company: "",
      githubHandle: "",
      status: "active",
    };
  }

  return NextResponse.json({ success: true, profile: profileData });
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Security guard: protect email from unverified modification
    if (body.email && body.email.toLowerCase().trim() !== sessionUser.email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: "Email address is verified and cannot be modified directly" },
        { status: 400 }
      );
    }

    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates = parsed.data;
    const email = sessionUser.email.toLowerCase().trim();
    const db = await connectToDatabase();
    let updatedUser: any = null;

    if (db) {
      let userDoc: any = null;
      try {
        userDoc = await UserModel.findById(sessionUser.userId);
      } catch {
        // Fallback
      }
      if (!userDoc) {
        userDoc = await UserModel.findOne({ email });
      }

      if (!userDoc) {
        return NextResponse.json({ error: "User account not found" }, { status: 404 });
      }

      if (updates.name !== undefined) userDoc.name = updates.name.trim();
      if (updates.avatarUrl !== undefined) userDoc.avatarUrl = updates.avatarUrl.trim();
      if (updates.bio !== undefined) userDoc.bio = updates.bio.trim();
      if (updates.role !== undefined) userDoc.role = updates.role.trim();
      if (updates.company !== undefined) userDoc.company = updates.company.trim();
      if (updates.githubHandle !== undefined) userDoc.githubHandle = updates.githubHandle.trim();

      await userDoc.save();

      updatedUser = {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        avatarUrl: userDoc.avatarUrl,
        bio: userDoc.bio,
        role: userDoc.role,
        company: userDoc.company,
        githubHandle: userDoc.githubHandle,
        subscription: userDoc.subscription,
        authProvider: userDoc.authProvider,
        status: userDoc.status,
      };
    } else {
      const devUser = devStore.users.get(email);
      if (!devUser) {
        return NextResponse.json({ error: "User account not found" }, { status: 404 });
      }

      if (updates.name !== undefined) devUser.name = updates.name.trim();
      if (updates.avatarUrl !== undefined) devUser.avatarUrl = updates.avatarUrl.trim();
      if (updates.bio !== undefined) devUser.bio = updates.bio.trim();
      if (updates.role !== undefined) devUser.role = updates.role.trim();
      if (updates.company !== undefined) devUser.company = updates.company.trim();
      if (updates.githubHandle !== undefined) devUser.githubHandle = updates.githubHandle.trim();

      updatedUser = {
        id: devUser.id,
        name: devUser.name,
        email: devUser.email,
        avatarUrl: devUser.avatarUrl,
        bio: devUser.bio,
        role: devUser.role,
        company: devUser.company,
        githubHandle: devUser.githubHandle,
        subscription: devUser.subscription,
        authProvider: devUser.authProvider,
        status: devUser.status,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
