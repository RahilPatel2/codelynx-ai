import { ExecutionRequest, ExecutionResult, ExecutionStatus } from "./types";
import { getLanguageById } from "../languages/definitions";

function safeBase64Encode(str: string): string {
  return Buffer.from(str || "", "utf-8").toString("base64");
}

function safeBase64Decode(str: string | null | undefined): string {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return str;
  }
}

export class Judge0Provider {
  private baseUrl: string;
  private apiKey: string | undefined;
  private apiHost: string | undefined;

  constructor() {
    // Default to the official public Judge0 Community Edition endpoint
    this.baseUrl =
      process.env.JUDGE0_BASE_URL || "https://ce.judge0.com";
    this.apiKey = process.env.JUDGE0_API_KEY;
    this.apiHost =
      process.env.JUDGE0_API_HOST ||
      (this.baseUrl.includes("rapidapi")
        ? "judge0-ce.p.rapidapi.com"
        : undefined);
  }

  isConfigured(): boolean {
    const trimmedUrl = this.baseUrl.trim();
    // Public CE endpoint or self-hosted instances do not require RapidAPI keys
    if (
      trimmedUrl.includes("ce.judge0.com") ||
      trimmedUrl.includes("localhost") ||
      trimmedUrl.includes("127.0.0.1")
    ) {
      return true;
    }
    // If using RapidAPI endpoint, an API key is required
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private mapJudge0Status(statusId: number): ExecutionStatus {
    switch (statusId) {
      case 1:
        return "queued";
      case 2:
        return "processing";
      case 3:
        return "accepted";
      case 5:
        return "time_limit_exceeded";
      case 6:
        return "compilation_error";
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
        return "runtime_error";
      default:
        return "error";
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const langDef = getLanguageById(request.language);
    const judge0LanguageId = langDef.judge0Id;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      if (this.apiHost) {
        headers["X-RapidAPI-Key"] = this.apiKey;
        headers["X-RapidAPI-Host"] = this.apiHost;
      } else {
        headers["X-Auth-Token"] = this.apiKey;
      }
    }

    const payload = {
      source_code: safeBase64Encode(request.sourceCode),
      language_id: judge0LanguageId,
      stdin: safeBase64Encode(request.stdin || ""),
      cpu_time_limit: request.cpuTimeLimit || 5,
      memory_limit: request.memoryLimit || 128000,
    };

    const cleanBaseUrl = this.baseUrl.replace(/\/+$/, "");
    const submitUrl = `${cleanBaseUrl}/submissions?base64_encoded=true&wait=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response: Response;
    try {
      response = await fetch(submitUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          status: "time_limit_exceeded",
          exitCode: 124,
          stdout: "",
          stderr: "Execution request timed out after 25.0 seconds.",
          executionTime: 25000,
          memoryUsage: 0,
          provider: "judge0-ce",
          message: "The remote execution container did not complete within the timeout limit.",
        };
      }
      throw new Error(`Failed to reach execution provider at ${cleanBaseUrl}: ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Execution service error (${response.status}): ${errText}`);
    }

    let data = await response.json();

    // If result was queued or processing asynchronously, poll until complete or max attempts
    if (data.token && (data.status?.id === 1 || data.status?.id === 2)) {
      data = await this.pollSubmission(cleanBaseUrl, data.token, headers);
    }

    const statusId = data.status?.id || 13;
    const status = this.mapJudge0Status(statusId);
    const executionTimeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;
    const memoryUsageKb = data.memory || 0;

    return {
      status,
      exitCode: data.exit_code ?? (status === "accepted" ? 0 : 1),
      stdout: safeBase64Decode(data.stdout),
      stderr: safeBase64Decode(data.stderr),
      compileOutput: safeBase64Decode(data.compile_output),
      executionTime: executionTimeMs,
      memoryUsage: memoryUsageKb,
      provider: "judge0-ce",
      providerStatusDescription: data.status?.description,
      message: safeBase64Decode(data.message),
    };
  }

  private async pollSubmission(
    cleanBaseUrl: string,
    token: string,
    headers: Record<string, string>
  ): Promise<any> {
    const pollUrl = `${cleanBaseUrl}/submissions/${token}?base64_encoded=true`;
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((res) => setTimeout(res, 1000));
      try {
        const res = await fetch(pollUrl, { headers });
        if (res.ok) {
          const body = await res.json();
          if (body.status?.id && body.status.id > 2) {
            return body;
          }
        }
      } catch (e) {
        // Continue polling
      }
    }
    return {
      status: { id: 5, description: "Time Limit Exceeded" },
      time: "5.0",
      stderr: "Execution polling exceeded maximum wait duration.",
    };
  }
}
