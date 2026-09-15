import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/service";

const GenerateTestsSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().default("python"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateTestsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, language } = parsed.data;
    const testSuite = await aiService.generateTests(code, language);

    return NextResponse.json({
      success: true,
      testSuite,
      meta: aiService.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate test cases" },
      { status: 500 }
    );
  }
}
