"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  Code2,
  ArrowRight,
  Compass,
  ListTodo,
  Layers,
  Settings,
} from "lucide-react";
import { AppHeader } from "@/components/shared/AppHeader";
import { useSettings } from "@/components/shared/SettingsContext";
import { useToast } from "@/components/shared/ToastProvider";
import { NextStepAnalysis } from "@/lib/ai/next-step";
import { HintResult, HintLevel } from "@/lib/ai/hints";
import { CodingPlan } from "@/lib/ai/plan";
import { CODELYNX_APP_REGISTRY } from "@/lib/ai/capabilities";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function DedicatedAssistantPage() {
  const { settings } = useSettings();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<"chat" | "next_step" | "hints" | "plan">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        `### 👋 Welcome to CodeLynx AI Copilot!\n\n` +
        `I am your dedicated pair programmer, algorithm tutor, and CodeLynx platform specialist. ` +
        `I can analyze your algorithms, explain compiler diagnostics, provide progressive hints, track a step-by-step coding plan, or answer any questions about the platform itself.\n\n` +
        `**Try asking me:**\n` +
        `- *"What should I do next with my code?"*\n` +
        `- *"How do I configure a custom keyboard shortcut?"*\n` +
        `- *"Why is the compiler requesting stdin?"*\n` +
        `- *"Give me a gentle hint on how to optimize two-sum without full code."*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scratchpad code for assistant
  const [codeSnippet, setCodeSnippet] = useState(
    `# Sample Algorithm: Two Sum with Hash Map\ndef two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in lookup:\n            return [lookup[complement], i]\n        lookup[num] = i\n    return []\n\nif __name__ == '__main__':\n    print("Indices:", two_sum([2, 7, 11, 15], 9))`
  );
  const [language, setLanguage] = useState("python");

  // Next-Step state
  const [nextStepData, setNextStepData] = useState<NextStepAnalysis | null>(null);
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false);

  // Hint state
  const [currentHint, setCurrentHint] = useState<HintResult | null>(null);
  const [hintLevel, setHintLevel] = useState<HintLevel>("small_nudge");
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Coding Plan state
  const [codingPlan, setCodingPlan] = useState<CodingPlan | null>(null);
  const [planGoal, setPlanGoal] = useState("Implement LRU Cache with O(1) get and put");
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Streaming send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
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
              name: `scratchpad.${language === "python" ? "py" : language === "cpp" ? "cpp" : "js"}`,
              language,
              content: codeSnippet,
            },
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
      info("Generation Stopped", "AI response output halted.");
    }
  };

  // Trigger Next-Step Guide
  const handleFetchNextStep = async () => {
    setIsLoadingNextStep(true);
    setActiveTab("next_step");
    try {
      const res = await fetch("/api/ai/next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeSnippet,
          language,
          model: settings.aiModel,
          detailLevel: settings.verbosity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.nextStep) {
        setNextStepData(data.nextStep);
        success("Next Step Identified", data.nextStep.immediateAction);
      }
    } catch (e: any) {
      toastError("Failed", e.message);
    } finally {
      setIsLoadingNextStep(false);
    }
  };

  // Trigger Progressive Hint
  const handleFetchHint = async (level: HintLevel) => {
    setIsLoadingHint(true);
    setHintLevel(level);
    setActiveTab("hints");
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeSnippet,
          language,
          level,
          model: settings.aiModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setCurrentHint(data.hint);
        success(`Level ${data.hint.levelNumber} Hint Ready`, data.hint.title);
      }
    } catch (e: any) {
      toastError("Hint Error", e.message);
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Generate Coding Plan
  const handleGeneratePlan = async () => {
    setIsLoadingPlan(true);
    setActiveTab("plan");
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: planGoal,
          language,
          code: codeSnippet,
          model: settings.aiModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        setCodingPlan(data.plan);
        success("Coding Plan Created", `${data.plan.steps.length} sequential steps generated.`);
      }
    } catch (e: any) {
      toastError("Plan Error", e.message);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleTogglePlanStep = (stepId: string) => {
    if (!codingPlan) return;
    setCodingPlan({
      ...codingPlan,
      steps: codingPlan.steps.map((s) => {
        if (s.id === stepId) {
          const nextStatus = s.status === "completed" ? "pending" : "completed";
          return { ...s, status: nextStatus };
        }
        return s;
      }),
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "cleared",
        role: "assistant",
        content: "Conversation history cleared. What coding challenge would you like to tackle next?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0b0e] text-slate-100 font-sans overflow-hidden">
      {/* Universal Header */}
      <AppHeader
        title="CodeLynx AI Copilot"
        icon={<Bot className="w-4 h-4 text-cyan-400" />}
        badge="Gemini Context-Aware"
        showBack={true}
        showDashboard={true}
      >
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Open Workspace</span>
        </Link>
      </AppHeader>

      {/* Main Split Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Navigation & Code Context Scratchpad */}
        <div className="w-80 lg:w-96 shrink-0 bg-[#0c0e15] border-r border-slate-800 flex flex-col hidden md:flex">
          {/* Modes Tab bar */}
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Copilot Modes
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                  activeTab === "chat"
                    ? "bg-indigo-600/20 border-cyan-400 text-white font-semibold"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pair Chat</span>
              </button>

              <button
                onClick={handleFetchNextStep}
                disabled={isLoadingNextStep}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                  activeTab === "next_step"
                    ? "bg-indigo-600/20 border-cyan-400 text-white font-semibold"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Next-Step</span>
              </button>

              <button
                onClick={() => handleFetchHint(hintLevel)}
                disabled={isLoadingHint}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                  activeTab === "hints"
                    ? "bg-indigo-600/20 border-cyan-400 text-white font-semibold"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Hint Lab</span>
              </button>

              <button
                onClick={() => setActiveTab("plan")}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                  activeTab === "plan"
                    ? "bg-indigo-600/20 border-cyan-400 text-white font-semibold"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
                <span>Coding Plan</span>
              </button>
            </div>
          </div>

          {/* Code Context Editor */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                Active Code Context
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="Paste code snippet for copilot context..."
              className="w-full flex-1 bg-[#08090d] border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Platform Settings Summary Pill */}
          <div className="p-3 bg-[#08090d] border-t border-white/5 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <Settings className="w-3 h-3 text-cyan-400" />
                Active Configuration:
              </span>
              <Link href="/settings" className="text-cyan-400 hover:underline">
                Configure
              </Link>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {settings.aiModel}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 capitalize">
                {settings.verbosity}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {settings.theme}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Active Workspace View */}
        <div className="flex-1 flex flex-col bg-[#0e111a] overflow-hidden">
          {/* Tab Content Display */}
          {activeTab === "chat" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Messages */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 text-xs leading-relaxed max-w-3xl ${
                      m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {m.role === "user" ? <span className="font-bold">U</span> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl border space-y-2 relative group ${
                        m.role === "user"
                          ? "bg-indigo-600/20 border-indigo-500/30 text-slate-100 rounded-tr-none"
                          : "bg-slate-900/80 border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-white/5">
                        <span className="font-semibold text-slate-400">
                          {m.role === "user" ? "You" : "CodeLynx AI"}
                        </span>
                        <span>{m.timestamp}</span>
                      </div>

                      <div className="whitespace-pre-wrap font-sans text-xs">{m.content}</div>

                      <div className="flex items-center justify-end gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(m.content, m.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Gemini is generating response stream...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 bg-[#11131c] border-t border-slate-800 space-y-2">
                {/* Quick chip prompts */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                  <button
                    onClick={() => handleSendMessage("What should I do next with my code?")}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                  >
                    🚀 What should I do next?
                  </button>
                  <button
                    onClick={() => handleSendMessage("Give me a small hint without full solution")}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                  >
                    💡 Small hint
                  </button>
                  <button
                    onClick={() => handleSendMessage("How do I configure custom keyboard shortcuts in CodeLynx?")}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                  >
                    ⚙️ Shortcuts guide
                  </button>
                  <button
                    onClick={() => handleSendMessage("Why does the compiler ask for standard input (stdin)?")}
                    className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
                  >
                    ⌨️ Stdin explanation
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask CodeLynx Copilot about algorithms, debugging, next steps, or platform features..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
                  />

                  {isStreaming ? (
                    <button
                      onClick={handleStopStream}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim()}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950/40 transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ask</span>
                    </button>
                  )}

                  <button
                    onClick={clearChat}
                    title="Clear Chat"
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "next_step" ? (
            /* Next-Step Guide View */
            <div className="flex-1 p-6 overflow-y-auto max-w-3xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">Next-Step Coding Guide</h2>
                    <p className="text-xs text-slate-400">
                      Context-aware guidance analyzing what immediate action to perform next.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFetchNextStep}
                  disabled={isLoadingNextStep}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  {isLoadingNextStep ? "Analyzing..." : "Re-evaluate"}
                </button>
              </div>

              {nextStepData ? (
                <div className="space-y-4">
                  {/* Primary Recommendation Banner */}
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Immediate Recommended Action:</span>
                    </div>
                    <div className="text-base font-bold text-white">
                      {nextStepData.immediateAction}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {nextStepData.summary}
                    </p>
                  </div>

                  {/* Step-by-Step Execution Sequence */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-200">
                      Chronological Action Sequence:
                    </h3>
                    <div className="space-y-2">
                      {nextStepData.stepByStepPlan.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-slate-300"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Patch if any */}
                  {nextStepData.suggestedPatchSnippet && (
                    <div className="p-4 rounded-2xl bg-[#08090d] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-emerald-400">Suggested Implementation Snippet:</span>
                        <button
                          onClick={() => handleCopy(nextStepData.suggestedPatchSnippet!, "patch")}
                          className="text-[11px] text-cyan-400 hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-950 border border-white/5 font-mono text-xs text-emerald-300 overflow-x-auto">
                        {nextStepData.suggestedPatchSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 space-y-3 text-slate-400 text-xs">
                  <Compass className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
                  <p>Click &ldquo;Re-evaluate&rdquo; to analyze your active code context.</p>
                </div>
              )}
            </div>
          ) : activeTab === "hints" ? (
            /* Progressive Hint Lab View */
            <div className="flex-1 p-6 overflow-y-auto max-w-3xl space-y-6">
              <div className="pb-3 border-b border-white/5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span>Progressive Hint Lab</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Pedagogical progressive assistance: small nudge first, complete answer only on demand.
                </p>
              </div>

              {/* Level Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {(
                  [
                    ["small_nudge", "1. Small Nudge"],
                    ["stronger_pointer", "2. Logic Pointer"],
                    ["algorithmic_idea", "3. Algorithm"],
                    ["debugging_clue", "4. Debug Clue"],
                    ["full_solution", "5. Solution"],
                  ] as [HintLevel, string][]
                ).map(([lvl, label]) => (
                  <button
                    key={lvl}
                    onClick={() => handleFetchHint(lvl)}
                    disabled={isLoadingHint}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      hintLevel === lvl
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Hint Card */}
              {currentHint && (
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                    <span>
                      Level {currentHint.levelNumber}: {currentHint.title}
                    </span>
                    {currentHint.targetFocus && (
                      <span className="text-[11px] text-slate-400">
                        Focus: <code className="text-cyan-400">{currentHint.targetFocus}</code>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-sans">
                    {currentHint.hint}
                  </p>

                  {currentHint.codeSnippet && (
                    <pre className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 overflow-x-auto border border-amber-500/20">
                      {currentHint.codeSnippet}
                    </pre>
                  )}

                  {currentHint.nextLevelAvailable && currentHint.nextLevelName && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const levels: HintLevel[] = [
                            "small_nudge",
                            "stronger_pointer",
                            "algorithmic_idea",
                            "debugging_clue",
                            "full_solution",
                          ];
                          const nextIdx = currentHint.levelNumber;
                          if (nextIdx < levels.length) {
                            handleFetchHint(levels[nextIdx]);
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
                      >
                        <span>Need more help? Advance to {currentHint.nextLevelName}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Coding Plan View */
            <div className="flex-1 p-6 overflow-y-auto max-w-3xl space-y-6">
              <div className="pb-3 border-b border-white/5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-emerald-400" />
                  <span>Task-Aware Coding Plan</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Step-by-step progress tracker preventing regressions. Files are never modified automatically.
                </p>
              </div>

              {/* Goal Input & Generate */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={planGoal}
                  onChange={(e) => setPlanGoal(e.target.value)}
                  placeholder="e.g. Build LRU Cache with doubly linked list"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleGeneratePlan}
                  disabled={isLoadingPlan || !planGoal.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  {isLoadingPlan ? "Planning..." : "Generate Plan"}
                </button>
              </div>

              {codingPlan && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Goal: {codingPlan.goal}</span>
                    <span className="text-emerald-400 font-mono">
                      {codingPlan.steps.filter((s) => s.status === "completed").length} /{" "}
                      {codingPlan.steps.length} completed
                    </span>
                  </div>

                  <div className="space-y-2">
                    {codingPlan.steps.map((step) => (
                      <div
                        key={step.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          step.status === "completed"
                            ? "bg-emerald-950/20 border-emerald-500/30 text-slate-300"
                            : step.status === "in_progress"
                            ? "bg-indigo-950/20 border-indigo-500/40 text-white"
                            : "bg-slate-950/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.status === "completed"}
                              onChange={() => handleTogglePlanStep(step.id)}
                              className="w-4 h-4 accent-emerald-400 rounded"
                            />
                            <span className="font-bold text-xs text-white">{step.title}</span>
                          </label>

                          {step.isBlocker && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Blocker
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 pl-6 pt-1 leading-relaxed">
                          {step.description}
                        </p>
                        {step.whyNecessary && (
                          <p className="text-[11px] text-slate-500 pl-6 pt-1 italic">
                            Why: {step.whyNecessary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Definition of Done */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300">Definition of Done:</h4>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                      {codingPlan.definitionOfDone.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
