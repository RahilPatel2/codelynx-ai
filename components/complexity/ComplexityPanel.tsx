"use client";

import React, { useState } from "react";
import {
  Activity,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle,
  Play,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ComplexityAnalysisResult } from "@/lib/ai/types";
import { BenchmarkReport } from "@/lib/analysis/benchmark";

interface ComplexityPanelProps {
  complexity: ComplexityAnalysisResult | null;
  benchmark: BenchmarkReport | null;
  isLoading: boolean;
  onRunBenchmark: () => void;
  onReanalyze: () => void;
  onClose: () => void;
}

export const ComplexityPanel: React.FC<ComplexityPanelProps> = ({
  complexity,
  benchmark,
  isLoading,
  onRunBenchmark,
  onReanalyze,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "benchmark">("analysis");

  return (
    <div className="flex flex-col h-full bg-[#11131c] border-l border-slate-800 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#151924] border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Complexity Lab
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                Big-O & Space
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Asymptotic evaluation & empirical growth benchmarks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReanalyze}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Recalculate"
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

      {/* Mode Sub-navigation */}
      <div className="flex items-center border-b border-white/5 bg-slate-900/60 px-4 pt-2 gap-4">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "analysis"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Asymptotic Analysis
        </button>
        <button
          onClick={() => setActiveTab("benchmark")}
          className={`pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "benchmark"
              ? "border-cyan-400 text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Empirical Benchmark Curve
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="text-sm font-medium text-slate-200">
              Calculating Recurrence Relations & Loop Invariants...
            </div>
          </div>
        ) : !complexity ? (
          <div className="text-center py-16 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No complexity analysis generated yet.</p>
            <p className="text-xs mt-1">
              Click &ldquo;Analyze Complexity&rdquo; on the toolbar to evaluate asymptotic bounds.
            </p>
          </div>
        ) : activeTab === "analysis" ? (
          <>
            {/* Top Complexity Metric Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Time Complexity</span>
                  <span className="text-[10px] bg-cyan-900/40 px-1.5 py-0.5 rounded text-cyan-300">
                    Worst Case
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {complexity.timeComplexity}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Avg: {complexity.averageCase || complexity.timeComplexity} • Best: {complexity.bestCase || "O(1)"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                <div className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Auxiliary Space</span>
                  <span className="text-[10px] bg-indigo-900/40 px-1.5 py-0.5 rounded text-indigo-300">
                    RAM Usage
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {complexity.spaceComplexity}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Excludes static input allocations
                </div>
              </div>
            </div>

            {/* Explanation & Dominant Operations */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Mathematical Analysis & Dominant Operations
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {complexity.explanation}
              </p>
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 text-xs">
                <span className="text-cyan-400 font-medium">Dominant Step: </span>
                <span className="text-slate-300">{complexity.dominantOperations}</span>
              </div>
              <div className="text-xs text-slate-400">
                <span className="text-slate-300 font-medium">Loop & Recursion: </span>
                {complexity.loopAndRecursionAnalysis}
              </div>
            </div>

            {/* Assumptions & Bottlenecks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-300">Model Assumptions:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {complexity.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                <div className="font-semibold text-amber-300">Potential Bottlenecks:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {complexity.bottlenecks.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Alternative Approaches */}
            {complexity.alternativeApproaches && complexity.alternativeApproaches.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Alternative Algorithmic Tradeoffs
                </h4>
                <div className="space-y-2">
                  {complexity.alternativeApproaches.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{alt.name}</div>
                        <div className="text-[11px] text-slate-400">{alt.tradeoff}</div>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0">
                        <div className="text-cyan-400">{alt.timeComplexity}</div>
                        <div className="text-slate-400">{alt.spaceComplexity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scientific Correctness Alert */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong>Asymptotic Note:</strong> Estimates are computed through static AST loop inspection and heuristic pattern matching. Complex non-linear recurrences or branch-dependent inputs may alter real-world runtimes.
              </div>
            </div>
          </>
        ) : (
          /* Benchmark Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Empirical Runtime Benchmark (n = 100 to 10,000)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tests code execution latency curve across 5 data sizes
                </p>
              </div>
              <button
                onClick={onRunBenchmark}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Run Benchmark
              </button>
            </div>

            {benchmark ? (
              <div className="space-y-3">
                <div className="h-48 w-full bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={benchmark.dataPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis
                        dataKey="inputSize"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(v) => `n=${v}`}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(v) => `${v}ms`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          fontSize: "11px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="runtimeMs"
                        stroke="#00E5FF"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#00E5FF" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  {benchmark.dataPoints.map((dp, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-slate-900 border border-slate-800"
                    >
                      <div className="text-[10px] text-slate-400">n = {dp.inputSize}</div>
                      <div className="font-bold text-cyan-300 font-mono mt-0.5">
                        {dp.runtimeMs}ms
                      </div>
                      <div className="text-[10px] text-slate-500">{dp.memoryKb} KB</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-200">
                    Empirical Curve: {benchmark.empiricalOrder}
                  </div>
                  <p className="text-slate-400">{benchmark.notes}</p>
                </div>

                <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300/80">
                  {benchmark.disclaimer}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                <TrendingUp className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Click &ldquo;Run Benchmark&rdquo; to simulate empirical execution times against 5 input scale factors.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
