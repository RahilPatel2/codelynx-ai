"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Terminal,
  FolderPlus,
  Play,
  Bug,
  Activity,
  Zap,
  History,
  Settings,
  BookOpen,
  LogOut,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Code2,
  Bot,
  User as UserIcon,
  Sparkles,
} from "lucide-react";
import { LynxLogo } from "@/components/shared/LynxLogo";
import { GlobalNavbar } from "@/components/shared/GlobalNavbar";
import { useAuth } from "@/components/shared/AuthContext";
import { useToast } from "@/components/shared/ToastProvider";
import { motion } from "framer-motion";

interface DashboardProject {
  id: string;
  name: string;
  description: string;
  language: string;
  updatedAt: string;
}

interface DashboardExecution {
  id: string;
  language: string;
  status: string;
  executionTime: number;
  memoryUsage: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [executions, setExecutions] = useState<DashboardExecution[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [projRes, execRes, statRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/executions"),
          fetch("/api/system-status"),
        ]);

        if (projRes.ok) {
          const pData = await projRes.json();
          setProjects(pData.projects || []);
        }

        if (execRes.ok) {
          const eData = await execRes.json();
          setExecutions(eData.executions || []);
        }

        if (statRes.ok) {
          const sData = await statRes.json();
          setSystemStatus(sData);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Compute language distribution from real projects
  const langCount: Record<string, number> = {};
  projects.forEach((p) => {
    langCount[p.language] = (langCount[p.language] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-screen bg-[#0a0b0e] text-slate-100 overflow-hidden font-sans">
      <GlobalNavbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-800 bg-[#0d0f17] flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          <div className="p-4 border-b border-white/5">
            <LynxLogo size="md" />
          </div>

          <nav className="p-3 space-y-1 text-xs">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-400"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              Overview Dashboard
            </Link>

            <Link
              href="/workspace"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              Coding Workspace
            </Link>

            <Link
              href="/problems"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Code2 className="w-4 h-4 text-amber-400" />
              Solve Problems (DSA)
            </Link>

            <Link
              href="/assistant"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              AI Copilot & Guide
            </Link>

            <Link
              href="/projects"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              My Projects ({projects.length})
            </Link>

            <Link
              href="/history"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <History className="w-4 h-4 text-purple-400" />
              Execution History
            </Link>

            <Link
              href="/documentation"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              Documentation
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-cyan-400" />
              My Profile
            </Link>

            <Link
              href="/subscription"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              My Subscription
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Settings
            </Link>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || "Developer"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || "demo@codelynx.ai"}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Surface */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#131622] to-indigo-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">
              DEVELOPER CONTROL CENTER
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Welcome back, {user?.name || "Senior Engineer"}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              CodeLynx AI is ready. Execute sandboxed code, run asymptotic complexity analysis, and perform AI-guided debugging across 10 programming languages.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5">
            <Link
              href="/problems"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:text-white transition-all shadow-md"
            >
              <Code2 className="w-4 h-4 text-amber-400" />
              Solve Problems (600+)
            </Link>
            <Link
              href="/assistant"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-200 bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-white transition-all shadow-md"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              AI Copilot & Guide
            </Link>
            <Link
              href="/workspace"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-indigo-950 transition-all hover:scale-[1.02]"
            >
              <Terminal className="w-4 h-4" />
              Open Coding Workspace
            </Link>
          </div>

          {/* Ambient Glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* System & Architecture Status Notification */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <Database className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">Database Layer</div>
                <div className="text-[11px] text-slate-400">
                  {systemStatus.database.status}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <Play className="w-4 h-4 text-emerald-400 shrink-0 fill-current" />
              <div>
                <div className="font-semibold text-slate-200">Compiler Provider</div>
                <div className="text-[11px] text-slate-400">
                  {systemStatus.execution.status}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <Bug className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">AI Intelligence</div>
                <div className="text-[11px] text-slate-400">
                  {systemStatus.ai.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.15 }}>
            <Link
              href="/problems"
              className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all group hover:bg-slate-900 h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-white">DSA Practice School</h3>
              <p className="text-xs text-slate-400 mt-1">
                600+ curated problems, Easy/Medium/Hard, Judge0 sandbox, and AI tutor.
              </p>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.15 }}>
            <Link
              href="/assistant"
              className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all group hover:bg-slate-900 h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Bot className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-white">AI Coding Copilot</h3>
              <p className="text-xs text-slate-400 mt-1">
                Context-aware pair programming, progressive hints, and step-by-step guidance.
              </p>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.15 }}>
            <Link
              href="/workspace"
              className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all group hover:bg-slate-900 h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Bug className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-white">AI Bug Finder</h3>
              <p className="text-xs text-slate-400 mt-1">
                Detect off-by-one errors, memory leaks, and race conditions with structured patches.
              </p>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.15 }}>
            <Link
              href="/workspace"
              className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all group hover:bg-slate-900 h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-white">Complexity Lab</h3>
              <p className="text-xs text-slate-400 mt-1">
                Compute asymptotic recurrence relations, auxiliary space, and empirical line charts.
              </p>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.15 }}>
            <Link
              href="/workspace"
              className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all group hover:bg-slate-900 h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-white">Algorithm Optimizer</h3>
              <p className="text-xs text-slate-400 mt-1">
                Convert brute force O(n²) logic into O(n) hash table or two-pointer patterns.
              </p>
            </Link>
          </motion.div>
        </div>

        {/* Projects & Executions Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Recent Projects</h3>
              </div>
              <Link
                href="/projects"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View all ({projects.length})
              </Link>
            </div>

            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No saved projects yet. Create your first project in the workspace.
                </div>
              ) : (
                projects.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    href={`/workspace`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white group-hover:text-cyan-400 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                        {p.description || "General algorithm implementation"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {p.language}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Execution Activity */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Recent Executions</h3>
              </div>
              <Link
                href="/history"
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                Full History
              </Link>
            </div>

            <div className="space-y-2">
              {executions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No execution runs recorded yet.
                </div>
              ) : (
                executions.slice(0, 4).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          e.status === "accepted" ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                      <div>
                        <div className="font-mono text-xs text-slate-200">
                          {e.language}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(e.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span>{e.executionTime}ms</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          e.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
