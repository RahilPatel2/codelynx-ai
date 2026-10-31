import { NextRequest, NextResponse } from "next/server";
import { problemRegistry } from "@/lib/dsa/problem-registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const dailyProblem = problemRegistry.getDailyChallenge(dateStr);

    return NextResponse.json({
      success: true,
      date: dateStr,
      challenge: dailyProblem,
    });
  } catch (err: any) {
    console.error("GET /api/dsa/daily error:", err);
    return NextResponse.json({ error: "Failed to fetch daily challenge" }, { status: 500 });
  }
}
