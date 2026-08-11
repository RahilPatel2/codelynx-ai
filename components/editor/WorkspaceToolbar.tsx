"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  Bug,
  Activity,
  Zap,
  Save,
  Bot,
  Terminal,
  FolderTree,
  ChevronDown,
  Sparkles,
  Command,
  MoreHorizontal,
  FileCode,
  Layers,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { SUPPORTED_LANGUAGES, LanguageDefinition } from "@/lib/languages/definitions";
import { LynxLogo } from "../shared/LynxLogo";
import { ThemeToggle } from "../shared/ThemeToggle";
import { UserAccountMenu } from "../shared/UserAccountMenu";

interface WorkspaceToolbarProps {
  projectName: string;
  activeFileName: string;
  selectedLanguage: string;
  isDirty: boolean;
  isSaving: boolean;
  isRunning: boolean;
  isAnalyzing: boolean;
  onLanguageChange: (langId: string) => void;
  onRunCode: () => void;
  onFindMistakes: () => void;
  onAnalyzeComplexity: () => void;
  onOptimizeCode: () => void;
  onExplainCode: () => void;
  onSave: () => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onToggleAI: () => void;
  onOpenCommandPalette: () => void;
  isAiConnected?: boolean;
  onOpenAiStatus?: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  projectName,
  activeFileName,
  selectedLanguage,
  isDirty,
  isSaving,
  isRunning,
  isAnalyzing,
  onLanguageChange,
  onRunCode,
  onFindMistakes,
  onAnalyzeComplexity,
  onOptimizeCode,
  onExplainCode,
  onSave,
  onToggleSidebar,
  onToggleTerminal,
  onToggleAI,
  onOpenCommandPalette,
  isAiConnected = false,
  onOpenAiStatus,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-3 py-2 bg-[#0c0e15] border-b border-slate-800 text-xs select-none min-w-0">
      {/* Left: Brand & File Indicator */}
      <div className="flex items-center gap-2 min-w-0 shrink">
        {/* Return to Dashboard */}
        <Link
          href="/dashboard"
          title="Return to Developer Dashboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline font-medium text-[11px]">Dashboard</span>
        </Link>
        <span className="text-slate-700 hidden sm:inline">/</span>

        <LynxLogo size="sm" iconOnly className="sm:hidden" />
        <LynxLogo size="sm" className="hidden sm:inline-flex" />
        <span className="text-slate-700 hidden md:inline">/</span>

        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="font-semibold text-slate-200 truncate max-w-[100px] sm:max-w-[160px] text-xs">
            {projectName}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 font-mono text-[11px] truncate max-w-[90px] hidden sm:inline">
            {activeFileName}
          </span>
          {isDirty && (
            <span
              title="Unsaved changes"
              className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse"
            />
          )}
        </div>
      </div>

      {/* Middle: Primary Actions (Run & Debug) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Language selector */}
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 pl-2 pr-6 py-1.5 rounded-lg text-xs font-medium cursor-pointer outline-none focus:border-indigo-500/50 max-w-[95px] sm:max-w-[140px] truncate"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2.5 pointer-events-none" />
        </div>

        {/* Primary Action: Run Code */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          title="Run Code in Isolated Sandbox (Ctrl+Enter)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow-md shadow-emerald-950/40 transition-all active:scale-95 shrink-0"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
          <span className="hidden xs:inline">{isRunning ? "Running..." : "Run"}</span>
        </button>

        {/* Signature Action: Find Mistakes */}
        <button
          onClick={onFindMistakes}
          disabled={isAnalyzing}
          title="AI Code Review & Bug Diagnostics"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 shadow-md shadow-indigo-950/40 transition-all active:scale-95 shrink-0"
        >
          <Bug className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Find Mistakes</span>
        </button>

        {/* Complexity Button (Desktop & Tablet) */}
        <button
          onClick={onAnalyzeComplexity}
          title="Asymptotic Time & Space Analysis"
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors shrink-0"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Complexity</span>
        </button>

        {/* Optimize Button (Desktop only) */}
        <button
          onClick={onOptimizeCode}
          title="Algorithmic Code Optimizer"
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Optimize</span>
        </button>
      </div>

      {/* Right: Panels & Secondary Tools */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Save button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          title="Save changes (Ctrl+S)"
          className={`p-1.5 rounded-lg border transition-colors ${
            isDirty
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              : "text-slate-400 hover:text-white border-transparent hover:bg-slate-800"
          }`}
        >
          <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-pulse" : ""}`} />
        </button>

        {/* Command palette */}
        <button
          onClick={onOpenCommandPalette}
          title="Command Palette (Ctrl+K)"
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Command className="w-3 h-3" />
          <span className="text-[10px] font-mono">⌘K</span>
        </button>

        {/* Toggle file explorer */}
        <button
          onClick={onToggleSidebar}
          title="Toggle File Explorer"
          className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <FolderTree className="w-3.5 h-3.5" />
        </button>

        {/* Toggle terminal */}
        <button
          onClick={onToggleTerminal}
          title="Toggle Terminal"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {/* AI Integration Status Indicator */}
        <button
          onClick={onOpenAiStatus}
          title={isAiConnected ? "Google Gemini AI: Connected" : "Google Gemini AI: Offline / Unconfigured"}
          className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
            isAiConnected
              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAiConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
            }`}
          />
          <span className="hidden md:inline">
            {isAiConnected ? "Gemini AI: Connected" : "Gemini AI: Offline"}
          </span>
          <span className="md:hidden">
            {isAiConnected ? "Gemini" : "Offline"}
          </span>
        </button>

        {/* Toggle AI Assistant */}
        <button
          onClick={onToggleAI}
          title="Toggle AI Assistant"
          className="p-1.5 text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Bot className="w-3.5 h-3.5" />
        </button>

        {/* Settings Link */}
        <Link
          href="/settings"
          title="Workspace & Editor Settings"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle size="sm" />

        {/* User Account Menu */}
        <UserAccountMenu />

        {/* Mobile More Actions Menu Toggle */}
        <div className="relative md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {mobileMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[#11131c] border border-slate-700 shadow-2xl p-1.5 z-50 space-y-0.5 text-xs">
              <button
                onClick={() => {
                  onAnalyzeComplexity();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Complexity Lab</span>
              </button>
              <button
                onClick={() => {
                  onOptimizeCode();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Optimize Code</span>
              </button>
              <button
                onClick={() => {
                  onExplainCode();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Explain Code</span>
              </button>
              <button
                onClick={() => {
                  onToggleSidebar();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                <span>Toggle Files</span>
              </button>
              <button
                onClick={() => {
                  onOpenCommandPalette();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white border-t border-white/5 pt-1 mt-1"
              >
                <Command className="w-3.5 h-3.5 text-purple-400" />
                <span>Command Palette</span>
              </button>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>Settings</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
