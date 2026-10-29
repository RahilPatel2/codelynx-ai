import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { SubscriptionModel } from "@/models/Subscription";
import { UserModel } from "@/models/User";
import { devStore } from "@/lib/database/dev-store";
import {
  PlanId,
  getPlan,
  normalizePlanId,
  formatInrPrice,
} from "@/lib/subscription/plans";
import { getUserSubscription } from "@/lib/subscription/entitlements";

const SimulatePurchaseSchema = z.object({
  planId: z.enum(["free", "professional", "pro", "FREE", "PROFESSIONAL", "PRO"], {
    errorMap: () => ({ message: "Invalid planId. Must be 'free', 'professional', or 'pro'" }),
  }),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to activate or change subscription" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = SimulatePurchaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const targetPlanId = normalizePlanId(parsed.data.planId);
    const targetPlan = getPlan(targetPlanId);

    // Fetch existing active subscription state to track upgrade/downgrade transition
    const currentSub = await getUserSubscription(user.userId, user.email);
    const fromPlanName = currentSub.plan.name;
    const toPlanName = targetPlan.name;

    const activatedAt = new Date();
    const historyItem = {
      fromPlan: fromPlanName,
      toPlan: toPlanName,
      timestamp: activatedAt,
      mode: "simulated" as const,
      notes: parsed.data.notes || `Simulated transition from ${fromPlanName} to ${toPlanName}`,
    };

    // 1. Persist to MongoDB Atlas if connected
    const db = await connectToDatabase();
    if (db) {
      try {
        await SubscriptionModel.findOneAndUpdate(
          { userId: user.userId },
          {
            $set: {
              userId: user.userId,
              userEmail: user.email.toLowerCase().trim(),
              planId: targetPlan.id,
              planName: targetPlan.name,
              priceInr: targetPlan.priceInr,
              currency: "INR",
              billingCycle: "monthly",
              status: "active",
              activatedAt,
              expiresAt: null,
              purchaseMode: "simulated",
              subscriptionSource: "simulated_checkout",
            },
            $push: {
              history: historyItem,
            },
          },
          { upsert: true, new: true }
        );

        // Synchronize User document embedded subscription
        let userDoc: any = null;
        try {
          userDoc = await UserModel.findById(user.userId);
        } catch {
          // Non-ObjectId fallback
        }
        if (!userDoc && user.email) {
          userDoc = await UserModel.findOne({ email: user.email.toLowerCase().trim() });
        }
        if (userDoc) {
          userDoc.subscription = {
            plan: targetPlan.name,
            status: "active",
            priceInr: targetPlan.priceInr,
            currency: "INR",
            purchaseMode: "simulated",
            activatedAt,
          };
          await userDoc.save();
        }
      } catch (err) {
        console.warn("[SimulatePurchase] MongoDB save error, falling back to devStore:", err);
      }
    }

    // 2. Persist in devStore (for local fallback / testing)
    const existingDevSub = devStore.subscriptions.get(user.userId);
    const devHistory = existingDevSub ? [...existingDevSub.history] : [];
    devHistory.push({
      ...historyItem,
      timestamp: activatedAt.toISOString(),
    });

    devStore.subscriptions.set(user.userId, {
      userId: user.userId,
      userEmail: user.email.toLowerCase().trim(),
      planId: targetPlan.id,
      planName: targetPlan.name,
      priceInr: targetPlan.priceInr,
      currency: "INR",
      billingCycle: "monthly",
      status: "active",
      activatedAt: activatedAt.toISOString(),
      expiresAt: null,
      purchaseMode: "simulated",
      subscriptionSource: "simulated_checkout",
      history: devHistory,
    });

    const devUser = devStore.users.get(user.email.toLowerCase().trim());
    if (devUser) {
      devUser.subscription = {
        plan: targetPlan.name,
        status: "active",
        priceInr: targetPlan.priceInr,
        currency: "INR",
        purchaseMode: "simulated",
        activatedAt: activatedAt.toISOString(),
      };
    }

    // Determine custom tailored success message
    let message = "";
    let subMessage = "";
    if (targetPlanId === "professional") {
      message = "Professional Plan Activated!";
      subMessage = "You are now a CODELYNX AI Professional member.";
    } else if (targetPlanId === "pro") {
      message = "Pro Plan Activated!";
      subMessage = "You are now a CODELYNX AI Pro member.";
    } else {
      message = "Free Community Plan Active";
      subMessage = "You are on the CODELYNX AI Free Community plan.";
    }

    return NextResponse.json({
      success: true,
      message,
      subMessage,
      simulationNotice:
        "This was a simulated plan activation for development and testing. No real payment was collected.",
      subscription: {
        userId: user.userId,
        planId: targetPlan.id,
        planName: targetPlan.name,
        priceInr: targetPlan.priceInr,
        formattedPrice: formatInrPrice(targetPlan.priceInr),
        currency: "INR",
        billingCycle: "monthly",
        status: "active",
        purchaseMode: "simulated",
        activatedAt: activatedAt.toISOString(),
        transition: {
          from: fromPlanName,
          to: toPlanName,
        },
      },
    });
  } catch (error: any) {
    console.error("[SimulatePurchase] Error:", error);
    return NextResponse.json(
      { error: "Internal error processing simulated purchase" },
      { status: 500 }
    );
  }
}
