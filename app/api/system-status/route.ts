import { NextResponse } from "next/server";
import { getDatabaseStatus } from "@/lib/database/mongodb";
import { executionService } from "@/lib/execution/adapter";
import { aiService } from "@/lib/ai/service";

export async function GET() {
  const dbStatus = getDatabaseStatus();
  const execStatus = executionService.getStatus();
  const aiStatus = aiService.getStatus();

  return NextResponse.json({
    database: {
      provider: "MongoDB Atlas",
      configured: dbStatus.isConfigured,
      connected: dbStatus.isConnected,
      dbName: dbStatus.dbName,
      status: dbStatus.isConfigured
        ? dbStatus.isConnected
          ? "connected"
          : "connecting"
        : "unconfigured (local sandbox active)",
    },
    execution: {
      provider: execStatus.activeProvider,
      isJudge0Configured: execStatus.isJudge0Configured,
      endpoint: execStatus.endpoint,
      status: execStatus.isJudge0Configured
        ? "active (Judge0 CE)"
        : "active (Local Sandbox Simulator)",
    },
    ai: {
      provider: aiStatus.provider,
      isConfigured: aiStatus.isConfigured,
      model: aiStatus.modelName,
      status: aiStatus.isConfigured
        ? `active (${aiStatus.modelName})`
        : "active (Deterministic Heuristics Engine)",
    },
  });
}
