"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Sparkles, Terminal, Database, Code2 } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "system" | "compiler" | "ai" | "dsa";
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    title: "AI Copilot Ready",
    description: "Google Gemini 3.5 Flash copilot engine is online and connected.",
    time: "Just now",
    read: false,
    type: "ai",
  },
  {
    id: "notif_2",
    title: "DSA Practice School Live",
    description: "Explore 621 curated data structures & algorithm challenges.",
    time: "2 hours ago",
    read: false,
    type: "dsa",
  },
  {
    id: "notif_3",
    title: "Sandbox Compiler Online",
    description: "Isolated container execution available for 10 programming languages.",
    time: "Today",
    read: true,
    type: "compiler",
  },
  {
    id: "notif_4",
    title: "Database Cluster Connected",
    description: "Production MongoDB Atlas persistence active.",
    time: "Today",
    read: true,
    type: "system",
  },
];

export const NotificationBell: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "ai":
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case "dsa":
        return <Code2 className="w-3.5 h-3.5 text-amber-400" />;
      case "compiler":
        return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Database className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Notifications"
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0d101a] border border-slate-200 dark:border-slate-800/90 shadow-2xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 flex items-start gap-3 transition-colors ${
                  item.read
                    ? "bg-transparent opacity-75 hover:opacity-100"
                    : "bg-cyan-500/5 dark:bg-cyan-950/20 hover:bg-cyan-500/10"
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-center">
            <span className="text-[10px] text-slate-400">All system services operational</span>
          </div>
        </div>
      )}
    </div>
  );
};
