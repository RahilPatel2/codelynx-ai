import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { devStore } from "@/lib/database/dev-store";
import { connectToDatabase } from "@/lib/database/mongodb";
import { DSAProgressModel } from "@/models/DSAProgress";
import { getCurrentUser } from "@/lib/auth/session";

const BookmarkSchema = z.object({
  problemId: z.string(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = BookmarkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { problemId } = parsed.data;

    if (!user && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Authentication required to bookmark problems in production." },
        { status: 401 }
      );
    }

    const effectiveUserId = user?.userId || parsed.data.userId || "usr_demo_developer";

    const db = await connectToDatabase();
    if (db) {
      const doc = await DSAProgressModel.findOne({ userId: effectiveUserId });
      const currentBookmarks: string[] = doc?.bookmarkedProblems || [];
      const hasBookmark = currentBookmarks.includes(problemId);
      const isBookmarked = !hasBookmark;

      if (isBookmarked) {
        await DSAProgressModel.findOneAndUpdate(
          { userId: effectiveUserId },
          { $addToSet: { bookmarkedProblems: problemId } },
          { upsert: true, new: true }
        );
      } else {
        await DSAProgressModel.findOneAndUpdate(
          { userId: effectiveUserId },
          { $pull: { bookmarkedProblems: problemId } },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({
        success: true,
        isBookmarked,
        problemId,
        storage: "mongodb",
      });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Database service unavailable. Cannot save bookmark." },
        { status: 503 }
      );
    }

    // Development fallback
    let progress = devStore.dsaProgress.get(effectiveUserId) || {
      userId: effectiveUserId,
      solvedProblems: [],
      attemptedProblems: [],
      bookmarkedProblems: [],
      revealedHints: {},
      drafts: {},
      streakCount: 0,
      lastActiveDate: "",
    };

    let isBookmarked = false;
    const bSet = new Set<string>(progress.bookmarkedProblems || []);
    if (bSet.has(problemId)) {
      bSet.delete(problemId);
      isBookmarked = false;
    } else {
      bSet.add(problemId);
      isBookmarked = true;
    }
    progress.bookmarkedProblems = Array.from(bSet);
    devStore.dsaProgress.set(effectiveUserId, progress);

    return NextResponse.json({
      success: true,
      isBookmarked,
      problemId,
      storage: "devStore",
    });
  } catch (err: any) {
    console.error("POST /api/dsa/bookmark error:", err);
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 });
  }
}
