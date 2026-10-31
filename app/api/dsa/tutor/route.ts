import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { problemRegistry } from "@/lib/dsa/problem-registry";
import { askDSATutor } from "@/lib/dsa/tutor";

const TutorRequestSchema = z.object({
  problemSlug: z.string(),
  userCode: z.string().default(""),
  language: z.string().default("python"),
  question: z.string().min(1, "Question cannot be empty"),
  diagnostics: z.array(z.any()).optional(),
  testResults: z.any().optional(),
  revealedHints: z.number().default(0),
  detailLevel: z.string().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TutorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      problemSlug,
      userCode,
      language,
      question,
      diagnostics,
      testResults,
      revealedHints,
      detailLevel,
      conversationHistory,
    } = parsed.data;

    const problem = problemRegistry.getPublicProblemBySlug(problemSlug);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const tutorResult = await askDSATutor({
      problem,
      userCode,
      language,
      diagnostics,
      testResults,
      revealedHints,
      question,
      detailLevel,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      ...tutorResult,
    });
  } catch (err: any) {
    console.error("POST /api/dsa/tutor error:", err);
    return NextResponse.json(
      { error: "Failed to communicate with AI Tutor" },
      { status: 500 }
    );
  }
}
