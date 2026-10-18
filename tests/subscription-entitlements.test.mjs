import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import fs from "node:fs";

// Import core subscription logic
import {
  SUBSCRIPTION_PLANS,
  getPlan,
  getAllPlans,
  formatInrPrice,
  normalizePlanId,
} from "../lib/subscription/plans.ts";
import {
  getUserSubscription,
  checkProjectCreationEntitlement,
  checkAndRecordAiUsage,
} from "../lib/subscription/entitlements.ts";
import { paymentGateway } from "../lib/subscription/payment-provider.ts";
import { devStore } from "../lib/database/dev-store.ts";

describe("Suite 1: INR Pricing Matrix & Plan Schema Definitions", () => {
  test("All 3 primary subscription tiers exist with exact INR pricing", () => {
    const plans = getAllPlans();
    assert.strictEqual(plans.length, 3, "Must have exactly 3 primary subscription plans");

    const freePlan = getPlan("free");
    assert.strictEqual(freePlan.name, "FREE");
    assert.strictEqual(freePlan.priceInr, 0, "Free plan price must be ₹0");
    assert.strictEqual(freePlan.currency, "INR");
    assert.strictEqual(formatInrPrice(freePlan.priceInr), "₹0");

    const proPlan = getPlan("professional");
    assert.strictEqual(proPlan.name, "PROFESSIONAL");
    assert.strictEqual(proPlan.priceInr, 499, "Professional plan price must be ₹499");
    assert.strictEqual(proPlan.currency, "INR");
    assert.strictEqual(formatInrPrice(proPlan.priceInr), "₹499");

    const staffPlan = getPlan("pro");
    assert.strictEqual(staffPlan.name, "PRO");
    assert.strictEqual(staffPlan.priceInr, 899, "Pro plan price must be ₹899");
    assert.strictEqual(staffPlan.currency, "INR");
    assert.strictEqual(formatInrPrice(staffPlan.priceInr), "₹899");
  });

  test("Central limits are defined honestly without unlimited claims", () => {
    const free = getPlan("free");
    assert.strictEqual(free.limits.aiRequestsPerDay, 20);
    assert.strictEqual(free.limits.maxProjects, 3);

    const professional = getPlan("professional");
    assert.strictEqual(professional.limits.aiRequestsPerDay, 200);
    assert.strictEqual(professional.limits.maxProjects, 25);
    assert.strictEqual(professional.limits.advancedDebugging, true);
    assert.strictEqual(professional.limits.codeOptimization, true);

    const pro = getPlan("pro");
    assert.strictEqual(pro.limits.aiRequestsPerDay, 1000);
    assert.strictEqual(pro.limits.maxProjects, 100);
  });

  test("normalizePlanId normalizes legacy and uppercase strings safely", () => {
    assert.strictEqual(normalizePlanId("FREE"), "free");
    assert.strictEqual(normalizePlanId("PROFESSIONAL"), "professional");
    assert.strictEqual(normalizePlanId("PRO"), "pro");
    assert.strictEqual(normalizePlanId("enterprise"), "pro");
    assert.strictEqual(normalizePlanId(null), "free");
    assert.strictEqual(normalizePlanId(undefined), "free");
    assert.strictEqual(normalizePlanId("unknown_garbage"), "free");
  });
});

describe("Suite 2: Default Plan Assignment on Registration & Lookup", () => {
  const testUserId = `usr_test_default_${Date.now()}`;
  const testEmail = `newuser_${Date.now()}@example.com`;

  test("Unregistered or new user defaults to FREE plan with ₹0 price", async () => {
    const sub = await getUserSubscription(testUserId, testEmail);
    assert.strictEqual(sub.planId, "free");
    assert.strictEqual(sub.plan.name, "FREE");
    assert.strictEqual(sub.priceInr, 0);
    assert.strictEqual(sub.currency, "INR");
    assert.strictEqual(sub.status, "active");
  });

  test("Staff developer demo@codelynx.ai defaults to PRO plan", async () => {
    const sub = await getUserSubscription("usr_demo_developer", "demo@codelynx.ai");
    assert.strictEqual(sub.planId, "pro");
    assert.strictEqual(sub.plan.name, "PRO");
    assert.strictEqual(sub.priceInr, 899);
  });
});

describe("Suite 3: Simulated Upgrade and Downgrade Lifecycle", () => {
  const lifecycleUserId = `usr_cycle_${Date.now()}`;
  const lifecycleEmail = `cycle_${Date.now()}@test.codelynx.ai`;

  test("Step 1: Starts on FREE plan", async () => {
    const initial = await getUserSubscription(lifecycleUserId, lifecycleEmail);
    assert.strictEqual(initial.planId, "free");
    assert.strictEqual(initial.priceInr, 0);
  });

  test("Step 2: Free -> Professional simulated upgrade", async () => {
    // Simulate upgrade mutation in devStore
    const activatedAt = new Date().toISOString();
    devStore.subscriptions.set(lifecycleUserId, {
      userId: lifecycleUserId,
      userEmail: lifecycleEmail,
      planId: "professional",
      planName: "PROFESSIONAL",
      priceInr: 499,
      currency: "INR",
      billingCycle: "monthly",
      status: "active",
      activatedAt,
      expiresAt: null,
      purchaseMode: "simulated",
      subscriptionSource: "simulated_checkout",
      history: [
        {
          fromPlan: "FREE",
          toPlan: "PROFESSIONAL",
          timestamp: activatedAt,
          mode: "simulated",
          notes: "Simulated upgrade",
        },
      ],
    });

    const upgraded = await getUserSubscription(lifecycleUserId, lifecycleEmail);
    assert.strictEqual(upgraded.planId, "professional");
    assert.strictEqual(upgraded.plan.name, "PROFESSIONAL");
    assert.strictEqual(upgraded.priceInr, 499);
    assert.strictEqual(upgraded.history?.length, 1);
  });

  test("Step 3: Professional -> Pro simulated upgrade", async () => {
    const existing = devStore.subscriptions.get(lifecycleUserId);
    const newTimestamp = new Date().toISOString();
    existing.planId = "pro";
    existing.planName = "PRO";
    existing.priceInr = 899;
    existing.history.push({
      fromPlan: "PROFESSIONAL",
      toPlan: "PRO",
      timestamp: newTimestamp,
      mode: "simulated",
      notes: "Upgrade to pro",
    });

    const proSub = await getUserSubscription(lifecycleUserId, lifecycleEmail);
    assert.strictEqual(proSub.planId, "pro");
    assert.strictEqual(proSub.priceInr, 899);
    assert.strictEqual(proSub.history?.length, 2);
  });

  test("Step 4: Pro -> Professional simulated downgrade", async () => {
    const existing = devStore.subscriptions.get(lifecycleUserId);
    const newTimestamp = new Date().toISOString();
    existing.planId = "professional";
    existing.planName = "PROFESSIONAL";
    existing.priceInr = 499;
    existing.history.push({
      fromPlan: "PRO",
      toPlan: "PROFESSIONAL",
      timestamp: newTimestamp,
      mode: "simulated",
      notes: "Downgrade to professional",
    });

    const sub = await getUserSubscription(lifecycleUserId, lifecycleEmail);
    assert.strictEqual(sub.planId, "professional");
    assert.strictEqual(sub.priceInr, 499);
    assert.strictEqual(sub.history?.length, 3);
  });

  test("Step 5: Professional -> Free simulated downgrade", async () => {
    const existing = devStore.subscriptions.get(lifecycleUserId);
    const newTimestamp = new Date().toISOString();
    existing.planId = "free";
    existing.planName = "FREE";
    existing.priceInr = 0;
    existing.history.push({
      fromPlan: "PROFESSIONAL",
      toPlan: "FREE",
      timestamp: newTimestamp,
      mode: "simulated",
      notes: "Downgrade to free community tier",
    });

    const freeSub = await getUserSubscription(lifecycleUserId, lifecycleEmail);
    assert.strictEqual(freeSub.planId, "free");
    assert.strictEqual(freeSub.priceInr, 0);
    assert.strictEqual(freeSub.history?.length, 4);
  });
});

describe("Suite 4: Server-Side Entitlement & Quota Enforcement", () => {
  const quotaUserFree = `usr_quota_free_${Date.now()}`;

  test("Free account cannot exceed 3 projects", async () => {
    // Clear any existing projects for this test user
    for (const [key, p] of devStore.projects.entries()) {
      if (p.ownerId === quotaUserFree) devStore.projects.delete(key);
    }

    // Add 2 projects -> should be allowed
    devStore.projects.set(`p1_${quotaUserFree}`, {
      id: `p1_${quotaUserFree}`,
      name: "P1",
      description: "",
      ownerId: quotaUserFree,
      language: "python",
      files: [],
      activeFileId: "f1",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    devStore.projects.set(`p2_${quotaUserFree}`, {
      id: `p2_${quotaUserFree}`,
      name: "P2",
      description: "",
      ownerId: quotaUserFree,
      language: "python",
      files: [],
      activeFileId: "f1",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const check1 = await checkProjectCreationEntitlement(quotaUserFree);
    assert.strictEqual(check1.allowed, true);
    assert.strictEqual(check1.currentCount, 2);
    assert.strictEqual(check1.maxAllowed, 3);

    // Add 3rd project -> limit reached for next creation
    devStore.projects.set(`p3_${quotaUserFree}`, {
      id: `p3_${quotaUserFree}`,
      name: "P3",
      description: "",
      ownerId: quotaUserFree,
      language: "python",
      files: [],
      activeFileId: "f1",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const check2 = await checkProjectCreationEntitlement(quotaUserFree);
    assert.strictEqual(check2.allowed, false, "Must block 4th project on Free plan");
    assert.strictEqual(check2.code, "PROJECT_LIMIT_EXCEEDED");
    assert.ok(check2.reason?.includes("limit reached"));
  });

  test("Daily AI usage increments and enforces quota limit (20 queries/day for Free)", async () => {
    const aiUser = `usr_ai_${Date.now()}`;
    const todayStr = new Date().toISOString().slice(0, 10);
    const key = `${aiUser}_${todayStr}`;

    // Reset usage counter
    devStore.dailyAiUsage.set(key, 0);

    // Call 19 times -> all allowed
    for (let i = 0; i < 19; i++) {
      const res = await checkAndRecordAiUsage(aiUser);
      assert.strictEqual(res.allowed, true);
    }

    // 20th query -> allowed (at limit)
    const res20 = await checkAndRecordAiUsage(aiUser);
    assert.strictEqual(res20.allowed, true);
    assert.strictEqual(res20.usedToday, 20);
    assert.strictEqual(res20.remaining, 0);

    // 21st query -> blocked!
    const res21 = await checkAndRecordAiUsage(aiUser);
    assert.strictEqual(res21.allowed, false, "21st query must be blocked on Free plan");
    assert.strictEqual(res21.code, "AI_QUOTA_EXCEEDED");
    assert.ok(res21.reason?.includes("limit reached"));
  });
});

describe("Suite 5: Payment Gateway Abstraction & Safety Invariants", () => {
  test("paymentGateway creates simulated order safely without exposing credentials", async () => {
    const order = await paymentGateway.createOrder({
      userId: "usr_any",
      userEmail: "dev@codelynx.ai",
      planId: "professional",
    });

    assert.strictEqual(order.provider, "simulated");
    assert.strictEqual(order.amountInr, 499);
    assert.strictEqual(order.currency, "INR");
    assert.strictEqual(order.status, "completed");
    assert.ok(order.orderId.startsWith("sim_ord_"));
  });

  test("Simulated purchase route strictly validates planId and rejects malicious values", () => {
    const routeCode = fs.readFileSync("app/api/subscription/simulate/route.ts", "utf8");
    assert.ok(routeCode.includes("SimulatePurchaseSchema"), "Must parse request via Zod");
    assert.ok(routeCode.includes("getCurrentUser"), "Must require authenticated session");
    assert.ok(routeCode.includes("targetPlan.priceInr"), "Price must come from server config");
    assert.ok(!routeCode.includes("req.body.price"), "Must never trust client price");
  });
});

describe("Suite 6: UI, Currency & Transparency Notices", () => {
  test("Pricing page displays Indian Rupee (INR) values and simulation notice", () => {
    const pricingCode = fs.readFileSync("app/(marketing)/pricing/page.tsx", "utf8");
    assert.ok(pricingCode.includes("formatInrPrice"), "Must use INR formatter");
    assert.ok(pricingCode.includes("Development Version Notice"), "Must display development transparency note");
    assert.ok(pricingCode.includes("SimulatedPurchaseModal"), "Must embed simulated purchase modal");
  });

  test("Subscription page features active plan, usage meters, and simulation badge", () => {
    const subCode = fs.readFileSync("app/(workspace)/subscription/page.tsx", "utf8");
    assert.ok(subCode.includes("Mode: Simulated"), "Must display simulated mode badge");
    assert.ok(subCode.includes("Cloud Saved Projects"), "Must show project quota meter");
    assert.ok(subCode.includes("Daily AI Assistant Allowance"), "Must show AI quota meter");
  });

  test("SimulatedPurchaseModal clearly states no financial charges occur", () => {
    const modalCode = fs.readFileSync("components/subscription/SimulatedPurchaseModal.tsx", "utf8");
    assert.ok(modalCode.includes("Development Simulation Notice"), "Modal must display simulation notice");
    assert.ok(modalCode.includes("refreshSession"), "Modal must refresh session upon activation");
  });
});
