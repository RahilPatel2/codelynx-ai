"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  size = "md",
  showLabel = false,
}) => {
  const { theme, toggleTheme, isMounted } = useTheme();

  const isLight = isMounted ? theme === "light" : false;

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  const buttonPaddings = {
    sm: "p-1.5 text-xs",
    md: "p-2 text-xs",
    lg: "p-2.5 text-sm",
  }[size];

  const currentLabel = isLight ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={currentLabel}
      title={currentLabel}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 
        text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white
        bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800
        border border-slate-200 dark:border-slate-800
        focus:outline-none focus:ring-2 focus:ring-cyan-500/50
        active:scale-95 ${buttonPaddings} ${className}`}
    >
      {isLight ? (
        <Moon className={`${iconSizes} text-indigo-600 dark:text-indigo-400 transition-transform duration-200 rotate-0 hover:-rotate-12`} />
      ) : (
        <Sun className={`${iconSizes} text-amber-500 dark:text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45`} />
      )}

      {showLabel && (
        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
          {isLight ? "Dark Mode" : "Light Mode"}
        </span>
      )}
    </button>
  );
};
