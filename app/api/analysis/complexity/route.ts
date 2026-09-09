import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";

const ComplexityRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ComplexityRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language } = parsed.data;
    const result = await aiService.analyzeComplexity(code, language);

    return NextResponse.json({
      success: true,
      complexity: result,
      meta: aiService.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to analyze code complexity" },
      { status: 500 }
    );
  }
}
