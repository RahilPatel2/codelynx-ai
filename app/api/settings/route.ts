import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/models/User";
import { devStore } from "@/lib/database/dev-store";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  WorkspaceSettingsSchema,
  WorkspaceSettings,
} from "@/lib/settings/types";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        settings: DEFAULT_WORKSPACE_SETTINGS,
      });
    }

    let savedPreferences: Partial<WorkspaceSettings> = {};

    const db = await connectToDatabase();
    if (db) {
      let userDoc = null;
      try {
        userDoc = await UserModel.findById(user.userId).lean();
      } catch {
        // Fallback to email
      }
      if (!userDoc && user.email) {
        userDoc = await UserModel.findOne({ email: user.email }).lean();
      }
      if (userDoc && userDoc.preferences) {
        savedPreferences = userDoc.preferences;
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Database service unavailable." },
          { status: 503 }
        );
      }
      const devUser = devStore.users.get(user.email);
      if (devUser && devUser.preferences) {
        savedPreferences = devUser.preferences;
      }
    }

    const merged = {
      ...DEFAULT_WORKSPACE_SETTINGS,
      ...savedPreferences,
      keyboardShortcuts: {
        ...DEFAULT_WORKSPACE_SETTINGS.keyboardShortcuts,
        ...(savedPreferences.keyboardShortcuts || {}),
      },
    };

    const parsed = WorkspaceSettingsSchema.safeParse(merged);
    const finalSettings = parsed.success ? parsed.data : DEFAULT_WORKSPACE_SETTINGS;

    return NextResponse.json({
      authenticated: true,
      settings: finalSettings,
    });
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve settings", settings: DEFAULT_WORKSPACE_SETTINGS },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "Authentication required to persist settings on server" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const partialSchema = WorkspaceSettingsSchema.partial();
    const validation = partialSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid settings format", details: validation.error.format() },
        { status: 400 }
      );
    }

    const updates = validation.data;

    let currentPreferences: Partial<WorkspaceSettings> = {};

    const db = await connectToDatabase();
    if (db) {
      let userDoc = null;
      try {
        userDoc = await UserModel.findById(user.userId);
      } catch {
        // Fallback
      }
      if (!userDoc && user.email) {
        userDoc = await UserModel.findOne({ email: user.email });
      }
      if (!userDoc) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      currentPreferences = userDoc.preferences || {};
      const newPreferences = {
        ...currentPreferences,
        ...updates,
        ...(updates.keyboardShortcuts
          ? {
              keyboardShortcuts: {
                ...(currentPreferences.keyboardShortcuts || {}),
                ...updates.keyboardShortcuts,
              },
            }
          : {}),
      };
      userDoc.preferences = newPreferences;
      userDoc.markModified("preferences");
      await userDoc.save();

      const merged = { ...DEFAULT_WORKSPACE_SETTINGS, ...newPreferences };
      return NextResponse.json({
        success: true,
        settings: WorkspaceSettingsSchema.parse(merged),
      });
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Database service unavailable. Cannot save preferences in production." },
          { status: 503 }
        );
      }
      const devUser = devStore.users.get(user.email);
      if (!devUser) {
        return NextResponse.json({ error: "User not found in store" }, { status: 404 });
      }
      currentPreferences = devUser.preferences || {};
      const newPreferences = {
        ...currentPreferences,
        ...updates,
        ...(updates.keyboardShortcuts
          ? {
              keyboardShortcuts: {
                ...(currentPreferences.keyboardShortcuts || {}),
                ...updates.keyboardShortcuts,
              },
            }
          : {}),
      };
      devUser.preferences = newPreferences;
      devStore.users.set(user.email, devUser);

      const merged = { ...DEFAULT_WORKSPACE_SETTINGS, ...newPreferences };
      return NextResponse.json({
        success: true,
        settings: WorkspaceSettingsSchema.parse(merged),
      });
    }
  } catch (err: any) {
    console.error("PATCH /api/settings error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
