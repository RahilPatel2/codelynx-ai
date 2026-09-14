import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";

const ExplainErrorRequestSchema = z.object({
  error: z.string().min(1, "Error message cannot be empty"),
  code: z.string().default(""),
  language: z.string().default("python"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ExplainErrorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { error, code, language } = parsed.data;
    const explanation = await aiService.explainError(error, code, language);

    return NextResponse.json({
      success: true,
      explanation,
      meta: aiService.getStatus(),
    });
  } catch (err: any) {
    console.error("AI explain-error endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to explain execution error" },
      { status: 500 }
    );
  }
}
