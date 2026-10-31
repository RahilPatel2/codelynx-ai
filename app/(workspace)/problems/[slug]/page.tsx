"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Bot,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Sparkles,
  Layers,
  HelpCircle,
  BookOpen,
  History,
  Copy,
  Check,
  ChevronRight,
  Maximize2,
  Terminal,
  X,
  Code2,
  MoreHorizontal,
  Settings,
  Plus,
  Minus,
  AlignLeft,
  FileText,
  Lightbulb,
  Sliders,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useSettings } from "@/components/shared/SettingsContext";
import { useToast } from "@/components/shared/ToastProvider";
import { PublicDSAProblem } from "@/lib/dsa/types";
import { DSASecondaryActionsModal } from "@/components/dsa/DSASecondaryActionsModal";

// Dynamically import Monaco Editor to avoid SSR window issues
const Editor = nextDynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function ProblemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const { settings, updateSettings } = useSettings();
  const { success, error: toastError, info } = useToast();

  // Problem data states
  const [problem, setProblem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(settings.defaultLanguage || "python");
  const [code, setCode] = useState("");
  
  // Mobile View Switcher: "problem" | "editor" | "output"
  const [mobileActiveTab, setMobileActiveTab] = useState<"problem" | "editor" | "output">("problem");

  // Problem view sub-tabs: "description" | "hints" | "editorial" | "submissions"
  const [activeLeftTab, setActiveLeftTab] = useState<"description" | "hints" | "editorial" | "submissions">(
    "description"
  );

  // Output & Tests view sub-tabs: "testcases" | "stdin" | "results" | "submission"
  const [consoleTab, setConsoleTab] = useState<"testcases" | "stdin" | "results" | "submission">("testcases");
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Mobile editor quick preferences
  const [editorFontSize, setEditorFontSize] = useState<number>(settings.fontSize || 14);
  const [editorWordWrap, setEditorWordWrap] = useState<boolean>(
    settings.wordWrap !== undefined ? settings.wordWrap : true
  );

  // Progressive hints
  const [revealedHintLevel, setRevealedHintLevel] = useState(1);
  const [hintsList, setHintsList] = useState<any[]>([]);

  // AI Tutor drawer states
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([]);
  const [isTutorThinking, setIsTutorThinking] = useState(false);

  // Secondary Tools Modal
  const [isSecondaryModalOpen, setIsSecondaryModalOpen] = useState(false);

  // UI state
  const [copiedExampleIdx, setCopiedExampleIdx] = useState<number | null>(null);
  const [copiedOutputIdx, setCopiedOutputIdx] = useState<number | null>(null);
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([]);

  // Monaco editor reference
  const editorRef = useRef<any>(null);

  // 1. Fetch Problem Details
  useEffect(() => {
    if (!slug) return;
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dsa/problems/${slug}`);
        if (!res.ok) {
          toastError("Problem not found");
          router.push("/problems");
          return;
        }
        const data = await res.json();
        const p = data.problem;
        setProblem(p);
        setHintsList(p.hints || []);
        setRevealedHintLevel(p.revealedHintLevel || 1);
        setSubmissionsHistory(p.submissions || []);

        // Load draft code from localStorage or starterCode
        const localDraftKey = `codelynx_draft_${p.id}_${selectedLanguage}`;
        const savedLocal = localStorage.getItem(localDraftKey);

        if (savedLocal) {
          setCode(savedLocal);
        } else if (p.starterCode?.[selectedLanguage]) {
          setCode(p.starterCode[selectedLanguage]);
        } else if (p.starterCode?.python) {
          setCode(p.starterCode.python);
        }
      } catch (err) {
        console.error("Failed to load problem:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  // 2. Language Change Handler
  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    if (!problem) return;

    // Check if user has a saved draft for this language
    const localDraftKey = `codelynx_draft_${problem.id}_${newLang}`;
    const savedLocal = localStorage.getItem(localDraftKey);
    if (savedLocal) {
      setCode(savedLocal);
    } else if (problem.starterCode?.[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  // 3. Auto-save Draft on code change (debounced)
  useEffect(() => {
    if (!problem || !code) return;
    const localDraftKey = `codelynx_draft_${problem.id}_${selectedLanguage}`;
    const timer = setTimeout(() => {
      localStorage.setItem(localDraftKey, code);
      // Background sync with API
      fetch("/api/dsa/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          language: selectedLanguage,
          code,
        }),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [code, problem, selectedLanguage]);

  // 4. Run Code (against sample tests or custom input)
  const handleRunCode = async (useCustomStdin = false) => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setConsoleTab("results");
    // On mobile screens, automatically switch to the output tab so user sees execution result!
    if (window.innerWidth < 1024) {
      setMobileActiveTab("output");
    }

    try {
      const res = await fetch("/api/dsa/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          problemSlug: problem.slug,
          customInput: useCustomStdin || selectedTestCaseIdx === -1 ? customInput : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRunResult(data.result);
        if (data.result.allPassed) {
          success("All sample test cases passed!");
        } else {
          info("Some tests failed. Inspect actual vs expected outputs.");
        }
      } else {
        toastError(data.error || "Execution failed");
      }
    } catch (err) {
      console.error("Run code error:", err);
      toastError("Network error while connecting to execution sandbox");
    } finally {
      setIsRunning(false);
    }
  };

  // 5. Submit Solution (against hidden test suite)
  const handleSubmit = async () => {
    if (!problem || isSubmitting) return;
    setIsSubmitting(true);
    setConsoleTab("submission");
    // On mobile screens, automatically switch to output tab to display verdict!
    if (window.innerWidth < 1024) {
      setMobileActiveTab("output");
    }

    try {
      const res = await fetch("/api/dsa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          problemSlug: problem.slug,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissionResult(data.submission);
        if (data.submission.status === "accepted") {
          success("🎉 Accepted! All test cases passed!");
          // Update problem solved state locally
          setProblem((prev: any) => ({ ...prev, isSolved: true }));
        } else {
          toastError(`${data.submission.status.toUpperCase()}: ${data.submission.message}`);
        }
        // Refresh submissions tab list
        setSubmissionsHistory((prev) => [
          {
            id: data.submission.submissionId,
            status: data.submission.status,
            runtime: data.submission.runtime,
            memory: data.submission.memory,
            submittedAt: new Date(),
          },
          ...prev,
        ]);
      } else {
        toastError(data.error || "Submission failed");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toastError("Failed to submit solution");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Reveal Next Hint
  const handleRevealHint = async (level: number) => {
    if (!problem) return;
    try {
      const res = await fetch("/api/dsa/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          requestedLevel: level,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRevealedHintLevel(data.currentRevealedLevel);
        setHintsList((prev) =>
          prev.map((h) =>
            h.level === level ? { ...h, hint: data.hint.hint, isUnlocked: true } : h
          )
        );
        success(`Unlocked Hint ${level}!`);
      }
    } catch (err) {
      console.error("Failed to reveal hint:", err);
    }
  };

  // 7. Reset Code to Starter Template
  const handleResetCode = () => {
    if (!problem) return;
    const starter = problem.starterCode?.[selectedLanguage] || "";
    setCode(starter);
    const localDraftKey = `codelynx_draft_${problem.id}_${selectedLanguage}`;
    localStorage.removeItem(localDraftKey);
    info("Code reset to starter template.");
  };

  // 8. Format Code Document in Monaco
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
      info("Document formatted.");
    }
  };

  // 9. AI Tutor Interaction
  const handleAskTutor = async (qText?: string) => {
    const textToSend = qText || tutorQuestion;
    if (!textToSend.trim() || !problem || isTutorThinking) return;

    const newMessages = [...tutorMessages, { role: "user" as const, text: textToSend }];
    setTutorMessages(newMessages);
    setTutorQuestion("");
    setIsTutorThinking(true);

    try {
      const res = await fetch("/api/dsa/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problem.slug,
          userCode: code,
          language: selectedLanguage,
          question: textToSend,
          testResults: runResult
            ? {
                passedTests: runResult.passedTests,
                totalTests: runResult.totalTests,
                compileOutput: runResult.compileOutput,
              }
            : undefined,
          revealedHints: revealedHintLevel,
          detailLevel: settings.verbosity,
          conversationHistory: tutorMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTutorMessages([...newMessages, { role: "model" as const, text: data.reply }]);
      } else {
        setTutorMessages([
          ...newMessages,
          {
            role: "model" as const,
            text: "I encountered an issue connecting to the AI Tutor. Please review the built-in hints in the Hints tab.",
          },
        ]);
      }
    } catch (err) {
      setTutorMessages([
        ...newMessages,
        {
          role: "model" as const,
          text: "Network error connecting to AI Tutor. The built-in progressive hints are available in the Hints tab.",
        },
      ]);
    } finally {
      setIsTutorThinking(false);
    }
  };

  // Copy Example Input / Output
  const handleCopyInput = (inputStr: string, idx: number) => {
    navigator.clipboard.writeText(inputStr);
    setCopiedExampleIdx(idx);
    setTimeout(() => setCopiedExampleIdx(null), 2000);
  };

  const handleCopyOutput = (outputStr: string, idx: number) => {
    navigator.clipboard.writeText(outputStr);
    setCopiedOutputIdx(idx);
    setTimeout(() => setCopiedOutputIdx(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#0a0b0e] text-slate-100 flex flex-col items-center justify-center space-y-3 px-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading problem workspace...</p>
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div
      className="h-[100dvh] bg-[#0a0b0e] text-slate-100 flex flex-col font-sans overflow-hidden select-none"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP WORKSPACE NAVIGATION BAR                         */}
      {/* ======================================================== */}
      <header className="border-b border-slate-800 bg-[#0d0f17] px-3 sm:px-4 py-2 shrink-0 select-none">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.push("/problems")}
              title="Back to Problems"
              className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Back to Problem List"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-xs ml-1.5">Problems</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">/</span>

            <div className="flex items-center gap-2 min-w-0 truncate">
              <h1 className="font-bold text-white text-xs sm:text-sm truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
                {problem.title}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                  problem.difficulty === "easy"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : problem.difficulty === "medium"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                {problem.difficulty}
              </span>
              {problem.isSolved && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 font-semibold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions (Language, Run, Submit, More Tools, AI Tutor) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="h-9 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              aria-label="Programming Language"
            >
              <option value="python">Python 3</option>
              <option value="cpp">C++ (GCC)</option>
              <option value="java">Java 17</option>
              <option value="javascript">JavaScript</option>
            </select>

            {/* Run Code */}
            <button
              onClick={() => handleRunCode(false)}
              disabled={isRunning || isSubmitting}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-sm transition-all disabled:opacity-50"
              title="Run code against sample test cases"
            >
              <Play className={`w-3.5 h-3.5 text-cyan-400 ${isRunning ? "animate-spin" : ""}`} />
              <span className="hidden xs:inline">{isRunning ? "Running..." : "Run"}</span>
            </button>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50"
              title="Submit solution to hidden test suite"
            >
              <Send className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
              <span>{isSubmitting ? "..." : "Submit"}</span>
            </button>

            {/* Socratic AI Tutor Toggle */}
            <button
              onClick={() => setIsTutorOpen(!isTutorOpen)}
              className={`h-9 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border transition-all ${
                isTutorOpen
                  ? "bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-inner"
                  : "bg-slate-900 text-indigo-400 border-slate-800 hover:border-indigo-500/50"
              }`}
              title="Open Socratic AI DSA Tutor"
            >
              <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden md:inline">AI Tutor</span>
            </button>

            {/* More Actions Menu Button */}
            <button
              onClick={() => setIsSecondaryModalOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="More Actions & Tools"
              aria-label="More Actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MOBILE SEGMENTED VIEW SWITCHER (< lg)                 */}
      {/* ======================================================== */}
      <div className="lg:hidden flex items-center justify-between bg-[#0e111a] border-b border-slate-800/80 px-2 py-1.5 shrink-0 text-xs font-semibold">
        <div className="flex items-center gap-1 w-full bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {/* Tab 1: Problem */}
          <button
            onClick={() => setMobileActiveTab("problem")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all text-xs font-semibold ${
              mobileActiveTab === "problem"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Problem</span>
          </button>

          {/* Tab 2: Code Editor */}
          <button
            onClick={() => setMobileActiveTab("editor")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all text-xs font-semibold ${
              mobileActiveTab === "editor"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Editor</span>
          </button>

          {/* Tab 3: Output & Tests */}
          <button
            onClick={() => setMobileActiveTab("output")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all text-xs font-semibold relative ${
              mobileActiveTab === "output"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output & Tests</span>
            {runResult && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  runResult.allPassed ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE CONTENT CONTAINER                      */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative min-h-0 min-w-0">
        {/* ====================================================== */}
        {/* VIEW A: PROBLEM STATEMENT PANE                         */}
        {/* (Visible when active on mobile, or left 50% on desktop) */}
        {/* ====================================================== */}
        <div
          className={`flex-col border-r border-slate-800 bg-[#0d0f17] overflow-hidden min-h-0 min-w-0 ${
            mobileActiveTab === "problem" ? "flex flex-1 w-full" : "hidden"
          } lg:flex lg:flex-1 lg:w-1/2`}
        >
          {/* Sub-tabs: Description, Hints, Editorial, Submissions */}
          <div className="flex items-center border-b border-slate-800 px-3 bg-[#0a0b0e] text-xs shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveLeftTab("description")}
              className={`px-3 py-2.5 font-semibold transition-colors border-b-2 whitespace-nowrap min-h-[42px] flex items-center ${
                activeLeftTab === "description"
                  ? "border-cyan-400 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveLeftTab("hints")}
              className={`px-3 py-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap min-h-[42px] ${
                activeLeftTab === "hints"
                  ? "border-amber-400 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Hints</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {revealedHintLevel}/3
              </span>
            </button>
            <button
              onClick={() => setActiveLeftTab("editorial")}
              className={`px-3 py-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap min-h-[42px] ${
                activeLeftTab === "editorial"
                  ? "border-indigo-400 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Editorial</span>
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              onClick={() => setActiveLeftTab("submissions")}
              className={`px-3 py-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap min-h-[42px] ${
                activeLeftTab === "submissions"
                  ? "border-emerald-400 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Submissions</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-medium">
                {submissionsHistory.length}
              </span>
            </button>
          </div>

          {/* Scrollable Problem Content */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-200 overscroll-contain select-text"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* SUB-VIEW 1: DESCRIPTION */}
            {activeLeftTab === "description" && (
              <div className="space-y-5">
                {/* Header Info */}
                <div className="space-y-2 border-b border-slate-800/80 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {problem.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold uppercase text-[11px] ${
                        problem.difficulty === "easy"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : problem.difficulty === "medium"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium text-[11px] capitalize">
                      {problem.category?.replace(/-/g, " ")}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-[11px]">
                      {problem.topicId}
                    </span>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="space-y-3 leading-relaxed text-sm sm:text-base text-slate-300">
                  <p className="whitespace-pre-line font-normal">{problem.statement}</p>
                </div>

                {/* Input & Output Format Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-xs text-cyan-400 uppercase tracking-wider">
                      Input Format
                    </span>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {problem.inputFormat}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-xs text-cyan-400 uppercase tracking-wider">
                      Output Format
                    </span>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {problem.outputFormat}
                    </p>
                  </div>
                </div>

                {/* Examples */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-300">
                    Examples
                  </h3>
                  {problem.examples?.map((ex: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
                        <span className="font-sans font-bold text-white text-xs sm:text-sm">
                          Example {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyInput(ex.input, idx)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors min-h-[36px]"
                            title="Copy Input"
                          >
                            {copiedExampleIdx === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Input</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-slate-400 font-sans font-semibold text-[11px] mb-1">
                            Input:
                          </div>
                          <pre className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-slate-200 text-xs whitespace-pre-wrap overflow-x-auto">
                            {ex.input}
                          </pre>
                        </div>
                        <div>
                          <div className="text-slate-400 font-sans font-semibold text-[11px] mb-1">
                            Output:
                          </div>
                          <pre className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-emerald-400 font-bold text-xs whitespace-pre-wrap overflow-x-auto">
                            {ex.output}
                          </pre>
                        </div>
                        {ex.explanation && (
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 font-sans text-xs leading-relaxed">
                            <span className="font-semibold text-slate-400">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints & Complexity Target */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-300">
                    Constraints & Complexity Targets
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs sm:text-sm font-mono">
                      {problem.constraints?.map((c: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">
                          {c}
                        </li>
                      ))}
                    </ul>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                      <div className="p-2 rounded-lg bg-black/40 text-center">
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Target Time
                        </span>
                        <span className="text-cyan-400 font-bold text-xs sm:text-sm">
                          {problem.expectedTimeComplexity}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 text-center">
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Target Space
                        </span>
                        <span className="text-cyan-400 font-bold text-xs sm:text-sm">
                          {problem.expectedSpaceComplexity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Quick Action to Editor */}
                <div className="lg:hidden pt-4 pb-2">
                  <button
                    onClick={() => setMobileActiveTab("editor")}
                    className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all min-h-[48px]"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Open Code Editor & Solve</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: PROGRESSIVE HINTS */}
            {activeLeftTab === "hints" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm leading-relaxed">
                  <span className="font-bold">Progressive Hint System:</span> Hints provide
                  calibrated Socratic clues without spoiling the full solution. Unlock each level
                  sequentially when you need a nudge.
                </div>

                {hintsList.map((h: any) => (
                  <div
                    key={h.level}
                    className={`p-4 rounded-2xl border transition-all ${
                      h.isUnlocked
                        ? "bg-slate-900/90 border-slate-700 shadow-md"
                        : "bg-slate-900/30 border-slate-800/80 opacity-65"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Level {h.level}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-white">{h.title}</h4>
                      </div>

                      {!h.isUnlocked && (
                        <button
                          onClick={() => handleRevealHint(h.level)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm min-h-[38px]"
                        >
                          Reveal Hint
                        </button>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {h.isUnlocked
                        ? h.hint
                        : "This hint is locked. Click 'Reveal Hint' above when you are ready."}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUB-VIEW 3: EDITORIAL */}
            {activeLeftTab === "editorial" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                  <h4 className="font-bold text-xs sm:text-sm text-indigo-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Official Editorial Solution
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {problem.editorial?.mainIdea}
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                    Algorithmic Approach
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {problem.editorial?.approach}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <div className="font-bold text-cyan-400">Complexity Analysis</div>
                  <p className="text-slate-300 leading-relaxed">
                    {problem.editorial?.complexityExplanation}
                  </p>
                  <div className="flex gap-4 pt-2 font-mono text-xs text-slate-200 border-t border-slate-800/80">
                    <span>
                      Time: <span className="text-cyan-400 font-bold">{problem.editorial?.timeComplexity}</span>
                    </span>
                    <span>
                      Aux Space:{" "}
                      <span className="text-cyan-400 font-bold">{problem.editorial?.spaceComplexity}</span>
                    </span>
                  </div>
                </div>

                {/* Reference Code (Unlocked if problem is solved) */}
                {problem.isSolved && problem.editorial?.referenceCode ? (
                  <div className="space-y-2 pt-2">
                    <h5 className="font-bold text-xs sm:text-sm text-white">
                      Verified Reference Implementation
                    </h5>
                    <pre className="p-3.5 rounded-2xl bg-black/60 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
                      {problem.editorial.referenceCode[selectedLanguage] ||
                        problem.editorial.referenceCode.python ||
                        Object.values(problem.editorial.referenceCode)[0]}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    Submit an accepted solution to unlock the verified reference source code.
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 4: SUBMISSIONS HISTORY */}
            {activeLeftTab === "submissions" && (
              <div className="space-y-3">
                <h4 className="font-bold text-xs sm:text-sm text-white">Your Past Attempts</h4>
                {submissionsHistory.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <History className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>No submissions recorded yet for this problem.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {submissionsHistory.map((sub: any, idx: number) => (
                      <div
                        key={sub.id || idx}
                        className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {sub.status === "accepted" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20 shrink-0" />
                          ) : (
                            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-white text-xs sm:text-sm capitalize">
                              {sub.status.replace(/_/g, " ")}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(sub.submittedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                          <div>Runtime: {sub.runtime || 0} ms</div>
                          <div>Memory: {sub.memory || 0} KB</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================== */}
        {/* VIEW B & C: CODE EDITOR & CONSOLE RIGHT PANE           */}
        {/* (On mobile: toggled via mobileActiveTab; on desktop:   */}
        {/* takes right 50% with editor on top and console on btm) */}
        {/* ====================================================== */}
        <div
          className={`flex-col bg-[#0a0b0e] overflow-hidden min-h-0 min-w-0 ${
            mobileActiveTab === "editor" || mobileActiveTab === "output"
              ? "flex flex-1 w-full"
              : "hidden"
          } lg:flex lg:flex-1 lg:w-1/2`}
        >
          {/* ==================================================== */}
          {/* VIEW B: MONACO CODE EDITOR CONTAINER                 */}
          {/* (Kept mounted at all times to prevent state loss!)    */}
          {/* ==================================================== */}
          <div
            className={`flex-col flex-1 overflow-hidden relative min-h-0 min-w-0 ${
              mobileActiveTab === "output" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Mobile Editor In-View Secondary Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f1118] border-b border-slate-800 text-xs shrink-0 select-none">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <span className="font-bold text-cyan-400 uppercase">{selectedLanguage}</span>
                <span>•</span>
                <span>Solution Workspace</span>
              </div>

              {/* Editor Quick Tools (Font size, wordwrap, format, reset) */}
              <div className="flex items-center gap-1.5">
                {/* Font Size decrease */}
                <button
                  onClick={() => setEditorFontSize((prev) => Math.max(11, prev - 1))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Decrease Editor Font Size"
                  aria-label="Decrease Font Size"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-400">{editorFontSize}px</span>
                {/* Font Size increase */}
                <button
                  onClick={() => setEditorFontSize((prev) => Math.min(24, prev + 1))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Increase Editor Font Size"
                  aria-label="Increase Font Size"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <span className="text-slate-700">|</span>

                {/* Format Code */}
                <button
                  onClick={handleFormatCode}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Format Code"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                {/* Reset to starter */}
                <button
                  onClick={handleResetCode}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Reset to starter template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Monaco Component */}
            <div className="flex-1 overflow-hidden relative min-h-0 min-w-0">
              <Editor
                height="100%"
                language={
                  selectedLanguage === "cpp"
                    ? "cpp"
                    : selectedLanguage === "c"
                    ? "c"
                    : selectedLanguage
                }
                theme={settings.theme === "vs-light" ? "vs" : "vs-dark"}
                value={code}
                onChange={(newVal) => setCode(newVal || "")}
                onMount={(ed) => {
                  editorRef.current = ed;
                }}
                options={{
                  fontSize: editorFontSize,
                  fontFamily: settings.fontFamily || "JetBrains Mono, monospace",
                  minimap: { enabled: false },
                  wordWrap: editorWordWrap ? "on" : "off",
                  lineNumbers: settings.lineNumbers ? "on" : "off",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 24 },
                  lineNumbersMinChars: 3,
                  lineDecorationsWidth: 6,
                  glyphMargin: false,
                  folding: true,
                }}
              />
            </div>

            {/* Mobile In-Editor Floating Run/Submit Bar (< lg) */}
            <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-[#0c0e15] border-t border-slate-800 shrink-0">
              <button
                onClick={() => setMobileActiveTab("output")}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-medium py-1 px-2"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>View Output / Tests</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunCode(false)}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 min-h-[42px]"
                >
                  <Play className={`w-3.5 h-3.5 text-cyan-400 ${isRunning ? "animate-spin" : ""}`} />
                  <span>Run</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 min-h-[42px]"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
                  <span>Submit</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* VIEW C: CONSOLE & OUTPUT / TEST CASES                */}
          {/* (On mobile: full-screen when output tab is active;   */}
          {/* On desktop: fixed height h-64 at bottom of right)    */}
          {/* ==================================================== */}
          <div
            className={`border-t border-slate-800 bg-[#0d0f17] flex-col shrink-0 min-h-0 min-w-0 ${
              mobileActiveTab === "output" ? "flex flex-1 w-full" : "hidden"
            } lg:flex lg:h-64`}
          >
            {/* Console Tab Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-3 bg-[#0a0b0e] text-xs shrink-0 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1">
                {/* Tab: Test Cases */}
                <button
                  onClick={() => setConsoleTab("testcases")}
                  className={`px-3 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap min-h-[40px] flex items-center ${
                    consoleTab === "testcases"
                      ? "border-cyan-400 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Test Cases
                </button>

                {/* Tab: Custom Stdin */}
                <button
                  onClick={() => setConsoleTab("stdin")}
                  className={`px-3 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap min-h-[40px] flex items-center ${
                    consoleTab === "stdin"
                      ? "border-cyan-400 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Custom Stdin
                </button>

                {/* Tab: Test Results */}
                <button
                  onClick={() => setConsoleTab("results")}
                  className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[40px] ${
                    consoleTab === "results"
                      ? "border-cyan-400 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>Test Results</span>
                  {runResult && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        runResult.allPassed ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                  )}
                </button>

                {/* Tab: Submission Result */}
                <button
                  onClick={() => setConsoleTab("submission")}
                  className={`px-3 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap min-h-[40px] flex items-center ${
                    consoleTab === "submission"
                      ? "border-emerald-400 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Submission Result
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Judge0 Sandboxed
              </div>
            </div>

            {/* Console Body Content */}
            <div
              className="flex-1 overflow-y-auto p-4 text-xs font-mono overscroll-contain select-text"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* SUB-VIEW 1: TEST CASES SELECTOR & PREVIEWS */}
              {consoleTab === "testcases" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    {problem.publicTestCases?.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestCaseIdx(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[38px] ${
                          selectedTestCaseIdx === idx
                            ? "bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm"
                            : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setConsoleTab("stdin")}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[38px] bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800"
                    >
                      + Custom Stdin
                    </button>
                  </div>

                  {selectedTestCaseIdx >= 0 && problem.publicTestCases?.[selectedTestCaseIdx] && (
                    <div className="space-y-2.5">
                      <div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans font-bold mb-1">
                          Input
                        </div>
                        <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 text-slate-200 text-xs overflow-x-auto whitespace-pre-wrap">
                          {problem.publicTestCases[selectedTestCaseIdx].input}
                        </pre>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans font-bold mb-1">
                          Expected Output
                        </div>
                        <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 text-emerald-400 font-bold text-xs overflow-x-auto whitespace-pre-wrap">
                          {problem.publicTestCases[selectedTestCaseIdx].expectedOutput}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 2: CUSTOM STDIN INPUT */}
              {consoleTab === "stdin" && (
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm">
                        Standard Input (Stdin)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Supply custom input lines for programs using Python input() or C++ cin
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom standard input here (e.g., Rahil or multi-line parameters)..."
                    rows={4}
                    className="w-full p-3 rounded-xl bg-black/60 border border-slate-800 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {customInput.length} characters
                    </span>
                    <button
                      onClick={() => handleRunCode(true)}
                      disabled={isRunning || isSubmitting}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 min-h-[42px]"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Run with Custom Stdin</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: TEST RESULTS */}
              {consoleTab === "results" && (
                <div>
                  {!runResult ? (
                    <div className="py-8 text-center text-slate-500 font-sans text-xs sm:text-sm space-y-2">
                      <Terminal className="w-6 h-6 mx-auto text-slate-600" />
                      <p>Click "Run" above to execute your code against test cases.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            runResult.allPassed
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {runResult.allPassed ? "All Passed" : "Tests Failed"}
                        </span>
                        <span className="text-xs text-slate-300 font-mono">
                          {runResult.passedTests} of {runResult.totalTests} test cases passed
                        </span>
                      </div>

                      {runResult.compileOutput && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs whitespace-pre-wrap">
                          {runResult.compileOutput}
                        </div>
                      )}

                      <div className="space-y-2 pt-1 font-mono text-xs">
                        {runResult.results?.map((r: any) => (
                          <div
                            key={r.index}
                            className={`p-3.5 rounded-xl border ${
                              r.passed
                                ? "bg-slate-900/70 border-emerald-500/30"
                                : "bg-slate-900/70 border-rose-500/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2 font-sans">
                              <span className="font-bold text-xs sm:text-sm text-white">
                                Case {r.index}
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  r.passed ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {r.passed ? "PASSED" : "FAILED"} ({r.runtime || 0} ms)
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div>
                                <span className="text-slate-500">Input: </span>
                                <span className="text-slate-200">{r.input}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Actual Output: </span>
                                <span className={r.passed ? "text-emerald-300" : "text-rose-300"}>
                                  {r.actualOutput || "(empty)"}
                                </span>
                              </div>
                              {r.expectedOutput && (
                                <div>
                                  <span className="text-slate-500">Expected: </span>
                                  <span className="text-emerald-400 font-bold">
                                    {r.expectedOutput}
                                  </span>
                                </div>
                              )}
                              {r.stderr && (
                                <div className="text-rose-400 mt-1 pt-1 border-t border-slate-800">
                                  {r.stderr}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 4: SUBMISSION VERDICT */}
              {consoleTab === "submission" && (
                <div>
                  {!submissionResult ? (
                    <div className="py-8 text-center text-slate-500 font-sans text-xs sm:text-sm space-y-2">
                      <Send className="w-6 h-6 mx-auto text-slate-600" />
                      <p>Click "Submit" above to test against the full hidden test suite.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            submissionResult.status === "accepted"
                              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40"
                              : "bg-rose-500 text-white shadow-md shadow-rose-950/40"
                          }`}
                        >
                          {submissionResult.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-200 font-mono">
                          {submissionResult.passedTests}/{submissionResult.totalTests} Passed
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {submissionResult.message}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                          <span>
                            Runtime:{" "}
                            <span className="text-white font-bold">{submissionResult.runtime} ms</span>
                          </span>
                          <span>
                            Memory:{" "}
                            <span className="text-white font-bold">{submissionResult.memory} KB</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. SOCRATIC AI DSA TUTOR (DRAWER ON DESKTOP,             */}
        {/*    BOTTOM SHEET ON MOBILE)                               */}
        {/* ======================================================== */}
        {isTutorOpen && (
          <div className="fixed inset-0 lg:absolute lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[420px] bg-black/60 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none z-50 flex flex-col justify-end lg:justify-start">
            <div
              className="w-full lg:w-full bg-[#0d0f17] border-t lg:border-t-0 lg:border-l border-slate-800 rounded-t-2xl lg:rounded-none h-[85vh] lg:h-full flex flex-col shadow-2xl overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Tutor Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0a0b0e] shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">
                      Socratic AI DSA Tutor
                    </h3>
                    <div className="text-[10px] text-indigo-300/80">Guided learning coach</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsTutorOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close AI Tutor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2.5 border-b border-slate-800 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                {[
                  "What does this problem ask?",
                  "Give me a small hint",
                  "Why is my solution failing?",
                  "Analyze time complexity",
                  "What should I do next?",
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskTutor(chip)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all whitespace-nowrap shrink-0 min-h-[34px]"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Conversation Log */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 text-xs sm:text-sm overscroll-contain select-text"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {tutorMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <Bot className="w-10 h-10 text-indigo-500/40 mx-auto" />
                    <p className="font-bold text-slate-200 text-sm">
                      Welcome to Socratic DSA Coaching
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Ask questions about invariants, edge cases, or complexity. The tutor guides you
                      step-by-step without giving away the full answer.
                    </p>
                  </div>
                ) : (
                  tutorMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-line"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isTutorThinking && (
                  <div className="flex items-center gap-2 text-indigo-400 text-xs italic">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span>Tutor is thinking...</span>
                  </div>
                )}
              </div>

              {/* Tutor Input Bar */}
              <div className="p-3 border-t border-slate-800 bg-[#0a0b0e] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Ask a question about this problem..."
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskTutor();
                    }
                  }}
                  className="flex-1 h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleAskTutor()}
                  disabled={!tutorQuestion.trim() || isTutorThinking}
                  className="h-11 w-11 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. SECONDARY ACTIONS MODAL (FIND MISTAKES, OPTIMIZER,    */}
      {/*    COMPLEXITY, EXPLAIN, SETTINGS)                        */}
      {/* ======================================================== */}
      <DSASecondaryActionsModal
        isOpen={isSecondaryModalOpen}
        onClose={() => setIsSecondaryModalOpen(false)}
        onOpenTutor={() => setIsTutorOpen(true)}
        onFormatCode={handleFormatCode}
        onResetCode={handleResetCode}
        code={code}
        language={selectedLanguage}
        problemTitle={problem.title}
        problemSlug={problem.slug}
        fontSize={editorFontSize}
        onChangeFontSize={(newSize) => setEditorFontSize(newSize)}
        wordWrap={editorWordWrap}
        onToggleWordWrap={() => setEditorWordWrap((prev) => !prev)}
        onApplyCode={(newCode) => {
          setCode(newCode);
          success("Optimized code applied to editor!");
        }}
      />
    </div>
  );
}
