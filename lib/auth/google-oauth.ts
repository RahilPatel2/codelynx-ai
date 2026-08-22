import { createSessionToken } from "./jwt";
import { createSessionCookieOptions, SESSION_COOKIE_NAME } from "./session";
import { connectToDatabase } from "../database/mongodb";
import { UserModel } from "../../models/User";
import { devStore } from "../database/dev-store";
import crypto from "crypto";

export interface GoogleUserProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

/**
 * Checks if Google OAuth credentials are fully provided in server environment
 */
export function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  return Boolean(
    clientId &&
    clientId.trim().length > 0 &&
    clientSecret &&
    clientSecret.trim().length > 0
  );
}

/**
 * Resolves the absolute callback URL based on environment or request origin
 */
export function getGoogleCallbackUrl(requestOrigin?: string): string {
  const baseUrl = process.env.APP_URL || requestOrigin || "http://localhost:3001";
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}/api/auth/callback/google`;
}

/**
 * Generates the Google OAuth 2.0 authorization URL
 */
export function buildGoogleAuthorizationUrl(state: string, requestOrigin?: string): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID is not configured");
  }

  const redirectUri = getGoogleCallbackUrl(requestOrigin);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges the authorization code for Google access and ID tokens
 */
export async function exchangeGoogleCodeForTokens(
  code: string,
  requestOrigin?: string
): Promise<{ accessToken: string; idToken: string }> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured in the environment");
  }

  const redirectUri = getGoogleCallbackUrl(requestOrigin);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = await tokenResponse.json();

  if (!tokenResponse.ok || data.error) {
    console.error("Google token exchange error:", data.error_description || data.error);
    throw new Error(data.error_description || data.error || "Failed to exchange authorization code");
  }

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
  };
}

/**
 * Verifies Google ID token / Userinfo and ensures audience and email verification
 */
export async function verifyGoogleTokenAndGetProfile(
  idToken: string,
  accessToken: string
): Promise<GoogleUserProfile> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  // 1. Verify ID token via Google TokenInfo endpoint
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (tokenInfoRes.ok) {
    const info = await tokenInfoRes.json();

    // Verify audience matches our Client ID
    if (clientId && info.aud !== clientId) {
      throw new Error("Google ID token audience mismatch: token was not issued for this application");
    }

    // Verify issuer is Google
    if (info.iss !== "accounts.google.com" && info.iss !== "https://accounts.google.com") {
      throw new Error("Google ID token issuer is invalid");
    }

    // Verify email is verified by Google
    const isEmailVerified = info.email_verified === "true" || info.email_verified === true;
    if (!isEmailVerified) {
      throw new Error("Google account email is not verified");
    }

    return {
      sub: info.sub,
      email: info.email.toLowerCase().trim(),
      email_verified: true,
      name: info.name || info.email.split("@")[0],
      picture: info.picture,
    };
  }

  // 2. Fallback to Google userinfo endpoint using access token
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userInfoRes.ok) {
    throw new Error("Failed to retrieve Google user profile");
  }

  const uInfo = await userInfoRes.json();
  if (!uInfo.email_verified) {
    throw new Error("Google account email is not verified");
  }

  return {
    sub: uInfo.sub,
    email: uInfo.email.toLowerCase().trim(),
    email_verified: true,
    name: uInfo.name || uInfo.email.split("@")[0],
    picture: uInfo.picture,
  };
}

/**
 * Links or creates user in MongoDB Atlas or local store, then returns session token
 */
export async function linkOrCreateGoogleUser(profile: GoogleUserProfile): Promise<{
  userId: string;
  email: string;
  name: string;
  sessionToken: string;
}> {
  const email = profile.email.toLowerCase().trim();
  const db = await connectToDatabase();

  let userId = "";
  let name = profile.name || email.split("@")[0];

  if (db) {
    // MongoDB Atlas active
    let user = await UserModel.findOne({ email });

    if (user) {
      // Existing user account: link Google ID
      userId = user._id.toString();
      if (!user.name) user.name = name;
      if (!user.googleId) user.googleId = profile.sub;
      if (profile.picture && !user.avatarUrl) user.avatarUrl = profile.picture;
      await user.save();
    } else {
      // New user account: create user
      const newUser = await UserModel.create({
        name,
        email,
        authProvider: "google",
        googleId: profile.sub,
        avatarUrl: profile.picture,
        preferences: {
          defaultLanguage: "python",
          theme: "codelynx-dark",
          fontSize: 14,
        },
      });
      userId = newUser._id.toString();
    }
  } else {
    const isLocalDev = !process.env.APP_URL || process.env.APP_URL.includes("localhost") || process.env.APP_URL.includes("127.0.0.1");
    if (process.env.NODE_ENV === "production" && !isLocalDev) {
      throw new Error("Database unavailable. Google authentication requires a live database in production.");
    }
    // Local devStore sandbox for development only
    const existing = devStore.users.get(email);
    if (existing) {
      userId = existing.id;
      name = existing.name;
      existing.googleId = profile.sub;
      if (profile.picture && !existing.avatarUrl) existing.avatarUrl = profile.picture;
    } else {
      userId = `google-user-${Date.now()}`;
      devStore.users.set(email, {
        id: userId,
        name,
        email,
        passwordHash: crypto.randomBytes(32).toString("hex"),
        preferences: {
          defaultLanguage: "python",
          theme: "codelynx-dark",
          fontSize: 14,
        },
        createdAt: new Date().toISOString(),
      });
    }
  }

  const sessionToken = await createSessionToken({
    userId,
    email,
    name,
    authProvider: "google",
  });

  return { userId, email, name, sessionToken };
}
