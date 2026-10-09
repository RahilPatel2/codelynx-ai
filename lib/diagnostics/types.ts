export type DiagnosticSeverity = "error" | "warning" | "info";

export type DiagnosticCategory =
  | "compilation"
  | "syntax"
  | "type"
  | "runtime"
  | "logical"
  | "security"
  | "performance"
  | "memory"
  | "code_quality";

export type DiagnosticSourceProvider =
  | "compiler"
  | "parser"
  | "type-checker"
  | "static-analyzer"
  | "ai";

export interface Diagnostic {
  id: string;
  filePath?: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  message: string;
  sourceProvider: DiagnosticSourceProvider;
  documentation?: string;
  suggestedFix?: string;
  rawText?: string;
}

export interface DiagnosticsSummary {
  status:
    | "clean"
    | "errors_found"
    | "warnings_only"
    | "incomplete"
    | "compiler_unavailable"
    | "ai_unavailable";
  title: string;
  description: string;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  checksExecuted: {
    compiler: boolean;
    compilerAvailable: boolean;
    parser: boolean;
    ai: boolean;
    aiAvailable: boolean;
  };
}

export interface DiagnosticsSnapshot {
  sourceVersion: number;
  contentHash: string;
  diagnostics: Diagnostic[];
  summary: DiagnosticsSummary;
  timestamp: number;
}
