"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Bug,
  Activity,
  Zap,
  FlaskConical,
  Shield,
  Layers,
  ArrowRight,
  Terminal,
  Cpu,
  Clock,
  Sparkles,
  ChevronDown,
  SunMoon,
  Menu,
  X,
  CheckCircle2,
  Database,
  Code2,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { LynxLogo } from "@/components/shared/LynxLogo";
import { useAuth } from "@/components/shared/AuthContext";
import { useTheme } from "@/components/shared/ThemeContext";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserAccountMenu } from "@/components/shared/UserAccountMenu";
import { SUPPORTED_LANGUAGES, getLanguageById } from "@/lib/languages/definitions";
import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer, subtleHover } from "@/lib/utils/motion";

export default function LandingPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hero interactive preview state
  const [heroLang, setHeroLang] = useState("python");
  const [heroCode, setHeroCode] = useState(getLanguageById("python").starterTemplate);
  const [heroOutput, setHeroOutput] = useState<string | null>(null);
  const [heroRunning, setHeroRunning] = useState(false);
  const [heroAnalysis, setHeroAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHeroRun = () => {
    setHeroRunning(true);
    setHeroAnalysis(null);
    setTimeout(() => {
      setHeroRunning(false);
      setHeroOutput("Input: nums = [2, 7, 11, 15], target = 9\nOutput indices: [0, 1]\nValues: [2, 7]\nProcess finished with exit code 0 (18ms)");
    }, 400);
  };

  const handleHeroDebug = () => {
    setHeroAnalysis(
      "AI Code Review: Two Sum algorithm is optimal with O(n) amortized time using hash lookup table. No memory leaks or off-by-one boundary violations detected."
    );
  };

  const handleHeroLangChange = (langId: string) => {
    setHeroLang(langId);
    setHeroCode(getLanguageById(langId).starterTemplate);
    setHeroOutput(null);
    setHeroAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-150">
      {/* 1. FIXED TRANSLUCENT NAVIGATION BAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-nav py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <LynxLogo size="md" />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Link href="#features" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
              Features
            </Link>
            <Link href="#debugger" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
              AI Debugger
            </Link>
            <Link href="#complexity" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
              Complexity Lab
            </Link>
            <Link href="/documentation" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
              Documentation
            </Link>
            <Link href="/pricing" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
              Plans
            </Link>
          </nav>

          {/* Right Header Controls */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle size="sm" />

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <UserAccountMenu />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  Log In
                </Link>

                <Link
                  href="/workspace"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-indigo-950 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 bg-[#0d0f17] border-b border-slate-800 space-y-3 text-sm">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#debugger"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white"
            >
              AI Debugger
            </Link>
            <Link
              href="#complexity"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white"
            >
              Complexity Lab
            </Link>
            <Link
              href="/documentation"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white"
            >
              Documentation
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white"
            >
              Plans
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Go to Dashboard</span>
                  </Link>
                  <Link
                    href="/workspace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center rounded-lg bg-indigo-600 text-white text-xs font-bold"
                  >
                    Launch Workspace
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2 text-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/workspace"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-center rounded-lg bg-indigo-600 text-white text-xs font-bold"
                  >
                    Launch Workspace
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Subtle Ambient Background Grid & Radial Lighting */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/15 to-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-12">
          {/* Main Title & Description */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center space-y-5 max-w-3xl mx-auto"
          >
            <motion.div variants={slideUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Generation AI Developer Workspace</span>
            </motion.div>

            <motion.h1 variants={slideUp} className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08]">
              Code Smarter. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
                Debug Faster. Build Better.
              </span>
            </motion.h1>

            <motion.p variants={slideUp} className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Your intelligent coding workspace for multi-language execution, algorithmic complexity analysis, and AI-powered optimization.
            </motion.p>

            <motion.div variants={slideUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-xl shadow-indigo-950/60 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </Link>

                  <Link
                    href="/workspace"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Open Coding Workspace</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/workspace"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-xl shadow-indigo-950/60 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Start Coding Now</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Explore the Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Interactive Live Hero Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-4xl mx-auto rounded-2xl border border-slate-800/80 bg-[#0d0f17] shadow-2xl overflow-hidden shadow-indigo-950/30"
          >
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#121522] border-b border-white/5 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-slate-400 font-mono text-[11px] ml-2 font-medium">
                  codelynx-preview.workspace
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Picker */}
                <select
                  value={heroLang}
                  onChange={(e) => handleHeroLangChange(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md outline-none"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="javascript">JavaScript</option>
                  <option value="rust">Rust</option>
                </select>

                <button
                  onClick={handleHeroRun}
                  disabled={heroRunning}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  <Play className={`w-3 h-3 fill-current ${heroRunning ? "animate-spin" : ""}`} />
                  <span>{heroRunning ? "Compiling..." : "Run"}</span>
                </button>

                <button
                  onClick={handleHeroDebug}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                >
                  <Bug className="w-3 h-3" />
                  <span>Find Mistakes</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 bg-[#0a0b10] font-mono text-xs overflow-x-auto max-h-72 leading-relaxed text-slate-300">
              <pre>{heroCode}</pre>
            </div>

            {/* Terminal Output Drawer */}
            {(heroOutput || heroAnalysis) && (
              <div className="p-3 bg-[#0d101a] border-t border-slate-800 text-xs font-mono space-y-2">
                {heroOutput && (
                  <div>
                    <div className="text-[11px] text-cyan-400 font-bold uppercase mb-1">
                      Program Standard Output:
                    </div>
                    <pre className="text-slate-200 whitespace-pre-wrap">{heroOutput}</pre>
                  </div>
                )}
                {heroAnalysis && (
                  <div className="p-2.5 rounded bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-xs font-sans">
                    {heroAnalysis}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 3. MULTI-LANGUAGE COMPILER SHOWCASE */}
      <section id="features" className="py-20 border-t border-slate-900 bg-[#0c0e16]/60">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Genuine Multi-Language Isolated Compilation
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              Execute code securely across 10 programming languages in sandboxed containers with millisecond metrics.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <motion.div
                key={lang.id}
                whileHover={{ y: -3, scale: 1.02 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  href="/workspace"
                  className="block p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all group space-y-1.5"
                >
                  <div className="text-xs font-mono font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {lang.name}
                  </div>
                  <div className="text-[10px] text-slate-400">Version: {lang.version}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    .{lang.extension} • {lang.isCompiled ? "Compiled" : "Interpreted"}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AI-POWERED DEBUGGING & ZERO-OVERWRITE DIFFS */}
      <section id="debugger" className="py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/20">
              <Bug className="w-3.5 h-3.5" />
              <span>Signature AI Debugger</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              &ldquo;Find Mistakes&rdquo; Without Silent Overwrites
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed">
              Never let an AI quietly break your codebase. CodeLynx categorizes issues into syntax errors, logical defects, off-by-one bounds, and security risks with line pointers.
            </p>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Side-by-side git diff showing green additions and red deletions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Explicit user approval required before any file patch is committed.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>One-click undo or reversion to preserve initial state.</span>
              </li>
            </ul>

            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              <span>Test the debugger in workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d0f17] border border-slate-800 shadow-2xl space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Interactive Patch Diff Review</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                Risk: Low
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs space-y-1">
              <div className="text-slate-500">@@ -8,4 +8,4 @@ Two Sum Lookup</div>
              <div className="bg-rose-950/40 text-rose-300 line-through pl-2 py-0.5">
                - for i in range(len(nums) + 1): # IndexError
              </div>
              <div className="bg-emerald-950/40 text-emerald-300 font-semibold pl-2 py-0.5">
                + for i, num in enumerate(nums): # Fixed Bounds & O(1) Lookup
              </div>
              <div className="text-slate-400 pl-2">     complement = target - num</div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              Summary: Fixed off-by-one range overflow and replaced linear scan with hash mapping.
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPLEXITY ANALYSIS LAB */}
      <section id="complexity" className="py-20 border-t border-slate-900 bg-[#0c0e16]/60">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 p-6 rounded-2xl bg-[#0d0f17] border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>QuickSort Algorithm Complexity</span>
              <span className="text-cyan-400 font-mono">O(n log n)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Time Complexity</div>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">O(n log n)</div>
                <div className="text-[10px] text-slate-500">Recurrence: T(n)=2T(n/2)+O(n)</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Auxiliary Space</div>
                <div className="text-xl font-bold font-mono text-indigo-400 mt-1">O(log n)</div>
                <div className="text-[10px] text-slate-500">Recursive call stack frames</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              Empirical Benchmark Mode enables live execution latency testing from n=100 to n=10,000, plotting real growth curves.
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20">
              <Activity className="w-3.5 h-3.5" />
              <span>Complexity Lab</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              Rigorous Asymptotic Time & Space Analysis
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed">
              We separate AI guesses from mathematical analysis. The Complexity Lab identifies loop bounds, recurrence relations, and dominant steps, with clear scientific disclaimers that runtime measurements do not prove formal complexity.
            </p>

            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              <span>Analyze an algorithm now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="py-24 border-t border-slate-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Build With CodeLynx AI?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Experience real compiler output, instant bug discoveries, and asymptotic complexity analysis right in your browser.
          </p>
          <div className="pt-2">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-2xl shadow-indigo-950 transition-all hover:scale-105"
            >
              <Terminal className="w-5 h-5" />
              <span>Launch Free Workspace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. PROFESSIONAL FOOTER */}
      <footer className="border-t border-slate-900 bg-[#090a0e] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <LynxLogo size="md" />
            <p className="max-w-xs text-slate-400 text-xs">
              Understand Your Code. Improve Your Thinking. The premium AI developer workspace for sandboxed execution and complexity analysis.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-300 text-xs uppercase tracking-wider">Product</div>
            <ul className="space-y-1.5">
              <li><Link href="/workspace" className="hover:text-slate-300">Editor Workspace</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-300">Developer Dashboard</Link></li>
              <li><Link href="/features" className="hover:text-slate-300">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-slate-300">Pricing Plans</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-300 text-xs uppercase tracking-wider">Integrations</div>
            <ul className="space-y-1.5">
              <li><Link href="/documentation" className="hover:text-slate-300">Judge0 CE</Link></li>
              <li><Link href="/documentation" className="hover:text-slate-300">Google Gemini AI</Link></li>
              <li><Link href="/documentation" className="hover:text-slate-300">MongoDB Atlas</Link></li>
              <li><Link href="/documentation" className="hover:text-slate-300">Vertex AI</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-300 text-xs uppercase tracking-wider">Legal & Security</div>
            <ul className="space-y-1.5">
              <li><Link href="/documentation" className="hover:text-slate-300">Security Architecture</Link></li>
              <li><Link href="/documentation" className="hover:text-slate-300">Privacy Policy</Link></li>
              <li><Link href="/documentation" className="hover:text-slate-300">Zero Retention Notice</Link></li>
              <li><Link href="/settings" className="hover:text-slate-300">Preferences</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-slate-900 flex items-center justify-between">
          <div>© 2026 CodeLynx AI Inc. All rights reserved.</div>
          <div className="font-mono text-[11px] text-slate-600">v1.0.0-production</div>
        </div>
      </footer>
    </div>
  );
}
