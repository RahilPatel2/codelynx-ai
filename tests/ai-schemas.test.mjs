import { test, describe } from "node:test";
import assert from "node:assert";
import {
  BugFindingSchema,
  DebugAnalysisResultSchema,
  FixCodeResultSchema,
  ComplexityAnalysisResultSchema,
  OptimizationResultSchema,
  TestSuiteResultSchema,
} from "../lib/ai/types.ts";

describe("AI Response Zod Schema Validations", () => {
  test("Validates strict Bug Finding schema", () => {
    const validFinding = {
      id: "bug_1",
      title: "Buffer Overflow",
      category: "runtime",
      severity: "critical",
      lineStart: 12,
      lineEnd: 14,
      explanation: "Array accessed out of bounds",
      impact: "Process crashes with SIGSEGV",
      suggestedCorrection: "Use i < size instead of i <= size",
      confidence: "high",
    };
    const parsed = BugFindingSchema.parse(validFinding);
    assert.strictEqual(parsed.id, "bug_1");
    assert.strictEqual(parsed.severity, "critical");
  });

  test("Validates Fix Code schema", () => {
    const validFix = {
      originalCode: "x = [1, 2]\nprint(x[2])",
      fixedCode: "x = [1, 2]\nprint(x[1])",
      summaryOfChanges: "Adjusted index within bounds",
      changesList: ["Replaced index 2 with index 1"],
      riskLevel: "low",
      compilationExpected: true,
    };
    const parsed = FixCodeResultSchema.parse(validFix);
    assert.strictEqual(parsed.riskLevel, "low");
    assert.strictEqual(parsed.compilationExpected, true);
  });

  test("Rejects malformed complexity analysis missing dominant operations", () => {
    const invalidComplexity = {
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      // missing dominantOperations, assumptions, etc.
    };
    assert.throws(() => {
      ComplexityAnalysisResultSchema.parse(invalidComplexity);
    });
  });

  test("Validates Test Suite schema", () => {
    const validSuite = {
      overallExplanation: "Coverage suite",
      testCases: [
        {
          id: "tc_1",
          name: "Empty input",
          category: "empty_input",
          input: "[]",
          expectedOutput: "0",
          explanation: "Empty array should sum to 0",
        },
      ],
    };
    const parsed = TestSuiteResultSchema.parse(validSuite);
    assert.strictEqual(parsed.testCases.length, 1);
    assert.strictEqual(parsed.testCases[0].category, "empty_input");
  });
});
