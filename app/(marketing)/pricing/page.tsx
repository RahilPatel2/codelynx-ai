"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Code2,
  Terminal,
  Cpu,
  Zap,
  Info,
} from "lucide-react";
import { GlobalNavbar } from "@/components/shared/GlobalNavbar";
import { useAuth } from "@/components/shared/AuthContext";
import {
  getAllPlans,
  formatInrPrice,
  SubscriptionPlan,
} from "@/lib/subscription/plans";
import { SimulatedPurchaseModal } from "@/components/subscription/SimulatedPurchaseModal";

export default function PricingPage() {
  const { user } = useAuth();
  const plans = getAllPlans();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentPlanId = user?.subscription?.plan?.toLowerCase() || (user?.email === "demo@codelynx.ai" ? "pro" : "free");
  const currentPlanName = user?.subscription?.plan?.toUpperCase() || (user?.email === "demo@codelynx.ai" ? "PRO" : "FREE");

  const handlePlanAction = (plan: SubscriptionPlan) => {
    if (!user) {
      // Unauthenticated users are directed to auth
      if (plan.id === "free") {
        window.location.href = "/register";
      } else {
        window.location.href = `/login?from=${encodeURIComponent("/pricing")}`;
      }
      return;
    }

    if (plan.id === currentPlanId) {
      return; // Already active
    }

    setSelectedPlan(plan);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      <GlobalNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer-First Indian Rupee (INR) Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Simple, Transparent Plans for Every Developer
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Level up your algorithmic problem solving and coding copilot workflow with predictable
            monthly pricing in Indian Rupees.
          </p>

          {/* Development Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs inline-flex items-center gap-2 text-left">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Development Version Notice:</strong> All premium upgrades are currently
              simulated. No payment details are collected and no money is charged.
            </span>
          </div>
        </div>

        {/* 3 Tier SaaS Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isCurrent = user ? plan.id === currentPlanId : plan.id === "free";
            const isPopular = plan.popular;

            let ctaText = plan.cta;
            if (user) {
              if (isCurrent) {
                ctaText = "Current Plan";
              } else if (currentPlanId === "pro" && plan.id === "professional") {
                ctaText = "Switch to Professional";
              } else if (plan.id === "free") {
                ctaText = "Downgrade to Free";
              } else {
                ctaText = plan.cta;
              }
            }

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                  isPopular
                    ? "bg-[var(--card)] border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 md:-translate-y-2"
                    : isCurrent
                    ? "bg-[var(--card)] border-2 border-cyan-500/80 shadow-lg shadow-cyan-500/5"
                    : "bg-[var(--card)] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                }`}
              >
                {/* Popular or Current Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 fill-current" />
                    Recommended
                  </div>
                )}

                {isCurrent && !isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow">
                    Active Plan
                  </div>
                )}

                {/* Plan Content */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h2>
                      {plan.badge && !isPopular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[32px]">
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* INR Price Block */}
                  <div className="border-t border-b border-slate-100 dark:border-slate-800/80 py-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        {formatInrPrice(plan.priceInr)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        / month
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {plan.priceInr === 0
                        ? "Billed ₹0. Free forever."
                        : "Billed monthly in INR (Simulated for dev)"}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Included Capabilities:
                    </span>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <Check className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action CTA Button */}
                <div className="pt-8">
                  <button
                    onClick={() => handlePlanAction(plan)}
                    disabled={isCurrent}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isCurrent
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default"
                        : isPopular
                        ? "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 cursor-pointer"
                        : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm cursor-pointer"
                    }`}
                  >
                    <span>{ctaText}</span>
                    {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Feature Comparison Table */}
        <div className="space-y-6 pt-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Feature & Quota Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear breakdown of limits enforced centrally on the server.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[var(--card)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400">
                    <th className="p-4 font-bold">Platform Capability</th>
                    <th className="p-4 font-bold text-center">FREE (₹0/mo)</th>
                    <th className="p-4 font-bold text-center text-cyan-600 dark:text-cyan-400">
                      PROFESSIONAL (₹499/mo)
                    </th>
                    <th className="p-4 font-bold text-center text-indigo-600 dark:text-indigo-400">
                      PRO (₹899/mo)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-4 font-semibold">Daily AI Assistant Allowance</td>
                    <td className="p-4 text-center">20 queries / day</td>
                    <td className="p-4 text-center font-bold text-cyan-600 dark:text-cyan-400">
                      200 queries / day
                    </td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      1,000 queries / day
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Cloud Saved Projects</td>
                    <td className="p-4 text-center">3 projects max</td>
                    <td className="p-4 text-center font-bold text-cyan-600 dark:text-cyan-400">
                      Up to 25 projects
                    </td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      Up to 100 projects
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">DSA Practice School (621 Problems)</td>
                    <td className="p-4 text-center">Standard Access</td>
                    <td className="p-4 text-center">Full Access + Hints</td>
                    <td className="p-4 text-center">Priority Socratic Tutor</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Interactive Code Optimization</td>
                    <td className="p-4 text-center text-slate-400">—</td>
                    <td className="p-4 text-center text-emerald-500 font-bold">Included</td>
                    <td className="p-4 text-center text-emerald-500 font-bold">Included</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Big-O Complexity Verification</td>
                    <td className="p-4 text-center text-emerald-500 font-bold">Standard</td>
                    <td className="p-4 text-center text-emerald-500 font-bold">Advanced</td>
                    <td className="p-4 text-center text-emerald-500 font-bold">Formal Proofs</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">Priority Sandbox Container Execution</td>
                    <td className="p-4 text-center text-slate-400">Standard Queue</td>
                    <td className="p-4 text-center text-cyan-500 font-bold">Priority Queue</td>
                    <td className="p-4 text-center text-indigo-500 font-bold">Dedicated Queue</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Simulated Purchase Confirmation Modal */}
      <SimulatedPurchaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetPlan={selectedPlan}
        currentPlanName={currentPlanName}
      />
    </div>
  );
}
