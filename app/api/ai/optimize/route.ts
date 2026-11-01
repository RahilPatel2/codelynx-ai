import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";
import { optimizerEngine } from "@/lib/optimizer/engine";
import { getCurrentUser } from "@/lib/auth/session";
import { checkAndRecordAiUsage } from "@/lib/subscription/entitlements";

const OptimizeRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  fileId: z.string().optional().default("active-file"),
  fileName: z.string().optional().default("main"),
  sourceVersion: z.number().optional().default(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OptimizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Server-side entitlement check for daily AI usage limits
    const user = await getCurrentUser();
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const usage = await checkAndRecordAiUsage(user?.userId, user?.email, clientIp);
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: usage.reason,
          code: usage.code || "AI_QUOTA_EXCEEDED",
          dailyLimit: usage.dailyLimit,
          usedToday: usage.usedToday,
        },
        { status: 429 }
      );
    }

    const { code, language, fileId, fileName, sourceVersion } = parsed.data;

    // 1. Create immutable snapshot (Step A)
    const snapshot = optimizerEngine.createSnapshot(
      fileId,
      fileName,
      code,
      language,
      sourceVersion
    );

    // 2. Perform verified optimization analysis (Steps B, C, D)
    const verifiedResult = await optimizerEngine.optimize(snapshot);

    // Legacy compatibility payload for components expecting OptimizationResult
    const legacyOptimization = {
      category: verifiedResult.category === "none" ? "readability" : verifiedResult.category,
      currentComplexity: verifiedResult.originalComplexity || "O(1)",
      optimizedComplexity: verifiedResult.candidateComplexity || "O(1)",
      explanation: verifiedResult.explanation,
      keyChanges: verifiedResult.changes.map((c) => `${c.reason} (${c.expectedBenefit})`),
      optimizedCode: verifiedResult.candidateSource,
      benchmarkEstimate: verifiedResult.hasMeaningfulChanges
        ? "Asymptotically verified improvement"
        : "No performance difference for identical code",
    };

    return NextResponse.json({
      success: true,
      optimization: legacyOptimization,
      verifiedResult,
      snapshot,
      meta: aiService.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to optimize code" },
      { status: 500 }
    );
  }
}
