"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  AlertCircle,
} from "lucide-react";
import { LynxLogo } from "@/components/shared/LynxLogo";
import { useAuth } from "@/components/shared/AuthContext";
import { useToast } from "@/components/shared/ToastProvider";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const { user, loading: authLoading, login, demoLogin } = useAuth();
  const { success, error, info } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const from = searchParams.get("from") || "/dashboard";
      router.replace(from);
    }
  }, [user, authLoading, router, searchParams]);

  useEffect(() => {
    if (oauthError) {
      if (oauthError === "access_denied") {
        error("Sign In Cancelled", "Google account permission was denied.");
      } else if (oauthError === "oauth_unconfigured") {
        error("Configuration Error", "Google OAuth credentials are not configured on the server.");
      } else if (oauthError === "oauth_state_mismatch") {
        error("Security Warning", "OAuth CSRF state validation failed. Please try again.");
      } else {
        error("OAuth Failed", `Google authentication error: ${oauthError}`);
      }
    }
  }, [oauthError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await login(email, password, rememberMe);
    setLoading(false);

    if (res.success) {
      success("Welcome back", "Signed in successfully.");
      router.push("/dashboard");
    } else {
      error("Authentication failed", res.error || "Invalid credentials");
    }
  };

  const handleDemoFastLogin = async () => {
    setLoading(true);
    await demoLogin();
    setLoading(false);
    success("Demo session started", "Logged in as Staff Engineer Alex Lynx.");
    router.push("/dashboard");
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0a0b0e] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Left Column: Brand & Hero Showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-[#0c0e16] via-[#121524] to-[#0a0b0e] border-r border-slate-800 relative overflow-hidden">
        <LynxLogo size="lg" />

        <div className="space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI-Engineered Developer Workspace
          </div>

          <h2 className="text-4xl font-black text-white leading-tight">
            Understand Your Code. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
              Improve Your Thinking.
            </span>
          </h2>

          <p className="text-slate-400 text-sm leading-relaxed">
            Multi-language compilation, asymptotic Big-O complexity proofs, and AI-guided debugging with explicit patch approval workflows.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Isolated Sandboxing</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Zero-Overwrite Safety</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 z-10">
          © 2026 CodeLynx AI Inc. All rights reserved.
        </div>

        {/* Ambient Light Orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-6 flex justify-center">
            <LynxLogo size="md" />
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sign In to CodeLynx
            </h1>
            <p className="text-xs text-slate-400">
              Enter your developer credentials or start an instant demo session.
            </p>
          </div>

          {/* Quick Demo Button */}
          <button
            onClick={handleDemoFastLogin}
            disabled={loading}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/40 hover:border-indigo-500/80 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>One-Click Demo Developer Login (Staff Engineer)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#0a0b0e] px-3 text-[11px] text-slate-500 uppercase font-mono tracking-wider">
              Or email credentials
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-medium">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="alex@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-medium">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
                <span className="text-slate-400">Remember session for 7 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Google Sign In option */}
          <div className="pt-2">
            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0b0e]" />}>
      <LoginContent />
    </Suspense>
  );
}
