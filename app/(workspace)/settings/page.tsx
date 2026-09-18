"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  SunMoon,
  Bot,
  Shield,
  Save,
  RotateCcw,
  Keyboard,
  Type,
  Palette,
  Check,
  AlertCircle,
  Eye,
  Sparkles,
} from "lucide-react";
import { useSettings } from "@/components/shared/SettingsContext";
import { useToast } from "@/components/shared/ToastProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/languages/definitions";
import { AppHeader } from "@/components/shared/AppHeader";
import {
  SupportedThemes,
  SupportedFontFamilies,
  SupportedAiModels,
  SupportedDetailLevels,
  formatShortcutFromEvent,
  KeyboardShortcuts,
} from "@/lib/settings/types";

export default function SettingsPage() {
  const { settings, updateSettings, resetToDefaults, isSaving } = useSettings();
  const { success, error: toastError, info } = useToast();

  // Local form state initialized from persistent settings
  const [theme, setTheme] = useState(settings.theme);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [fontFamily, setFontFamily] = useState(settings.fontFamily);
  const [minimap, setMinimap] = useState(settings.minimap);
  const [wordWrap, setWordWrap] = useState(settings.wordWrap);
  const [lineNumbers, setLineNumbers] = useState(settings.lineNumbers);
  const [defaultLang, setDefaultLang] = useState(settings.defaultLanguage);
  const [aiModel, setAiModel] = useState(settings.aiModel);
  const [verbosity, setVerbosity] = useState(settings.verbosity);
  const [confirmPatches, setConfirmPatches] = useState(settings.confirmPatches);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcuts>(settings.keyboardShortcuts);

  // Key recording state
  const [recordingAction, setRecordingAction] = useState<keyof KeyboardShortcuts | null>(null);

  // Sync local form state if settings update from context
  useEffect(() => {
    setTheme(settings.theme);
    setFontSize(settings.fontSize);
    setFontFamily(settings.fontFamily);
    setMinimap(settings.minimap);
    setWordWrap(settings.wordWrap);
    setLineNumbers(settings.lineNumbers);
    setDefaultLang(settings.defaultLanguage);
    setAiModel(settings.aiModel);
    setVerbosity(settings.verbosity);
    setConfirmPatches(settings.confirmPatches);
    setShortcuts(settings.keyboardShortcuts);
  }, [settings]);

  // Handle keypress when recording a shortcut
  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keyCombo = formatShortcutFromEvent(e);
      if (!keyCombo) return; // Modifier only

      setShortcuts((prev) => ({
        ...prev,
        [recordingAction]: keyCombo,
      }));
      setRecordingAction(null);
      info("Shortcut recorded", `${recordingAction} set to ${keyCombo}`);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recordingAction, info]);

  // Conflict detection
  const findShortcutConflict = (action: keyof KeyboardShortcuts, shortcut: string) => {
    if (!shortcut) return null;
    for (const [key, val] of Object.entries(shortcuts)) {
      if (key !== action && val.toLowerCase() === shortcut.toLowerCase()) {
        return key;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const ok = await updateSettings({
      theme,
      fontSize,
      fontFamily,
      minimap,
      wordWrap,
      lineNumbers,
      defaultLanguage: defaultLang,
      aiModel,
      verbosity,
      confirmPatches,
      keyboardShortcuts: shortcuts,
    });

    if (ok) {
      success("Settings Saved", "Your workspace, editor, and AI configurations are active and persisted.");
    } else {
      toastError("Save Failed", "Could not persist preferences. Please check your connection.");
    }
  };

  const actionLabels: Record<keyof KeyboardShortcuts, string> = {
    runCode: "Run Code (Primary)",
    runCodeAlt: "Run Code (Secondary / Alternate)",
    saveProject: "Save Project / Workspace",
    findMistakes: "Find Mistakes / AI Debugger",
    analyzeComplexity: "Analyze Complexity (Big-O)",
    optimizeCode: "Optimize Code",
    commandPalette: "Open Command Palette",
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0b0e] text-slate-100 font-sans overflow-hidden">
      {/* Universal Consistent Header */}
      <AppHeader
        title="Platform & Workspace Settings"
        icon={<SettingsIcon className="w-4 h-4 text-cyan-400" />}
        badge="Persistent"
        showBack={true}
        showDashboard={true}
      >
        <button
          onClick={resetToDefaults}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Defaults</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950/40 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          {isSaving ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
        </button>
      </AppHeader>

      {/* Settings Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Section 1: Editor Appearance & Theme */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e111a] border border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Monaco Code Editor & Typography</h2>
            </div>
            <span className="text-[11px] text-slate-400">Live Editor Preview Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Syntax Theme</span>
                <span className="text-cyan-400 font-mono text-[11px]">{theme}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SupportedThemes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      theme === t
                        ? "bg-indigo-600/20 border-cyan-400 text-white shadow-sm"
                        : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-semibold text-[11px] capitalize">{t.replace("-", " ")}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            t === "codelynx-dark"
                              ? "#38bdf8"
                              : t === "monokai"
                              ? "#f92672"
                              : t === "nord"
                              ? "#88c0d0"
                              : t === "vs-light"
                              ? "#ffffff"
                              : "#a855f7",
                        }}
                      />
                      <span className="text-[10px] text-slate-500">
                        {t === "vs-light" ? "Light" : "Dark"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Code Font Family</span>
                <Type className="w-3.5 h-3.5 text-indigo-400" />
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500/50"
              >
                {SupportedFontFamilies.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Supports developer ligatures like <code className="text-cyan-400">&lt;=</code>, <code className="text-cyan-400">=&gt;</code>, <code className="text-cyan-400">===</code>
              </p>
            </div>

            {/* Font Size Slider & Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">Font Size</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="11"
                    max="28"
                    value={fontSize}
                    onChange={(e) => setFontSize(Math.max(11, Math.min(28, parseInt(e.target.value) || 14)))}
                    className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-mono text-cyan-400 font-bold"
                  />
                  <span className="text-slate-500">px</span>
                </div>
              </div>
              <input
                type="range"
                min="11"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>11px (Compact)</span>
                <span>14px (Standard)</span>
                <span>24px (Large)</span>
              </div>
            </div>

            {/* Default Programming Language */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold">Default Workspace Language</label>
              <select
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-cyan-500/50"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.extension})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                New sessions and untitled workspaces will default to this language.
              </p>
            </div>

            {/* Monaco Display Toggles */}
            <div className="md:col-span-2 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/5">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={minimap}
                  onChange={(e) => setMinimap(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <div>
                  <div className="text-slate-200 font-medium">Monaco Minimap</div>
                  <div className="text-[10px] text-slate-500">Display side code map</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={wordWrap}
                  onChange={(e) => setWordWrap(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <div>
                  <div className="text-slate-200 font-medium">Automatic Word Wrap</div>
                  <div className="text-[10px] text-slate-500">Wrap long lines cleanly</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={lineNumbers}
                  onChange={(e) => setLineNumbers(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
                <div>
                  <div className="text-slate-200 font-medium">Line Numbers</div>
                  <div className="text-[10px] text-slate-500">Display margin line count</div>
                </div>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#08090d] border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Live Typography & Size Preview:
              </span>
              <span className="font-mono text-cyan-400">
                {fontFamily} • {fontSize}px
              </span>
            </div>
            <pre
              className="p-3 rounded-lg bg-[#0e1017] border border-white/5 overflow-x-auto text-slate-200"
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: `'${fontFamily}', monospace`,
              }}
            >
              <span className="text-purple-400">def</span> <span className="text-blue-400">fibonacci</span>(n: <span className="text-cyan-400">int</span>) -&gt; <span className="text-cyan-400">int</span>:{"\n"}
              {"    "}<span className="text-slate-500"># Fast doubling matrix exponentiation</span>{"\n"}
              {"    "}<span className="text-purple-400">if</span> n &lt;= 1: <span className="text-purple-400">return</span> n{"\n"}
              {"    "}<span className="text-purple-400">return</span> fibonacci(n - 1) + fibonacci(n - 2)
            </pre>
          </div>
        </div>

        {/* Section 2: AI Intelligence & Gemini Provider */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e111a] border border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Google Gemini AI & Response Tuning</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Active Server LLM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* AI Model Selector */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold">Gemini Intelligence Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500/50"
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Balanced Speed & Reasoning)</option>
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Fastest Execution)</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Enhanced Context)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (High-Capability Developer Model)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
              <p className="text-[11px] text-slate-500">
                CodeLynx AI features automatic quota failover across Gemini model tiers.
              </p>
            </div>

            {/* Explanation Detail Level */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold">Response Detail Level</label>
              <select
                value={verbosity}
                onChange={(e) => setVerbosity(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500/50"
              >
                <option value="concise">Concise (Bullet points & direct code diffs only)</option>
                <option value="balanced">Balanced (Clear explanations & reasoning)</option>
                <option value="detailed">Detailed (Deep algorithmic & mathematical derivations)</option>
                <option value="step-by-step">Step-by-Step (Chronological step-by-step debugging walkthrough)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Directly sets the instruction style in Gemini prompts for Find Mistakes, Fix Code, and Explain.
              </p>
            </div>

            {/* Explicit Patch Approval Toggle */}
            <div className="md:col-span-2 pt-2 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={confirmPatches}
                  onChange={(e) => setConfirmPatches(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded shrink-0"
                />
                <div>
                  <div className="text-slate-200 font-semibold text-xs">
                    Require explicit diff review before applying AI-generated code fixes
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Prevents silent modifications by always opening side-by-side diff comparison before editor edits.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Custom Keyboard Shortcuts */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e111a] border border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Custom Keyboard Shortcuts</h2>
            </div>
            <span className="text-[11px] text-slate-400">Click to record shortcut</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {(Object.keys(shortcuts) as (keyof KeyboardShortcuts)[]).map((action) => {
              const currentShortcut = shortcuts[action];
              const isRecording = recordingAction === action;
              const conflictWith = findShortcutConflict(action, currentShortcut);

              return (
                <div
                  key={action}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isRecording
                      ? "bg-purple-950/30 border-purple-500 shadow-md ring-1 ring-purple-500"
                      : conflictWith
                      ? "bg-amber-950/20 border-amber-500/40"
                      : "bg-slate-950/70 border-slate-800/80"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-200">{actionLabels[action]}</div>
                    {conflictWith && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        <span>Conflicts with {actionLabels[conflictWith as keyof KeyboardShortcuts]}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecordingAction(isRecording ? null : action)}
                      className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs border transition-colors ${
                        isRecording
                          ? "bg-purple-600 text-white border-purple-400 animate-pulse"
                          : "bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700"
                      }`}
                    >
                      {isRecording ? "Press Keys..." : currentShortcut || "None"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Tip: Both primary (e.g. <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">Ctrl+Enter</kbd>) and alternate (e.g. <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">Ctrl+F9</kbd>) Run Code shortcuts trigger execution in the workspace.
          </p>
        </div>

        {/* Section 4: Security & Ephemeral Execution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e111a] border border-slate-800/80 space-y-3 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Security & Execution Isolation Guarantee</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">
            All code executions are dispatched to ephemeral Judge0 sandbox containers with memory caps, CPU time limits, and restricted system call boundaries. No user code runs directly on the Next.js production host.
          </p>
        </div>
      </div>
    </div>
  );
}
