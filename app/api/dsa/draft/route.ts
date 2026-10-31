import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { devStore } from "@/lib/database/dev-store";
import { connectToDatabase } from "@/lib/database/mongodb";
import { DSAProgressModel } from "@/models/DSAProgress";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const SaveDraftSchema = z.object({
  problemId: z.string(),
  language: z.string(),
  code: z.string(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = SaveDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { problemId, language, code } = parsed.data;

    if (!user && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Authentication required to save drafts in production." },
        { status: 401 }
      );
    }

    const effectiveUserId = user?.userId || parsed.data.userId || "usr_demo_developer";
    const draftData = { code, language, updatedAt: new Date() };

    const db = await connectToDatabase();
    if (db) {
      await DSAProgressModel.findOneAndUpdate(
        { userId: effectiveUserId },
        { $set: { [`drafts.${problemId}_${language}`]: draftData } },
        { upsert: true, new: true }
      );
      return NextResponse.json({
        success: true,
        savedAt: draftData.updatedAt,
        storage: "mongodb",
      });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Database service unavailable. Cannot save draft." },
        { status: 503 }
      );
    }

    // Dev fallback
    const key = `${effectiveUserId}:${problemId}:${language}`;
    devStore.dsaDrafts.set(key, draftData);

    return NextResponse.json({
      success: true,
      savedAt: draftData.updatedAt,
      storage: "devStore",
    });
  } catch (err: any) {
    console.error("POST /api/dsa/draft error:", err);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId");
    const language = searchParams.get("language") || "python";

    if (!problemId) {
      return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
    }

    const effectiveUserId = user?.userId || searchParams.get("userId") || "usr_demo_developer";
    let draft = null;

    const db = await connectToDatabase();
    if (db) {
      const doc = (await DSAProgressModel.findOne({ userId: effectiveUserId }).lean()) as any;
      const dbDraft = doc?.drafts ? (doc.drafts as any)[`${problemId}_${language}`] : null;
      if (dbDraft) draft = dbDraft;
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Database service unavailable." },
          { status: 503 }
        );
      }
      const key = `${effectiveUserId}:${problemId}:${language}`;
      draft = devStore.dsaDrafts.get(key) || null;
    }

    return NextResponse.json({
      success: true,
      draft,
      storage: db ? "mongodb" : "devStore",
    });
  } catch (err: any) {
    console.error("GET /api/dsa/draft error:", err);
    return NextResponse.json({ error: "Failed to retrieve draft" }, { status: 500 });
  }
}
