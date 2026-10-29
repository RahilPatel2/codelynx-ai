import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserQuotaUsage,
  getUserSubscription,
} from "@/lib/subscription/entitlements";
import { getAllPlans, formatInrPrice } from "@/lib/subscription/plans";
import { POST as simulatePOST } from "./simulate/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  const plans = getAllPlans().map((p) => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    priceInr: p.priceInr,
    formattedPrice: formatInrPrice(p.priceInr),
    billingCycle: p.billingCycle,
    currency: p.currency,
    subtitle: p.subtitle,
    features: p.features,
    limits: p.limits,
    badge: p.badge,
    popular: p.popular,
    cta: p.cta,
  }));

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      plans,
      subscription: null,
      usage: null,
    });
  }

  try {
    const quotaData = await getUserQuotaUsage(user.userId, user.email);

    return NextResponse.json({
      authenticated: true,
      plans,
      subscription: {
        userId: quotaData.subscription.userId,
        userEmail: quotaData.subscription.userEmail,
        planId: quotaData.subscription.planId,
        planName: quotaData.subscription.plan.name,
        priceInr: quotaData.subscription.priceInr,
        formattedPrice: formatInrPrice(quotaData.subscription.priceInr),
        currency: quotaData.subscription.currency,
        billingCycle: quotaData.subscription.billingCycle,
        status: quotaData.subscription.status,
        purchaseMode: quotaData.subscription.purchaseMode,
        activatedAt: quotaData.subscription.activatedAt,
        history: quotaData.subscription.history || [],
      },
      usage: quotaData.usage,
      notice: "Payments are simulated for development and testing. No real financial charges occur.",
    });
  } catch (error: any) {
    console.error("[Subscription API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve subscription status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return simulatePOST(req);
}
