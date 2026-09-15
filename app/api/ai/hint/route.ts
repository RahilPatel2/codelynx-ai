import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateProgressiveHint, HintLevelSchema } from "@/lib/ai/hints";
import { sanitizeContext } from "@/lib/ai/context-builder";

const HintRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
  level: HintLevelSchema.default("small_nudge"),
  context: z.any().optional(),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = HintRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language, level, context, model } = parsed.data;
    const sanitized = sanitizeContext(context);
    const hint = await generateProgressiveHint(code, language, level, sanitized, { model });

    return NextResponse.json({
      success: true,
      hint,
    });
  } catch (err: any) {
    console.error("POST /api/ai/hint error:", err);
    return NextResponse.json(
      { error: "Failed to generate hint" },
      { status: 500 }
    );
  }
}
