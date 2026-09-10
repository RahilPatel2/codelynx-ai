import { z } from "zod";

// --- Find Mistakes Schemas ---
export const BugFindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum([
    "syntax",
    "compilation",
    "runtime",
    "logical",
    "edge_case",
    "security",
    "performance",
    "memory",
    "code_quality",
  ]),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
  codeSnippet: z.string().optional(),
  explanation: z.string(),
  impact: z.string(),
  suggestedCorrection: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  demonstrationTestCase: z
    .object({
      input: z.string(),
      expectedFailure: z.string(),
    })
    .optional(),
});

export type BugFinding = z.infer<typeof BugFindingSchema>;

export const DebugAnalysisResultSchema = z.object({
  overallSummary: z.string(),
  hasCriticalBugs: z.boolean(),
  findings: z.array(BugFindingSchema),
  proposedFixSummary: z.string().optional(),
});

export type DebugAnalysisResult = z.infer<typeof DebugAnalysisResultSchema>;

// --- Fix Code Schema ---
export const FixCodeResultSchema = z.object({
  originalCode: z.string(),
  fixedCode: z.string(),
  summaryOfChanges: z.string(),
  changesList: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high"]),
  compilationExpected: z.boolean(),
});

export type FixCodeResult = z.infer<typeof FixCodeResultSchema>;

// --- Complexity Analysis Schema ---
export const ComplexityAnalysisResultSchema = z.object({
  timeComplexity: z.string(), // e.g. "O(n log n)"
  spaceComplexity: z.string(), // e.g. "O(n)"
  bestCase: z.string().optional(),
  averageCase: z.string().optional(),
  worstCase: z.string().optional(),
  dominantOperations: z.string(),
  loopAndRecursionAnalysis: z.string(),
  assumptions: z.array(z.string()),
  bottlenecks: z.array(z.string()),
  alternativeApproaches: z.array(
    z.object({
      name: z.string(),
      timeComplexity: z.string(),
      spaceComplexity: z.string(),
      tradeoff: z.string(),
    })
  ),
  isEstimated: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
  explanation: z.string(),
});

export type ComplexityAnalysisResult = z.infer<
  typeof ComplexityAnalysisResultSchema
>;

// --- Optimization Schema ---
export const OptimizationResultSchema = z.object({
  category: z.enum([
    "algorithmic",
    "redundant_work",
    "data_structures",
    "memory_allocation",
    "readability",
  ]),
  currentComplexity: z.string(),
  optimizedComplexity: z.string(),
  explanation: z.string(),
  keyChanges: z.array(z.string()),
  optimizedCode: z.string(),
  benchmarkEstimate: z.string(),
});

export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;

// --- Test Cases Schema ---
export const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    "normal",
    "boundary",
    "empty_input",
    "minimum",
    "maximum",
    "duplicate",
    "negative",
    "invalid",
    "adversarial",
  ]),
  input: z.string(),
  expectedOutput: z.string(),
  explanation: z.string(),
  passed: z.boolean().optional(),
  actualOutput: z.string().optional(),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

export const TestSuiteResultSchema = z.object({
  testCases: z.array(TestCaseSchema),
  overallExplanation: z.string(),
});

export type TestSuiteResult = z.infer<typeof TestSuiteResultSchema>;

// --- Explain Code Schema ---
export const ExplainCodeResultSchema = z.object({
  summary: z.string(),
  algorithmApproach: z.string(),
  keyComponents: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      lineRange: z.string().optional(),
    })
  ),
  stepByStepExplanation: z.array(z.string()),
  edgeCasesHandled: z.array(z.string()),
  timeSpaceSummary: z.string(),
});

export type ExplainCodeResult = z.infer<typeof ExplainCodeResultSchema>;

// --- Code Review Schema ---
export const ReviewItemSchema = z.object({
  id: z.string(),
  category: z.enum([
    "architecture",
    "maintainability",
    "performance",
    "security",
    "style",
    "best_practices",
  ]),
  severity: z.enum(["critical", "warning", "suggestion", "praise"]),
  title: z.string(),
  description: z.string(),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
  recommendation: z.string(),
});

export type ReviewItem = z.infer<typeof ReviewItemSchema>;

export const CodeReviewResultSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.string(),
  summary: z.string(),
  items: z.array(ReviewItemSchema),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export type CodeReviewResult = z.infer<typeof CodeReviewResultSchema>;

// --- Error Explanation Schema ---
export const ErrorExplanationResultSchema = z.object({
  errorType: z.string(),
  rootCause: z.string(),
  plainEnglishExplanation: z.string(),
  offendingLocation: z
    .object({
      line: z.number().optional(),
      snippet: z.string().optional(),
    })
    .optional(),
  suggestedFix: z.string(),
  fixedCodeSnippet: z.string().optional(),
  preventionAdvice: z.string(),
});

export type ErrorExplanationResult = z.infer<
  typeof ErrorExplanationResultSchema
>;

// --- Documentation Generator Schema ---
export const DocumentationResultSchema = z.object({
  title: z.string(),
  overview: z.string(),
  formattedCodeWithDocstrings: z.string(),
  apiReference: z.array(
    z.object({
      name: z.string(),
      kind: z.string(),
      signature: z.string(),
      description: z.string(),
      params: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          description: z.string(),
        })
      ),
      returns: z.string(),
    })
  ),
  readmeMarkdown: z.string(),
});

export type DocumentationResult = z.infer<typeof DocumentationResultSchema>;
