import { Diagnostic, DiagnosticSeverity, DiagnosticCategory } from "./types";

export class CompilerDiagnosticParser {
  /**
   * Parse compiler output, stderr, or build messages into structured Diagnostics.
   */
  public parse(
    rawOutput: string,
    language: string,
    filePath?: string
  ): Diagnostic[] {
    if (!rawOutput || rawOutput.trim().length === 0) {
      return [];
    }

    const diagnostics: Diagnostic[] = [];
    const cleanOutput = rawOutput
      .replace(/\r\n/g, "\n")
      // Normalize unicode quotes from GCC/Clang
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

    const lines = cleanOutput.split("\n");

    // 1. GCC / Clang / C / C++ Pattern:
    // e.g. main.cpp:9:1: error: expected declaration before '}' token
    // e.g. main.cpp:9: error: ...
    const gccRegex = /^\s*(?:(?:\w+:)?[\/\\]?[^\s:]+):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note):\s*(.+)$/i;

    // 2. Python Traceback & SyntaxError Pattern:
    // e.g. File "main.py", line 4, in <module>
    // e.g. SyntaxError: invalid syntax
    const pythonFileLineRegex = /^\s*File\s+["']?([^"',\n]+)["']?,\s*line\s+(\d+)(?:,\s*in\s+(.+))?/i;

    // 3. Java Pattern:
    // e.g. Main.java:5: error: cannot find symbol
    const javaRegex = /^\s*(?:[^\s:]+):(\d+):\s*(error|warning):\s*(.+)$/i;

    // 4. Rust Pattern:
    // e.g. error[E0425]: cannot find value ...
    //   --> src/main.rs:5:10
    const rustArrowRegex = /^\s*-->\s*(?:[^\s:]+):(\d+):(\d+)/i;

    // 5. C# Pattern:
    // e.g. Program.cs(5,13): error CS0103: The name 'x' does not exist
    const csharpRegex = /^\s*(?:[^\s(]+)\((\d+),(\d+)\):\s*(error|warning)\s*([A-Z0-9]+)?:\s*(.+)$/i;

    // 6. Go Pattern:
    // e.g. ./main.go:5:2: undefined: foo
    const goRegex = /^\s*(?:(?:\.\/)?[^\s:]+):(\d+):(\d+):\s*(.+)$/i;

    // 7. TypeScript Pattern:
    // e.g. main.ts:5:7 - error TS2304: Cannot find name 'foo'.
    const tsRegex = /^\s*(?:[^\s:]+):(\d+):(\d+)\s*-\s*(error|warning)\s*([A-Za-z0-9]+)?:\s*(.+)$/i;

    let pendingPythonLine: number | null = null;
    let pendingRustMessage: string | null = null;
    let pendingRustSeverity: DiagnosticSeverity = "error";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // SyntaxError check (e.g. SyntaxError: Unexpected closing bracket '}' at line 9)
      const syntaxMatch = line.match(/^\s*SyntaxError:\s*(.+?)(?:\s+at\s+line\s+(\d+))?$/i);
      if (syntaxMatch) {
        const lineNum = syntaxMatch[2] ? parseInt(syntaxMatch[2], 10) : (pendingPythonLine ?? 1);
        pendingPythonLine = null;
        diagnostics.push({
          id: `diag_syntax_${lineNum}_${diagnostics.length}`,
          filePath,
          line: lineNum,
          column: 1,
          severity: "error",
          category: "syntax",
          message: line.trim(),
          sourceProvider: "compiler",
          rawText: line,
        });
        continue;
      }

      // GCC / Clang check
      const gccMatch = line.match(gccRegex);
      if (gccMatch) {
        const lineNum = parseInt(gccMatch[1], 10);
        const colNum = gccMatch[2] ? parseInt(gccMatch[2], 10) : 1;
        const rawSev = gccMatch[3].toLowerCase();
        const msg = gccMatch[4].trim();

        const severity: DiagnosticSeverity =
          rawSev.includes("error")
            ? "error"
            : rawSev.includes("warning")
            ? "warning"
            : "info";

        diagnostics.push({
          id: `diag_gcc_${lineNum}_${colNum}_${diagnostics.length}`,
          filePath,
          line: lineNum,
          column: colNum,
          severity,
          category: severity === "error" ? "compilation" : "syntax",
          message: msg,
          sourceProvider: "compiler",
          rawText: line,
        });
        continue;
      }

      // Python traceback / syntax error tracking
      const pyFileMatch = line.match(pythonFileLineRegex);
      if (pyFileMatch) {
        pendingPythonLine = parseInt(pyFileMatch[2], 10);
        continue;
      }

      if (pendingPythonLine !== null) {
        const pyErrorMatch = line.match(/^([A-Za-z0-9_]+Error|[A-Za-z0-9_]+Exception):\s*(.+)$/);
        if (pyErrorMatch) {
          const errType = pyErrorMatch[1];
          const errDetail = pyErrorMatch[2];
          diagnostics.push({
            id: `diag_py_${pendingPythonLine}_${diagnostics.length}`,
            filePath,
            line: pendingPythonLine,
            column: 1,
            severity: "error",
            category: errType === "SyntaxError" || errType === "IndentationError" ? "syntax" : "runtime",
            message: `${errType}: ${errDetail}`,
            sourceProvider: "compiler",
            rawText: line,
          });
          pendingPythonLine = null;
          continue;
        }
      }

      // Java check
      const javaMatch = line.match(javaRegex);
      if (javaMatch) {
        const lineNum = parseInt(javaMatch[1], 10);
        const rawSev = javaMatch[2].toLowerCase();
        const msg = javaMatch[3].trim();
        diagnostics.push({
          id: `diag_java_${lineNum}_${diagnostics.length}`,
          filePath,
          line: lineNum,
          column: 1,
          severity: rawSev === "error" ? "error" : "warning",
          category: "compilation",
          message: msg,
          sourceProvider: "compiler",
          rawText: line,
        });
        continue;
      }

      // Rust error header
      if (line.startsWith("error[") || line.startsWith("error:") || line.startsWith("warning[")) {
        pendingRustMessage = line.trim();
        pendingRustSeverity = line.startsWith("warning") ? "warning" : "error";
        continue;
      }

      if (pendingRustMessage) {
        const rustArrowMatch = line.match(rustArrowRegex);
        if (rustArrowMatch) {
          const lineNum = parseInt(rustArrowMatch[1], 10);
          const colNum = parseInt(rustArrowMatch[2], 10);
          diagnostics.push({
            id: `diag_rust_${lineNum}_${colNum}_${diagnostics.length}`,
            filePath,
            line: lineNum,
            column: colNum,
            severity: pendingRustSeverity,
            category: "compilation",
            message: pendingRustMessage,
            sourceProvider: "compiler",
            rawText: pendingRustMessage,
          });
          pendingRustMessage = null;
          continue;
        }
      }

      // C# check
      const csMatch = line.match(csharpRegex);
      if (csMatch) {
        const lineNum = parseInt(csMatch[1], 10);
        const colNum = parseInt(csMatch[2], 10);
        const rawSev = csMatch[3].toLowerCase();
        const code = csMatch[4] ? ` (${csMatch[4]})` : "";
        const msg = `${csMatch[5].trim()}${code}`;
        diagnostics.push({
          id: `diag_cs_${lineNum}_${colNum}_${diagnostics.length}`,
          filePath,
          line: lineNum,
          column: colNum,
          severity: rawSev === "error" ? "error" : "warning",
          category: "compilation",
          message: msg,
          sourceProvider: "compiler",
          rawText: line,
        });
        continue;
      }

      // Go check
      const goMatch = line.match(goRegex);
      if (goMatch) {
        const lineNum = parseInt(goMatch[1], 10);
        const colNum = parseInt(goMatch[2], 10);
        const msg = goMatch[3].trim();
        diagnostics.push({
          id: `diag_go_${lineNum}_${colNum}_${diagnostics.length}`,
          filePath,
          line: lineNum,
          column: colNum,
          severity: "error",
          category: "compilation",
          message: msg,
          sourceProvider: "compiler",
          rawText: line,
        });
        continue;
      }

      // TypeScript check
      const tsMatch = line.match(tsRegex);
      if (tsMatch) {
        const lineNum = parseInt(tsMatch[1], 10);
        const colNum = parseInt(tsMatch[2], 10);
        const rawSev = tsMatch[3].toLowerCase();
        const code = tsMatch[4] ? ` (${tsMatch[4]})` : "";
        const msg = `${tsMatch[5].trim()}${code}`;
        diagnostics.push({
          id: `diag_ts_${lineNum}_${colNum}_${diagnostics.length}`,
          filePath,
          line: lineNum,
          column: colNum,
          severity: rawSev === "error" ? "error" : "warning",
          category: "compilation",
          message: msg,
          sourceProvider: "compiler",
          rawText: line,
        });
        continue;
      }
    }

    // Fallback: If no structured line matched but output contains error keywords,
    // generate a general file-level diagnostic so errors are never lost
    if (diagnostics.length === 0) {
      const trimmed = cleanOutput.trim();
      const isError =
        trimmed.toLowerCase().includes("error") ||
        trimmed.toLowerCase().includes("failed") ||
        trimmed.toLowerCase().includes("exception");

      if (isError) {
        const lineMatch = cleanOutput.match(/(?:at\s+line|line)\s+(\d+)/i);
        const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : 1;
        const firstLine = lines.find((l) => l.trim().length > 0) || "Compilation failed";
        diagnostics.push({
          id: `diag_fallback_1`,
          filePath,
          line: lineNum,
          column: 1,
          severity: "error",
          category: "compilation",
          message: firstLine.slice(0, 150),
          sourceProvider: "compiler",
          rawText: cleanOutput,
        });
      }
    }

    return diagnostics;
  }
}

export const compilerDiagnosticParser = new CompilerDiagnosticParser();
