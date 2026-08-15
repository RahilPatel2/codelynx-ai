export type ExecutionStatus =
  | "queued"
  | "processing"
  | "accepted"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "error";

export interface ExecutionRequest {
  language: string;
  sourceCode: string;
  stdin?: string;
  cpuTimeLimit?: number; // seconds
  memoryLimit?: number; // KB
}

export interface ExecutionResult {
  status: ExecutionStatus;
  exitCode: number;
  stdout: string;
  stderr: string;
  compileOutput?: string;
  executionTime: number; // ms
  memoryUsage: number; // KB
  provider: string;
  message?: string;
  providerStatusDescription?: string;
}
