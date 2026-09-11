import { z } from "zod";
import { geminiProvider } from "./gemini";
import { SanitizedContext } from "./context-builder";

export const NextStepAnalysisSchema = z.object({
  currentState: z.enum([
    "compilation_error",
    "runtime_error",
    "untested",
    "in_progress",
    "verified_clean",
  ]),
  summary: z.string(),
  primaryBlocker: z.string().nullable().optional(),
  immediateAction: z.string(),
  actionType: z.enum([
    "fix_compiler_error",
    "fix_runtime_bug",
    "write_tests",
    "implement_missing_logic",
    "optimize_or_document",
  ]),
  stepByStepPlan: z.array(z.string()),
  suggestedPatchSnippet: z.string().nullable().optional(),
  optionalImprovements: z.array(z.string()),
});

export type NextStepAnalysis = z.infer<typeof NextStepAnalysisSchema>;

/**
 * Deterministically analyzes code state to determine the immediate next development action
 */
export function determineDeterministicNextStep(
  code: string,
  language: string,
  context?: SanitizedContext
): NextStepAnalysis {
  // Case 1: Active compiler diagnostics or compilation errors
  if (context?.diagnostics && context.diagnostics.length > 0) {
    const firstError = context.diagnostics[0];
    return {
      currentState: "compilation_error",
      summary: `Compilation blocked by syntax or declaration issue at Line ${firstError.line}: "${firstError.message}".`,
      primaryBlocker: `Line ${firstError.line}: ${firstError.message}`,
      immediateAction: `Fix the syntax / declaration error on Line ${firstError.line} and recompile.`,
      actionType: "fix_compiler_error",
      stepByStepPlan: [
        `Locate Line ${firstError.line} in ${context.activeFile?.name || "the active file"}.`,
        `Resolve "${firstError.message}". Check for missing semicolons, unmatched braces, or misspelled symbols.`,
        `Click "Run Code" or press Ctrl+Enter to recompile.`,
        `Verify that standard output is produced cleanly without diagnostic warnings.`,
      ],
      optionalImprovements: ["Review surrounding function boundaries for scope leaks."],
    };
  }

  // Case 2: Runtime error / non-zero exit code
  if (
    context?.lastExecution &&
    (context.lastExecution.status === "runtime_error" ||
      (context.lastExecution.exitCode !== undefined && context.lastExecution.exitCode !== 0))
  ) {
    const stderr = context.lastExecution.stderr || "Runtime exception occurred.";
    return {
      currentState: "runtime_error",
      summary: `Program terminated with runtime exit code ${context.lastExecution.exitCode}: ${stderr.slice(0, 120)}`,
      primaryBlocker: stderr.slice(0, 180),
      immediateAction: "Diagnose and patch the runtime exception.",
      actionType: "fix_runtime_bug",
      stepByStepPlan: [
        "Inspect the stderr traceback to identify the exact failing line and memory/type condition.",
        "Add defensive guard conditions (e.g. check for null, array bounds, or zero-division).",
        "Run Code again with sample inputs in the Input (stdin) tab.",
      ],
      optionalImprovements: ["Add unit tests covering the edge case that triggered this exception."],
    };
  }

  // Case 3: Verified clean execution
  if (
    context?.lastExecution &&
    context.lastExecution.status === "success" &&
    (context.lastExecution.exitCode === 0 || context.lastExecution.exitCode === undefined)
  ) {
    return {
      currentState: "verified_clean",
      summary: "Program compiled and executed cleanly with exit code 0.",
      immediateAction: "Analyze asymptotic Big-O complexity or generate complete API documentation.",
      actionType: "optimize_or_document",
      stepByStepPlan: [
        "Open Complexity Lab to measure algorithmic Big-O time and auxiliary space scaling.",
        "Consider using the Code Optimizer if quadratic nested loops can be reduced to linear time.",
        "Document invariants and function interfaces for maintainability.",
      ],
      optionalImprovements: [
        "Benchmark execution latency under heavy load.",
        "Add inline typing or docstrings.",
      ],
    };
  }

  // Case 4: Incomplete feature / stub / TODOs
  const hasTodo = /\b(?:TODO|FIXME|throw new NotImplementedException|pass\s*$|return None\s*$|return 0;\s*\/\/\s*todo)/i.test(
    code
  );
  if (hasTodo || code.trim().length === 0) {
    return {
      currentState: "in_progress",
      summary: "Implementation is in progress with incomplete functions or pending logic.",
      immediateAction: "Implement the primary algorithm logic and return statement.",
      actionType: "implement_missing_logic",
      stepByStepPlan: [
        "Flesh out the core loop, condition, or transformation.",
        "Replace placeholder returns or pass statements with concrete calculated values.",
        "Run Code with sample inputs to verify correct output.",
      ],
      optionalImprovements: ["Document function arguments and expected return types with docstrings."],
    };
  }

  // Case 5: Clean code that compiles, but has no tests
  return {
    currentState: "untested",
    summary:
      "Your code compiles cleanly, but execution correctness has not been verified against boundary conditions.",
    immediateAction: "Create unit test cases covering normal, boundary, and negative input cases.",
    actionType: "write_tests",
    stepByStepPlan: [
      "Identify the core expected output for standard input cases.",
      "Test boundary cases: empty collections, single elements, zero, and negative values.",
      "Click 'Generate Tests' or use the Test Runner tab to execute automated verification.",
      "Once tests pass, evaluate asymptotic Big-O complexity in the Complexity Lab.",
    ],
    optionalImprovements: [
      "Analyze time and auxiliary space complexity in the Complexity Lab.",
      "Add docstrings or README documentation for module consumers.",
    ],
  };
}

/**
 * AI-powered Next-Step Guide incorporating Gemini reasoning
 */
export async function analyzeNextStep(
  code: string,
  language: string,
  context?: SanitizedContext,
  options?: { model?: string; detailLevel?: string }
): Promise<NextStepAnalysis> {
  if (geminiProvider.isConfigured()) {
    try {
      const prompt = `You are CodeLynx AI Next-Step Coding Guide.
Examine this ${language} codebase and current development context. Recommend the single most practical, high-value immediate action the developer should take right now.

Guiding Principles:
1. If there is a compiler error or diagnostic, fixing it is ALWAYS step 1. Do not recommend writing tests or optimizing broken code.
2. If the code compiles but crashes at runtime, fixing the exception is step 1.
3. If the code compiles cleanly but is untested, recommend writing meaningful test cases covering edge cases. Never assume successful compilation implies algorithm correctness!
4. If the code is already correct and tested, DO NOT invent fake bugs! Suggest useful next steps: boundary fuzzing, asymptotic complexity verification, documentation, or clean refactoring. Distinguish optional improvements from necessary fixes.

Context Information:
- Diagnostics: ${JSON.stringify(context?.diagnostics || [])}
- Last Execution: ${JSON.stringify(context?.lastExecution || {})}
- Active File: ${context?.activeFile?.name || "main"} (${language})

Source Code:
\`\`\`${language}
${code}
\`\`\`

Return a JSON object conforming strictly to this structure:
{
  "currentState": "compilation_error" | "runtime_error" | "untested" | "in_progress" | "verified_clean",
  "summary": "Concise overview of current codebase state",
  "primaryBlocker": "String describing primary blocker if one exists",
  "immediateAction": "The single most important action to do right now",
  "actionType": "fix_compiler_error" | "fix_runtime_bug" | "write_tests" | "implement_missing_logic" | "optimize_or_document",
  "stepByStepPlan": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "suggestedPatchSnippet": "Small concrete snippet to help implement the immediate action (optional)",
  "optionalImprovements": ["Optional enhancement 1", "Optional enhancement 2"]
}`;

      const raw = await geminiProvider.generateJson<NextStepAnalysis>(
        prompt,
        undefined,
        { model: options?.model }
      );
      return NextStepAnalysisSchema.parse(raw);
    } catch (err: any) {
      console.warn("Gemini analyzeNextStep error, falling back to deterministic guide:", err.message);
      return determineDeterministicNextStep(code, language, context);
    }
  }

  return determineDeterministicNextStep(code, language, context);
}
