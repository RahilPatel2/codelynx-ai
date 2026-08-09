"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";

interface LynxLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
  asLink?: boolean;
}

export const LynxLogo: React.FC<LynxLogoProps> = ({
  className = "",
  iconOnly = false,
  size = "md",
  href,
  asLink = true,
}) => {
  const { user } = useAuth();

  const iconDimensions = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }[size];

  const textDimensions = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  }[size];

  // Dynamic destination: if not explicitly supplied, route authenticated users to /dashboard
  const targetHref = href !== undefined ? href : user ? "/dashboard" : "/";

  const content = (
    <>
      <div className={`relative flex items-center justify-center ${iconDimensions}`}>
        {/* Abstract Lynx + Neural Code Bracket Symbol */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]"
        >
          <defs>
            <linearGradient id="lynxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="lynxAccent" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Left Bracket / Lynx Ear Outline */}
          <path
            d="M 14 6 L 8 16 L 8 24 L 14 34"
            stroke="url(#lynxGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Bracket / Lynx Ear Outline */}
          <path
            d="M 26 6 L 32 16 L 32 24 L 26 34"
            stroke="url(#lynxGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Geometric Lynx Forehead & Neural Center */}
          <path
            d="M 14 14 L 20 22 L 26 14"
            stroke="url(#lynxAccent)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Lynx Muzzle & Code Vertex */}
          <path
            d="M 16 28 L 20 25 L 24 28"
            stroke="#00E5FF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Neural Synapse Nodes */}
          <circle cx="20" cy="22" r="2.2" fill="#00E5FF" />
          <circle cx="8" cy="20" r="1.6" fill="#818CF8" />
          <circle cx="32" cy="20" r="1.6" fill="#818CF8" />
        </svg>
      </div>

      {!iconOnly && (
        <span className={`font-extrabold tracking-wider ${textDimensions}`}>
          <span className="text-white">CODELYNX</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 ml-1">
            AI
          </span>
        </span>
      )}
    </>
  );

  if (!asLink) {
    return (
      <div
        className={`inline-flex items-center gap-2.5 font-bold tracking-tight text-white select-none ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={targetHref}
      className={`inline-flex items-center gap-2.5 font-bold tracking-tight text-white transition-opacity hover:opacity-95 ${className}`}
    >
      {content}
    </Link>
  );
};
