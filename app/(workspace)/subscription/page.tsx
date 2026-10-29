"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Check,
  Shield,
  Zap,
  Cpu,
  Database,
  ArrowRight,
  Terminal,
  HelpCircle,
  Clock,
  Code2,
  FolderKanban,
  Bot,
  AlertTriangle,
  History,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthContext";
import { GlobalNavbar } from "@/components/shared/GlobalNavbar";
import {
  getAllPlans,
  getPlan,
  formatInrPrice,
  SubscriptionPlan,
} from "@/lib/subscription/plans";
import { SimulatedPurchaseModal } from "@/components/subscription/SimulatedPurchaseModal";

export default function SubscriptionPage() {
  const { user, refreshSession } = useAuth();
  const allPlans = getAllPlans();

  const [quotaData, setQuotaData] = useState<{
    projects: { used: number; limit: number; remaining: number };
    aiQueriesToday: { used: number; limit: number; remaining: number };
  } | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentPlanId = user?.subscription?.plan?.toLowerCase() || (user?.email === "demo@codelynx.ai" ? "pro" : "free");
  const currentPlanName = user?.subscription?.plan?.toUpperCase() || (user?.email === "demo@codelynx.ai" ? "PRO" : "FREE");
  const currentPlanObj = getPlan(currentPlanId);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        if (data.usage) {
          setQuotaData(data.usage);
        }
        if (data.subscription?.history) {
          setHistoryList(data.subscription.history);
        }
      }
    } catch (err) {
      console.warn("Failed to load subscription quota details:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [user]);

  const handleOpenUpgrade = (plan: SubscriptionPlan) => {
    if (plan.id === currentPlanId) return;
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleSuccessfulSwitch = async () => {
    await refreshSession();
    await fetchSubscriptionDetails();
  };

  const formattedActivation = user?.subscription?.activatedAt
    ? new Date(user.subscription.activatedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Current Session";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      <GlobalNavbar
        title="My Subscription"
        badge="Cloud Plans & Quotas"
        icon={<Sparkles className="w-4 h-4 text-cyan-500" />}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* Prominent Development Simulation Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Development & Testing Mode:</span>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
              Payments are not currently enabled. Premium plan activation is simulated for
              development and testing. Upgrading or switching plans does not charge real currency or require payment cards.
            </p>
          </div>
        </div>

        {/* Current Active Plan Overview Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#111422] to-indigo-950 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                CURRENT SUBSCRIPTION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Status
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Mode: Simulated
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  CodeLynx {currentPlanObj.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  {currentPlanObj.subtitle}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400">
                  {formatInrPrice(currentPlanObj.priceInr)}
                </div>
                <div className="text-[11px] text-slate-400">per month (INR)</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Activated: {formattedActivation}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Database: MongoDB Atlas Isolated</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>AI Quota: {currentPlanObj.limits.aiRequestsPerDay} queries/day</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                <span>Projects Limit: {currentPlanObj.limits.maxProjects} projects</span>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Quota & Usage Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Projects Meter */}
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-cyan-500" />
                Cloud Saved Projects
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {quotaData?.projects.used ?? 0} / {currentPlanObj.limits.maxProjects}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      5,
                      ((quotaData?.projects.used ?? 0) / currentPlanObj.limits.maxProjects) * 100
                    )
                  )}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {quotaData?.projects.remaining ?? currentPlanObj.limits.maxProjects} project slots remaining on your {currentPlanObj.name} plan.
            </p>
          </div>

          {/* AI Daily Usage Meter */}
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-500" />
                Daily AI Assistant Allowance
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {quotaData?.aiQueriesToday.used ?? 0} / {currentPlanObj.limits.aiRequestsPerDay}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      5,
                      ((quotaData?.aiQueriesToday.used ?? 0) /
                        currentPlanObj.limits.aiRequestsPerDay) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Allowance automatically resets daily at midnight UTC.
            </p>
          </div>
        </div>

        {/* Change Plan / Upgrades & Downgrades Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Upgrade or Switch Plan
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Instant simulated transition
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allPlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isDowngrade =
                (currentPlanId === "pro" && (plan.id === "professional" || plan.id === "free")) ||
                (currentPlanId === "professional" && plan.id === "free");

              let buttonLabel = isCurrent
                ? "Active Plan"
                : isDowngrade
                ? `Switch to ${plan.name}`
                : `Upgrade to ${plan.name}`;

              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? "bg-[var(--card)] border-2 border-cyan-500 shadow-md"
                      : "bg-[var(--card)] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-white">
                          Current
                        </span>
                      ) : (
                        plan.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {plan.badge}
                          </span>
                        )
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                      {plan.subtitle}
                    </p>

                    <div className="border-t border-b border-slate-100 dark:border-slate-800/80 py-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {formatInrPrice(plan.priceInr)}
                        </span>
                        <span className="text-xs text-slate-400">/ month</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {plan.features.slice(0, 5).map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenUpgrade(plan)}
                      disabled={isCurrent}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isCurrent
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default"
                          : isDowngrade
                          ? "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 cursor-pointer"
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active on Your Account</span>
                        </>
                      ) : (
                        <>
                          <span>{buttonLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulated Subscription History Log */}
        {historyList && historyList.length > 0 && (
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Simulated Plan Transition History
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-2 px-3 font-semibold">Date & Time</th>
                    <th className="py-2 px-3 font-semibold">Previous Plan</th>
                    <th className="py-2 px-3 font-semibold">New Plan</th>
                    <th className="py-2 px-3 font-semibold">Activation Mode</th>
                    <th className="py-2 px-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                  {historyList.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        {new Date(entry.timestamp).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-medium">{entry.fromPlan}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                        {entry.toPlan}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-mono">
                          {entry.mode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{entry.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Simulated Purchase Confirmation Modal */}
      <SimulatedPurchaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetPlan={selectedPlan}
        currentPlanName={currentPlanName}
        onSuccess={handleSuccessfulSwitch}
      />
    </div>
  );
}
