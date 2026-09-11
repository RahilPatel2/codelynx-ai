import { CODELYNX_APP_REGISTRY } from "./capabilities";

export interface CopilotContextInput {
  activeFile?: {
    name: string;
    language: string;
    content: string;
  };
  selectedSnippet?: string;
  projectSummary?: {
    id: string;
    name: string;
    fileNames: string[];
  };
  diagnostics?: Array<{
    line: number;
    message: string;
    severity: string;
  }>;
  lastExecution?: {
    status: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    executionTime?: number;
  };
  debugFindings?: Array<{
    id: string;
    title: string;
    explanation: string;
    lineStart?: number;
  }>;
  settings?: {
    theme?: string;
    fontSize?: number;
    fontFamily?: string;
    defaultLanguage?: string;
    aiModel?: string;
    verbosity?: string;
  };
  mode?: "general" | "copilot" | "next_step" | "hints" | "plan";
}

export interface SanitizedContext {
  activeFile?: {
    name: string;
    language: string;
    content: string;
    totalLines: number;
  };
  selectedSnippet?: string;
  projectSummary?: {
    id: string;
    name: string;
    fileNames: string[];
  };
  diagnostics?: Array<{
    line: number;
    message: string;
    severity: string;
  }>;
  lastExecution?: {
    status: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    executionTime?: number;
  };
  debugFindings?: Array<{
    id: string;
    title: string;
    explanation: string;
    lineStart?: number;
  }>;
  settings?: Record<string, any>;
  hasContext: boolean;
}

const SENSITIVE_KEY_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/g,
  /AQ\.[0-9A-Za-z-_]{40,}/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /mongodb(?:\+srv)?:\/\/[^\s"']+/gi,
  /password\s*[:=]\s*["'][^"']+["']/gi,
  /secret\s*[:=]\s*["'][^"']+["']/gi,
];

/**
 * Strips confidential tokens, passwords, and API keys
 */
export function scrubSensitiveData(text: string): string {
  if (!text) return "";
  let scrubbed = text;
  for (const pattern of SENSITIVE_KEY_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, "[REDACTED_SECRET]");
  }
  return scrubbed;
}

/**
 * Prepares and bounds context securely for AI consumption
 */
export function sanitizeContext(input?: CopilotContextInput): SanitizedContext {
  if (!input) {
    return { hasContext: false };
  }

  const result: SanitizedContext = { hasContext: false };

  // 1. Active File Sanitization
  if (input.activeFile && input.activeFile.content) {
    const rawContent = scrubSensitiveData(input.activeFile.content);
    const lines = rawContent.split("\n");
    let safeContent = rawContent;

    // Truncate to maximum 300 lines to avoid excessive token overhead
    if (lines.length > 300) {
      safeContent = lines.slice(0, 300).join("\n") + `\n\n... [Truncated ${lines.length - 300} additional lines]`;
    }

    result.activeFile = {
      name: input.activeFile.name,
      language: input.activeFile.language,
      content: safeContent,
      totalLines: lines.length,
    };
    result.hasContext = true;
  }

  // 2. Selected Snippet
  if (input.selectedSnippet && input.selectedSnippet.trim()) {
    result.selectedSnippet = scrubSensitiveData(input.selectedSnippet.trim().slice(0, 2000));
    result.hasContext = true;
  }

  // 3. Project Summary
  if (input.projectSummary) {
    result.projectSummary = {
      id: input.projectSummary.id,
      name: scrubSensitiveData(input.projectSummary.name),
      fileNames: (input.projectSummary.fileNames || []).slice(0, 25),
    };
    result.hasContext = true;
  }

  // 4. Diagnostics & Compiler Errors
  if (input.diagnostics && input.diagnostics.length > 0) {
    result.diagnostics = input.diagnostics.slice(0, 10).map((d) => ({
      line: d.line,
      message: scrubSensitiveData(d.message),
      severity: d.severity,
    }));
    result.hasContext = true;
  }

  // 5. Last Execution
  if (input.lastExecution) {
    result.lastExecution = {
      status: input.lastExecution.status,
      stdout: scrubSensitiveData((input.lastExecution.stdout || "").slice(0, 1500)),
      stderr: scrubSensitiveData((input.lastExecution.stderr || "").slice(0, 1500)),
      exitCode: input.lastExecution.exitCode,
      executionTime: input.lastExecution.executionTime,
    };
    result.hasContext = true;
  }

  // 6. Debug Findings
  if (input.debugFindings && input.debugFindings.length > 0) {
    result.debugFindings = input.debugFindings.slice(0, 5).map((f) => ({
      id: f.id,
      title: scrubSensitiveData(f.title),
      explanation: scrubSensitiveData(f.explanation),
      lineStart: f.lineStart,
    }));
    result.hasContext = true;
  }

  // 7. Settings
  if (input.settings) {
    result.settings = {
      theme: input.settings.theme,
      fontSize: input.settings.fontSize,
      fontFamily: input.settings.fontFamily,
      defaultLanguage: input.settings.defaultLanguage,
      aiModel: input.settings.aiModel,
      verbosity: input.settings.verbosity,
    };
  }

  return result;
}

/**
 * Builds formatted prompt incorporating context sections only when relevant
 */
export function buildPromptWithContext(
  userMessage: string,
  sanitized: SanitizedContext
): string {
  // If user is asking a general or platform question with no active code
  if (!sanitized.hasContext) {
    return userMessage;
  }

  const sections: string[] = [];

  if (sanitized.activeFile) {
    sections.push(
      `ACTIVE FILE: ${sanitized.activeFile.name} (${sanitized.activeFile.language}, ${sanitized.activeFile.totalLines} lines)\n\`\`\`${sanitized.activeFile.language}\n${sanitized.activeFile.content}\n\`\`\``
    );
  }

  if (sanitized.selectedSnippet) {
    sections.push(
      `USER HIGHLIGHTED SELECTION:\n\`\`\`${sanitized.activeFile?.language || "text"}\n${sanitized.selectedSnippet}\n\`\`\``
    );
  }

  if (sanitized.diagnostics && sanitized.diagnostics.length > 0) {
    const diagList = sanitized.diagnostics
      .map((d) => `- Line ${d.line} [${d.severity.toUpperCase()}]: ${d.message}`)
      .join("\n");
    sections.push(`CURRENT COMPILER DIAGNOSTICS:\n${diagList}`);
  }

  if (sanitized.lastExecution && (sanitized.lastExecution.stderr || sanitized.lastExecution.stdout)) {
    sections.push(
      `LAST EXECUTION (Status: ${sanitized.lastExecution.status}, Exit: ${sanitized.lastExecution.exitCode}):\n` +
        (sanitized.lastExecution.stdout ? `STDOUT:\n${sanitized.lastExecution.stdout}\n` : "") +
        (sanitized.lastExecution.stderr ? `STDERR:\n${sanitized.lastExecution.stderr}\n` : "")
    );
  }

  if (sanitized.debugFindings && sanitized.debugFindings.length > 0) {
    const findings = sanitized.debugFindings
      .map((f) => `- ${f.lineStart ? `Line ${f.lineStart}: ` : ""}${f.title} (${f.explanation})`)
      .join("\n");
    sections.push(`AI DEBUG FINDINGS:\n${findings}`);
  }

  if (sanitized.settings) {
    sections.push(
      `ACTIVE PLATFORM SETTINGS:\nTheme: ${sanitized.settings.theme}, Font: ${sanitized.settings.fontFamily} (${sanitized.settings.fontSize}px), AI Model: ${sanitized.settings.aiModel}, Detail Level: ${sanitized.settings.verbosity}`
    );
  }

  return `${sections.join("\n\n")}\n\nDEVELOPER REQUEST:\n${userMessage}`;
}
