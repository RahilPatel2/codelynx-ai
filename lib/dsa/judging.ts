import { ExecutionService } from "../execution/adapter";
import { DSAProblem, TestCaseSchema } from "./types";
import { DSASubmissionStatus, DSASubmissionModel } from "../../models/DSASubmission";
import { DSAProgressModel } from "../../models/DSAProgress";
import { devStore } from "../database/dev-store";
import { connectDB } from "../database/connection";

const executionService = new ExecutionService();

export interface TestEvaluationItem {
  index: number;
  isPublic: boolean;
  passed: boolean;
  input?: string; // Only present for public test cases
  expectedOutput?: string; // Only present for public test cases
  actualOutput?: string;
  runtime: number;
  memory: number;
  status: "passed" | "failed" | "error" | "timeout";
  stderr?: string;
}

export interface RunCodeResult {
  allPassed: boolean;
  passedTests: number;
  totalTests: number;
  compileOutput?: string;
  results: TestEvaluationItem[];
}

export interface SubmissionResult {
  submissionId: string;
  status: DSASubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtime: number; // Max or average runtime
  memory: number;
  failedTestIndex?: number;
  message: string;
}

/**
 * Normalizes output string for fair comparisons
 */
export function normalizeOutput(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Evaluates code against public test cases (Run Code)
 */
export async function evaluateRunCode(
  code: string,
  language: string,
  testCases: Array<{ input: string; expectedOutput: string; isPublic: boolean }>
): Promise<RunCodeResult> {
  const results: TestEvaluationItem[] = [];
  let compileOutput: string | undefined = undefined;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execRes = await executionService.runCode({
      sourceCode: code,
      language,
      stdin: tc.input,
    });

    if (execRes.status === "compilation_error") {
      compileOutput = execRes.compileOutput || execRes.stderr || "Compilation failed";
      results.push({
        index: i + 1,
        isPublic: true,
        passed: false,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        runtime: 0,
        memory: 0,
        status: "error",
        stderr: compileOutput,
      });
      break; // Halt on compilation error
    }

    const normActual = normalizeOutput(execRes.stdout);
    const normExpected = normalizeOutput(tc.expectedOutput);
    const hasExpected = tc.expectedOutput !== undefined && tc.expectedOutput.trim() !== "";
    const passed = hasExpected
      ? normActual === normExpected && execRes.exitCode === 0
      : execRes.exitCode === 0;

    let itemStatus: "passed" | "failed" | "error" | "timeout" = passed ? "passed" : "failed";
    if (execRes.status === "time_limit_exceeded") itemStatus = "timeout";
    else if (execRes.status === "runtime_error" || execRes.exitCode !== 0) itemStatus = "error";

    results.push({
      index: i + 1,
      isPublic: true,
      passed,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: normActual,
      runtime: execRes.executionTime || 0,
      memory: execRes.memoryUsage || 0,
      status: itemStatus,
      stderr: execRes.stderr,
    });
  }

  const passedTests = results.filter((r) => r.passed).length;
  return {
    allPassed: passedTests === testCases.length && !compileOutput,
    passedTests,
    totalTests: testCases.length,
    compileOutput,
    results,
  };
}

/**
 * Evaluates code against all test cases including hidden tests (Submit)
 */
export async function evaluateSubmission(
  userId: string,
  problem: DSAProblem,
  code: string,
  language: string
): Promise<SubmissionResult> {
  const allTests = [...problem.publicTestCases, ...problem.hiddenTestCases];
  let passedCount = 0;
  let maxRuntime = 0;
  let maxMemory = 0;
  let finalStatus: DSASubmissionStatus = "accepted";
  let failedIndex: number | undefined = undefined;
  let message = "All tests passed successfully!";

  for (let i = 0; i < allTests.length; i++) {
    const tc = allTests[i];
    const execRes = await executionService.runCode({
      sourceCode: code,
      language,
      stdin: tc.input,
    });

    if (execRes.status === "compilation_error") {
      finalStatus = "compilation_error";
      failedIndex = i + 1;
      message = execRes.compileOutput || execRes.stderr || "Compilation failed";
      break;
    }

    if (execRes.status === "time_limit_exceeded") {
      finalStatus = "time_limit_exceeded";
      failedIndex = i + 1;
      message = `Time limit exceeded on test case ${i + 1}`;
      break;
    }

    if (execRes.status === "runtime_error" || (execRes.exitCode && execRes.exitCode !== 0)) {
      finalStatus = "runtime_error";
      failedIndex = i + 1;
      message = `Runtime error on test case ${i + 1}: ${execRes.stderr || "Non-zero exit status"}`;
      break;
    }

    if (execRes.status === "error") {
      finalStatus = "internal_error";
      failedIndex = i + 1;
      message = "Execution provider unavailable. Please retry.";
      break;
    }

    const normActual = normalizeOutput(execRes.stdout);
    const normExpected = normalizeOutput(tc.expectedOutput);

    maxRuntime = Math.max(maxRuntime, execRes.executionTime || 0);
    maxMemory = Math.max(maxMemory, execRes.memoryUsage || 0);

    if (normActual === normExpected) {
      passedCount++;
    } else {
      finalStatus = "wrong_answer";
      failedIndex = i + 1;
      // Do NOT reveal hidden test input or expected output!
      message = tc.isPublic
        ? `Output mismatch on sample test ${i + 1}`
        : `Wrong answer on test case ${i + 1}`;
      break;
    }
  }

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const submissionRecord = {
    id: submissionId,
    userId,
    problemId: problem.id,
    problemSlug: problem.slug,
    code: code.slice(0, 10000), // Bound storage size
    language,
    status: finalStatus,
    passedTests: passedCount,
    totalTests: allTests.length,
    runtime: maxRuntime,
    memory: maxMemory,
    failedTestIndex: failedIndex,
    errorMessage: finalStatus !== "accepted" ? message : undefined,
    submittedAt: new Date(),
  };

  // Persist submission & update user progress
  await recordSubmissionAndProgress(submissionRecord);

  return {
    submissionId,
    status: finalStatus,
    passedTests: passedCount,
    totalTests: allTests.length,
    runtime: maxRuntime,
    memory: maxMemory,
    failedTestIndex: failedIndex,
    message,
  };
}

async function recordSubmissionAndProgress(sub: any) {
  // 1. Record in devStore
  devStore.dsaSubmissions.unshift(sub);
  if (devStore.dsaSubmissions.length > 500) {
    devStore.dsaSubmissions.pop(); // Reasonable retention
  }

  let progress = devStore.dsaProgress.get(sub.userId) || {
    userId: sub.userId,
    solvedProblems: [],
    attemptedProblems: [],
    bookmarkedProblems: [],
    revealedHints: {},
    drafts: {},
    streakCount: 0,
    lastActiveDate: "",
  };

  if (!progress.attemptedProblems.includes(sub.problemId)) {
    progress.attemptedProblems.push(sub.problemId);
  }
  if (sub.status === "accepted" && !progress.solvedProblems.includes(sub.problemId)) {
    progress.solvedProblems.push(sub.problemId);
  }

  // Update streak if active today
  const today = new Date().toISOString().slice(0, 10);
  if (progress.lastActiveDate !== today) {
    progress.streakCount = (progress.streakCount || 0) + 1;
    progress.lastActiveDate = today;
  }
  devStore.dsaProgress.set(sub.userId, progress);

  // 2. Persist in MongoDB if available
  try {
    const conn = await connectDB();
    if (conn) {
      await DSASubmissionModel.create(sub);
      await DSAProgressModel.findOneAndUpdate(
        { userId: sub.userId },
        {
          $addToSet: {
            attemptedProblems: sub.problemId,
            ...(sub.status === "accepted" ? { solvedProblems: sub.problemId } : {}),
          },
          $set: {
            lastActiveDate: today,
          },
          $inc: progress.lastActiveDate !== today ? { streakCount: 1 } : {},
        },
        { upsert: true, new: true }
      );
    }
  } catch (err: any) {
    console.warn("MongoDB submission record skipped, devStore updated:", err.message);
  }
}
