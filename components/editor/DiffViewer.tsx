"use client";

import React, { useMemo } from "react";
import * as Diff from "diff";
import { Check, X, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { FixCodeResult } from "@/lib/ai/types";

interface DiffViewerProps {
  originalCode: string;
  fixResult: FixCodeResult;
  onApply: (newCode: string) => void;
  onReject: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalCode,
  fixResult,
  onApply,
  onReject,
}) => {
  const diffParts = useMemo(() => {
    return Diff.diffLines(originalCode, fixResult.fixedCode);
  }, [originalCode, fixResult.fixedCode]);

  return (
    <div className="flex flex-col h-full bg-surface-primary border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              AI Code Fix Review & Patch Diff
            </h3>
            <p className="text-xs text-slate-400">
              Review line additions and deletions before approving changes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium border ${
              fixResult.riskLevel === "low"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : fixResult.riskLevel === "medium"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
          >
            Risk Level: {fixResult.riskLevel.toUpperCase()}
          </span>

          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>

          <button
            onClick={() => onApply(fixResult.fixedCode)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-md shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Approved Patch
          </button>
        </div>
      </div>

      {/* Summary of Changes */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-white/5 text-xs">
        <div className="font-medium text-slate-200 mb-1">
          {fixResult.summaryOfChanges}
        </div>
        {fixResult.changesList && fixResult.changesList.length > 0 && (
          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
            {fixResult.changesList.map((ch, idx) => (
              <li key={idx}>{ch}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Side-by-Side or Unified Diff Code Surface */}
      <div className="flex-1 overflow-auto font-mono text-xs p-4 bg-[#0d0f17]">
        <table className="w-full border-collapse">
          <tbody>
            {diffParts.map((part, partIdx) => {
              const lines = part.value.split("\n");
              if (lines[lines.length - 1] === "") lines.pop(); // remove trailing split artifact

              return lines.map((line, lineIdx) => {
                let rowBg = "hover:bg-slate-800/20";
                let prefix = " ";
                let textColor = "text-slate-300";

                if (part.added) {
                  rowBg = "bg-emerald-950/30 hover:bg-emerald-950/50";
                  prefix = "+";
                  textColor = "text-emerald-300 font-medium";
                } else if (part.removed) {
                  rowBg = "bg-rose-950/30 hover:bg-rose-950/50";
                  prefix = "-";
                  textColor = "text-rose-300/80 line-through";
                }

                return (
                  <tr key={`${partIdx}-${lineIdx}`} className={`${rowBg} transition-colors`}>
                    <td className="w-8 select-none text-right pr-3 text-slate-500 text-[11px]">
                      {prefix}
                    </td>
                    <td className={`whitespace-pre-wrap py-0.5 pl-2 ${textColor}`}>
                      {line}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
