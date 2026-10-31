"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Sparkles,
  Building,
  Briefcase,
  Github,
  Save,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Camera,
  RefreshCw,
  Key,
} from "lucide-react";
import { useAuth } from "@/components/shared/AuthContext";
import { useToast } from "@/components/shared/ToastProvider";
import { GlobalNavbar } from "@/components/shared/GlobalNavbar";
import { UserAvatar } from "@/components/shared/UserAvatar";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
];

export default function ProfilePage() {
  const { user, updateProfile, refreshSession } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form state from user session
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatarUrl || "");
      setBio(user.bio || "");
      setRole(user.role || "Software Engineer");
      setCompany(user.company || "");
      setGithubHandle(user.githubHandle || "");
    }
  }, [user]);

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setHasChanges(true);
  };

  const handleClearAvatar = () => {
    setAvatarUrl("");
    setHasChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("Validation Error", "Full name cannot be blank.");
      return;
    }

    setIsSaving(true);
    const res = await updateProfile({
      name: name.trim(),
      avatarUrl: avatarUrl.trim(),
      bio: bio.trim(),
      role: role.trim(),
      company: company.trim(),
      githubHandle: githubHandle.trim(),
    });
    setIsSaving(false);

    if (res.success) {
      setHasChanges(false);
      success("Profile Updated", "Your developer profile changes were saved successfully to MongoDB Atlas.");
      await refreshSession();
    } else {
      toastError("Update Failed", res.error || "Could not save profile changes.");
    }
  };

  // Formatted date
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "October 2026";

  const planName = user?.subscription?.plan?.toUpperCase() || (user?.email === "demo@codelynx.ai" ? "PRO" : "FREE");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      <GlobalNavbar
        title="My Developer Profile"
        badge="Account & Identity"
        icon={<UserIcon className="w-4 h-4" />}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Profile Identity Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
            {/* Avatar Preview */}
            <div className="relative group">
              <UserAvatar
                user={{ name: name || user?.name, email: user?.email, avatarUrl }}
                size="xl"
                className="ring-4 ring-slate-100 dark:ring-slate-800"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-white shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {name || user?.name || "Developer"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Active Account
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-3 h-3" />
                  {planName} PLAN
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  {user?.authProvider === "google" ? "Google OAuth 2.0" : "Credentials Authentication"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Member since {memberSince}
                </span>
              </div>
            </div>

            {/* Quick Subscription Link */}
            <Link
              href="/subscription"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <span>Manage Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Ambient Decorative Gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Profile Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your public developer identity and avatar.
                </p>
              </div>

              {hasChanges && (
                <span className="text-[11px] font-semibold text-amber-500 animate-pulse">
                  Unsaved changes
                </span>
              )}
            </div>

            {/* Avatar Selector Section */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Profile Avatar
              </label>

              {/* Avatar Preset Grid */}
              <div className="flex flex-wrap items-center gap-3">
                {AVATAR_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === preset
                        ? "border-cyan-500 ring-2 ring-cyan-500/40 scale-105"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-400 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preset} alt={`Preset ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClearAvatar}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Use Initials
                </button>
              </div>

              {/* Custom Image URL Input */}
              <div className="pt-2">
                <input
                  type="url"
                  placeholder="Or enter a custom HTTPS image URL (e.g. https://.../avatar.jpg)"
                  value={avatarUrl}
                  onChange={(e) => handleChange(setAvatarUrl, e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090b12] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleChange(setName, e.target.value)}
                    placeholder="Alex Lynx"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090b12] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Email Address (Protected / Read-Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-3 h-3" /> Verified & Protected
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-slate-500 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Email address is locked to maintain verified account ownership.
                </p>
              </div>

              {/* Role / Job Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Professional Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleChange(setRole, e.target.value)}
                    placeholder="Senior Software Architect"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090b12] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Company / Organization */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => handleChange(setCompany, e.target.value)}
                    placeholder="CodeLynx Engineering"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090b12] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* GitHub Handle */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  GitHub Profile Handle
                </label>
                <div className="relative">
                  <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={githubHandle}
                    onChange={(e) => handleChange(setGithubHandle, e.target.value)}
                    placeholder="alexlynx"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090b12] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Developer Bio & Summary
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {bio.length} / 500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => handleChange(setBio, e.target.value)}
                  placeholder="Passionate about algorithmic complexity, high-performance C++, and AI developer tooling."
                  className="w-full p-3.5 rounded-xl text-xs bg-slate-50 dark:bg-[#090b12] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? "Saving to Atlas..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Security Quick Link Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0d101a]/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Password & Security Settings
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Manage active cryptographic session tokens and account authentication.
              </p>
            </div>
          </div>

          <Link
            href="/settings#security"
            className="px-4 py-2 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors shrink-0"
          >
            Review Security Settings &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
