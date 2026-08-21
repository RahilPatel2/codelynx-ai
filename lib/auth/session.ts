import { cookies } from "next/headers";
import { verifySessionToken, TokenPayload } from "./jwt";

export const SESSION_COOKIE_NAME = "codelynx_session";

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Resolves whether the session cookie should use the Secure attribute.
 * If running on HTTP (e.g. localhost), secure must be false so the browser
 * does not reject or drop the cookie on navigation.
 */
function resolveIsSecure(isHttps?: boolean): boolean {
  if (isHttps !== undefined) {
    return isHttps;
  }
  const appUrl = process.env.APP_URL || "";
  if (appUrl.startsWith("https://")) {
    return true;
  }
  if (appUrl.startsWith("http://localhost") || appUrl.startsWith("http://127.0.0.1")) {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

export function createSessionCookieOptions(rememberMe: boolean = true, isHttps?: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: resolveIsSecure(isHttps),
    sameSite: "lax" as const,
    path: "/",
    maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days or 1 day
  };
}

export function createClearSessionCookieOptions(isHttps?: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: resolveIsSecure(isHttps),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}
