import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";

const ExplainRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  selectedSnippet: z.string().optional(),
  model: z.string().optional(),
  detailLevel: z.enum(["concise", "balanced", "detailed", "step-by-step"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExplainRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, selectedSnippet, model, detailLevel } = parsed.data;
    const explanation = await aiService.explainCode(code, language, selectedSnippet, {
      model,
      detailLevel,
    });

    return NextResponse.json({
      success: true,
      explanation,
      meta: aiService.getStatus(),
    });
  } catch (err: any) {
    console.error("AI explain endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to explain code" },
      { status: 500 }
    );
  }
}
