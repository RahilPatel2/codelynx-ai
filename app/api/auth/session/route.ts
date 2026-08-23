import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { UserModel } from "@/models/User";
import { SubscriptionModel } from "@/models/Subscription";
import { devStore } from "@/lib/database/dev-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Fetch latest preferences
  let preferences = {
    theme: "dark",
    defaultLanguage: "python",
    fontSize: 14,
    minimap: true,
    wordWrap: true,
    aiModel: "gemini-2.5-flash",
    verbosity: "balanced",
  };

  let avatarUrl = "";
  let authProvider = user.authProvider || "credentials";
  let subscription: {
    plan: string;
    status: string;
    priceInr?: number;
    currency?: string;
    purchaseMode?: string;
    activatedAt?: any;
  } = { plan: "FREE", status: "active", priceInr: 0, currency: "INR", purchaseMode: "simulated" };
  let createdAt = new Date().toISOString();
  let bio = "";
  let role = "Software Engineer";
  let company = "";
  let githubHandle = "";
  let status = "active";
  let resolvedName = user.name;

  // Demo user defaults to PRO plan
  if (user.email === "demo@codelynx.ai") {
    subscription = { plan: "PRO", status: "active" };
    role = "Staff Infrastructure Engineer";
    company = "CodeLynx AI Labs";
    bio = "Distributed systems architect, algorithmic optimization enthusiast, and Staff Developer at CodeLynx.";
    githubHandle = "alexlynx-dev";
  }

  const db = await connectToDatabase();
  if (db) {
    let userDoc: any = null;
    try {
      userDoc = await UserModel.findById(user.userId);
    } catch {
      // If user.userId is not an ObjectId (e.g. legacy usr_demo_developer), fallback to email
    }
    if (!userDoc && user.email) {
      userDoc = await UserModel.findOne({ email: user.email });
    }
    if (userDoc) {
      if (userDoc.preferences) {
        preferences = { ...preferences, ...userDoc.preferences };
      }
      if (userDoc.name) resolvedName = userDoc.name;
      if (userDoc.avatarUrl) avatarUrl = userDoc.avatarUrl;
      if (userDoc.authProvider) authProvider = userDoc.authProvider;
      if (userDoc.subscription?.plan) subscription = userDoc.subscription;
      if (userDoc.createdAt) createdAt = userDoc.createdAt.toISOString();
      if (userDoc.bio !== undefined) bio = userDoc.bio;
      if (userDoc.role) role = userDoc.role;
      if (userDoc.company !== undefined) company = userDoc.company;
      if (userDoc.githubHandle !== undefined) githubHandle = userDoc.githubHandle;
      if (userDoc.status) status = userDoc.status;

      // Query latest dedicated subscription record
      try {
        const subDoc = await SubscriptionModel.findOne({ userId: user.userId }).lean();
        if (subDoc) {
          subscription = {
            plan: subDoc.planName,
            status: subDoc.status,
            ...(subDoc.priceInr !== undefined ? { priceInr: subDoc.priceInr } : {}),
            currency: subDoc.currency || "INR",
            purchaseMode: subDoc.purchaseMode || "simulated",
            activatedAt: subDoc.activatedAt,
          };
        }
      } catch {
        // Fallback to userDoc.subscription
      }
    }
  } else {
    const devSub = devStore.subscriptions.get(user.userId);
    if (devSub) {
      subscription = {
        plan: devSub.planName,
        status: devSub.status,
        priceInr: devSub.priceInr,
        currency: devSub.currency,
        purchaseMode: devSub.purchaseMode,
        activatedAt: devSub.activatedAt,
      };
    }

    const devUser = devStore.users.get(user.email);
    if (devUser) {
      if (devUser.preferences) {
        preferences = { ...preferences, ...devUser.preferences };
      }
      if (devUser.name) resolvedName = devUser.name;
      if (devUser.avatarUrl) avatarUrl = devUser.avatarUrl;
      if (devUser.authProvider) authProvider = devUser.authProvider;
      if (!devSub && devUser.subscription?.plan) subscription = devUser.subscription;
      if (devUser.createdAt) createdAt = devUser.createdAt;
      if (devUser.bio !== undefined) bio = devUser.bio;
      if (devUser.role) role = devUser.role;
      if (devUser.company !== undefined) company = devUser.company;
      if (devUser.githubHandle !== undefined) githubHandle = devUser.githubHandle;
      if (devUser.status) status = devUser.status;
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.userId,
      email: user.email,
      name: resolvedName,
      avatarUrl,
      authProvider,
      subscription,
      createdAt,
      bio,
      role,
      company,
      githubHandle,
      status,
      preferences,
    },
  });
}
