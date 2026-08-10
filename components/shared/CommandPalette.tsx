"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Bug,
  Activity,
  Zap,
  HelpCircle,
  FolderPlus,
  Save,
  SunMoon,
  Settings,
  BookOpen,
  Search,
  X,
  Terminal,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

interface CommandItem {
  id: string;
  name: string;
  shortcut?: string;
  category: "Action" | "Navigation" | "Workspace";
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

interface CommandPaletteProps {
  onRunCode?: () => void;
  onFindMistakes?: () => void;
  onAnalyzeComplexity?: () => void;
  onOptimizeCode?: () => void;
  onSave?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onRunCode,
  onFindMistakes,
  onAnalyzeComplexity,
  onOptimizeCode,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: "run-code",
      name: "Run Code",
      shortcut: "Ctrl+Enter",
      category: "Action",
      icon: Play,
      perform: () => {
        onRunCode?.();
        setIsOpen(false);
      },
    },
    {
      id: "find-mistakes",
      name: "Find Mistakes (AI Code Review)",
      shortcut: "Ctrl+Shift+D",
      category: "Action",
      icon: Bug,
      perform: () => {
        onFindMistakes?.();
        setIsOpen(false);
      },
    },
    {
      id: "analyze-complexity",
      name: "Analyze Complexity (Time & Space)",
      shortcut: "Ctrl+Shift+C",
      category: "Action",
      icon: Activity,
      perform: () => {
        onAnalyzeComplexity?.();
        setIsOpen(false);
      },
    },
    {
      id: "optimize-code",
      name: "Optimize Code (Algorithmic & Memory)",
      shortcut: "Ctrl+Shift+O",
      category: "Action",
      icon: Zap,
      perform: () => {
        onOptimizeCode?.();
        setIsOpen(false);
      },
    },
    {
      id: "save-project",
      name: "Save Project Changes",
      shortcut: "Ctrl+S",
      category: "Workspace",
      icon: Save,
      perform: () => {
        onSave?.();
        setIsOpen(false);
      },
    },
    {
      id: "nav-workspace",
      name: "Open Coding Workspace",
      category: "Navigation",
      icon: Terminal,
      perform: () => {
        router.push("/workspace");
        setIsOpen(false);
      },
    },
    {
      id: "nav-dashboard",
      name: "Go to Dashboard",
      category: "Navigation",
      icon: FolderPlus,
      perform: () => {
        router.push("/dashboard");
        setIsOpen(false);
      },
    },
    {
      id: "toggle-theme",
      name: "Toggle Dark / Light Theme",
      category: "Action",
      icon: SunMoon,
      perform: () => {
        toggleTheme();
        setIsOpen(false);
      },
    },
    {
      id: "nav-settings",
      name: "Open Settings",
      category: "Navigation",
      icon: Settings,
      perform: () => {
        router.push("/settings");
        setIsOpen(false);
      },
    },
    {
      id: "nav-docs",
      name: "Documentation & API Guides",
      category: "Navigation",
      icon: BookOpen,
      perform: () => {
        router.push("/documentation");
        setIsOpen(false);
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-surface-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-xs text-slate-400 bg-slate-800 rounded border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No commands matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.perform}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm text-slate-200 hover:bg-indigo-600/20 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    <span className="font-medium">{cmd.name}</span>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 font-mono">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-slate-950/40 text-xs text-slate-400">
          <span>Navigate with arrows, Enter to execute</span>
          <span className="font-mono">CODELYNX AI</span>
        </div>
      </div>
    </div>
  );
};
