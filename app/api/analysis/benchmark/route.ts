import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runEmpiricalBenchmark } from "@/lib/analysis/benchmark";

const BenchmarkRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  complexity: z.string().default("O(n)"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BenchmarkRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, complexity } = parsed.data;
    const report = runEmpiricalBenchmark(code, language, complexity);

    return NextResponse.json({
      success: true,
      benchmark: report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to run empirical benchmark" },
      { status: 500 }
    );
  }
}
