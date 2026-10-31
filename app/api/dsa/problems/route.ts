import { NextRequest, NextResponse } from "next/server";
import { problemRegistry } from "@/lib/dsa/problem-registry";
import { devStore } from "@/lib/database/dev-store";
import { connectDB } from "@/lib/database/connection";
import { DSAProgressModel } from "@/models/DSAProgress";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const difficulty = searchParams.get("difficulty") || "all";
    const topic = searchParams.get("topic") || "all";
    const status = searchParams.get("status") || "all";
    const bookmarkedOnly = searchParams.get("bookmarked") === "true";
    const sort = searchParams.get("sort") || "order";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const userId = searchParams.get("userId") || "usr_demo_developer";

    // 1. Get user progress for solved/attempted/bookmarked filters
    let userProgress = devStore.dsaProgress.get(userId);
    if (!userProgress) {
      try {
        const conn = await connectDB();
        if (conn) {
          const doc = await DSAProgressModel.findOne({ userId });
          if (doc) userProgress = doc.toObject();
        }
      } catch (err) {
        // Fallback to empty progress
      }
    }
    const solvedSet = new Set<string>(userProgress?.solvedProblems || []);
    const attemptedSet = new Set<string>(userProgress?.attemptedProblems || []);
    const bookmarkedSet = new Set<string>(userProgress?.bookmarkedProblems || []);

    // 2. Filter from the in-memory registry
    let filtered = problemRegistry.getAllPublicProblems();

    if (difficulty !== "all") {
      filtered = filtered.filter((p) => p.difficulty === difficulty);
    }

    if (topic !== "all") {
      filtered = filtered.filter(
        (p) => p.primaryTopic === topic || p.secondaryTopics.includes(topic)
      );
    }

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.statement.toLowerCase().includes(search) ||
          p.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    if (bookmarkedOnly) {
      filtered = filtered.filter((p) => bookmarkedSet.has(p.id));
    }

    if (status === "solved") {
      filtered = filtered.filter((p) => solvedSet.has(p.id));
    } else if (status === "attempted") {
      filtered = filtered.filter((p) => attemptedSet.has(p.id) && !solvedSet.has(p.id));
    } else if (status === "unsolved") {
      filtered = filtered.filter((p) => !solvedSet.has(p.id));
    }

    // 3. Sorting
    if (sort === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "difficulty") {
      const order = { easy: 1, medium: 2, hard: 3 };
      filtered.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    } else {
      filtered.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    // 4. Pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    // Annotate with solved / bookmarked status for current user
    const annotated = paginated.map((p) => ({
      ...p,
      isSolved: solvedSet.has(p.id),
      isAttempted: attemptedSet.has(p.id),
      isBookmarked: bookmarkedSet.has(p.id),
    }));

    const counts = problemRegistry.getProblemCount();

    return NextResponse.json({
      success: true,
      problems: annotated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        total: counts.total,
        easy: counts.easy,
        medium: counts.medium,
        hard: counts.hard,
        solved: solvedSet.size,
      },
    });
  } catch (err: any) {
    console.error("GET /api/dsa/problems error:", err);
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
  }
}
