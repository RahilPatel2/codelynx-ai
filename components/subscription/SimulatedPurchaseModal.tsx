"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { SubscriptionPlan, formatInrPrice } from "@/lib/subscription/plans";
import { useAuth } from "@/components/shared/AuthContext";

interface SimulatedPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlan | null;
  currentPlanName?: string;
  onSuccess?: (plan: SubscriptionPlan) => void;
}

export const SimulatedPurchaseModal: React.FC<SimulatedPurchaseModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  currentPlanName = "FREE",
  onSuccess,
}) => {
  const { refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    subMessage: string;
  } | null>(null);

  if (!isOpen || !targetPlan) return null;

  const isDowngrade =
    (currentPlanName === "PRO" && (targetPlan.id === "professional" || targetPlan.id === "free")) ||
    (currentPlanName === "PROFESSIONAL" && targetPlan.id === "free");

  const actionTitle = isDowngrade
    ? `Switch to ${targetPlan.displayName}?`
    : `Upgrade to ${targetPlan.displayName}?`;

  const confirmButtonText = isDowngrade
    ? `Confirm Switch to ${targetPlan.name}`
    : `Confirm Upgrade to ${targetPlan.name}`;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/subscription/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: targetPlan.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to activate subscription plan");
      }

      setSuccessData({
        message: data.message,
        subMessage: data.subMessage,
      });

      // Synchronize global session immediately so all headers and badges update
      await refreshSession();

      if (onSuccess) {
        onSuccess(targetPlan);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during simulated upgrade");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setSuccessData(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleFinish();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--card)] border border-slate-200 dark:border-slate-800 text-[var(--foreground)] p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={handleFinish}
          disabled={loading}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {successData ? (
          /* SUCCESS STATE */
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 id="modal-headline" className="text-xl font-black text-slate-900 dark:text-white">
                {successData.message}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {successData.subMessage}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Simulated Plan Activation:
              </span>{" "}
              Stored securely in MongoDB Atlas. Your account entitlements, daily AI allowance, and
              workspace quotas have updated.
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all"
            >
              Continue to Workspace
            </button>
          </div>
        ) : (
          /* CONFIRMATION STATE */
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="modal-headline" className="text-lg font-black text-slate-900 dark:text-white">
                  {actionTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {targetPlan.subtitle}
                </p>
              </div>
            </div>

            {/* Plan Details Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Target Plan
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {targetPlan.name}
                </span>
              </div>

              <div className="flex items-baseline justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Price
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatInrPrice(targetPlan.priceInr)}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ month</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2.5">
                <span>Transition</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>{currentPlanName}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-bold text-cyan-500">{targetPlan.name}</span>
                </span>
              </div>
            </div>

            {/* Transparency / Simulated Purchase Callout */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Development Simulation Notice</p>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  This is a simulated purchase for the current development version. No real
                  payment or bank transaction will be collected. Your account will be upgraded immediately.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{confirmButtonText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
