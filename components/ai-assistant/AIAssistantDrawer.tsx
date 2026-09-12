"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
  Trash2,
  X,
  Code2,
  FileText,
  Lightbulb,
  Compass,
  ListTodo,
  ArrowRight,
  Maximize2,
  Minimize2,
  ArrowDownToLine,
  StopCircle,
} from "lucide-react";
import { useSettings } from "@/components/shared/SettingsContext";
import { useToast } from "@/components/shared/ToastProvider";
import { NextStepAnalysis } from "@/lib/ai/next-step";
import { HintResult, HintLevel } from "@/lib/ai/hints";
import { CodingPlan } from "@/lib/ai/plan";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  codeSnippet?: string;
  timestamp: string;
}

interface AIAssistantDrawerProps {
  currentCode: string;
  currentLanguage: string;
  activeFileName?: string;
  selectedCode?: string;
  diagnostics?: Array<{ line: number; message: string; severity: string }>;
  lastExecution?: any;
  onInsertCode: (code: string) => void;
  onClose: () => void;
  initialTab?: "chat" | "next_step" | "hints" | "plan";
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  currentCode,
  currentLanguage,
  activeFileName,
  selectedCode,
  diagnostics,
  lastExecution,
  onInsertCode,
  onClose,
  initialTab = "chat",
}) => {
  const { settings } = useSettings();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<"chat" | "next_step" | "hints" | "plan">(initialTab);
  const [isWide, setIsWide] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hello! I am your CodeLynx AI Copilot. I understand your active code, compiler diagnostics, and workspace settings. Ask me what to do next, request progressive hints, or generate a coding plan.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Next-Step state
  const [nextStepData, setNextStepData] = useState<NextStepAnalysis | null>(null);
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false);

  // Hint state
  const [currentHint, setCurrentHint] = useState<HintResult | null>(null);
  const [hintLevel, setHintLevel] = useState<HintLevel>("small_nudge");
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Coding Plan state
  const [codingPlan, setCodingPlan] = useState<CodingPlan | null>(null);
  const [planGoal, setPlanGoal] = useState("");
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Streaming message send handler
  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/copilot/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message: text,
          context: {
            activeFile: {
              name: activeFileName || "main",
              language: currentLanguage,
              content: currentCode,
            },
            selectedSnippet: selectedCode,
            diagnostics,
            lastExecution,
            settings: {
              theme: settings.theme,
              fontSize: settings.fontSize,
              fontFamily: settings.fontFamily,
              defaultLanguage: settings.defaultLanguage,
              aiModel: settings.aiModel,
              verbosity: settings.verbosity,
            },
          },
          model: settings.aiModel,
          detailLevel: settings.verbosity,
          conversationHistory: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream available");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
                );
              }
            } catch (e) {
              // ignore partial line parse
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `*Error communicating with AI Copilot:* ${err.message}. Please check your connection or try again.`,
                }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      info("Generation Halted", "AI response streaming stopped.");
    }
  };

  // Next Step Action
  const handleFetchNextStep = async () => {
    setIsLoadingNextStep(true);
    setActiveTab("next_step");
    try {
      const res = await fetch("/api/ai/next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          language: currentLanguage,
          context: {
            diagnostics,
            lastExecution,
            activeFile: { name: activeFileName || "main", language: currentLanguage, content: currentCode },
          },
          model: settings.aiModel,
          detailLevel: settings.verbosity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.nextStep) {
        setNextStepData(data.nextStep);
      }
    } catch (e: any) {
      toastError("Error", e.message);
    } finally {
      setIsLoadingNextStep(false);
    }
  };

  // Progressive Hint Action
  const handleFetchHint = async (level: HintLevel) => {
    setIsLoadingHint(true);
    setHintLevel(level);
    setActiveTab("hints");
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentCode,
          language: currentLanguage,
          level,
          context: {
            diagnostics,
            lastExecution,
          },
          model: settings.aiModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setCurrentHint(data.hint);
      }
    } catch (e: any) {
      toastError("Hint Error", e.message);
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Plan generation
  const handleGeneratePlan = async () => {
    if (!planGoal.trim()) return;
    setIsLoadingPlan(true);
    setActiveTab("plan");
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: planGoal,
          language: currentLanguage,
          code: currentCode,
          model: settings.aiModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        setCodingPlan(data.plan);
        success("Plan Created", `${data.plan.steps.length} sequential steps ready.`);
      }
    } catch (e: any) {
      toastError("Plan Error", e.message);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearMessages = () => {
    setMessages([
      {
        id: "cleared",
        role: "assistant",
        content: "Conversation history cleared. How can I assist you with your code today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#11131c] border-l border-slate-800 overflow-hidden font-sans transition-all duration-200 ${
        isWide ? "w-full md:w-[600px]" : "w-full md:w-[420px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#151924] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              CodeLynx Copilot
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {activeFileName || "main"} • {currentLanguage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsWide(!isWide)}
            title={isWide ? "Narrow drawer" : "Expand drawer"}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors hidden md:inline-flex"
          >
            {isWide ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={clearMessages}
            title="Clear Chat History"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close Assistant"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0f1118] border-b border-white/5 text-xs shrink-0">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            activeTab === "chat"
              ? "bg-indigo-600/20 text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bot className="w-3 h-3" />
          <span>Chat</span>
        </button>

        <button
          onClick={handleFetchNextStep}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            activeTab === "next_step"
              ? "bg-indigo-600/20 text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Compass className="w-3 h-3 text-indigo-400" />
          <span>Next-Step</span>
        </button>

        <button
          onClick={() => handleFetchHint(hintLevel)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            activeTab === "hints"
              ? "bg-indigo-600/20 text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Hints</span>
        </button>

        <button
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            activeTab === "plan"
              ? "bg-indigo-600/20 text-cyan-400 font-bold border border-cyan-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ListTodo className="w-3 h-3 text-emerald-400" />
          <span>Plan</span>
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Quick Actions Bar */}
            <div className="flex items-center gap-1 p-1.5 bg-[#0e1017] border-b border-white/5 overflow-x-auto no-scrollbar text-[11px] shrink-0">
              <button
                onClick={() => handleSend("What should I do next with this code?")}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
              >
                🚀 What next?
              </button>
              <button
                onClick={() => handleSend("Give me a small hint to improve this code")}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
              >
                💡 Hint
              </button>
              <button
                onClick={() => handleSend("Explain the current algorithm and its time complexity")}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
              >
                📖 Explain
              </button>
              <button
                onClick={() => handleSend("Find any bugs or edge cases in this file")}
                className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
              >
                🐛 Find Bugs
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 text-xs leading-relaxed ${
                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    }`}
                  >
                    {m.role === "user" ? "U" : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl border space-y-1.5 relative group max-w-[85%] ${
                      m.role === "user"
                        ? "bg-indigo-600/20 border-indigo-500/30 text-white rounded-tr-none"
                        : "bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-white/5">
                      <span className="font-semibold text-slate-400">
                        {m.role === "user" ? "You" : "CodeLynx Copilot"}
                      </span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {m.content}
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse p-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Gemini is generating response...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-2.5 bg-[#121520] border-t border-slate-800 space-y-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask copilot about code, next steps, or settings..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
                />

                {isStreaming ? (
                  <button
                    onClick={handleStopStream}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                    title="Stop generation"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
                    title="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "next_step" ? (
          /* Next-Step Guide Tab */
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                Next-Step Recommendations
              </span>
              <button
                onClick={handleFetchNextStep}
                disabled={isLoadingNextStep}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {isLoadingNextStep ? "Analyzing..." : "Refresh"}
              </button>
            </div>

            {nextStepData ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                    Immediate Action
                  </div>
                  <div className="text-xs font-bold text-white">
                    {nextStepData.immediateAction}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {nextStepData.summary}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400">Action Sequence:</div>
                  {nextStepData.stepByStepPlan.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                    >
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {nextStepData.suggestedPatchSnippet && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-emerald-400">Suggested Snippet:</span>
                      <button
                        onClick={() => onInsertCode(nextStepData.suggestedPatchSnippet!)}
                        className="text-cyan-400 hover:underline"
                      >
                        Insert in Editor
                      </button>
                    </div>
                    <pre className="p-2 rounded bg-black/40 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      {nextStepData.suggestedPatchSnippet}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <Compass className="w-6 h-6 mx-auto animate-spin text-indigo-400" />
                <p>Analyzing code state & compiler telemetry...</p>
              </div>
            )}
          </div>
        ) : activeTab === "hints" ? (
          /* Progressive Hint Tab */
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Progressive Hint System
              </span>
              <span className="text-[10px] text-slate-400">Pedagogical Clues</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {(
                [
                  ["small_nudge", "1. Nudge"],
                  ["stronger_pointer", "2. Pointer"],
                  ["algorithmic_idea", "3. Algorithm"],
                  ["debugging_clue", "4. Debug Clue"],
                  ["full_solution", "5. Solution"],
                ] as [HintLevel, string][]
              ).map(([lvl, label]) => (
                <button
                  key={lvl}
                  onClick={() => handleFetchHint(lvl)}
                  disabled={isLoadingHint}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    hintLevel === lvl
                      ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {currentHint && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="text-[11px] font-bold text-amber-400">
                  Level {currentHint.levelNumber}: {currentHint.title}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {currentHint.hint}
                </p>
                {currentHint.codeSnippet && (
                  <pre className="p-2 rounded bg-black/50 font-mono text-[11px] text-amber-300 overflow-x-auto border border-amber-500/20">
                    {currentHint.codeSnippet}
                  </pre>
                )}
                {currentHint.nextLevelAvailable && currentHint.nextLevelName && (
                  <button
                    onClick={() => {
                      const levels: HintLevel[] = [
                        "small_nudge",
                        "stronger_pointer",
                        "algorithmic_idea",
                        "debugging_clue",
                        "full_solution",
                      ];
                      const next = levels[currentHint.levelNumber];
                      if (next) handleFetchHint(next);
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>Advance to {currentHint.nextLevelName}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Coding Plan Tab */
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                Task-Aware Coding Plan
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
                placeholder="What are you building? e.g. Two Sum HashMap"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleGeneratePlan}
                disabled={isLoadingPlan || !planGoal.trim()}
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {isLoadingPlan ? "..." : "Plan"}
              </button>
            </div>

            {codingPlan && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400">
                  Goal: <span className="font-semibold text-white">{codingPlan.goal}</span>
                </div>
                {codingPlan.steps.map((step) => (
                  <label
                    key={step.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={step.status === "completed"}
                      onChange={() => {
                        setCodingPlan({
                          ...codingPlan,
                          steps: codingPlan.steps.map((s) =>
                            s.id === step.id
                              ? { ...s, status: s.status === "completed" ? "pending" : "completed" }
                              : s
                          ),
                        });
                      }}
                      className="w-3.5 h-3.5 accent-emerald-400 rounded mt-0.5"
                    />
                    <div>
                      <div
                        className={`font-semibold ${
                          step.status === "completed"
                            ? "line-through text-slate-500"
                            : "text-slate-200"
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-normal">
                        {step.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
