import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { problemRegistry } from "@/lib/dsa/problem-registry";
import { evaluateSubmission } from "@/lib/dsa/judging";
import { getCurrentUser } from "@/lib/auth/session";

const SubmitRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  problemSlug: z.string(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = SubmitRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, problemSlug } = parsed.data;
    const effectiveUserId = user?.userId || parsed.data.userId || "usr_demo_developer";
    const problem = problemRegistry.getProblemBySlug(problemSlug);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Evaluate against complete suite (public + hidden)
    const result = await evaluateSubmission(effectiveUserId, problem, code, language);

    return NextResponse.json({
      success: true,
      submission: result,
    });
  } catch (err: any) {
    console.error("POST /api/dsa/submit error:", err);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
