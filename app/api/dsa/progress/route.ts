import { NextRequest, NextResponse } from "next/server";
import { problemRegistry } from "@/lib/dsa/problem-registry";
import { devStore } from "@/lib/database/dev-store";
import { connectToDatabase } from "@/lib/database/mongodb";
import { DSAProgressModel } from "@/models/DSAProgress";
import { DSASubmissionModel } from "@/models/DSASubmission";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);

    // Derive user ID strictly from authenticated session if available
    const userId = user?.userId || searchParams.get("userId") || "usr_demo_developer";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    let progress: any = null;
    let submissions: any[] = [];
    let totalSubmissions = 0;

    const db = await connectToDatabase();
    if (db) {
      const doc = (await DSAProgressModel.findOne({ userId }).lean()) as any;
      if (doc) progress = doc;

      totalSubmissions = await DSASubmissionModel.countDocuments({ userId });
      const subs = (await DSASubmissionModel.find({ userId })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()) as any[];
      submissions = subs;
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Database service unavailable. Cannot retrieve DSA progress." },
          { status: 503 }
        );
      }

      progress = devStore.dsaProgress.get(userId);
      const allDevSubs = devStore.dsaSubmissions.filter((s) => s.userId === userId);
      totalSubmissions = allDevSubs.length;
      submissions = allDevSubs.slice(skip, skip + limit);
    }

    const solvedIds = new Set<string>(progress?.solvedProblems || []);
    const attemptedIds = new Set<string>(progress?.attemptedProblems || []);
    const bookmarkedIds = new Set<string>(progress?.bookmarkedProblems || []);

    let easySolved = 0,
      mediumSolved = 0,
      hardSolved = 0;
    const topicSolvedCount: Record<string, number> = {};

    for (const id of Array.from(solvedIds)) {
      const prob = problemRegistry.getProblemById(id);
      if (prob) {
        if (prob.difficulty === "easy") easySolved++;
        else if (prob.difficulty === "medium") mediumSolved++;
        else if (prob.difficulty === "hard") hardSolved++;

        topicSolvedCount[prob.primaryTopic] =
          (topicSolvedCount[prob.primaryTopic] || 0) + 1;
      }
    }

    const counts = problemRegistry.getProblemCount();

    return NextResponse.json({
      success: true,
      stats: {
        totalProblems: counts.total,
        totalSolved: solvedIds.size,
        totalAttempted: attemptedIds.size,
        totalBookmarked: bookmarkedIds.size,
        easy: {
          total: counts.easy,
          solved: easySolved,
        },
        medium: {
          total: counts.medium,
          solved: mediumSolved,
        },
        hard: {
          total: counts.hard,
          solved: hardSolved,
        },
        streak: progress?.streakCount || (solvedIds.size > 0 ? 1 : 0),
        lastActiveDate: progress?.lastActiveDate || "",
        topicProgress: topicSolvedCount,
      },
      recentSubmissions: submissions,
      pagination: {
        page,
        limit,
        total: totalSubmissions,
        totalPages: Math.ceil(totalSubmissions / limit),
      },
      solvedProblemIds: Array.from(solvedIds),
      bookmarkedProblemIds: Array.from(bookmarkedIds),
      storage: db ? "mongodb" : "devStore",
    });
  } catch (err: any) {
    console.error("GET /api/dsa/progress error:", err);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
