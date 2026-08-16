"use client";

import React, { useState } from "react";
import { Keyboard, Play, X, Sparkles, Terminal, ArrowRight } from "lucide-react";

interface StdinPromptModalProps {
  isOpen: boolean;
  patterns: string[];
  initialStdin: string;
  language: string;
  onConfirm: (stdinValue: string) => void;
  onCancel: () => void;
  onRunAnyway: () => void;
}

export const StdinPromptModal: React.FC<StdinPromptModalProps> = ({
  isOpen,
  patterns,
  initialStdin,
  language,
  onConfirm,
  onCancel,
  onRunAnyway,
}) => {
  const [val, setVal] = useState(initialStdin);

  if (!isOpen) return null;

  const quickSamples = [
    { label: "Two Numbers (5 7)", value: "5 7" },
    { label: "Name & Age", value: "Alex 28" },
    { label: "Array Size & Items", value: "5\n10 20 30 40 50" },
    { label: "Single String", value: "Hello World" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f111a] border border-cyan-500/30 shadow-2xl p-5 space-y-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Standard Input (stdin) Required
              </h3>
              <p className="text-[11px] text-slate-400">
                Your program uses interactive input ({patterns.join(", ")}).
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick presets */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-medium text-[11px]">
            Quick Input Presets:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickSamples.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setVal(s.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium">Standard Input Data:</span>
            <span className="font-mono text-cyan-400">
              {val.length} chars • {val ? val.split("\n").length : 0} lines
            </span>
          </div>
          <textarea
            autoFocus
            rows={5}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Type or paste the input lines expected by your program..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500/50 font-mono text-xs leading-relaxed resize-none"
          />
          <p className="text-[10px] text-slate-500">
            Judge0 compiles in a sandboxed batch container. Pre-supplying input prevents <code className="text-rose-400">EOFError</code> or runtime hangs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onRunAnyway}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium hover:bg-slate-900 transition-colors"
          >
            Run Without Input
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-medium bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(val)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950/40 transition-all hover:scale-[1.02]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run with Input</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
