"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  FolderGit2,
  Sparkles,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { UserAvatar } from "./UserAvatar";

export const UserAccountMenu: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const plan = user.subscription?.plan?.toUpperCase() || (user.email === "demo@codelynx.ai" ? "PRO" : "FREE");

  const getPlanBadge = (planName: string) => {
    if (planName === "PRO" || planName === "ENTERPRISE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-cyan-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40">
          <Sparkles className="w-2.5 h-2.5" />
          {planName} PLAN
        </span>
      );
    }
    if (planName === "PROFESSIONAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40">
          <Sparkles className="w-2.5 h-2.5" />
          PROFESSIONAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        FREE TIER
      </span>
    );
  };

  const menuItems = [
    {
      label: "My Profile",
      href: "/profile",
      icon: <UserIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />,
      description: "Personal details & developer identity",
    },
    {
      label: "My Projects",
      href: "/projects",
      icon: <FolderGit2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
      description: "Manage sandboxed workspaces & files",
    },
    {
      label: "My Subscription",
      href: "/subscription",
      icon: <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
      description: `Active plan: ${plan}`,
    },
    {
      label: "Account Settings",
      href: "/settings",
      icon: <Settings className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />,
      description: "Editor, AI & compiler preferences",
    },
    {
      label: "Security Settings",
      href: "/settings#security",
      icon: <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
      description: "Session tokens & authentication",
    },
    {
      label: "Help & Support",
      href: "/documentation",
      icon: <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
      description: "Guides, keyboard shortcuts & API",
    },
  ];

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Account Menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-[#0c0f18] hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 group"
      >
        <UserAvatar user={user} size="sm" />
        <span className="hidden sm:inline font-semibold text-xs text-slate-700 dark:text-slate-200 truncate max-w-[110px]">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Account Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#0e111a] border border-slate-200 dark:border-slate-800/90 shadow-2xl z-50 overflow-hidden text-xs">
          {/* User Profile Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-start gap-3">
              <UserAvatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate text-sm">
                  {user.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  {user.email}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {getPlanBadge(plan)}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-1.5 space-y-0.5">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors group"
              >
                <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:scale-105 transition-transform shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs leading-none">{item.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Logout Section */}
          <div className="p-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition-colors"
            >
              <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 shrink-0">
                <LogOut className="w-4 h-4 text-rose-500" />
              </div>
              <span>Sign Out of CodeLynx</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
