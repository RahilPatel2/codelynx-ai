import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "codelynx_session";
const DEFAULT_SECRET = "codelynx-ai-enterprise-jwt-super-secret-key-32chars-min";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || DEFAULT_SECRET
);

// Protected routes that strictly require an active, valid session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/settings",
  "/history",
  "/assistant",
  "/profile",
  "/subscription",
];

// Auth routes where already-authenticated users should be redirected to /dashboard
const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
];

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return Boolean(payload && (payload.userId || payload.sub));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const isAuthRoute = AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 1. Guard protected routes
  if (isProtected) {
    const authenticated = await isValidSession(token);
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);

      // Clean up stale or invalid cookie if present
      if (token) {
        redirectResponse.cookies.set(SESSION_COOKIE_NAME, "", {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      }

      return redirectResponse;
    }
    return NextResponse.next();
  }

  // 2. Redirect logged-in users away from auth pages
  if (isAuthRoute) {
    const authenticated = await isValidSession(token);
    if (authenticated) {
      const fromParam = request.nextUrl.searchParams.get("from");
      const targetUrl = fromParam && fromParam.startsWith("/") ? fromParam : "/dashboard";
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled individually)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - static image/asset extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
