import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";
import { getCurrentUser } from "@/lib/auth/session";
import { checkAndRecordAiUsage } from "@/lib/subscription/entitlements";

const DebugRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  runtimeError: z.string().optional(),
  model: z.string().optional(),
  detailLevel: z.enum(["concise", "balanced", "detailed", "step-by-step"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DebugRequestSchema.safeParse(body);

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

    const { code, language, runtimeError, model, detailLevel } = parsed.data;
    const analysis = await aiService.findMistakes(code, language, runtimeError, {
      model,
      detailLevel,
    });

    return NextResponse.json({
      success: true,
      analysis,
      meta: {
        ...aiService.getStatus(),
        quota: {
          usedToday: usage.usedToday,
          dailyLimit: usage.dailyLimit,
          remaining: usage.remaining,
        },
      },
    });
  } catch (err: any) {
    console.error("AI debug endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to perform AI code analysis" },
      { status: 500 }
    );
  }
}
