import { connectToDatabase } from "@/lib/database/mongodb";
import { SubscriptionModel, ISubscription } from "@/models/Subscription";
import { UserModel } from "@/models/User";
import { ProjectModel } from "@/models/Project";
import { devStore } from "@/lib/database/dev-store";
import {
  PlanId,
  SubscriptionPlan,
  getPlan,
  normalizePlanId,
  formatInrPrice,
} from "./plans";

export interface UserSubscriptionDetails {
  userId: string;
  userEmail: string;
  planId: PlanId;
  plan: SubscriptionPlan;
  status: "active" | "cancelled" | "past_due";
  priceInr: number;
  currency: "INR";
  billingCycle: "monthly";
  purchaseMode: "simulated" | "real";
  activatedAt: Date;
  expiresAt: Date | null;
  history?: any[];
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  currentCount?: number;
  maxAllowed?: number;
  usedToday?: number;
  dailyLimit?: number;
  remaining?: number;
}

/**
 * Resolves the authenticated user's active subscription record from MongoDB Atlas
 * with local devStore fallback.
 */
export async function getUserSubscription(
  userId: string,
  userEmail?: string
): Promise<UserSubscriptionDetails> {
  const normalizedEmail = userEmail?.toLowerCase().trim() || "";

  // Staff developer default override
  if (normalizedEmail === "demo@codelynx.ai" || userId === "usr_demo_developer") {
    const proPlan = getPlan("pro");
    return {
      userId,
      userEmail: normalizedEmail || "demo@codelynx.ai",
      planId: "pro",
      plan: proPlan,
      status: "active",
      priceInr: proPlan.priceInr,
      currency: "INR",
      billingCycle: "monthly",
      purchaseMode: "simulated",
      activatedAt: new Date(),
      expiresAt: null,
      history: [
        {
          fromPlan: "FREE",
          toPlan: "PRO",
          timestamp: new Date(),
          mode: "simulated",
          notes: "Seeded Staff Engineer entitlement",
        },
      ],
    };
  }

  const db = await connectToDatabase();
  if (db) {
    try {
      const subDoc = await SubscriptionModel.findOne({
        $or: [{ userId }, ...(normalizedEmail ? [{ userEmail: normalizedEmail }] : [])],
      }).lean();

      if (subDoc) {
        const plan = getPlan(subDoc.planId);
        return {
          userId: subDoc.userId,
          userEmail: subDoc.userEmail,
          planId: plan.id,
          plan,
          status: subDoc.status,
          priceInr: plan.priceInr,
          currency: "INR",
          billingCycle: "monthly",
          purchaseMode: subDoc.purchaseMode,
          activatedAt: subDoc.activatedAt,
          expiresAt: subDoc.expiresAt,
          history: subDoc.history || [],
        };
      }

      // If no separate subscription document yet, check User document embedded subscription
      let userDoc: any = null;
      try {
        userDoc = await UserModel.findById(userId).lean();
      } catch {
        // userId might not be an ObjectId
      }
      if (!userDoc && normalizedEmail) {
        userDoc = await UserModel.findOne({ email: normalizedEmail }).lean();
      }

      if (userDoc?.subscription?.plan) {
        const plan = getPlan(userDoc.subscription.plan);
        return {
          userId,
          userEmail: userDoc.email || normalizedEmail,
          planId: plan.id,
          plan,
          status: userDoc.subscription.status || "active",
          priceInr: plan.priceInr,
          currency: "INR",
          billingCycle: "monthly",
          purchaseMode: (userDoc.subscription.purchaseMode as any) || "simulated",
          activatedAt: userDoc.subscription.activatedAt || userDoc.createdAt || new Date(),
          expiresAt: null,
          history: [],
        };
      }
    } catch (err) {
      console.warn("[Entitlements] MongoDB subscription lookup error, falling back:", err);
    }
  }

  // devStore fallback
  const storedSub = devStore.subscriptions.get(userId);
  if (storedSub) {
    const plan = getPlan(storedSub.planId);
    return {
      userId: storedSub.userId,
      userEmail: storedSub.userEmail,
      planId: plan.id,
      plan,
      status: storedSub.status,
      priceInr: plan.priceInr,
      currency: "INR",
      billingCycle: "monthly",
      purchaseMode: storedSub.purchaseMode,
      activatedAt: new Date(storedSub.activatedAt),
      expiresAt: storedSub.expiresAt ? new Date(storedSub.expiresAt) : null,
      history: storedSub.history || [],
    };
  }

  const storedUser = normalizedEmail ? devStore.users.get(normalizedEmail) : null;
  if (storedUser?.subscription?.plan) {
    const plan = getPlan(storedUser.subscription.plan);
    return {
      userId,
      userEmail: storedUser.email,
      planId: plan.id,
      plan,
      status: (storedUser.subscription.status as any) || "active",
      priceInr: plan.priceInr,
      currency: "INR",
      billingCycle: "monthly",
      purchaseMode: "simulated",
      activatedAt: new Date(storedUser.createdAt),
      expiresAt: null,
      history: [],
    };
  }

  // Default baseline is FREE
  const defaultPlan = getPlan("free");
  return {
    userId,
    userEmail: normalizedEmail,
    planId: "free",
    plan: defaultPlan,
    status: "active",
    priceInr: defaultPlan.priceInr,
    currency: "INR",
    billingCycle: "monthly",
    purchaseMode: "simulated",
    activatedAt: new Date(),
    expiresAt: null,
    history: [],
  };
}

/**
 * Checks project creation quota against server-side plan limit.
 * Strictly prevents Free accounts from saving > 3 projects, Professional > 25, Pro > 100.
 */
export async function checkProjectCreationEntitlement(
  userId: string,
  userEmail?: string
): Promise<EntitlementCheckResult> {
  const sub = await getUserSubscription(userId, userEmail);
  const maxProjects = sub.plan.limits.maxProjects;

  let currentCount = 0;
  const db = await connectToDatabase();
  if (db) {
    try {
      currentCount = await ProjectModel.countDocuments({ ownerId: userId });
    } catch (e) {
      console.warn("[Entitlements] Failed to count projects in Mongo:", e);
    }
  } else {
    currentCount = Array.from(devStore.projects.values()).filter(
      (p) => p.ownerId === userId
    ).length;
  }

  if (currentCount >= maxProjects) {
    const upgradeSuggestion =
      sub.planId === "free"
        ? "Upgrade to Professional (₹499/mo) to save up to 25 projects."
        : sub.planId === "professional"
        ? "Upgrade to Pro (₹899/mo) to save up to 100 projects."
        : "You have reached the maximum project limit for your account.";

    return {
      allowed: false,
      code: "PROJECT_LIMIT_EXCEEDED",
      currentCount,
      maxAllowed: maxProjects,
      reason: `Project limit reached. Your ${sub.plan.name} plan allows up to ${maxProjects} saved projects. ${upgradeSuggestion}`,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed: maxProjects,
  };
}

/**
 * Checks and increments daily AI query usage against the user's plan.
 * Resets each calendar day (UTC).
 * FREE: 20 queries/day
 * PROFESSIONAL: 200 queries/day
 * PRO: 1,000 queries/day
 */
export async function checkAndRecordAiUsage(
  userId?: string,
  userEmail?: string,
  clientIp?: string
): Promise<EntitlementCheckResult> {
  let planId: PlanId = "free";
  let plan: SubscriptionPlan = getPlan("free");

  if (userId) {
    const sub = await getUserSubscription(userId, userEmail);
    planId = sub.planId;
    plan = sub.plan;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const identifier = userId || userEmail || clientIp || "anonymous";
  const usageKey = `${identifier}_${todayStr}`;

  const currentUsage = devStore.dailyAiUsage.get(usageKey) || 0;
  const dailyLimit = plan.limits.aiRequestsPerDay;

  if (currentUsage >= dailyLimit) {
    const upgradeSuggestion =
      planId === "free"
        ? "Upgrade to Professional (₹499/mo) for 200 queries/day, or Pro (₹899/mo) for 1,000 queries/day."
        : planId === "professional"
        ? "Upgrade to Pro (₹899/mo) for 1,000 queries/day."
        : "Daily quota exhausted. Your allowance resets at midnight UTC.";

    return {
      allowed: false,
      code: "AI_QUOTA_EXCEEDED",
      usedToday: currentUsage,
      dailyLimit,
      remaining: 0,
      reason: `Daily AI usage limit reached for ${plan.name} plan (${dailyLimit} queries/day). ${upgradeSuggestion}`,
    };
  }

  // Increment usage
  const nextUsage = currentUsage + 1;
  devStore.dailyAiUsage.set(usageKey, nextUsage);

  return {
    allowed: true,
    usedToday: nextUsage,
    dailyLimit,
    remaining: Math.max(0, dailyLimit - nextUsage),
  };
}

/**
 * Retrieves aggregate quota and usage statistics for user subscription dashboard
 */
export async function getUserQuotaUsage(userId: string, userEmail?: string) {
  const sub = await getUserSubscription(userId, userEmail);

  let projectsCount = 0;
  const db = await connectToDatabase();
  if (db) {
    try {
      projectsCount = await ProjectModel.countDocuments({ ownerId: userId });
    } catch {
      // Fallback
    }
  } else {
    projectsCount = Array.from(devStore.projects.values()).filter(
      (p) => p.ownerId === userId
    ).length;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const identifier = userId || userEmail || "anonymous";
  const usageKey = `${identifier}_${todayStr}`;
  const aiUsedToday = devStore.dailyAiUsage.get(usageKey) || 0;

  return {
    subscription: sub,
    usage: {
      projects: {
        used: projectsCount,
        limit: sub.plan.limits.maxProjects,
        remaining: Math.max(0, sub.plan.limits.maxProjects - projectsCount),
      },
      aiQueriesToday: {
        used: aiUsedToday,
        limit: sub.plan.limits.aiRequestsPerDay,
        remaining: Math.max(0, sub.plan.limits.aiRequestsPerDay - aiUsedToday),
        resetsAt: `${todayStr}T23:59:59.999Z`,
      },
    },
  };
}
