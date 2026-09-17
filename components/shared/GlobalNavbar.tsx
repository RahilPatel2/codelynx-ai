"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Terminal,
  Code2,
  Bot,
  BookOpen,
  Sparkles,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  FolderGit2,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { LynxLogo } from "./LynxLogo";
import { useAuth } from "./AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { UserAccountMenu } from "./UserAccountMenu";
import { UserAvatar } from "./UserAvatar";

interface GlobalNavbarProps {
  title?: string;
  badge?: string;
  icon?: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({
  title,
  badge,
  icon,
  showBack = false,
  backHref,
  children,
  className = "",
}) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  const navLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      active: pathname === "/dashboard",
    },
    {
      label: "Workspace",
      href: "/workspace",
      icon: <Terminal className="w-3.5 h-3.5" />,
      active: pathname === "/workspace",
    },
    {
      label: "DSA School",
      href: "/problems",
      icon: <Code2 className="w-3.5 h-3.5" />,
      active: pathname.startsWith("/problems"),
    },
    {
      label: "AI Assistant",
      href: "/assistant",
      icon: <Bot className="w-3.5 h-3.5" />,
      active: pathname === "/assistant",
    },
    {
      label: "Documentation",
      href: "/documentation",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      active: pathname === "/documentation",
    },
    {
      label: "Plans",
      href: "/pricing",
      icon: <Sparkles className="w-3.5 h-3.5" />,
      active: pathname === "/pricing" || pathname === "/subscription",
    },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0c0e15]/90 backdrop-blur-md text-xs select-none transition-colors duration-150 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* LEFT SECTION: Brand Logo & Optional Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <LynxLogo size="sm" href={user ? "/dashboard" : "/"} className="shrink-0" />

          {/* Optional Back Button */}
          {showBack && (
            <button
              onClick={handleBack}
              title="Go back"
              aria-label="Go back"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>
          )}

          {/* Optional Subpage Breadcrumb */}
          {title && (
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 truncate">
                {icon && <div className="shrink-0 text-cyan-500 dark:text-cyan-400">{icon}</div>}
                <span className="font-bold text-slate-900 dark:text-white truncate">{title}</span>
                {badge && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    {badge}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CENTER SECTION: Main Navigation Links (Desktop & Tablet) */}
        <nav
          aria-label="Global navigation"
          className="hidden lg:flex items-center gap-1 font-medium text-xs text-slate-600 dark:text-slate-400"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-150 ${
                link.active
                  ? "bg-slate-100 dark:bg-slate-800/80 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm"
                  : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
              }`}
            >
              <span className={link.active ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* RIGHT SECTION: Action Buttons, Theme Toggle, Notifications & Account */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Page-Specific Actions (if provided) */}
          {children && <div className="hidden sm:flex items-center gap-2 mr-1">{children}</div>}

          {/* Universal Theme Toggle */}
          <ThemeToggle size="sm" />

          {/* Notifications Bell */}
          <NotificationBell />

          {/* Authenticated User Menu or Unauthenticated CTAs */}
          {user ? (
            <UserAccountMenu />
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-xl font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/workspace"
                className="px-3.5 py-1.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c0f18] px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* User Card if Authenticated */}
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <UserAvatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate text-xs">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </div>
                <div className="mt-1">
                  <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    {user.subscription?.plan?.toUpperCase() || (user.email === "demo@codelynx.ai" ? "PRO" : "FREE")} PLAN
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Link
                href="/login"
                className="py-2 text-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
              >
                Log In
              </Link>
              <Link
                href="/workspace"
                className="py-2 text-center rounded-xl bg-indigo-600 text-white font-bold"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Primary Nav Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-1">
              Main Navigation
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  link.active
                    ? "bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className={link.active ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Authenticated Account Shortcuts */}
          {user && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-1">
                Account & Preferences
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <UserIcon className="w-3.5 h-3.5 text-cyan-500" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/projects"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>My Projects</span>
              </Link>
              <Link
                href="/subscription"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>My Subscription</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-500" />
                <span>Account Settings</span>
              </Link>
              <Link
                href="/settings#security"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>Security Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors mt-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Children / Extra Actions on Mobile */}
          {children && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
