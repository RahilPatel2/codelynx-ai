import { NextRequest, NextResponse } from "next/server";
import {
  isGoogleOAuthConfigured,
  buildGoogleAuthorizationUrl,
} from "@/lib/auth/google-oauth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_unconfigured", req.url)
      );
    }

    // Generate cryptographically random state to protect against CSRF
    const state = crypto.randomBytes(24).toString("hex");

    const requestOrigin = req.nextUrl.origin;
    const googleAuthUrl = buildGoogleAuthorizationUrl(state, requestOrigin);

    const response = NextResponse.redirect(googleAuthUrl);

    const isHttps = req.nextUrl.protocol === "https:";
    const isSecure = isHttps || Boolean(process.env.APP_URL?.startsWith("https://") || (process.env.NODE_ENV === "production" && !process.env.APP_URL?.startsWith("http://localhost")));

    // Set state cookie with 10-minute expiry
    response.cookies.set("codelynx_oauth_state", state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (err: any) {
    console.error("GET /api/auth/google initiation error:", err);
    return NextResponse.redirect(
      new URL("/login?error=oauth_initiation_failed", req.url)
    );
  }
}
