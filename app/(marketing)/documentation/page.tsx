"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Terminal,
  Cpu,
  Shield,
  Zap,
  Activity,
  Bug,
  Key,
  Server,
  Database,
  ExternalLink,
} from "lucide-react";
import { LynxLogo } from "@/components/shared/LynxLogo";
import { AppHeader } from "@/components/shared/AppHeader";

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col">
      {/* Top Navbar with Dashboard and Back actions */}
      <AppHeader
        title="Developer Documentation & Architecture Guide"
        icon={<BookOpen className="w-4 h-4 text-cyan-400" />}
        showBack={true}
        showDashboard={true}
        backHref="/dashboard"
      >
        <Link
          href="/workspace"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Launch Workspace</span>
        </Link>
      </AppHeader>

      {/* Main Documentation Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 md:p-8 gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-60 shrink-0 hidden md:block space-y-1 text-xs">
          <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wider mb-2 px-2">
            Architecture
          </div>
          <button
            onClick={() => setActiveSection("overview")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "overview"
                ? "bg-indigo-600/20 text-cyan-400 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveSection("judge0")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "judge0"
                ? "bg-indigo-600/20 text-cyan-400 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Judge0 Execution Provider
          </button>
          <button
            onClick={() => setActiveSection("gemini")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "gemini"
                ? "bg-indigo-600/20 text-cyan-400 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Google Gemini / Vertex AI
          </button>
          <button
            onClick={() => setActiveSection("mongodb")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "mongodb"
                ? "bg-indigo-600/20 text-cyan-400 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            MongoDB Atlas Integration
          </button>
          <button
            onClick={() => setActiveSection("complexity")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "complexity"
                ? "bg-indigo-600/20 text-cyan-400 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Complexity Analysis Lab
          </button>
          <button
            onClick={() => setActiveSection("shortcuts")}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              activeSection === "shortcuts"
                ? "bg-indigo-600/20 text-cyan-400 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Keyboard Shortcuts
          </button>
        </aside>

        {/* Content Body */}
        <main className="flex-1 space-y-8 max-w-3xl text-sm leading-relaxed text-slate-300">
          {activeSection === "overview" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white">Platform Overview</h2>
              <p>
                <strong>CODELYNX AI</strong> is an enterprise-grade developer workspace combining browser-based code editing (Monaco Editor), multi-language isolated compilation (Judge0 CE), asymptotic algorithmic complexity analysis, and AI-guided code reviews with git-style diff approval workflows.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-xs">Supported Languages (10)</div>
                  <p className="text-xs text-slate-400">
                    Python 3, C++ (GCC), JavaScript (Node.js), TypeScript, Java (OpenJDK), C (GCC), C# (Mono/.NET), Go, Rust, and SQL.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-xs">Zero-Overwrite Patching</div>
                  <p className="text-xs text-slate-400">
                    Fix Code reviews require explicit user approval with interactive line-by-line diffs before any editor replacement occurs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "judge0" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white">Judge0 CE Execution Engine</h2>
              <p>
                CodeLynx AI decouples code execution from the main Next.js web application server. Untrusted user programs are sent to a sandboxed execution provider with strict CPU time and memory boundaries.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-cyan-400 font-bold"># Environment Configuration (.env)</div>
                <div>JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com</div>
                <div>JUDGE0_API_KEY=&lt;your_rapidapi_or_judge0_token&gt;</div>
                <div>JUDGE0_API_HOST=judge0-ce.p.rapidapi.com</div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300">
                <strong>Offline Dev Fallback:</strong> When Judge0 credentials are not provided, CodeLynx seamlessly activates its built-in AST syntax analyzer and isolated simulator, permitting local development with clear telemetry indicators.
              </div>
            </div>
          )}

          {activeSection === "gemini" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white">Google Gemini AI Setup</h2>
              <p>
                The AI service leverages Google&apos;s high-performance Gemini models (such as <code>gemini-2.5-flash</code>) for real-time bug discovery, asymptotic complexity derivations, and optimization suggestions.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-cyan-400 font-bold"># Google AI API Key Configuration</div>
                <div>GEMINI_API_KEY=AIzaSy...</div>
                <div>GEMINI_API_MODEL=gemini-2.5-flash</div>
              </div>

              <p className="text-xs text-slate-400">
                Obtain a free developer key at <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-cyan-400 underline">ai.google.dev</a>. Responses are validated server-side using strict Zod schemas before being delivered to the UI.
              </p>
            </div>
          )}

          {activeSection === "mongodb" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white">MongoDB Atlas Persistence</h2>
              <p>
                CodeLynx AI supports full multi-file project persistence, execution logs, and user sessions via MongoDB Atlas.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-cyan-400 font-bold"># MongoDB Connection String</div>
                <div>MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority</div>
                <div>MONGODB_DB_NAME=codelynx</div>
              </div>
            </div>
          )}

          {activeSection === "complexity" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white">Complexity Analysis Lab</h2>
              <p>
                The Complexity Lab employs a two-tier methodology:
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs">
                <li><strong>Deterministic Pattern Engine:</strong> Detects loops, binary search bisecting, divide-and-conquer recurrences, and hash table amortizations.</li>
                <li><strong>Empirical Benchmark Mode:</strong> Runs execution latency trials across scaling input sizes (n = 100 to 10,000) and plots real-world millisecond curves using Recharts.</li>
              </ul>
            </div>
          )}

          {activeSection === "shortcuts" && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white">Keyboard Shortcuts</h2>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="py-2">Shortcut</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2.5 text-cyan-400">Ctrl + Enter</td>
                    <td className="font-sans">Execute Program</td>
                    <td className="text-slate-500">Workspace</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-cyan-400">Ctrl + K</td>
                    <td className="font-sans">Open Command Palette</td>
                    <td className="text-slate-500">Global</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-cyan-400">Ctrl + S</td>
                    <td className="font-sans">Save Project State</td>
                    <td className="text-slate-500">Workspace</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-cyan-400">Ctrl + Shift + D</td>
                    <td className="font-sans">Find Mistakes (AI Debug)</td>
                    <td className="text-slate-500">Workspace</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-cyan-400">Ctrl + Shift + C</td>
                    <td className="font-sans">Analyze Complexity</td>
                    <td className="text-slate-500">Workspace</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
