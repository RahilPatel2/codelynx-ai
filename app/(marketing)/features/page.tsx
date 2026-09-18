import React from "react";
import Link from "next/link";
import {
  Terminal,
  Bug,
  Activity,
  Zap,
  FlaskConical,
  Shield,
  Layers,
  ArrowRight,
  Code2,
} from "lucide-react";
import { LynxLogo } from "@/components/shared/LynxLogo";
import { GlobalNavbar } from "@/components/shared/GlobalNavbar";

export default function FeaturesPage() {
  const features = [
    {
      icon: Terminal,
      title: "Isolated Multi-Language Compiler",
      desc: "Compile and execute Python, C++, Java, Rust, Go, TypeScript, C#, and SQL in sandboxed execution environments with real-time stdout, stderr, execution time, and memory metrics.",
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Bug,
      title: "Signature AI Bug Finder",
      desc: "Detect off-by-one errors, buffer overruns, unclosed pointers, logic inversions, and security vulnerabilities with concrete line markers and demonstration test cases.",
      accent: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      icon: Layers,
      title: "Zero-Overwrite Diff Patching",
      desc: "Never suffer silent code overwrites. CodeLynx renders side-by-side git-style additions and deletions with risk badges. You explicitly approve patches before application.",
      accent: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      icon: Activity,
      title: "Complexity Lab & Benchmarking",
      desc: "Evaluate asymptotic Big-O time and auxiliary space bounds, solve recurrence relations, and plot empirical millisecond growth curves across input sizes up to n = 10,000.",
      accent: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Zap,
      title: "Algorithmic Code Optimizer",
      desc: "Transform nested O(n²) iterations into linear O(n) hash table lookups and optimal pointer passes with explicit reasoning for every transformed line.",
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: FlaskConical,
      title: "Automated Edge Case Generator",
      desc: "Synthesize robust test suites covering empty inputs, negative integers, boundary limits, and adversarial conditions with pass/fail telemetry.",
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-indigo-500/30">
      <GlobalNavbar />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Designed for Engineers Who Care About{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
              Correctness & Performance
            </span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every feature in CodeLynx AI is engineered around precision, transparency, and developer empowerment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className={`p-3 rounded-xl w-fit ${f.bg} ${f.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">Experience the CodeLynx Workspace</h3>
            <p className="text-xs text-slate-400 mt-1">
              No configuration required. Launch the interactive editor immediately.
            </p>
          </div>
          <Link
            href="/workspace"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-xs text-white shadow-xl shadow-indigo-950 flex items-center gap-2"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
