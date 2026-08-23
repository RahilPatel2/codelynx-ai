import { NextRequest, NextResponse } from "next/server";
import { createClearSessionCookieOptions } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const isHttps = req.nextUrl.protocol === "https:";
  const clearOpts = createClearSessionCookieOptions(isHttps);

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set(clearOpts.name, "", clearOpts);

  return response;
}
