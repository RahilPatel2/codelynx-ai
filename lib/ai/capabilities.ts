export interface AppFeature {
  id: string;
  name: string;
  route: string;
  description: string;
  instructions: string[];
}

export const CODELYNX_APP_REGISTRY = {
  platformName: "CODELYNX AI",
  version: "2.0.0",
  description:
    "Production-grade AI-powered developer platform combining Monaco Editor, multi-language sandbox compiler, interactive debugging, Big-O complexity analysis, verified optimization, and context-aware copilot.",

  routes: [
    {
      path: "/",
      name: "Landing Page",
      description: "Platform introduction, hero section, capabilities overview, and access points.",
    },
    {
      path: "/dashboard",
      name: "Developer Dashboard",
      description: "Central engineer dashboard with active project stats, telemetry summary, and quick launch actions.",
    },
    {
      path: "/workspace",
      name: "IDE & Coding Workspace",
      description:
        "Full-screen developer workspace with Monaco Editor, Judge0 execution sandbox, Output Terminal with Stdin tab, AI Debugger, Complexity Lab, Code Optimizer, Test Runner, and AI Copilot drawer.",
    },
    {
      path: "/assistant",
      name: "Dedicated AI Copilot",
      description:
        "Full-page dedicated AI pair programming environment with Next-Step Guide, Progressive Hint Lab, Architecture Advisor, and Coding Plan tracker.",
    },
    {
      path: "/problems",
      name: "Solve Problems & DSA Practice School",
      description:
        "Comprehensive competitive programming platform with 600+ curated problems, Easy/Medium/Hard categorization, 51 taxonomy topics, live judging against hidden tests, 3-level progressive hints, and Gemini Socratic AI Tutor.",
    },
    {
      path: "/projects",
      name: "Project Workspaces",
      description: "Manage, create, search, and delete multi-file coding projects.",
    },
    {
      path: "/history",
      name: "Execution Telemetry History",
      description: "Detailed historical logs of all code executions including runtimes, memory usage, exit codes, and stdout/stderr.",
    },
    {
      path: "/settings",
      name: "Platform Settings",
      description: "Persistent workspace configuration: Monaco themes, typography, font size, default language, AI models, detail level, and custom keyboard shortcuts.",
    },
    {
      path: "/documentation",
      name: "Developer Documentation",
      description: "System architecture, API specifications, and developer guides with direct Back and Dashboard navigation.",
    },
    {
      path: "/login",
      name: "Authentication",
      description: "User sign-in with session cookie persistence.",
    },
    {
      path: "/register",
      name: "Registration",
      description: "New account creation with password hashing.",
    },
  ],

  settings: {
    themes: ["codelynx-dark", "vs-dark", "vs-light", "monokai", "nord", "github-dark"],
    fontFamilies: ["JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro", "Courier New"],
    fontSizeRange: { min: 11, max: 28, default: 14 },
    aiModels: [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
    ],
    detailLevels: [
      { id: "concise", description: "Bullet points and direct code diffs only, no filler prose." },
      { id: "balanced", description: "Balanced engineering explanations with clear rationale (recommended)." },
      { id: "detailed", description: "Deep algorithmic derivations, mathematical analysis, and memory mechanics." },
      { id: "step-by-step", description: "Numbered chronological walkthrough from diagnosis to implementation." },
    ],
    defaultLanguages: ["python", "cpp", "java", "javascript", "typescript", "c", "csharp", "rust", "go", "php"],
    keyboardShortcuts: [
      { action: "runCode", default: "Ctrl+Enter", description: "Primary shortcut to compile and run code" },
      { action: "runCodeAlt", default: "Ctrl+F9", description: "Alternate shortcut to run code" },
      { action: "saveProject", default: "Ctrl+S", description: "Save active project state" },
      { action: "findMistakes", default: "Ctrl+Shift+D", description: "Trigger AI debugging & error markers" },
      { action: "analyzeComplexity", default: "Ctrl+Shift+C", description: "Evaluate Big-O time and space" },
      { action: "optimizeCode", default: "Ctrl+Shift+O", description: "Open Code Optimizer" },
      { action: "commandPalette", default: "Ctrl+K", description: "Open fuzzy command palette" },
    ],
  },

  frequentlyAskedQuestions: [
    {
      question: "How do I change the default programming language?",
      answer:
        "Go to Settings (/settings). Under 'Appearance & Editor Preferences', choose your desired language from the 'Default Workspace Language' dropdown, and click 'Save Preferences'. New workspaces and untitled sessions will automatically start in that language.",
    },
    {
      question: "Why is the editor font size not changing?",
      answer:
        "Make sure to adjust the Font Size slider or input (11px-28px) in /settings and click 'Save Preferences'. The Monaco Editor in /workspace dynamically binds font-size without requiring a page refresh. If in /workspace, check that your browser zoom is at 100%.",
    },
    {
      question: "How do I configure custom keyboard shortcuts?",
      answer:
        "Open /settings and scroll to 'Custom Keyboard Shortcuts'. Click the button next to any action (e.g. 'Press Keys...'), press your desired combination (e.g. Ctrl+Shift+R or Ctrl+F9), and click 'Save Preferences'. The system detects conflicts automatically if another action uses the same keys.",
    },
    {
      question: "Why does the compiler request standard input (stdin)?",
      answer:
        "When your code contains interactive input calls (such as C++ `cin >>`, Python `input()`, or Java `new Scanner(System.in)`), Judge0 runs in a batch container. If stdin is left blank, the process would hang or fail with `EOFError`. CodeLynx AI automatically detects stdin calls and pops up an input modal with quick presets (e.g., '5 7', array sizes) or you can enter text into the 'Input (stdin)' tab in the terminal before running.",
    },
    {
      question: "Which AI model is currently selected?",
      answer:
        "The active model is configured in /settings under 'Gemini Intelligence Model'. Default is 'gemini-3.5-flash'. CodeLynx AI also features resilient automatic quota failover across Gemini 3.5, 3.5-lite, 3.6, and 3.8.",
    },
    {
      question: "Why did an AI request fail?",
      answer:
        "AI requests require GEMINI_API_KEY in the server environment (.env.local). If the key is missing or quota is exhausted, CodeLynx AI falls back safely to deterministic AST and heuristic analyzers rather than crashing or faking data.",
    },
    {
      question: "How do I save a project?",
      answer:
        "Press Ctrl+S in the workspace or click the 'Save' button in the toolbar. Authenticated users have their workspaces synced to MongoDB Atlas or local storage. You can manage saved projects at /projects.",
    },
    {
      question: "How do I use Find Mistakes?",
      answer:
        "Click the 'Find Mistakes' button in the toolbar or press Ctrl+Shift+D. The AI Debugger analyzes syntax, logical edge cases, and runtime exceptions, placing red and yellow squiggly markers directly onto offending lines in Monaco Editor.",
    },
    {
      question: "Why is a proposed optimization not being applied?",
      answer:
        "CodeLynx AI enforces safe diff verification: if you modified the editor source after the optimization snapshot was taken (conflict), or if the candidate code provides no asymptotic improvement, the engine prevents accidental regressions. Approve the diff explicitly in the Diff Viewer to apply.",
    },
    {
      question: "How do I change the editor syntax theme?",
      answer:
        "Navigate to /settings -> 'Syntax Theme'. Choose from 'CodeLynx Dark', 'Nord', 'Monokai', 'GitHub Dark', 'VS Dark', or 'VS Light'. Click 'Save Preferences' to persist.",
    },
  ],
  get faqs() {
    return this.frequentlyAskedQuestions;
  },
};

/**
 * Builds the authoritative system prompt for CodeLynx Copilot
 */
export function buildCopilotSystemInstruction(detailLevel: string = "balanced"): string {
  let styleGuide = "Provide clear, balanced, and technically accurate responses with code examples.";
  if (detailLevel === "concise") {
    styleGuide = "Be extremely concise. Use short bullet points and direct code diffs only, avoiding filler commentary.";
  } else if (detailLevel === "detailed") {
    styleGuide = "Provide comprehensive in-depth algorithmic derivations, edge cases, underlying memory layout, and full explanations.";
  } else if (detailLevel === "step-by-step") {
    styleGuide = "Break down your recommendations into numbered chronological steps (Step 1, Step 2...) guiding the developer.";
  }

  return `You are CodeLynx AI Copilot, an elite pair programmer, algorithms expert, compiler engineer, and product specialist for the CODELYNX AI platform.

CORE PRINCIPLES:
1. You are purpose-built for CODELYNX AI. You understand the editor, active file, compiler diagnostics, standard input requirements, test cases, and application settings.
2. When answering questions about CODELYNX AI features or settings (such as themes, keyboard shortcuts, font size, stdin, languages, or routes), provide exact paths, actual settings options, and verified instructions based on the platform registry. Never invent non-existent features or menus.
3. For coding assistance, write high-quality, idiomatic, and syntactically correct code matching the active language.
4. When helping users debug, examine compiler diagnostics and stderr carefully. Distinguish syntax errors from runtime logic bugs.
5. In the "What should I do next?" workflow, guide the user chronologically: fix compiler errors first, test boundary cases next, optimize only after correctness is proven.
6. When giving hints, prefer progressive nudges over immediately dumping full answers, unless the user asks for the complete solution.
7. Style Instruction: ${styleGuide}
8. Never reveal private environment variables, secrets, or internal database connection strings.`;
}
