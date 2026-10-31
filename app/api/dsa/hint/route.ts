import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { problemRegistry } from "@/lib/dsa/problem-registry";
import { devStore } from "@/lib/database/dev-store";
import { connectDB } from "@/lib/database/connection";
import { DSAProgressModel } from "@/models/DSAProgress";

const RevealHintSchema = z.object({
  problemId: z.string(),
  requestedLevel: z.number().int().min(1).max(3),
  userId: z.string().default("usr_demo_developer"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RevealHintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { problemId, requestedLevel, userId } = parsed.data;
    const problem = problemRegistry.getProblemById(problemId);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const hint = problem.hints.find((h) => h.level === requestedLevel);
    if (!hint) {
      return NextResponse.json({ error: "Invalid hint level" }, { status: 400 });
    }

    // Update revealed hints in devStore
    let progress = devStore.dsaProgress.get(userId) || {
      userId,
      solvedProblems: [],
      attemptedProblems: [],
      bookmarkedProblems: [],
      revealedHints: {},
      drafts: {},
      streakCount: 0,
      lastActiveDate: "",
    };

    const currentLevel = progress.revealedHints?.[problemId] || 0;
    const newMax = Math.max(currentLevel, requestedLevel);
    if (!progress.revealedHints) progress.revealedHints = {};
    progress.revealedHints[problemId] = newMax;
    devStore.dsaProgress.set(userId, progress);

    try {
      const conn = await connectDB();
      if (conn) {
        await DSAProgressModel.findOneAndUpdate(
          { userId },
          { $set: { [`revealedHints.${problemId}`]: newMax } },
          { upsert: true }
        );
      }
    } catch (err) {
      // In-memory fallback
    }

    return NextResponse.json({
      success: true,
      hint: {
        level: hint.level,
        title: hint.title,
        hint: hint.hint,
        nextLevelAvailable: requestedLevel < 3,
      },
      currentRevealedLevel: newMax,
    });
  } catch (err: any) {
    console.error("POST /api/dsa/hint error:", err);
    return NextResponse.json({ error: "Failed to reveal hint" }, { status: 500 });
  }
}
