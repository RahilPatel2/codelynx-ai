import { NextRequest, NextResponse } from "next/server";
import {
  isGoogleOAuthConfigured,
  exchangeGoogleCodeForTokens,
  verifyGoogleTokenAndGetProfile,
  linkOrCreateGoogleUser,
} from "@/lib/auth/google-oauth";
import { createSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle user cancellation or access denied
  if (error) {
    console.warn("Google OAuth callback returned error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_authorization_code", req.url)
    );
  }

  // Validate CSRF state
  const storedState = req.cookies.get("codelynx_oauth_state")?.value;
  if (!storedState || !state || storedState !== state) {
    console.warn("Google OAuth callback CSRF state mismatch or expired");
    return NextResponse.redirect(
      new URL("/login?error=oauth_state_mismatch", req.url)
    );
  }

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_unconfigured", req.url)
    );
  }

  try {
    const requestOrigin = req.nextUrl.origin;

    // 1. Exchange authorization code for tokens
    const { accessToken, idToken } = await exchangeGoogleCodeForTokens(code, requestOrigin);

    // 2. Validate ID token and verify profile
    const profile = await verifyGoogleTokenAndGetProfile(idToken, accessToken);

    // 3. Link or create user and sign JWT session
    const { sessionToken } = await linkOrCreateGoogleUser(profile);

    // 4. Create redirect response to /dashboard
    const response = NextResponse.redirect(new URL("/dashboard", req.url));

    // 5. Set session cookie using standard options
    const isHttps = req.nextUrl.protocol === "https:";
    const cookieOpts = createSessionCookieOptions(true, isHttps);
    response.cookies.set(cookieOpts.name, sessionToken, cookieOpts);

    // 6. Clear CSRF state cookie
    response.cookies.set("codelynx_oauth_state", "", {
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    console.error("Google OAuth token exchange or session creation failed:", err.message);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, req.url)
    );
  }
}
