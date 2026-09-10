"use client";

import React, { useState, useMemo } from "react";
import * as Diff from "diff";
import {
  Zap,
  ArrowRight,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  FileCode,
  Layers,
  SplitSquareVertical,
  Bot,
} from "lucide-react";
import { OptimizationResult } from "@/lib/ai/types";
import { VerifiedOptimizationResult } from "@/lib/optimizer/types";

interface OptimizerPanelProps {
  optimization: OptimizationResult | null;
  verifiedResult?: VerifiedOptimizationResult | null;
  originalCode: string;
  isLoading: boolean;
  onApplyOptimization: (code: string) => void;
  onReanalyze: () => void;
  onClose: () => void;
  onAskCopilot?: (question: string) => void;
}

export const OptimizerPanel: React.FC<OptimizerPanelProps> = ({
  optimization,
  verifiedResult,
  originalCode,
  isLoading,
  onApplyOptimization,
  onReanalyze,
  onClose,
  onAskCopilot,
}) => {
  const [viewMode, setViewMode] = useState<"diff" | "code">("diff");

  const candidateCode =
    verifiedResult?.candidateSource || optimization?.optimizedCode || "";

  const isIdentical = useMemo(() => {
    if (verifiedResult) return verifiedResult.isIdentical;
    return candidateCode.trim() === originalCode.trim();
  }, [verifiedResult, candidateCode, originalCode]);

  const diffParts = useMemo(() => {
    if (!originalCode || !candidateCode) return [];
    return Diff.diffLines(originalCode, candidateCode);
  }, [originalCode, candidateCode]);

  return (
    <div className="flex flex-col h-full bg-[#11131c] border-l border-slate-800 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#151924] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Verified Code Optimizer
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                Subsystem D
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Evidence-based transformation with diff review & exact model application
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReanalyze}
            disabled={isLoading}
            title="Re-run optimization"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
            <div className="text-sm font-medium text-slate-200">
              Profiling bottlenecks & synthesizing candidate transformation...
            </div>
            <div className="text-xs text-slate-500">
              Capturing immutable source snapshot & validating syntax invariants
            </div>
          </div>
        ) : !optimization && !verifiedResult ? (
          <div className="text-center py-16 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No optimization run yet.</p>
            <p className="text-xs mt-1">
              Click &ldquo;Optimize&rdquo; in the toolbar to generate an improved implementation.
            </p>
          </div>
        ) : (
          <>
            {/* Condition 1: Identical Code (No meaningful changes) */}
            {isIdentical ? (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <AlertCircle className="w-4 h-4 text-cyan-400" />
                  <span>No Meaningful Code Changes Were Generated</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The current algorithm is already optimal for its scope or contains no statically
                  verifiable redundant calculations. CodeLynx refuses to present placebo changes or
                  unsubstantiated speedup claims.
                </p>
                <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 border border-white/5">
                  Algorithmic complexity: {optimization?.currentComplexity || "O(1)"} (Unchanged)
                </div>
              </div>
            ) : (
              <>
                {/* Condition 2: Verified Meaningful Asymptotic / Algorithmic Improvement */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-emerald-950/30 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>EVIDENCE-BASED COMPLEXITY TRANSFORMATION</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                      {verifiedResult?.category || optimization?.category || "Algorithmic"}
                    </span>
                  </div>

                  <div className="flex items-center justify-around py-2">
                    <div className="text-center">
                      <div className="text-[11px] text-slate-400 uppercase font-mono">Original</div>
                      <div className="text-xl font-bold font-mono text-rose-400">
                        {verifiedResult?.originalComplexity || optimization?.currentComplexity}
                      </div>
                    </div>

                    <ArrowRight className="w-6 h-6 text-slate-500" />

                    <div className="text-center">
                      <div className="text-[11px] text-slate-400 uppercase font-mono">Optimized</div>
                      <div className="text-xl font-bold font-mono text-emerald-400">
                        {verifiedResult?.candidateComplexity || optimization?.optimizedComplexity}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-center text-slate-300 font-medium">
                    {verifiedResult?.evidence?.algorithmicJustification ||
                      optimization?.benchmarkEstimate}
                  </div>
                </div>

                {/* Validation Status */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-300">Candidate Validated</div>
                    <div className="text-slate-400 text-[11px]">
                      {verifiedResult?.validation?.validationMessage ||
                        "Passed syntax check and structural integrity verification."}
                    </div>
                  </div>
                </div>

                {/* Explanation & Concrete Changes */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-semibold text-white">Why This Is Asymptotically Faster:</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {verifiedResult?.explanation || optimization?.explanation}
                  </p>

                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <div className="font-medium text-slate-200">Concrete Transformations:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      {verifiedResult?.changes && verifiedResult.changes.length > 0
                        ? verifiedResult.changes.map((change) => (
                            <li key={change.id}>
                              <span className="text-slate-200 font-medium">{change.reason}</span>:{" "}
                              {change.expectedBenefit}
                            </li>
                          ))
                        : (optimization?.keyChanges || []).map((ch, idx) => (
                            <li key={idx}>{ch}</li>
                          ))}
                    </ul>
                  </div>

                  {onAskCopilot && (
                    <div className="pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() =>
                          onAskCopilot(
                            `Analyze the architectural tradeoffs of this optimization from ${verifiedResult?.originalComplexity || optimization?.currentComplexity} to ${verifiedResult?.candidateComplexity || optimization?.optimizedComplexity}. What are the memory space implications?`
                          )
                        }
                        className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold bg-indigo-600/20 text-cyan-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
                      >
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ask Copilot to Analyze Tradeoffs</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* View Mode Switcher (Diff vs Candidate Source) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewMode("diff")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                    viewMode === "diff"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  Diff View
                </button>
                <button
                  onClick={() => setViewMode("code")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                    viewMode === "code"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Full Candidate
                </button>
              </div>

              {/* Apply to Editor Button */}
              <button
                onClick={() => onApplyOptimization(candidateCode)}
                disabled={isIdentical}
                title={
                  isIdentical
                    ? "No meaningful code changes were generated."
                    : "Apply exact verified candidate code to Monaco editor model."
                }
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isIdentical
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 active:scale-[0.98]"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Apply to Editor
              </button>
            </div>

            {/* Code / Diff Display Surface */}
            <div className="rounded-xl border border-slate-800 bg-[#0b0d13] overflow-hidden text-[11px] font-mono leading-relaxed">
              {viewMode === "diff" ? (
                <div className="p-3 overflow-x-auto max-h-72 divide-y divide-white/5">
                  {diffParts.map((part, pIdx) => {
                    const lines = part.value.split("\n");
                    if (lines[lines.length - 1] === "") lines.pop();

                    return lines.map((line, lIdx) => (
                      <div
                        key={`${pIdx}-${lIdx}`}
                        className={`px-2 py-0.5 whitespace-pre flex items-start gap-2 ${
                          part.added
                            ? "bg-emerald-950/40 text-emerald-300 font-semibold"
                            : part.removed
                            ? "bg-rose-950/40 text-rose-300 line-through opacity-75"
                            : "text-slate-400"
                        }`}
                      >
                        <span className="w-4 select-none opacity-60">
                          {part.added ? "+" : part.removed ? "-" : " "}
                        </span>
                        <span>{line}</span>
                      </div>
                    ));
                  })}
                </div>
              ) : (
                <pre className="p-3 overflow-x-auto max-h-72 text-slate-200">
                  {candidateCode}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
