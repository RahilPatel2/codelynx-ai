export type PlanId = "free" | "professional" | "pro";

export interface PlanLimits {
  aiRequestsPerDay: number;
  maxProjects: number;
  advancedDebugging: boolean;
  codeOptimization: boolean;
  complexityAnalysis: boolean;
  dsaPracticeFull: boolean;
  priorityExecution: boolean;
  saveProjects: boolean;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: "FREE" | "PROFESSIONAL" | "PRO";
  displayName: string;
  priceInr: number;
  billingCycle: "monthly";
  currency: "INR";
  subtitle: string;
  features: string[];
  limits: PlanLimits;
  badge?: string;
  popular?: boolean;
  cta: string;
}

export const SUBSCRIPTION_PLANS: Record<PlanId, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "FREE",
    displayName: "Free Community",
    priceInr: 0,
    billingCycle: "monthly",
    currency: "INR",
    subtitle: "Start coding and learning with CODELYNX AI.",
    features: [
      "Access to the basic coding workspace",
      "Supported programming languages (C++, Python, Java, JS, Rust, Go)",
      "Basic code execution within configured limits",
      "Limited AI assistant usage (20 queries/day)",
      "Access to DSA School",
      "Basic DSA progress tracking",
      "Save up to 3 projects",
      "Community-level features",
    ],
    limits: {
      aiRequestsPerDay: 20,
      maxProjects: 3,
      advancedDebugging: false,
      codeOptimization: false,
      complexityAnalysis: true,
      dsaPracticeFull: false,
      priorityExecution: false,
      saveProjects: true,
    },
    cta: "Get Started Free",
  },
  professional: {
    id: "professional",
    name: "PROFESSIONAL",
    displayName: "Professional",
    priceInr: 499,
    billingCycle: "monthly",
    currency: "INR",
    subtitle: "For developers who want to code smarter and faster.",
    badge: "Recommended",
    popular: true,
    features: [
      "Everything in Free",
      "Higher AI assistant usage limits (200 queries/day)",
      "Advanced debugging assistance",
      "Code optimization",
      "Complexity analysis",
      "More saved projects (Up to 25 projects)",
      "Expanded DSA practice capabilities",
      "Enhanced coding workspace",
      "Priority feature access where implemented",
    ],
    limits: {
      aiRequestsPerDay: 200,
      maxProjects: 25,
      advancedDebugging: true,
      codeOptimization: true,
      complexityAnalysis: true,
      dsaPracticeFull: true,
      priorityExecution: true,
      saveProjects: true,
    },
    cta: "Upgrade to Professional",
  },
  pro: {
    id: "pro",
    name: "PRO",
    displayName: "Pro",
    priceInr: 899,
    billingCycle: "monthly",
    currency: "INR",
    subtitle: "For serious developers and advanced learners.",
    badge: "Advanced",
    features: [
      "Everything in Professional",
      "Highest AI usage limits among the three plans (1,000 queries/day)",
      "Advanced AI coding assistance",
      "Expanded debugging and optimization",
      "Full DSA learning experience",
      "Higher project limits (Up to 100 projects)",
      "Advanced learning analytics where implemented",
      "Priority access to new features where implemented",
    ],
    limits: {
      aiRequestsPerDay: 1000,
      maxProjects: 100,
      advancedDebugging: true,
      codeOptimization: true,
      complexityAnalysis: true,
      dsaPracticeFull: true,
      priorityExecution: true,
      saveProjects: true,
    },
    cta: "Upgrade to Pro",
  },
};

/**
 * Normalizes any casing or legacy plan strings (e.g. "FREE", "community", "professional")
 * to a valid PlanId.
 */
export function normalizePlanId(raw?: string | null): PlanId {
  if (!raw) return "free";
  const lower = raw.trim().toLowerCase();
  if (lower === "pro" || lower === "enterprise") return "pro";
  if (lower === "professional") return "professional";
  return "free";
}

/**
 * Retrieves a plan configuration by id safely.
 */
export function getPlan(planId?: string | null): SubscriptionPlan {
  const normalized = normalizePlanId(planId);
  return SUBSCRIPTION_PLANS[normalized];
}

/**
 * Returns all available plans in array format.
 */
export function getAllPlans(): SubscriptionPlan[] {
  return [
    SUBSCRIPTION_PLANS.free,
    SUBSCRIPTION_PLANS.professional,
    SUBSCRIPTION_PLANS.pro,
  ];
}

/**
 * Formats Indian Rupee currency with standard symbol and separator
 */
export function formatInrPrice(amount: number): string {
  if (amount === 0) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}
