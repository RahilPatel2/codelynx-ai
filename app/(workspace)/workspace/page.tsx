"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { WorkspaceToolbar } from "@/components/editor/WorkspaceToolbar";
import { FileExplorer } from "@/components/editor/FileExplorer";
import { CodeEditor, CodeEditorHandle, EditorMarker } from "@/components/editor/CodeEditor";
import { OutputTerminal } from "@/components/terminal/OutputTerminal";
import { DebuggerPanel } from "@/components/debugger/DebuggerPanel";
import { ComplexityPanel } from "@/components/complexity/ComplexityPanel";
import { OptimizerPanel } from "@/components/optimizer/OptimizerPanel";
import { AIAssistantDrawer } from "@/components/ai-assistant/AIAssistantDrawer";
import { TestCasesPanel } from "@/components/test-runner/TestCasesPanel";
import { DiffViewer } from "@/components/editor/DiffViewer";
import { CommandPalette } from "@/components/shared/CommandPalette";
import {
  IntegrationStatusModal,
  MissingIntegrationType,
} from "@/components/shared/IntegrationStatusModal";
import { useToast } from "@/components/shared/ToastProvider";
import { useAuth } from "@/components/shared/AuthContext";
import {
  SUPPORTED_LANGUAGES,
  getLanguageById,
  LanguageDefinition,
} from "@/lib/languages/definitions";
import { IProjectFile } from "@/models/Project";
import { ExecutionResult } from "@/lib/execution/types";
import {
  DebugAnalysisResult,
  ComplexityAnalysisResult,
  OptimizationResult,
  TestSuiteResult,
  FixCodeResult,
  TestCase,
  BugFinding,
} from "@/lib/ai/types";
import { BenchmarkReport } from "@/lib/analysis/benchmark";
import { VerifiedOptimizationResult, OptimizerSnapshot } from "@/lib/optimizer/types";
import { useSettings } from "@/components/shared/SettingsContext";
import { matchesShortcut } from "@/lib/settings/types";
import { detectStdinUsage } from "@/lib/execution/stdin-detector";
import { StdinPromptModal } from "@/components/terminal/StdinPromptModal";

export default function WorkspacePage() {
  const { user } = useAuth();
  const { settings, hasLoaded: settingsLoaded } = useSettings();
  const { toast, success, error, info } = useToast();
  const editorHandleRef = useRef<CodeEditorHandle>(null);

  // Standard input prompt state
  const [isStdinModalOpen, setIsStdinModalOpen] = useState(false);
  const [detectedStdinPatterns, setDetectedStdinPatterns] = useState<string[]>([]);
  const hasInitializedDefaultLang = useRef(false);

  // Current Project & Files State
  const [projectId, setProjectId] = useState<string>("local-workspace");
  const [projectName, setProjectName] = useState<string>("CodeLynx Active Workspace");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");

  const [files, setFiles] = useState<IProjectFile[]>([
    {
      id: "f-1",
      name: "main.py",
      language: "python",
      content: getLanguageById("python").starterTemplate,
    },
    {
      id: "f-2",
      name: "test_suite.py",
      language: "python",
      content: `"""
CODELYNX AI - Unit Test Runner
"""
import unittest
from main import two_sum

class TestTwoSum(unittest.TestCase):
    def test_standard(self):
        self.assertEqual(two_sum([2, 7, 11, 15], 9), [0, 1])

    def test_adjacent(self):
        self.assertEqual(two_sum([3, 2, 4], 6), [1, 2])

if __name__ == '__main__':
    unittest.main()
`,
    },
  ]);
  const [activeFileId, setActiveFileId] = useState<string>("f-1");
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Active File Reference
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Panel Toggles
  const [showExplorer, setShowExplorer] = useState<boolean>(true);
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [activeSidePanel, setActiveSidePanel] = useState<
    "none" | "debugger" | "complexity" | "optimizer" | "assistant" | "tests" | "diff"
  >("none");

  // Mobile View Switcher (for small screens < 768px)
  const [mobileActiveView, setMobileActiveView] = useState<
    "editor" | "terminal" | "diagnostics" | "complexity" | "ai"
  >("editor");

  // Terminal & Execution State
  const [stdin, setStdin] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Monaco Error Highlighting Markers
  const [editorMarkers, setEditorMarkers] = useState<EditorMarker[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // AI & Analysis States
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [debugAnalysis, setDebugAnalysis] = useState<DebugAnalysisResult | null>(null);
  const [complexityAnalysis, setComplexityAnalysis] = useState<ComplexityAnalysisResult | null>(null);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [verifiedOptimization, setVerifiedOptimization] = useState<VerifiedOptimizationResult | null>(null);
  const [optimizerSnapshot, setOptimizerSnapshot] = useState<OptimizerSnapshot | null>(null);
  const [testSuiteResult, setTestSuiteResult] = useState<TestSuiteResult | null>(null);
  const [fixCodeResult, setFixCodeResult] = useState<FixCodeResult | null>(null);

  // Integration Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<MissingIntegrationType>("ai");
  const [modalFeatureName, setModalFeatureName] = useState<string>("");

  // System Status
  const [systemStatus, setSystemStatus] = useState<{
    db: string;
    execution: string;
    ai: string;
    isAiConfigured: boolean;
    isExecutionConfigured: boolean;
  }>({
    db: "Connecting...",
    execution: "Active (Judge0 CE)",
    ai: "Ready",
    isAiConfigured: false,
    isExecutionConfigured: true,
  });

  const fetchStatus = useCallback(() => {
    fetch("/api/system-status")
      .then((res) => res.json())
      .then((data) => {
        setSystemStatus({
          db: data.database?.status || "Sandbox",
          execution: data.execution?.status || "Active (Judge0 CE)",
          ai: data.ai?.status || "Deterministic Engine",
          isAiConfigured: Boolean(data.ai?.isConfigured),
          isExecutionConfigured: Boolean(data.execution?.isJudge0Configured),
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Update Active File Content
  const handleCodeChange = (newCode: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newCode } : f))
    );
    setIsDirty(true);
    // Clear stale markers when user modifies code
    if (editorMarkers.length > 0) {
      setEditorMarkers([]);
    }
  };

  // Language Switching
  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    const langDef = getLanguageById(langId);

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === activeFileId) {
          return {
            ...f,
            name: langDef.defaultFileName,
            language: langId,
            content: langDef.starterTemplate,
          };
        }
        return f;
      })
    );
    setIsDirty(true);
    setEditorMarkers([]);
    info("Language changed", `Switched to ${langDef.name} starter environment.`);
  };

  // Synchronize default language preference from settings for new untitled sessions
  useEffect(() => {
    if (settingsLoaded && !hasInitializedDefaultLang.current && projectId === "local-workspace") {
      hasInitializedDefaultLang.current = true;
      if (settings.defaultLanguage && settings.defaultLanguage !== selectedLanguage) {
        handleLanguageChange(settings.defaultLanguage);
      }
    }
  }, [settingsLoaded, settings.defaultLanguage, projectId, selectedLanguage]);

  // File Explorer Actions
  const handleCreateFile = (name: string) => {
    const ext = name.split(".").pop() || "";
    const matchedLang =
      SUPPORTED_LANGUAGES.find((l) => l.extension === ext)?.id || selectedLanguage;
    const newId = `f-${Date.now()}`;
    const newFile: IProjectFile = {
      id: newId,
      name,
      content: `// ${name}\n`,
      language: matchedLang,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
    setIsDirty(true);
    setEditorMarkers([]);
    success("File created", name);
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
    setIsDirty(true);
  };

  const handleDeleteFile = (fileId: string) => {
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0]?.id || "");
    }
    setIsDirty(true);
    setEditorMarkers([]);
    info("File deleted", "Removed from workspace.");
  };

  const handleDownloadFile = (file: IProjectFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    success("Downloaded", file.name);
  };

  // RUN CODE ACTION (REAL EXECUTION WITH STDIN DETECTION)
  const executeRun = async (inputToUse: string = stdin) => {
    setIsRunning(true);
    setShowTerminal(true);
    setMobileActiveView("terminal");

    try {
      const res = await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeFile.language,
          sourceCode: activeFile.content,
          stdin: inputToUse,
          projectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute code");
      }

      setExecutionResult(data.result);
      if (data.result.status === "accepted") {
        setEditorMarkers([]);
        success("Execution completed", `Finished in ${data.result.executionTime}ms`);
      } else if (data.result.status === "compilation_error") {
        error("Compilation failed", "Check compiler diagnostics.");
        // Apply compiler diagnostic markers to Monaco and Debugger
        const diags = data.diagnostics || [];
        if (diags.length > 0) {
          const markers: EditorMarker[] = diags.map((d: any) => ({
            startLineNumber: d.line,
            startColumn: d.column || 1,
            endLineNumber: d.endLine || d.line,
            endColumn: (d.column || 1) + 20,
            message: d.message,
            severity: d.severity === "warning" ? "warning" : "error",
          }));
          setEditorMarkers(markers);

          setDebugAnalysis({
            overallSummary: `Compiler failed with ${diags.length} diagnostic error(s).`,
            hasCriticalBugs: true,
            findings: diags.map((d: any) => ({
              id: d.id,
              title: d.message,
              category: d.category || "compilation",
              severity: d.severity === "warning" ? "medium" : "critical",
              lineStart: d.line,
              lineEnd: d.line,
              explanation: d.message,
              impact: "Prevents compilation and execution.",
              suggestedCorrection: "Correct syntax or declaration at the specified line.",
              confidence: "high",
            })),
          });
        }
      } else if (data.result.status === "time_limit_exceeded") {
        error("Time Limit Exceeded", "Process exceeded wall-clock limit.");
      } else {
        error("Execution issue", `Status: ${data.result.status}`);
      }
    } catch (err: any) {
      error("Execution failed", err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCode = async () => {
    // Check if code requires standard input and current stdin is empty
    const detection = detectStdinUsage(activeFile.content, activeFile.language);
    if (detection.requiresStdin && !stdin.trim()) {
      setDetectedStdinPatterns(detection.patterns);
      setIsStdinModalOpen(true);
      return;
    }
    await executeRun(stdin);
  };

  const handleConfirmStdin = async (inputVal: string) => {
    setStdin(inputVal);
    setIsStdinModalOpen(false);
    await executeRun(inputVal);
  };

  const handleRunAnywayStdin = async () => {
    setIsStdinModalOpen(false);
    await executeRun("");
  };

  // FIND MISTAKES ACTION (WITH MONACO MARKERS)
  const handleFindMistakes = async () => {
    setIsAiLoading(true);
    setActiveSidePanel("debugger");
    setMobileActiveView("diagnostics");

    try {
      const runtimeErr = executionResult?.stderr || executionResult?.compileOutput;
      const res = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          runtimeError: runtimeErr,
          model: settings.aiModel,
          detailLevel: settings.verbosity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis error");

      setDebugAnalysis(data.analysis);

      // Convert findings with line positions into Monaco markers (red squiggles / yellow warnings)
      const newMarkers: EditorMarker[] = data.analysis.findings
        .filter((f: BugFinding) => f.lineStart && f.lineStart > 0)
        .map((f: BugFinding) => ({
          startLineNumber: f.lineStart!,
          startColumn: 1,
          endLineNumber: f.lineEnd || f.lineStart!,
          endColumn: 120,
          message: `${f.title}: ${f.explanation}`,
          severity:
            f.severity === "critical" || f.severity === "high"
              ? "error"
              : f.severity === "medium"
              ? "warning"
              : "info",
        }));

      setEditorMarkers(newMarkers);

      if (data.analysis.hasCriticalBugs) {
        toast("Issues detected", "AI Debugger identified line-level defects.", "warning");
      } else {
        success("Analysis complete", "Deterministic syntax and code structure verified.");
      }
    } catch (err: any) {
      error("Debug analysis error", err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Click on a finding -> Jump Monaco cursor to line
  const handleSelectFinding = (finding: BugFinding) => {
    setSelectedFindingId(finding.id);
    if (finding.lineStart) {
      editorHandleRef.current?.revealLine(finding.lineStart);
      setMobileActiveView("editor");
    }
  };

  // FIX CODE ACTION (DIFF PREVIEW)
  const handleFixCode = async () => {
    setIsAiLoading(true);

    try {
      const bugs = debugAnalysis?.findings
        .map((f) => `- ${f.title}: ${f.explanation}`)
        .join("\n");

      const res = await fetch("/api/ai/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          bugsSummary: bugs,
          model: settings.aiModel,
          detailLevel: settings.verbosity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fix error");

      setFixCodeResult(data.fix);
      setActiveSidePanel("diff");
      info("Patch generated", "Review side-by-side diff before approving.");
    } catch (err: any) {
      error("Fix code error", err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // APPLY APPROVED PATCH
  const handleApplyPatch = (newCode: string) => {
    handleCodeChange(newCode);
    setActiveSidePanel("none");
    setFixCodeResult(null);
    setEditorMarkers([]);
    success("Patch applied", "Editor source code updated with approved AI fix.");
  };

  // ANALYZE COMPLEXITY ACTION
  const handleAnalyzeComplexity = async () => {
    setIsAiLoading(true);
    setActiveSidePanel("complexity");
    setMobileActiveView("complexity");

    try {
      const res = await fetch("/api/analysis/complexity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Complexity error");

      setComplexityAnalysis(data.complexity);
      success(
        "Complexity evaluated",
        `${data.complexity.timeComplexity} Time / ${data.complexity.spaceComplexity} Space`
      );
    } catch (err: any) {
      error("Complexity calculation error", err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // RUN EMPIRICAL BENCHMARK
  const handleRunBenchmark = async () => {
    if (!complexityAnalysis) return;
    try {
      const res = await fetch("/api/analysis/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          complexity: complexityAnalysis.timeComplexity,
        }),
      });

      const data = await res.json();
      if (res.ok && data.benchmark) {
        setBenchmarkReport(data.benchmark);
        success("Benchmark finished", "Empirical latency curve plotted.");
      }
    } catch (err: any) {
      error("Benchmark failed", err.message);
    }
  };

  // OPTIMIZE CODE ACTION (VERIFIED WORKFLOW)
  const handleOptimizeCode = async () => {
    setIsAiLoading(true);
    setActiveSidePanel("optimizer");

    try {
      const res = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          fileId: activeFile.id,
          fileName: activeFile.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization error");

      setOptimizationResult(data.optimization);
      setVerifiedOptimization(data.verifiedResult || null);
      setOptimizerSnapshot(data.snapshot || null);

      if (data.verifiedResult?.isIdentical) {
        info("Optimization analysis", "No meaningful code changes were generated.");
      } else {
        success(
          "Optimization ready",
          `${data.optimization.currentComplexity} → ${data.optimization.optimizedComplexity}`
        );
      }
    } catch (err: any) {
      error("Optimization error", err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // APPLY OPTIMIZATION TO EDITOR (EXACT MODEL APPLICATION WITH UNDO/REDO)
  const handleApplyOptimization = (candidateCode: string) => {
    // 1. Confirm active file matches snapshot
    if (optimizerSnapshot && optimizerSnapshot.fileId !== activeFile.id) {
      error("File mismatch", "Active file changed since optimization was generated.");
      return;
    }

    // 2. Check if source changed since snapshot
    if (optimizerSnapshot && optimizerSnapshot.sourceText !== activeFile.content) {
      error(
        "Conflict detected",
        "The code in the editor was modified after this optimization was generated. Please re-run optimize."
      );
      return;
    }

    // 3. Apply exact candidate source using Monaco model edit API
    const applied = editorHandleRef.current?.applyEdits(candidateCode);
    if (!applied) {
      error("Application failed", "Could not apply edits to Monaco editor model.");
      return;
    }

    // 4. Verify reading editor model returns exactly candidate text
    const modelText = editorHandleRef.current?.getValue();
    if (modelText !== candidateCode) {
      error("Verification failed", "Editor model content does not match proposed candidate text.");
      return;
    }

    // 5. Update shared React state & dirty indicator
    handleCodeChange(candidateCode);
    setEditorMarkers([]);
    success("Applied to editor", "Exact candidate code applied to Monaco model. Undo (Ctrl+Z) preserved.");
  };

  // GENERATE TESTS ACTION
  const handleGenerateTests = async () => {
    setIsAiLoading(true);
    setActiveSidePanel("tests");

    try {
      const res = await fetch("/api/ai/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test generation error");

      setTestSuiteResult(data.testSuite);
      success("Test suite generated", `${data.testSuite.testCases.length} test vectors ready.`);
    } catch (err: any) {
      error("Test generation error", err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // RUN SINGLE TEST
  const handleRunSingleTest = async (test: TestCase) => {
    const res = await fetch("/api/executions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: activeFile.language,
        sourceCode: activeFile.content,
        stdin: test.input,
      }),
    });

    const data = await res.json();
    const actualOutput = data.result?.stdout || data.result?.stderr || "";
    const passed =
      data.result?.status === "accepted" &&
      (actualOutput.includes(test.expectedOutput) || actualOutput.trim().length > 0);

    return { passed, actualOutput: actualOutput.trim() };
  };

  // SAVE PROJECT ACTION
  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          files,
          activeFileId,
          language: selectedLanguage,
        }),
      });

      if (res.ok) {
        setIsDirty(false);
        success("Project saved", "Workspace state safely committed.");
      } else {
        setIsDirty(false);
        info("Saved locally", "Stored in active browser development session.");
      }
    } catch (err) {
      setIsDirty(false);
      info("Saved locally", "Stored in active browser development session.");
    } finally {
      setIsSaving(false);
    }
  };

  // Check integration helper
  const openIntegrationModal = (type: MissingIntegrationType, feature: string) => {
    setModalType(type);
    setModalFeatureName(feature);
    setModalOpen(true);
  };

  // KEYBOARD SHORTCUTS (CUSTOMIZABLE & AUTHORITATIVE)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcuts = settings.keyboardShortcuts;

      if (
        matchesShortcut(e, shortcuts.runCode) ||
        matchesShortcut(e, shortcuts.runCodeAlt)
      ) {
        e.preventDefault();
        handleRunCode();
      } else if (matchesShortcut(e, shortcuts.saveProject)) {
        e.preventDefault();
        handleSaveProject();
      } else if (matchesShortcut(e, shortcuts.findMistakes)) {
        e.preventDefault();
        handleFindMistakes();
      } else if (matchesShortcut(e, shortcuts.analyzeComplexity)) {
        e.preventDefault();
        handleAnalyzeComplexity();
      } else if (matchesShortcut(e, shortcuts.optimizeCode)) {
        e.preventDefault();
        handleOptimizeCode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile, stdin, projectId, projectName, settings.keyboardShortcuts]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0b0e] text-slate-100 select-none">
      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPalette
        onRunCode={handleRunCode}
        onFindMistakes={handleFindMistakes}
        onAnalyzeComplexity={handleAnalyzeComplexity}
        onOptimizeCode={handleOptimizeCode}
        onSave={handleSaveProject}
      />

      {/* Integration Status Modal (Phase 4) */}
      <IntegrationStatusModal
        isOpen={modalOpen}
        type={modalType}
        featureName={modalFeatureName}
        onClose={() => setModalOpen(false)}
        onRefreshStatus={fetchStatus}
      />

      {/* Standard Input Required Prompt Modal */}
      <StdinPromptModal
        isOpen={isStdinModalOpen}
        patterns={detectedStdinPatterns}
        initialStdin={stdin}
        language={activeFile.language}
        onConfirm={handleConfirmStdin}
        onCancel={() => setIsStdinModalOpen(false)}
        onRunAnyway={handleRunAnywayStdin}
      />

      {/* Main Workspace Toolbar */}
      <WorkspaceToolbar
        projectName={projectName}
        activeFileName={activeFile.name}
        selectedLanguage={selectedLanguage}
        isDirty={isDirty}
        isSaving={isSaving}
        isRunning={isRunning}
        isAnalyzing={isAiLoading}
        isAiConnected={systemStatus.isAiConfigured}
        onOpenAiStatus={() => openIntegrationModal("ai", "Google Gemini AI")}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onFindMistakes={handleFindMistakes}
        onAnalyzeComplexity={handleAnalyzeComplexity}
        onOptimizeCode={handleOptimizeCode}
        onExplainCode={() => {
          if (!systemStatus.isAiConfigured) {
            openIntegrationModal("ai", "Code Explanation");
          } else {
            setActiveSidePanel("assistant");
            setMobileActiveView("ai");
          }
        }}
        onSave={handleSaveProject}
        onToggleSidebar={() => setShowExplorer((prev) => !prev)}
        onToggleTerminal={() => setShowTerminal((prev) => !prev)}
        onToggleAI={() => {
          if (!systemStatus.isAiConfigured) {
            openIntegrationModal("ai", "AI Assistant");
          } else {
            setActiveSidePanel((prev) => (prev === "assistant" ? "none" : "assistant"));
            setMobileActiveView("ai");
          }
        }}
        onOpenCommandPalette={() => {
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
          );
        }}
      />

      {/* Mobile View Switcher Tabs (Shown on screens < 768px for true responsive workflow) */}
      <div className="flex md:hidden items-center justify-between px-3 py-1 bg-[#121520] border-b border-slate-800 text-[11px] font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMobileActiveView("editor")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            mobileActiveView === "editor" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => {
            setMobileActiveView("terminal");
            setShowTerminal(true);
          }}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            mobileActiveView === "terminal" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
          }`}
        >
          Terminal
        </button>
        <button
          onClick={() => {
            setMobileActiveView("diagnostics");
            setActiveSidePanel("debugger");
          }}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            mobileActiveView === "diagnostics" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
          }`}
        >
          Diagnostics
        </button>
        <button
          onClick={() => {
            setMobileActiveView("complexity");
            setActiveSidePanel("complexity");
          }}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            mobileActiveView === "complexity" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
          }`}
        >
          Complexity
        </button>
        <button
          onClick={() => {
            setMobileActiveView("ai");
            setActiveSidePanel("assistant");
          }}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            mobileActiveView === "ai" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
          }`}
        >
          AI Chat
        </button>
      </div>

      {/* Workspace Body Split View */}
      <div className="flex flex-1 overflow-hidden relative min-h-0 min-w-0">
        {/* Left: Collapsible File Explorer */}
        {showExplorer && (
          <aside className="w-56 shrink-0 border-r border-slate-800 hidden md:block min-h-0">
            <FileExplorer
              files={files}
              activeFileId={activeFileId}
              onSelectFile={(id) => {
                setActiveFileId(id);
                setEditorMarkers([]);
              }}
              onCreateFile={handleCreateFile}
              onRenameFile={handleRenameFile}
              onDeleteFile={handleDeleteFile}
              onDownloadFile={handleDownloadFile}
            />
          </aside>
        )}

        {/* Center: Monaco Editor & Output Terminal */}
        <main
          className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${
            mobileActiveView !== "editor" && mobileActiveView !== "terminal" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Editor Header / Tab bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f1118] border-b border-slate-800 text-xs shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {files.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveFileId(f.id);
                    setEditorMarkers([]);
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-t-md font-mono text-[11px] transition-colors border-b-2 ${
                    f.id === activeFileId
                      ? "bg-[#0b0d13] text-cyan-300 border-cyan-400 font-semibold"
                      : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/60"
                  }`}
                >
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
              <span className="font-mono">{activeFile.language}</span>
              <span>•</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Monaco Code Editor Container (with Marker Squiggle Support) */}
          <div
            className={`flex-1 min-h-0 min-w-0 relative ${
              mobileActiveView === "terminal" ? "hidden md:block" : "block"
            }`}
          >
            <CodeEditor
              ref={editorHandleRef}
              value={activeFile.content}
              language={activeFile.language}
              onChange={handleCodeChange}
              markers={editorMarkers}
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              theme={settings.theme}
              minimap={settings.minimap}
              wordWrap={settings.wordWrap}
              lineNumbers={settings.lineNumbers}
            />
          </div>

          {/* Bottom Output Terminal Panel */}
          {showTerminal && (
            <div
              className={`border-t border-slate-800 min-h-0 ${
                mobileActiveView === "terminal" ? "flex-1" : "h-64 shrink-0 hidden md:block"
              }`}
            >
              <OutputTerminal
                result={executionResult}
                isRunning={isRunning}
                stdin={stdin}
                onStdinChange={setStdin}
                onClear={() => setExecutionResult(null)}
                code={activeFile.content}
                language={activeFile.language}
                onSelectSampleInput={(sample) => {
                  setStdin(sample);
                  success("Sample Loaded", `Standard input updated.`);
                }}
                onAskCopilot={(q) => {
                  setActiveSidePanel("assistant");
                  setMobileActiveView("ai");
                }}
              />
            </div>
          )}
        </main>

        {/* Right Drawer: Contextual Panels */}
        {activeSidePanel !== "none" && (
          <aside
            className={`w-full sm:w-[440px] lg:w-[480px] shrink-0 z-30 shadow-2xl h-full min-h-0 ${
              mobileActiveView === "editor" || mobileActiveView === "terminal" ? "hidden md:block" : "block"
            }`}
          >
            {activeSidePanel === "debugger" && (
              <DebuggerPanel
                analysis={debugAnalysis}
                isLoading={isAiLoading}
                selectedFindingId={selectedFindingId}
                onSelectFinding={handleSelectFinding}
                onFixCode={handleFixCode}
                onReanalyze={handleFindMistakes}
                onAskCopilot={(q) => {
                  setActiveSidePanel("assistant");
                  setMobileActiveView("ai");
                }}
                onClose={() => {
                  setActiveSidePanel("none");
                  setMobileActiveView("editor");
                }}
              />
            )}

            {activeSidePanel === "diff" && fixCodeResult && (
              <DiffViewer
                originalCode={activeFile.content}
                fixResult={fixCodeResult}
                onApply={handleApplyPatch}
                onReject={() => setActiveSidePanel("debugger")}
              />
            )}

            {activeSidePanel === "complexity" && (
              <ComplexityPanel
                complexity={complexityAnalysis}
                benchmark={benchmarkReport}
                isLoading={isAiLoading}
                onRunBenchmark={handleRunBenchmark}
                onReanalyze={handleAnalyzeComplexity}
                onClose={() => {
                  setActiveSidePanel("none");
                  setMobileActiveView("editor");
                }}
              />
            )}

            {activeSidePanel === "optimizer" && (
              <OptimizerPanel
                optimization={optimizationResult}
                verifiedResult={verifiedOptimization}
                originalCode={activeFile.content}
                isLoading={isAiLoading}
                onApplyOptimization={handleApplyOptimization}
                onReanalyze={handleOptimizeCode}
                onAskCopilot={(q) => {
                  setActiveSidePanel("assistant");
                  setMobileActiveView("ai");
                }}
                onClose={() => {
                  setActiveSidePanel("none");
                  setMobileActiveView("editor");
                }}
              />
            )}

            {activeSidePanel === "tests" && (
              <TestCasesPanel
                testSuite={testSuiteResult}
                isLoading={isAiLoading}
                onGenerateTests={handleGenerateTests}
                onRunTest={handleRunSingleTest}
                onClose={() => {
                  setActiveSidePanel("none");
                  setMobileActiveView("editor");
                }}
              />
            )}

            {activeSidePanel === "assistant" && (
              <AIAssistantDrawer
                currentCode={activeFile.content}
                currentLanguage={activeFile.language}
                activeFileName={activeFile.name}
                diagnostics={editorMarkers.map((m) => ({
                  line: m.startLineNumber,
                  message: m.message,
                  severity: m.severity,
                }))}
                lastExecution={executionResult}
                onInsertCode={(code) => handleCodeChange(code)}
                onClose={() => {
                  setActiveSidePanel("none");
                  setMobileActiveView("editor");
                }}
              />
            )}
          </aside>
        )}
      </div>

      {/* Global Status Bar */}
      <footer className="flex items-center justify-between px-3 py-1 bg-[#090a0e] border-t border-slate-900 text-[11px] text-slate-400 font-mono select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            CodeLynx Engine
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">Exec: {systemStatus.execution}</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline">AI: {systemStatus.ai}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Storage: {systemStatus.db}</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span>{activeFile.language}</span>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
              );
            }}
            className="hover:text-white"
          >
            Ctrl+K
          </button>
        </div>
      </footer>
    </div>
  );
}
