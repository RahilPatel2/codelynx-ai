import { NextRequest, NextResponse } from "next/server";
import { problemRegistry } from "@/lib/dsa/problem-registry";
import { devStore } from "@/lib/database/dev-store";
import { connectDB } from "@/lib/database/connection";
import { DSAProgressModel } from "@/models/DSAProgress";
import { DSASubmissionModel } from "@/models/DSASubmission";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const problem = problemRegistry.getProblemBySlug(slug);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr_demo_developer";

    // Check user progress for revealed hints & solved state
    let progress = devStore.dsaProgress.get(userId);
    let submissions: any[] = [];

    if (!progress) {
      try {
        const conn = await connectDB();
        if (conn) {
          const doc = await DSAProgressModel.findOne({ userId });
          if (doc) progress = doc.toObject();
          const subs = await DSASubmissionModel.find({
            userId,
            problemId: problem.id,
          })
            .sort({ submittedAt: -1 })
            .limit(10);
          submissions = subs.map((s) => s.toObject());
        }
      } catch (err) {
        // Fallback
      }
    }

    if (submissions.length === 0) {
      submissions = devStore.dsaSubmissions.filter(
        (s) => s.userId === userId && s.problemId === problem.id
      );
    }

    const isSolved = progress?.solvedProblems?.includes(problem.id) || false;
    const isBookmarked = progress?.bookmarkedProblems?.includes(problem.id) || false;
    const revealedHintLevel = progress?.revealedHints?.[problem.id] || 0;

    // Filter hints to only show unlocked ones
    const availableHints = problem.hints.map((h) => ({
      level: h.level,
      title: h.title,
      isUnlocked: h.level <= Math.max(1, revealedHintLevel),
      hint: h.level <= Math.max(1, revealedHintLevel) ? h.hint : "Click 'Reveal Hint' to unlock.",
    }));

    // Strictly omit hiddenTestCases and referenceSolution
    const publicData = {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      primaryTopic: problem.primaryTopic,
      secondaryTopics: problem.secondaryTopics,
      statement: problem.statement,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      constraints: problem.constraints,
      examples: problem.examples,
      starterCode: problem.starterCode,
      publicTestCases: problem.publicTestCases,
      expectedTimeComplexity: problem.expectedTimeComplexity,
      expectedSpaceComplexity: problem.expectedSpaceComplexity,
      requiredConcepts: problem.requiredConcepts,
      prerequisiteConcepts: problem.prerequisiteConcepts,
      hints: availableHints,
      revealedHintLevel: Math.max(1, revealedHintLevel),
      editorial: {
        mainIdea: problem.editorial.mainIdea,
        approach: problem.editorial.approach,
        complexityExplanation: problem.editorial.complexityExplanation,
        timeComplexity: problem.editorial.timeComplexity,
        spaceComplexity: problem.editorial.spaceComplexity,
        referenceCode: isSolved ? problem.editorial.referenceCode : undefined,
      },
      tags: problem.tags,
      isSolved,
      isBookmarked,
      submissions,
    };

    return NextResponse.json({
      success: true,
      problem: publicData,
    });
  } catch (err: any) {
    console.error("GET /api/dsa/problems/[slug] error:", err);
    return NextResponse.json({ error: "Failed to load problem" }, { status: 500 });
  }
}
