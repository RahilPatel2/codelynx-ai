import { ExecutionRequest, ExecutionResult } from "./types";

export class SandboxFallbackProvider {
  /**
   * Deterministic static syntax checking prior to execution
   */
  public checkBasicSyntax(code: string, language: string): string | null {
    const stack: { char: string; line: number }[] = [];
    const lines = code.split("\n");

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      // strip single line comments
      const cleanLine = line.replace(/\/\/.*$/, "").replace(/#.*$/, "");

      for (let i = 0; i < cleanLine.length; i++) {
        const ch = cleanLine[i];
        if (ch === "{" || ch === "(" || ch === "[") {
          stack.push({ char: ch, line: lineIdx + 1 });
        } else if (ch === "}" || ch === ")" || ch === "]") {
          const last = stack.pop();
          if (!last) {
            return `SyntaxError: Unexpected closing bracket '${ch}' at line ${lineIdx + 1}`;
          }
          if (
            (ch === "}" && last.char !== "{") ||
            (ch === ")" && last.char !== "(") ||
            (ch === "]" && last.char !== "[")
          ) {
            return `SyntaxError: Mismatched bracket '${ch}' at line ${lineIdx + 1}, expected match for '${last.char}' from line ${last.line}`;
          }
        }
      }
    }

    if (stack.length > 0) {
      const unclosed = stack[stack.length - 1];
      return `SyntaxError: Unclosed bracket '${unclosed.char}' opened on line ${unclosed.line}`;
    }

    return null;
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { language, sourceCode } = request;

    // 1. Check basic syntax errors deterministically
    const syntaxError = this.checkBasicSyntax(sourceCode, language);
    if (syntaxError) {
      return {
        status: "compilation_error",
        exitCode: 1,
        stdout: "",
        stderr: syntaxError,
        compileOutput: syntaxError,
        executionTime: 0,
        memoryUsage: 0,
        provider: "deterministic-syntax-checker",
        message: "Syntax analysis detected bracket mismatch prior to execution.",
      };
    }

    // 2. Since production execution requires an external isolated provider,
    // do not fabricate fake stdout or pretend code was executed.
    return {
      status: "error",
      exitCode: 1,
      stdout: "",
      stderr:
        "Execution Service Not Configured: No sandboxed execution provider is connected. Configure JUDGE0_BASE_URL (e.g. https://ce.judge0.com) or JUDGE0_API_KEY in .env to run code.",
      compileOutput: "",
      executionTime: 0,
      memoryUsage: 0,
      provider: "none",
      message:
        "Connect a supported sandboxed execution service to compile and run your programs.",
    };
  }
}
