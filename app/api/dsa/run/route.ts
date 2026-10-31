import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { problemRegistry } from "@/lib/dsa/problem-registry";
import { evaluateRunCode } from "@/lib/dsa/judging";

const RunRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  problemSlug: z.string(),
  customInput: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RunRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, problemSlug, customInput } = parsed.data;
    const problem = problemRegistry.getProblemBySlug(problemSlug);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // If custom input is provided, evaluate as single ad-hoc test
    const testCases = customInput !== undefined
      ? [{ input: customInput, expectedOutput: "", isPublic: true }]
      : problem.publicTestCases;

    const runResult = await evaluateRunCode(code, language, testCases);

    return NextResponse.json({
      success: true,
      result: runResult,
    });
  } catch (err: any) {
    console.error("POST /api/dsa/run error:", err);
    return NextResponse.json(
      { error: "Failed to execute test cases" },
      { status: 500 }
    );
  }
}
