"use client";

import React, { useState } from "react";
import {
  X,
  Bug,
  Activity,
  Zap,
  BookOpen,
  RotateCcw,
  AlignLeft,
  Settings,
  Sparkles,
  Bot,
  Copy,
  Check,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DSASecondaryActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTutor: () => void;
  onFormatCode: () => void;
  onResetCode: () => void;
  code: string;
  language: string;
  problemTitle: string;
  problemSlug: string;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  onApplyCode?: (newCode: string) => void;
}

export const DSASecondaryActionsModal: React.FC<DSASecondaryActionsModalProps> = ({
  isOpen,
  onClose,
  onOpenTutor,
  onFormatCode,
  onResetCode,
  code,
  language,
  problemTitle,
  problemSlug,
  fontSize,
  onChangeFontSize,
  wordWrap,
  onToggleWordWrap,
  onApplyCode,
}) => {
  const [activeTool, setActiveTool] = useState<
    "menu" | "find-mistakes" | "complexity" | "optimize" | "explain" | "settings"
  >("menu");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Results
  const [debugResult, setDebugResult] = useState<any | null>(null);
  const [complexityResult, setComplexityResult] = useState<any | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<any | null>(null);
  const [explainResult, setExplainResult] = useState<any | null>(null);

  if (!isOpen) return null;

  // Handle Find Mistakes
  const handleFindMistakes = async () => {
    setActiveTool("find-mistakes");
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setDebugResult(data.analysis);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze code mistakes");
    } finally {
      setLoading(false);
    }
  };

  // Handle Complexity Analysis
  const handleComplexityAnalysis = async () => {
    setActiveTool("complexity");
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/analysis/complexity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Complexity analysis failed");
      setComplexityResult(data.complexity);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze algorithmic complexity");
    } finally {
      setLoading(false);
    }
  };

  // Handle Code Optimization
  const handleOptimize = async () => {
    setActiveTool("optimize");
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          fileId: `dsa-${problemSlug}`,
          fileName: `solution.${language === "python" ? "py" : language === "cpp" ? "cpp" : "js"}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization failed");
      setOptimizeResult(data.optimization);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to optimize algorithm");
    } finally {
      setLoading(false);
    }
  };

  // Handle Explain Code
  const handleExplain = async () => {
    setActiveTool("explain");
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code explanation failed");
      setExplainResult(data.explanation);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to explain code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-[#0d0f17] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0a0b0e] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {activeTool !== "menu" && (
              <button
                onClick={() => {
                  setActiveTool("menu");
                  setErrorMsg(null);
                }}
                className="p-1 -ml-1 text-slate-400 hover:text-white rounded-lg"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            )}
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <h3 className="font-bold text-sm text-white truncate">
              {activeTool === "menu" && "Workspace Tools & Actions"}
              {activeTool === "find-mistakes" && "Find Mistakes (AI Debugger)"}
              {activeTool === "complexity" && "Algorithmic Complexity"}
              {activeTool === "optimize" && "Code Optimizer"}
              {activeTool === "explain" && "Explain Code Logic"}
              {activeTool === "settings" && "Editor Settings"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs text-slate-200">
          {/* Main Action Menu */}
          {activeTool === "menu" && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                AI Coding Assistant
              </div>

              {/* Socratic AI Tutor */}
              <button
                onClick={() => {
                  onClose();
                  onOpenTutor();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 transition-colors text-left min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Open Socratic AI Tutor</div>
                    <div className="text-[11px] text-indigo-300/80">
                      Step-by-step algorithmic guidance without spoiling answers
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
              </button>

              {/* Find Mistakes */}
              <button
                onClick={handleFindMistakes}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors text-left min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Bug className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Find Mistakes & Bugs</div>
                    <div className="text-[11px] text-slate-400">
                      Detect logic errors, boundary conditions, and type issues
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* Analyze Complexity */}
              <button
                onClick={handleComplexityAnalysis}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors text-left min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Analyze Complexity (Big-O)</div>
                    <div className="text-[11px] text-slate-400">
                      Deterministic time & auxiliary space complexity evaluation
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* Optimize Code */}
              <button
                onClick={handleOptimize}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors text-left min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Optimize Algorithm</div>
                    <div className="text-[11px] text-slate-400">
                      Propose asymptotically faster algorithm with code diff
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {/* Explain Code */}
              <button
                onClick={handleExplain}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors text-left min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Explain Code Logic</div>
                    <div className="text-[11px] text-slate-400">
                      Step-by-step explanation of current implementation
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 pt-2">
                Editor Utilities
              </div>

              {/* Format Code */}
              <button
                onClick={() => {
                  onFormatCode();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors text-left min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <AlignLeft className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-medium text-xs">Format Code Document</span>
                </div>
              </button>

              {/* Reset to Starter Template */}
              <button
                onClick={() => {
                  if (confirm("Reset code back to original starter template?")) {
                    onResetCode();
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-rose-300 transition-colors text-left min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-medium text-xs">Reset to Starter Template</span>
                </div>
              </button>

              {/* Editor Settings */}
              <button
                onClick={() => setActiveTool("settings")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors text-left min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-xs">Editor Preferences</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Running CodeLynx AI Analysis...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Analysis Error
              </div>
              <p className="text-xs">{errorMsg}</p>
            </div>
          )}

          {/* Tool 1: Find Mistakes Result */}
          {!loading && activeTool === "find-mistakes" && debugResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Found {debugResult.findings?.length || 0} issues
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    debugResult.findings?.length === 0
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {debugResult.findings?.length === 0 ? "Clean Code" : "Action Needed"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                {debugResult.summary}
              </div>

              {debugResult.findings?.map((f: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">
                      Line {f.lineNumber}: {f.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.severity === "high"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">{f.description}</p>
                  {f.suggestedFix && (
                    <div className="p-2 rounded-lg bg-black/50 border border-slate-800 text-[11px] font-mono text-cyan-300">
                      💡 Fix: {f.suggestedFix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tool 2: Complexity Result */}
          {!loading && activeTool === "complexity" && complexityResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Time Complexity
                  </div>
                  <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                    {complexityResult.timeComplexity}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Space Complexity
                  </div>
                  <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                    {complexityResult.spaceComplexity}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-xs text-white">Analysis Breakdown</div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {complexityResult.explanation}
                </p>
              </div>

              {complexityResult.dominantOperations && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-400 uppercase tracking-wider text-[10px]">
                    Dominant Bottlenecks
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    {complexityResult.dominantOperations}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tool 3: Optimizer Result */}
          {!loading && activeTool === "optimize" && optimizeResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <div className="text-xs">
                  <span className="text-slate-400">Complexity: </span>
                  <span className="font-mono text-white font-bold">
                    {optimizeResult.currentComplexity}
                  </span>{" "}
                  →{" "}
                  <span className="font-mono text-cyan-400 font-bold">
                    {optimizeResult.optimizedComplexity}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-xs text-white">Technique</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {optimizeResult.explanation}
                </p>
              </div>

              {optimizeResult.optimizedCode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Optimized Code</span>
                    <button
                      onClick={() => handleCopy(optimizeResult.optimizedCode)}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 p-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-56">
                    {optimizeResult.optimizedCode}
                  </pre>
                  {onApplyCode && (
                    <button
                      onClick={() => {
                        onApplyCode(optimizeResult.optimizedCode);
                        onClose();
                      }}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all min-h-[44px]"
                    >
                      Apply Optimization to Editor
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tool 4: Explain Code Result */}
          {!loading && activeTool === "explain" && explainResult && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                <div className="font-bold">{explainResult.summary}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-white">Step-by-Step Logic</div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
                  {explainResult.steps?.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tool 5: Editor Preferences */}
          {activeTool === "settings" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-white">Editor Font Size</div>
                    <div className="text-[11px] text-slate-400">Current: {fontSize}px</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onChangeFontSize(Math.max(11, fontSize - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold min-h-[40px] min-w-[40px]"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => onChangeFontSize(Math.min(24, fontSize + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold min-h-[40px] min-w-[40px]"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <div className="font-bold text-xs text-white">Word Wrap</div>
                    <div className="text-[11px] text-slate-400">
                      Wrap long lines to prevent horizontal scrolling
                    </div>
                  </div>
                  <button
                    onClick={onToggleWordWrap}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[40px] ${
                      wordWrap
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {wordWrap ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
