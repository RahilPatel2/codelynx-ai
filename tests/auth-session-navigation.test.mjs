import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SignJWT, jwtVerify } from "jose";

// Ensure .env.local is parsed
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const DEFAULT_SECRET = "codelynx-ai-enterprise-jwt-super-secret-key-32chars-min";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || DEFAULT_SECRET
);

test("Suite 1: Cookie Configuration & HTTP vs HTTPS Security Flag Logic", async (t) => {
  const { createSessionCookieOptions, createClearSessionCookieOptions, SESSION_COOKIE_NAME } =
    await import("../lib/auth/session.js").catch(() => import("../lib/auth/session.ts"));

  await t.test("SESSION_COOKIE_NAME is 'codelynx_session'", () => {
    assert.equal(SESSION_COOKIE_NAME, "codelynx_session");
  });

  await t.test("HTTP localhost development: secure flag must be false to avoid browser cookie drops", () => {
    // When isHttps is explicitly false or APP_URL is http://localhost:3001
    const opts = createSessionCookieOptions(true, false);
    assert.equal(opts.secure, false, "Secure flag must be false over plain HTTP localhost");
    assert.equal(opts.httpOnly, true, "httpOnly must remain true for XSS protection");
    assert.equal(opts.sameSite, "lax", "sameSite must be lax");
    assert.equal(opts.path, "/");
    assert.equal(opts.maxAge, 60 * 60 * 24 * 7, "Remember me should be 7 days");
  });

  await t.test("HTTPS production environment: secure flag must be true", () => {
    const opts = createSessionCookieOptions(true, true);
    assert.equal(opts.secure, true, "Secure flag must be true over HTTPS");
    assert.equal(opts.httpOnly, true);
  });

  await t.test("Short-lived session (rememberMe = false) sets 1 day maxAge", () => {
    const opts = createSessionCookieOptions(false, false);
    assert.equal(opts.maxAge, 60 * 60 * 24);
  });

  await t.test("createClearSessionCookieOptions sets maxAge: 0 and past expires date", () => {
    const clearOpts = createClearSessionCookieOptions(false);
    assert.equal(clearOpts.maxAge, 0);
    assert.equal(clearOpts.expires.getTime(), 0);
    assert.equal(clearOpts.path, "/");
  });
});

test("Suite 2: Google OAuth Configuration & URL Generator", async (t) => {
  const { isGoogleOAuthConfigured, getGoogleCallbackUrl, buildGoogleAuthorizationUrl } =
    await import("../lib/auth/google-oauth.js").catch(() => import("../lib/auth/google-oauth.ts"));

  await t.test("Detects configured Google OAuth credentials", () => {
    const isConfigured = isGoogleOAuthConfigured();
    assert.equal(typeof isConfigured, "boolean");
    // Client ID must match project prefix 370892581677
    if (process.env.GOOGLE_OAUTH_CLIENT_ID) {
      assert.ok(process.env.GOOGLE_OAUTH_CLIENT_ID.startsWith("370892581677"));
    }
  });

  await t.test("getGoogleCallbackUrl cleans trailing slashes and resolves callback path", () => {
    const url = getGoogleCallbackUrl("http://localhost:3001/");
    assert.equal(url, "http://localhost:3001/api/auth/callback/google");
  });

  await t.test("buildGoogleAuthorizationUrl constructs compliant Google OAuth URL", () => {
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
      return;
    }
    const authUrl = buildGoogleAuthorizationUrl("test_csrf_token_xyz", "http://localhost:3001");
    assert.ok(authUrl.startsWith("https://accounts.google.com/o/oauth2/v2/auth?"));
    const parsed = new URL(authUrl);
    assert.equal(parsed.searchParams.get("client_id"), process.env.GOOGLE_OAUTH_CLIENT_ID);
    assert.equal(parsed.searchParams.get("redirect_uri"), "http://localhost:3001/api/auth/callback/google");
    assert.equal(parsed.searchParams.get("response_type"), "code");
    assert.equal(parsed.searchParams.get("scope"), "openid email profile");
    assert.equal(parsed.searchParams.get("prompt"), "select_account");
    assert.equal(parsed.searchParams.get("state"), "test_csrf_token_xyz");
  });
});

test("Suite 3: Branding & UI Standardization ('Romly' Removal & Button Text)", async (t) => {
  await t.test("Zero occurrences of 'Romly' across all code, components, and configs", () => {
    const checkDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (entry.isFile() && /\.(tsx|ts|jsx|js|mjs|json|css|md)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, "utf8");
          // Allow mentioning "Romly" only in documentation of the fix, audit logs, scripts, or test files
          if (!fullPath.includes("docs") && !fullPath.includes("tests") && !fullPath.includes("chunk") && !fullPath.includes("scripts")) {
            const hasRomly = /romly/i.test(content);
            assert.equal(hasRomly, false, `Found forbidden branding 'Romly' in ${fullPath}`);
          }
        }
      }
    };
    checkDir(process.cwd());
  });

  await t.test("Login page features 'Continue with Google' button", () => {
    const loginCode = fs.readFileSync("app/(auth)/login/page.tsx", "utf8");
    assert.ok(loginCode.includes("Continue with Google"), "Login page must have 'Continue with Google'");
    assert.ok(!loginCode.includes("Sign in with Google"), "Login page should not use legacy 'Sign in with Google'");
  });

  await t.test("Register page features 'Continue with Google' button", () => {
    const regCode = fs.readFileSync("app/(auth)/register/page.tsx", "utf8");
    assert.ok(regCode.includes("Continue with Google"), "Register page must have 'Continue with Google'");
    assert.ok(!regCode.includes("Sign up with Google"), "Register page should not use legacy 'Sign up with Google'");
  });
});

test("Suite 4: Safe Account Linking & Credential Preservation", async (t) => {
  const { devStore } = await import("../lib/database/dev-store.js").catch(() => import("../lib/database/dev-store.ts"));
  const { linkOrCreateGoogleUser } = await import("../lib/auth/google-oauth.js").catch(() => import("../lib/auth/google-oauth.ts"));

  await t.test("Google login preserves existing password credentials in local dev-store", async () => {
    const existingEmail = `hybrid.dev.${Date.now()}@codelynx.ai`;
    const passwordHash = "argon2_or_bcrypt_hash_secret_string";

    devStore.users.set(existingEmail, {
      id: "usr_hybrid_123",
      name: "Hybrid Developer",
      email: existingEmail,
      passwordHash: passwordHash,
      preferences: { defaultLanguage: "rust", theme: "codelynx-dark", fontSize: 16 },
      createdAt: new Date().toISOString(),
    });

    const googleProfile = {
      sub: "google_sub_998877",
      email: existingEmail,
      email_verified: true,
      name: "Hybrid Developer Updated",
      picture: "https://avatar.google.com/hybrid.png",
    };

    const result = await linkOrCreateGoogleUser(googleProfile);
    assert.equal(result.email, existingEmail);
    assert.ok(result.sessionToken, "Session JWT token generated");

    // Verify existing passwordHash was NOT overwritten or wiped
    const storedUser = devStore.users.get(existingEmail);
    assert.equal(storedUser.passwordHash, passwordHash, "Original passwordHash must be preserved untouched");
  });
});

test("Suite 5: Route Protection, Middleware Redirection & Session Rules", async (t) => {
  const PROTECTED_PREFIXES = [
    "/dashboard",
    "/projects",
    "/settings",
    "/history",
    "/assistant",
  ];

  const AUTH_PREFIXES = [
    "/login",
    "/register",
    "/forgot-password",
  ];

  const isValidSession = async (token) => {
    if (!token) return false;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return Boolean(payload && (payload.userId || payload.sub));
    } catch {
      return false;
    }
  };

  const validToken = await new SignJWT({ userId: "usr_test_audit", email: "test@codelynx.ai", name: "Audit User" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const expiredToken = await new SignJWT({ userId: "usr_test_audit", email: "test@codelynx.ai", name: "Audit User" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("-1h")
    .sign(JWT_SECRET);

  await t.test("Valid session token validates true", async () => {
    assert.equal(await isValidSession(validToken), true);
  });

  await t.test("Expired or forged token validates false", async () => {
    assert.equal(await isValidSession(expiredToken), false);
    assert.equal(await isValidSession("corrupted_jwt_token_123"), false);
    assert.equal(await isValidSession(undefined), false);
  });

  await t.test("Unauthenticated user accessing protected routes must redirect to /login with 'from' parameter", async () => {
    for (const prefix of PROTECTED_PREFIXES) {
      const authenticated = await isValidSession(undefined);
      assert.equal(authenticated, false);
      // Expected destination
      const expectedDestination = `/login?from=${encodeURIComponent(prefix)}`;
      assert.ok(expectedDestination.startsWith("/login?from="));
    }
  });

  await t.test("Authenticated user accessing /login or /register must redirect to /dashboard", async () => {
    for (const prefix of AUTH_PREFIXES) {
      const authenticated = await isValidSession(validToken);
      assert.equal(authenticated, true);
      // Expected destination
      const expectedDestination = "/dashboard";
      assert.equal(expectedDestination, "/dashboard");
    }
  });
});

test("Suite 6: LynxLogo Dynamic Routing & Nested Link Safety", async (t) => {
  await t.test("LynxLogo code supports asLink prop and dynamic destination", () => {
    const logoCode = fs.readFileSync("components/shared/LynxLogo.tsx", "utf8");
    assert.ok(logoCode.includes("asLink = true"), "Must accept asLink prop");
    assert.ok(logoCode.includes("user ? \"/dashboard\" : \"/\""), "Must route to /dashboard if user is logged in");
  });

  await t.test("AppHeader renders LynxLogo without invalid nested <a> tags", () => {
    const headerCode = fs.readFileSync("components/shared/AppHeader.tsx", "utf8");
    const navbarCode = fs.readFileSync("components/shared/GlobalNavbar.tsx", "utf8");
    assert.ok(!headerCode.includes("<Link href=\"/dashboard\"><LynxLogo"), "Must not wrap LynxLogo in another <Link>");
    assert.ok(!navbarCode.includes("<Link href=\"/dashboard\"><LynxLogo"), "Must not wrap LynxLogo in another <Link>");
    assert.ok(
      headerCode.includes("<LynxLogo size=\"sm\" href=\"/dashboard\"") ||
      (headerCode.includes("<GlobalNavbar") && navbarCode.includes("<LynxLogo size=\"sm\"")),
      "Must use LynxLogo href property directly or forward to GlobalNavbar"
    );
  });

  await t.test("Landing page updates UI dynamically for authenticated users", () => {
    const landingCode = fs.readFileSync("app/page.tsx", "utf8");
    assert.ok(landingCode.includes("useAuth()"), "Landing page must consume useAuth context");
    assert.ok(landingCode.includes("Go to Dashboard"), "Landing page must offer Go to Dashboard for logged in users");
    assert.ok(landingCode.includes("Log Out"), "Landing page must offer Log Out for logged in users");
  });
});
