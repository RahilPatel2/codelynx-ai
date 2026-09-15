import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeNextStep } from "@/lib/ai/next-step";
import { sanitizeContext } from "@/lib/ai/context-builder";

const NextStepRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  context: z.any().optional(),
  model: z.string().optional(),
  detailLevel: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = NextStepRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, context, model, detailLevel } = parsed.data;
    const sanitized = sanitizeContext(context);
    const analysis = await analyzeNextStep(code, language, sanitized, {
      model,
      detailLevel,
    });

    return NextResponse.json({
      success: true,
      nextStep: analysis,
    });
  } catch (err: any) {
    console.error("POST /api/ai/next-step error:", err);
    return NextResponse.json(
      { error: "Failed to generate next-step recommendations" },
      { status: 500 }
    );
  }
}
