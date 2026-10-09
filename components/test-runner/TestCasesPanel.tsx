"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  FlaskConical,
} from "lucide-react";
import { TestSuiteResult, TestCase } from "@/lib/ai/types";

interface TestCasesPanelProps {
  testSuite: TestSuiteResult | null;
  isLoading: boolean;
  onGenerateTests: () => void;
  onRunTest: (test: TestCase) => Promise<{ passed: boolean; actualOutput: string }>;
  onClose: () => void;
}

export const TestCasesPanel: React.FC<TestCasesPanelProps> = ({
  testSuite,
  isLoading,
  onGenerateTests,
  onRunTest,
  onClose,
}) => {
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { passed: boolean; actualOutput: string }>
  >({});

  const handleExecuteSingleTest = async (test: TestCase) => {
    setRunningTestId(test.id);
    try {
      const res = await onRunTest(test);
      setTestResults((prev) => ({ ...prev, [test.id]: res }));
    } finally {
      setRunningTestId(null);
    }
  };

  const handleRunAll = async () => {
    if (!testSuite) return;
    for (const tc of testSuite.testCases) {
      await handleExecuteSingleTest(tc);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#11131c] border-l border-slate-800 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#151924] border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Automated Test Suite
              {testSuite && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {testSuite.testCases.length} Cases
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Edge cases, boundary limits, and adversarial inputs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {testSuite && (
            <button
              onClick={handleRunAll}
              disabled={Boolean(runningTestId)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              Run All
            </button>
          )}
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
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <div className="text-sm font-medium text-slate-200">
              Synthesizing boundary conditions and regression suite...
            </div>
          </div>
        ) : !testSuite ? (
          <div className="text-center py-16 text-slate-500 space-y-3">
            <FlaskConical className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm">No test cases generated yet.</p>
            <button
              onClick={onGenerateTests}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Test Suite
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              {testSuite.overallExplanation}
            </div>

            <div className="space-y-3">
              {testSuite.testCases.map((tc) => {
                const result = testResults[tc.id];
                const isRunning = runningTestId === tc.id;

                return (
                  <div
                    key={tc.id}
                    className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{tc.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {tc.category.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {result && (
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              result.passed
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {result.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {result.passed ? "PASSED" : "FAILED"}
                          </span>
                        )}

                        <button
                          onClick={() => handleExecuteSingleTest(tc)}
                          disabled={isRunning}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="Run this test"
                        >
                          <Play
                            className={`w-3.5 h-3.5 ${
                              isRunning ? "animate-spin text-cyan-400" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                        <div className="text-[10px] text-slate-500 font-sans">Input:</div>
                        <div className="text-slate-200 truncate">{tc.input}</div>
                      </div>

                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
                        <div className="text-[10px] text-slate-500 font-sans">
                          Expected Output:
                        </div>
                        <div className="text-emerald-300 truncate">
                          {tc.expectedOutput}
                        </div>
                      </div>
                    </div>

                    {result && !result.passed && (
                      <div className="p-2 rounded bg-rose-950/20 border border-rose-500/30 text-rose-300 font-mono text-[11px]">
                        <span className="font-sans text-[10px] uppercase text-rose-400 block">
                          Actual Output:
                        </span>
                        {result.actualOutput}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">{tc.explanation}</div>
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
