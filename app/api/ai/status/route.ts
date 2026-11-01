import { NextResponse } from "next/server";
import { aiService } from "@/lib/ai/service";

export async function GET() {
  const status = aiService.getStatus();

  return NextResponse.json({
    success: true,
    isConfigured: status.isConfigured,
    provider: status.provider,
    modelName: status.modelName,
    badge: status.isConfigured ? "connected" : "offline",
    message: status.isConfigured
      ? `Connected to Google Gemini (${status.modelName})`
      : "GEMINI_API_KEY is not configured in server environment.",
  });
}
