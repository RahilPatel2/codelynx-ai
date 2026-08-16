"use client";

import React, { useState } from "react";
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  Play,
  Copy,
  Trash2,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Keyboard,
  FlaskConical,
  Check,
  Sparkles,
  HelpCircle as HelpIcon,
  Bot,
} from "lucide-react";
import { ExecutionResult } from "@/lib/execution/types";

interface OutputTerminalProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  stdin: string;
  onStdinChange: (val: string) => void;
  onClear: () => void;
  onSelectSampleInput?: (sample: string) => void;
  code?: string;
  language?: string;
  onAskCopilot?: (question: string) => void;
}

export const OutputTerminal: React.FC<OutputTerminalProps> = ({
  result,
  isRunning,
  stdin,
  onStdinChange,
  onClear,
  onSelectSampleInput,
  code = "",
  language = "python",
  onAskCopilot,
}) => {
  const [activeTab, setActiveTab] = useState<"output" | "errors" | "stdin" | "testcases" | "metrics">("output");
  const [copied, setCopied] = useState(false);
  const [isExplainingError, setIsExplainingError] = useState(false);
  const [errorExplanation, setErrorExplanation] = useState<any | null>(null);

  const handleExplainError = async () => {
    const rawError = (result?.compileOutput || "") + "\n" + (result?.stderr || "");
    if (!rawError.trim()) return;

    setIsExplainingError(true);
    setErrorExplanation(null);
    try {
      const res = await fetch("/api/ai/explain-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: rawError,
          code,
          language,
        }),
      });
      const data = await res.json();
      if (res.ok && data.explanation) {
        setErrorExplanation(data.explanation);
      }
    } catch (e) {
      console.error("Error explaining failure:", e);
    } finally {
      setIsExplainingError(false);
    }
  };

  const handleCopy = () => {
    let textToCopy = "";
    if (activeTab === "errors") {
      textToCopy = (result?.stderr || "") + "\n" + (result?.compileOutput || "");
    } else if (activeTab === "stdin") {
      textToCopy = stdin;
    } else {
      textToCopy = result?.stdout || "";
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Running...
        </span>
      );
    }

    if (!result) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
          Ready
        </span>
      );
    }

    const status = result.status;

    if (status === "accepted") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Accepted (0)
        </span>
      );
    }
    if (status === "compilation_error") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Compilation Error
        </span>
      );
    }
    if (status === "time_limit_exceeded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <Clock className="w-3.5 h-3.5" />
          Time Limit Exceeded
        </span>
      );
    }
    if (status === "memory_limit_exceeded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <Cpu className="w-3.5 h-3.5" />
          Memory Limit Exceeded
        </span>
      );
    }
    if (result.stderr.includes("Not Configured") || result.message?.includes("Connect")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Service Unavailable
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" />
        Runtime Error ({result.exitCode})
      </span>
    );
  };

  const sampleInputs = [
    { label: "Two Integers: 5 7", value: "5 7" },
    { label: "Array Size & Elements", value: "5\n10 20 30 40 50" },
    { label: "Single String", value: "CodeLynx" },
    { label: "Negative Numbers", value: "-15 -30" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d0f17] border-t border-slate-800 font-mono text-xs select-text min-h-0 overflow-hidden">
      {/* Tab bar header */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[#121520] border-b border-white/5 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "output"
                ? "bg-slate-800 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Output</span>
          </button>

          <button
            onClick={() => setActiveTab("errors")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "errors"
                ? "bg-slate-800 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                result?.stderr || result?.compileOutput ? "text-rose-400" : "text-slate-500"
              }`}
            />
            <span>Errors</span>
            {(result?.stderr || result?.compileOutput) && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("stdin")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "stdin"
                ? "bg-slate-800 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Input (stdin)</span>
            {stdin.trim().length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("testcases")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "testcases"
                ? "bg-slate-800 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Samples</span>
          </button>

          <button
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "metrics"
                ? "bg-slate-800 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Telemetry</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {getStatusBadge()}

          {result && (
            <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                {result.executionTime}ms
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                {result.memoryUsage > 0 ? `${result.memoryUsage} KB` : "N/A"}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={handleCopy}
              title="Copy Output"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClear}
              title="Clear Terminal"
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className="flex-1 p-3 overflow-auto font-mono text-xs leading-relaxed select-text min-h-0">
        {isRunning ? (
          <div className="flex items-center gap-2.5 text-cyan-400 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Transmitting code to isolated compiler container & waiting for stdout...</span>
          </div>
        ) : activeTab === "output" ? (
          result?.stdout ? (
            <pre className="text-slate-200 whitespace-pre-wrap">{result.stdout}</pre>
          ) : result?.stderr || result?.compileOutput ? (
            <div className="space-y-1">
              <div className="text-rose-400 font-semibold">Standard Error / Compiler Diagnostic:</div>
              <pre className="text-rose-300 whitespace-pre-wrap bg-rose-950/20 p-2.5 rounded border border-rose-500/20">
                {result.stderr || result.compileOutput}
              </pre>
            </div>
          ) : (
            <div className="text-slate-500 italic">
              Terminal ready. Press &ldquo;Run Code&rdquo; or Ctrl+Enter to execute program. If your program requests user input (cin / input() / Scanner), enter it in the &ldquo;Input (stdin)&rdquo; tab.
            </div>
          )
        ) : activeTab === "errors" ? (
          result?.stderr || result?.compileOutput ? (
            <div className="space-y-2">
              {result.compileOutput && (
                <div>
                  <div className="text-amber-400 font-semibold mb-1">Compiler Diagnostics:</div>
                  <pre className="text-amber-200/90 whitespace-pre-wrap bg-amber-950/20 p-2.5 rounded border border-amber-500/20">
                    {result.compileOutput}
                  </pre>
                </div>
              )}
              {result.stderr && (
                <div>
                  <div className="text-rose-400 font-semibold mb-1">Standard Error (stderr):</div>
                  <pre className="text-rose-200 whitespace-pre-wrap bg-rose-950/20 p-2.5 rounded border border-rose-500/20">
                    {result.stderr}
                  </pre>
                </div>
              )}

              {/* Explain with AI & Copilot Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExplainError}
                  disabled={isExplainingError}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isExplainingError ? "animate-spin" : ""}`} />
                  <span>{isExplainingError ? "Consulting Gemini AI..." : "Explain Error with Gemini AI"}</span>
                </button>

                {onAskCopilot && (
                  <button
                    onClick={() =>
                      onAskCopilot(
                        `I encountered this compiler or runtime error in ${language}:\n\`\`\`\n${(result?.compileOutput || "") + "\n" + (result?.stderr || "")}\n\`\`\`\nWhat should I do next to resolve it?`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask Copilot to Guide Fix</span>
                  </button>
                )}
              </div>

              {/* AI Error Explanation Result Card */}
              {errorExplanation && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      {errorExplanation.errorType || "Error Explanation"}
                    </span>
                  </div>

                  <div className="text-slate-200 leading-relaxed">
                    {errorExplanation.plainEnglishExplanation}
                  </div>

                  {errorExplanation.rootCause && (
                    <div className="p-2 rounded bg-slate-950 border border-white/5 text-[11px] text-slate-300 font-mono">
                      <span className="text-amber-400 font-semibold">Root Cause: </span>
                      {errorExplanation.rootCause}
                    </div>
                  )}

                  {errorExplanation.suggestedFix && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 text-xs">
                      <span className="font-bold text-emerald-400">Suggested Fix: </span>
                      {errorExplanation.suggestedFix}
                    </div>
                  )}

                  {errorExplanation.fixedCodeSnippet && (
                    <div>
                      <div className="text-slate-400 text-[11px] mb-1">Proposed Correction:</div>
                      <pre className="p-2 rounded bg-slate-950 font-mono text-xs text-emerald-300 overflow-x-auto border border-emerald-500/30">
                        {errorExplanation.fixedCodeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 italic">
              No compiler errors or exceptions reported.
            </div>
          )
        ) : activeTab === "stdin" ? (
          <div className="h-full flex flex-col space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Standard Input (stdin) supplied to the program container:</span>
              <span className="text-cyan-400">
                {stdin.length} characters • {stdin.split("\n").length} lines
              </span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="e.g. For C++: cin >> a >> b;&#10;5 7&#10;&#10;Or multiple lines of inputs..."
              className="w-full flex-1 min-h-[90px] bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 resize-none font-mono text-xs"
            />
          </div>
        ) : activeTab === "testcases" ? (
          <div className="space-y-2 p-1">
            <div className="text-slate-300 font-sans font-medium text-xs">
              Quick Sample Input Vectors:
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Click any vector to populate standard input (stdin) before clicking Run Code.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {sampleInputs.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onStdinChange(sample.value);
                    onSelectSampleInput?.(sample.value);
                    setActiveTab("stdin");
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
                >
                  <span className="text-slate-200 group-hover:text-cyan-300 font-sans">
                    {sample.label}
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    Use input
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Telemetry Tab */
          <div className="space-y-3 p-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[11px]">Execution Time</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">
                  {result?.executionTime ?? 0} ms
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[11px]">Memory Peak</div>
                <div className="text-base font-bold text-indigo-400 mt-0.5">
                  {result?.memoryUsage ?? 0} KB
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[11px]">Exit Code</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {result?.exitCode ?? 0}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500 text-[11px]">Provider</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">
                  {result?.provider ?? "Judge0 CE"}
                </div>
              </div>
            </div>

            {result?.providerStatusDescription && (
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                Status: {result.providerStatusDescription}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
