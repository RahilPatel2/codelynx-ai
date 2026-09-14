import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";

const DocumentRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  model: z.string().optional(),
  detailLevel: z.enum(["concise", "balanced", "detailed", "step-by-step"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DocumentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, model, detailLevel } = parsed.data;
    const documentation = await aiService.generateDocumentation(code, language, {
      model,
      detailLevel,
    });

    return NextResponse.json({
      success: true,
      documentation,
      meta: aiService.getStatus(),
    });
  } catch (err: any) {
    console.error("AI document endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to generate documentation" },
      { status: 500 }
    );
  }
}
