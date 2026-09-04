"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  X,
  Key,
  Database,
  Terminal,
  Shield,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

export type MissingIntegrationType = "ai" | "execution" | "database" | "oauth";

interface IntegrationStatusModalProps {
  isOpen: boolean;
  type: MissingIntegrationType;
  featureName?: string;
  onClose: () => void;
  onRefreshStatus?: () => void;
}

export const IntegrationStatusModal: React.FC<IntegrationStatusModalProps> = ({
  isOpen,
  type,
  featureName,
  onClose,
  onRefreshStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const contentMap = {
    ai: {
      title: "Google AI Integration Not Configured",
      tagline: featureName
        ? `The "${featureName}" feature requires an active AI provider.`
        : "Intelligent code analysis and chat require an active Google Gemini API integration.",
      envSnippet: `GEMINI_API_KEY=your_gemini_api_key_here\nGEMINI_MODEL=gemini-3.5-flash`,
      instructions:
        "1. Obtain a free API key at ai.google.dev.\n2. Add GEMINI_API_KEY to your .env file.\n3. Restart the Next.js server to activate live Gemini intelligence.",
      portalUrl: "https://ai.google.dev/",
      icon: Key,
      iconColor: "text-indigo-400",
      iconBg: "bg-indigo-500/15",
    },
    execution: {
      title: "Execution Service Not Configured",
      tagline:
        "Code execution is not currently available because no execution provider has been configured. Connect a supported sandboxed execution service to compile and run your programs.",
      envSnippet: `JUDGE0_BASE_URL=https://ce.judge0.com\n# Or RapidAPI:\n# JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com\n# JUDGE0_API_KEY=your-rapidapi-key`,
      instructions:
        "1. By default, CodeLynx connects to https://ce.judge0.com.\n2. For private or high-throughput execution, host a local Judge0 container or configure RapidAPI.\n3. Verify internet connectivity to access the sandbox compiler.",
      portalUrl: "https://ce.judge0.com/docs",
      icon: Terminal,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
    },
    database: {
      title: "Database Not Connected",
      tagline:
        "Project saving, custom tags, and execution history persistence require a configured MongoDB connection.",
      envSnippet: `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority\nMONGODB_DB_NAME=codelynx`,
      instructions:
        "1. Create a free cluster on MongoDB Atlas.\n2. Copy the connection string into your .env file.\n3. Ensure your current IP address is whitelisted in Network Access.",
      portalUrl: "https://www.mongodb.com/cloud/atlas",
      icon: Database,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/15",
    },
    oauth: {
      title: "Google Login Not Configured",
      tagline:
        "Google authentication is not configured yet. Configure the OAuth credentials to enable Google sign-in.",
      envSnippet: `GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com\nGOOGLE_OAUTH_CLIENT_SECRET=your-client-secret`,
      instructions:
        "1. Create a project in Google Cloud Console.\n2. Configure an OAuth 2.0 Client ID with authorized redirect URIs.\n3. Add credentials to your .env file.",
      portalUrl: "https://console.cloud.google.com/apis/credentials",
      icon: Shield,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/15",
    },
  };

  const details = contentMap[type];
  const Icon = details.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(details.envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch("/api/system-status");
      const data = await res.json();
      if (type === "ai") {
        setCheckResult(data.ai?.isConfigured ? "Connected successfully!" : "AI key still not detected in environment.");
      } else if (type === "execution") {
        setCheckResult(data.execution?.isJudge0Configured ? "Execution service active!" : "Compiler service unreachable.");
      } else if (type === "database") {
        setCheckResult(data.database?.connected ? "MongoDB Atlas connected!" : "Database not yet connected.");
      }
      onRefreshStatus?.();
    } catch (err: any) {
      setCheckResult(`Check failed: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f121b] border border-slate-700 shadow-2xl overflow-hidden space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${details.iconBg} ${details.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{details.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
                {details.tagline}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Required Environment Configuration Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Environment Variables Required</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy to Clipboard"}</span>
            </button>
          </div>

          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
            {details.envSnippet}
          </pre>
        </div>

        {/* Step-by-step instructions */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-white">Setup Instructions:</div>
          <div className="whitespace-pre-line text-slate-400 leading-relaxed">
            {details.instructions}
          </div>
        </div>

        {/* Status check response */}
        {checkResult && (
          <div
            className={`p-2.5 rounded-lg text-xs font-medium border ${
              checkResult.includes("success") || checkResult.includes("active")
                ? "bg-emerald-950/20 text-emerald-300 border-emerald-500/30"
                : "bg-amber-950/20 text-amber-300 border-amber-500/30"
            }`}
          >
            {checkResult}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <a
            href={details.portalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium"
          >
            <span>Open Provider Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-cyan-400" : ""}`} />
              <span>Verify Status</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              Continue in Local Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
