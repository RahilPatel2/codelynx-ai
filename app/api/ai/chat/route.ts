import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";
import { getCurrentUser } from "@/lib/auth/session";
import { checkAndRecordAiUsage } from "@/lib/subscription/entitlements";

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  codeContext: z
    .object({
      code: z.string(),
      language: z.string(),
      activeFileName: z.string().optional(),
    })
    .optional(),
  model: z.string().optional(),
  detailLevel: z.enum(["concise", "balanced", "detailed", "step-by-step"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

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

    const { message, codeContext, model, detailLevel } = parsed.data;
    const reply = await aiService.chat(message, codeContext, { model, detailLevel });

    return NextResponse.json({
      success: true,
      reply,
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
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
