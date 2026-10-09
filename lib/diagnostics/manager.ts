import {
  Diagnostic,
  DiagnosticsSummary,
  DiagnosticsSnapshot,
  DiagnosticSeverity,
} from "./types";
import { compilerDiagnosticParser } from "./compiler-parser";
import { SandboxFallbackProvider } from "../execution/sandbox-fallback";

export interface DiagnosticsSourceContext {
  sourceCode: string;
  language: string;
  filePath?: string;
  sourceVersion: number;
  contentHash: string;
  compilerOutput?: {
    status: string;
    compileOutput?: string;
    stderr?: string;
    exitCode?: number;
  };
  aiFindings?: any[];
  compilerAvailable?: boolean;
  aiAvailable?: boolean;
}

export class DiagnosticsManager {
  private syntaxChecker = new SandboxFallbackProvider();

  /**
   * Produce a unified diagnostic snapshot for a given source revision.
   */
  public generateSnapshot(ctx: DiagnosticsSourceContext): DiagnosticsSnapshot {
    const diagnostics: Diagnostic[] = [];
    const seenKeys = new Set<string>();

    const checksExecuted = {
      compiler: false,
      compilerAvailable: ctx.compilerAvailable ?? true,
      parser: false,
      ai: false,
      aiAvailable: ctx.aiAvailable ?? false,
    };

    // 1. Process Real Compiler Diagnostics if compilerOutput is present
    if (ctx.compilerOutput) {
      checksExecuted.compiler = true;
      const rawText = `${ctx.compilerOutput.compileOutput || ""}\n${ctx.compilerOutput.stderr || ""}`.trim();
      if (rawText.length > 0) {
        const compilerDiags = compilerDiagnosticParser.parse(
          rawText,
          ctx.language,
          ctx.filePath || "main"
        );

        for (const cd of compilerDiags) {
          const key = `${cd.line}:${cd.column}:${cd.message}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            diagnostics.push(cd);
          }
        }
      }
    }

    // 2. Parser / Static Syntax Check
    checksExecuted.parser = true;
    const syntaxErr = this.syntaxChecker.checkBasicSyntax(
      ctx.sourceCode,
      ctx.language
    );
    if (syntaxErr) {
      // Extract line number from syntax error string if possible
      const lineMatch = syntaxErr.match(/line\s+(\d+)/i);
      const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      const key = `${lineNum}:1:${syntaxErr}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        diagnostics.push({
          id: `diag_syntax_${lineNum}_${diagnostics.length}`,
          filePath: ctx.filePath,
          line: lineNum,
          column: 1,
          severity: "error",
          category: "syntax",
          message: syntaxErr,
          sourceProvider: "parser",
          rawText: syntaxErr,
        });
      }
    }

    // 3. Static Code Defect & Bracket / Scope Checks
    this.appendStaticAnalysisChecks(ctx.sourceCode, ctx.language, ctx.filePath, diagnostics, seenKeys);

    // 4. Merge AI Findings if available
    if (ctx.aiFindings && ctx.aiFindings.length > 0) {
      checksExecuted.ai = true;
      for (const finding of ctx.aiFindings) {
        // Skip generic "clean structure" placeholder info findings
        if (finding.id === "info_clean_structure") continue;

        const line = finding.lineStart || 1;
        const col = 1;
        const key = `${line}:${col}:${finding.title}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const sev: DiagnosticSeverity =
            finding.severity === "critical" || finding.severity === "high"
              ? "error"
              : finding.severity === "medium"
              ? "warning"
              : "info";

          diagnostics.push({
            id: finding.id || `diag_ai_${diagnostics.length}`,
            filePath: ctx.filePath,
            line,
            column: col,
            endLine: finding.lineEnd,
            severity: sev,
            category: finding.category || "logical",
            message: `${finding.title}: ${finding.explanation}`,
            sourceProvider: "ai",
            suggestedFix: finding.suggestedCorrection,
          });
        }
      }
    }

    // 5. Build Honest Diagnostic Summary
    const errorCount = diagnostics.filter((d) => d.severity === "error").length;
    const warningCount = diagnostics.filter((d) => d.severity === "warning").length;
    const infoCount = diagnostics.filter((d) => d.severity === "info").length;

    let summaryStatus: DiagnosticsSummary["status"] = "clean";
    let title = "Clean Code Verification";
    let description = "No issues detected by the checks that actually ran.";

    if (errorCount > 0) {
      summaryStatus = "errors_found";
      title = `${errorCount} Error${errorCount > 1 ? "s" : ""} Identified`;
      description = `The code contains ${errorCount} blocking compilation/syntax error${errorCount > 1 ? "s" : ""}.`;
    } else if (warningCount > 0) {
      summaryStatus = "warnings_only";
      title = `${warningCount} Warning${warningCount > 1 ? "s" : ""} Identified`;
      description = "Syntax and compilation passed with non-blocking static warnings.";
    } else if (!checksExecuted.compilerAvailable) {
      summaryStatus = "compiler_unavailable";
      title = "Compiler Unavailable";
      description = "Real compiler checks could not run because the execution sandbox is unreachable.";
    } else if (!checksExecuted.aiAvailable && !checksExecuted.compiler) {
      summaryStatus = "incomplete";
      title = "Basic Syntax Verified";
      description = "Only structural syntax checks ran. Deep compiler and AI review are not currently active.";
    }

    const summary: DiagnosticsSummary = {
      status: summaryStatus,
      title,
      description,
      errorCount,
      warningCount,
      infoCount,
      checksExecuted,
    };

    return {
      sourceVersion: ctx.sourceVersion,
      contentHash: ctx.contentHash,
      diagnostics,
      summary,
      timestamp: Date.now(),
    };
  }

  /**
   * Deterministic static code inspection for common defects
   */
  private appendStaticAnalysisChecks(
    code: string,
    language: string,
    filePath: string | undefined,
    diagnostics: Diagnostic[],
    seenKeys: Set<string>
  ) {
    const lines = code.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 1. Python off-by-one in range(len(arr) + 1)
      if (language === "python" && line.includes("range(len(") && line.includes("+ 1")) {
        const key = `${lineNum}:1:python_off_by_one`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          diagnostics.push({
            id: `diag_static_py_off_by_one_${lineNum}`,
            filePath,
            line: lineNum,
            column: 1,
            severity: "error",
            category: "runtime",
            message: "Off-by-One Error: range(len(arr) + 1) will trigger IndexError when indexing arr.",
            sourceProvider: "static-analyzer",
            suggestedFix: "Use range(len(arr)) or iterate over elements directly with 'for item in arr:'.",
          });
        }
      }

      // 2. C/C++/Java off-by-one: <= size() or <= length
      if (
        (language === "cpp" || language === "c" || language === "java") &&
        (/<=\s*\w+\.size\(\)/.test(line) || /<=\s*\w+\.length/.test(line))
      ) {
        const key = `${lineNum}:1:cpp_off_by_one`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          diagnostics.push({
            id: `diag_static_cpp_off_by_one_${lineNum}`,
            filePath,
            line: lineNum,
            column: 1,
            severity: "error",
            category: "runtime",
            message: "Array Index Out of Bounds: loop condition uses '<=' with container size. Arrays are 0-indexed.",
            sourceProvider: "static-analyzer",
            suggestedFix: "Change '<= size' to '< size'.",
          });
        }
      }

      // 3. C memory leak check
      if (language === "c" && line.includes("malloc(") && !code.includes("free(")) {
        const key = `${lineNum}:1:c_malloc_leak`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          diagnostics.push({
            id: `diag_static_c_leak_${lineNum}`,
            filePath,
            line: lineNum,
            column: 1,
            severity: "warning",
            category: "memory",
            message: "Memory Leak: dynamically allocated buffer via malloc() is never freed.",
            sourceProvider: "static-analyzer",
            suggestedFix: "Ensure free() is called when the allocated buffer is no longer needed.",
          });
        }
      }
    }
  }
}

export const diagnosticsManager = new DiagnosticsManager();
