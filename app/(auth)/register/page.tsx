"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { LynxLogo } from "@/components/shared/LynxLogo";
import { useAuth } from "@/components/shared/AuthContext";
import { useToast } from "@/components/shared/ToastProvider";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams?.get("error");
  const { user, loading: authLoading, register } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const from = searchParams?.get("from") || "/dashboard";
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

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      error("Terms required", "Please agree to the terms of service.");
      return;
    }
    if (password !== confirmPassword) {
      error("Password mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);

    if (res.success) {
      success("Account created", "Welcome to CodeLynx AI!");
      router.push("/dashboard");
    } else {
      error("Registration failed", res.error || "Unable to register");
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0b0e] text-slate-100 font-sans p-6 selection:bg-indigo-500/30">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <LynxLogo size="md" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Create Developer Account
          </h1>
          <p className="text-xs text-slate-400">
            Join the CodeLynx AI platform for sandboxed execution and algorithmic analysis.
          </p>
        </div>

        {/* Google Sign Up option */}
        <div>
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

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0a0b0e] px-3 text-[11px] text-slate-500 uppercase font-mono tracking-wider">
            Or register with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Elena Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="elena@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Minimum 8 characters, 1 uppercase, 1 number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength ticks */}
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className={hasMinLength ? "text-emerald-400 font-medium" : ""}>
                • 8+ chars
              </span>
              <span className={hasUpperCase ? "text-emerald-400 font-medium" : ""}>
                • Uppercase
              </span>
              <span className={hasNumber ? "text-emerald-400 font-medium" : ""}>
                • Number
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
            <label htmlFor="terms" className="text-slate-400 cursor-pointer">
              I agree to the Terms of Service & Privacy Policy
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !hasMinLength || !hasUpperCase || !hasNumber || !agreeTerms}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0b0e]" />}>
      <RegisterContent />
    </Suspense>
  );
}
