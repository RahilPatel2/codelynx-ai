"use client";

import React, { useState } from "react";
import {
  Bug,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Filter,
  ArrowRight,
  Bot,
} from "lucide-react";
import { DebugAnalysisResult, BugFinding } from "@/lib/ai/types";

interface DebuggerPanelProps {
  analysis: DebugAnalysisResult | null;
  isLoading: boolean;
  selectedFindingId?: string | null;
  onSelectFinding?: (finding: BugFinding) => void;
  onFixCode: () => void;
  onReanalyze: () => void;
  onClose: () => void;
  onAskCopilot?: (question: string) => void;
}

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({
  analysis,
  isLoading,
  selectedFindingId,
  onSelectFinding,
  onFixCode,
  onReanalyze,
  onClose,
  onAskCopilot,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "info">("all");

  const getSeverityBadge = (severity: BugFinding["severity"]) => {
    switch (severity) {
      case "critical":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertOctagon className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case "high":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3" />
            HIGH
          </span>
        );
      case "medium":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
            WARNING
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <Info className="w-3 h-3 inline mr-1" />
            INFO
          </span>
        );
    }
  };

  const findings = analysis?.findings || [];
  const filteredFindings = findings.filter((f) => {
    if (filterSeverity === "critical") return f.severity === "critical" || f.severity === "high";
    if (filterSeverity === "warning") return f.severity === "medium" || f.severity === "low";
    if (filterSeverity === "info") return f.severity === "info";
    return true;
  });

  const totalErrors = findings.filter((f) => f.severity === "critical" || f.severity === "high").length;
  const totalWarnings = findings.filter((f) => f.severity === "medium" || f.severity === "low").length;
  const totalInfo = findings.filter((f) => f.severity === "info").length;

  return (
    <div className="flex flex-col h-full bg-[#11131c] border-l border-slate-800 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#151924] border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Diagnostics & Findings
              {analysis && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[11px] text-slate-300 font-mono">
                  {findings.length}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Syntax, logic, boundary violations & line markers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReanalyze}
            disabled={isLoading}
            title="Re-run analysis"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      {analysis && findings.length > 0 && (
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/60 border-b border-white/5 text-[11px] overflow-x-auto">
          <button
            onClick={() => setFilterSeverity("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterSeverity === "all"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({findings.length})
          </button>
          <button
            onClick={() => setFilterSeverity("critical")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filterSeverity === "critical"
                ? "bg-rose-950/40 text-rose-300 font-bold border border-rose-500/30"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Errors ({totalErrors})
          </button>
          <button
            onClick={() => setFilterSeverity("warning")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filterSeverity === "warning"
                ? "bg-amber-950/40 text-amber-300 font-bold border border-amber-500/30"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Warnings ({totalWarnings})
          </button>
          <button
            onClick={() => setFilterSeverity("info")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filterSeverity === "info"
                ? "bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-500/30"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Info ({totalInfo})
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
              <Bug className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto" />
            </div>
            <div className="text-sm font-medium text-slate-200">
              Running AST safety checks & static verification...
            </div>
            <div className="text-xs text-slate-400 max-w-xs">
              Inspecting bounds, off-by-one loops, memory leaks, and logic invariants.
            </div>
          </div>
        ) : !analysis ? (
          <div className="text-center py-16 text-slate-500">
            <Bug className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No analysis performed yet.</p>
            <p className="text-xs mt-1">
              Click &ldquo;Find Mistakes&rdquo; in the toolbar to run diagnostics.
            </p>
          </div>
        ) : (
          <>
            {/* Overall summary banner */}
            <div
              className={`p-3.5 rounded-xl border ${
                analysis.hasCriticalBugs
                  ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                  : "bg-indigo-950/20 border-indigo-500/30 text-indigo-200"
              }`}
            >
              <div className="text-xs font-semibold mb-1 uppercase tracking-wider text-slate-300">
                Summary of Inspection
              </div>
              <div className="text-xs leading-relaxed">
                {analysis.overallSummary}
              </div>

              {analysis.proposedFixSummary && (
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-300">
                    {analysis.proposedFixSummary}
                  </span>
                  <button
                    onClick={onFixCode}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-lg shadow-indigo-950 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Fix Code
                  </button>
                </div>
              )}
            </div>

            {/* List of findings */}
            <div className="space-y-3">
              {filteredFindings.map((bug) => {
                const isSelected = selectedFindingId === bug.id;

                return (
                  <div
                    key={bug.id}
                    onClick={() => onSelectFinding?.(bug)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/50"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(bug.severity)}
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {bug.category}
                          </span>
                          {bug.lineStart && (
                            <span className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                              Line {bug.lineStart}
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-100">
                          {bug.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {bug.explanation}
                    </p>

                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Impact: </span>
                        <span className="text-rose-300/90">{bug.impact}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Suggested Fix: </span>
                        <span className="text-emerald-300 font-mono text-[11px]">
                          {bug.suggestedCorrection}
                        </span>
                      </div>
                    </div>

                    {bug.demonstrationTestCase && (
                      <div className="p-2 rounded bg-slate-950/40 border border-slate-800/50 text-[11px] font-mono">
                        <div className="text-slate-500 font-sans text-[10px] uppercase">
                          Demonstration Input:
                        </div>
                        <div className="text-slate-300">{bug.demonstrationTestCase.input}</div>
                        <div className="text-rose-400 mt-1">
                          Expected failure: {bug.demonstrationTestCase.expectedFailure}
                        </div>
                      </div>
                    )}

                    {onAskCopilot && (
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskCopilot(
                              `Explain this finding on Line ${bug.lineStart || 1}: "${bug.title}". Why does it happen and how should I correct it?`
                            );
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-600/20 text-cyan-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
                        >
                          <Bot className="w-3 h-3 text-cyan-400" />
                          <span>Ask Copilot about this Finding</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
