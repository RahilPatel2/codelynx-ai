import { ExecutionRequest, ExecutionResult } from "./types";
import { Judge0Provider } from "./judge0";
import { SandboxFallbackProvider } from "./sandbox-fallback";

export interface ExecutionProviderStatus {
  activeProvider: "judge0" | "none";
  isJudge0Configured: boolean;
  endpoint: string;
}

export class ExecutionService {
  private judge0 = new Judge0Provider();
  private sandbox = new SandboxFallbackProvider();

  getStatus(): ExecutionProviderStatus {
    const isConfigured = this.judge0.isConfigured();
    return {
      activeProvider: isConfigured ? "judge0" : "none",
      isJudge0Configured: isConfigured,
      endpoint: process.env.JUDGE0_BASE_URL || "https://ce.judge0.com",
    };
  }

  getSyntaxChecker(): SandboxFallbackProvider {
    return this.sandbox;
  }

  async runCode(request: ExecutionRequest): Promise<ExecutionResult> {
    // Perform quick static syntax pre-check
    const syntaxErr = this.sandbox.checkBasicSyntax(
      request.sourceCode,
      request.language
    );
    if (syntaxErr) {
      return {
        status: "compilation_error",
        exitCode: 1,
        stdout: "",
        stderr: syntaxErr,
        compileOutput: syntaxErr,
        executionTime: 0,
        memoryUsage: 0,
        provider: "syntax-precheck",
        message: "Syntax validation failed before remote execution.",
      };
    }

    if (this.judge0.isConfigured()) {
      try {
        return await this.judge0.execute(request);
      } catch (err: any) {
        console.warn("Judge0 execution failure:", err.message);
        return {
          status: "error",
          exitCode: 1,
          stdout: "",
          stderr: `Execution Service Error: ${err.message}`,
          compileOutput: "",
          executionTime: 0,
          memoryUsage: 0,
          provider: "judge0-ce",
          message:
            "The execution provider could not be reached. Verify your network connection or JUDGE0_BASE_URL.",
        };
      }
    }

    // Provider not configured
    return this.sandbox.execute(request);
  }
}

export const executionService = new ExecutionService();
