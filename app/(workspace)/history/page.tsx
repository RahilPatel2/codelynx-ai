"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  Terminal,
  Clock,
  Cpu,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";
import { LynxLogo } from "@/components/shared/LynxLogo";
import { useToast } from "@/components/shared/ToastProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/languages/definitions";
import { AppHeader } from "@/components/shared/AppHeader";

export default function HistoryPage() {
  const { success, error, info } = useToast();
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [inspectExecution, setInspectExecution] = useState<any | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedLang !== "all") query.set("language", selectedLang);
      if (selectedStatus !== "all") query.set("status", selectedStatus);

      const res = await fetch(`/api/history?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedLang, selectedStatus]);

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your execution logs?")) {
      await fetch("/api/history", { method: "DELETE" });
      setHistoryList([]);
      setInspectExecution(null);
      success("History cleared", "Execution logs removed.");
    }
  };

  const filteredHistory = historyList.filter((item) => {
    const matchSearch =
      search === "" ||
      item.language.toLowerCase().includes(search.toLowerCase()) ||
      item.sourceSnippet.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="flex flex-col h-screen bg-[#0a0b0e] text-slate-100 font-sans overflow-hidden">
      {/* Top Navbar */}
      <AppHeader
        title="Execution Telemetry History"
        icon={<HistoryIcon className="w-4 h-4 text-purple-400" />}
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
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/20 border border-rose-500/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </AppHeader>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#11131c] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code snippet or execution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language filter */}
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">All Languages</option>
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="accepted">Accepted (0)</option>
            <option value="compilation_error">Compilation Error</option>
            <option value="runtime_error">Runtime Error</option>
            <option value="time_limit_exceeded">Time Limit Exceeded</option>
          </select>
        </div>
      </div>

      {/* Main Table / Grid Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <HistoryIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No executions match your criteria.</p>
              <p className="text-xs mt-1">Run algorithms in the workspace to log execution telemetry.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setInspectExecution(item)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  inspectExecution?.id === item.id
                    ? "bg-purple-950/20 border-purple-500/50"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.status === "accepted" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                    <span className="font-mono font-bold text-white uppercase">
                      {item.language}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.executionTime}ms
                    </span>
                    <span className="text-slate-400">
                      {item.memoryUsage} KB
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === "accepted"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] font-mono text-slate-400 truncate max-w-2xl">
                  {item.sourceSnippet}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Details Inspector Panel */}
        {inspectExecution && (
          <aside className="w-96 border-l border-slate-800 bg-[#0d0f17] p-5 flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Execution Inspector</h3>
              <button
                onClick={() => setInspectExecution(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Language:</span>
                <span className="font-mono text-white font-bold">{inspectExecution.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-mono text-cyan-400">{inspectExecution.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exit Code:</span>
                <span className="font-mono text-emerald-400">{inspectExecution.exitCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Runtime:</span>
                <span className="font-mono text-white">{inspectExecution.executionTime} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Memory:</span>
                <span className="font-mono text-white">{inspectExecution.memoryUsage} KB</span>
              </div>
            </div>

            {inspectExecution.stdout && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-300">Standard Output (stdout):</div>
                <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {inspectExecution.stdout}
                </pre>
              </div>
            )}

            {(inspectExecution.stderr || inspectExecution.compileOutput) && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-rose-400">Error / Compiler Output:</div>
                <pre className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs font-mono text-rose-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {inspectExecution.stderr || inspectExecution.compileOutput}
                </pre>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/workspace"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Open Code in Workspace
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
