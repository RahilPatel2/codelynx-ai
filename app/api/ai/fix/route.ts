import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";

const FixRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  bugsSummary: z.string().optional(),
  model: z.string().optional(),
  detailLevel: z.enum(["concise", "balanced", "detailed", "step-by-step"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = FixRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, bugsSummary, model, detailLevel } = parsed.data;
    const fixResult = await aiService.fixCode(code, language, bugsSummary, {
      model,
      detailLevel,
    });

    return NextResponse.json({
      success: true,
      fix: fixResult,
      meta: aiService.getStatus(),
    });
  } catch (err: any) {
    console.error("AI fix endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to generate AI code fix" },
      { status: 500 }
    );
  }
}
