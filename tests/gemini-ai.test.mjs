import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { GeminiProvider } from "../lib/ai/gemini.ts";
import { aiService } from "../lib/ai/service.ts";
import {
  ExplainCodeResultSchema,
  CodeReviewResultSchema,
  ErrorExplanationResultSchema,
  DocumentationResultSchema,
  DebugAnalysisResultSchema,
  FixCodeResultSchema,
  ComplexityAnalysisResultSchema,
} from "../lib/ai/types.ts";

describe("Google Gemini AI Integration & Workflows", () => {
  test("GeminiProvider initializes with active Gemini model", () => {
    const provider = new GeminiProvider();
    const model = provider.getModelName();
    assert.ok(
      model === "gemini-3.5-flash" ||
      model === "gemini-3.8-flash" ||
      model === "gemini-flash-latest",
      `Expected active model, got ${model}`
    );
  });

  test("aiService returns honest configured or fallback status", () => {
    const status = aiService.getStatus();
    assert.ok(typeof status.isConfigured === "boolean");
    assert.ok(status.provider === "gemini" || status.provider === "deterministic-fallback");
    assert.ok(typeof status.modelName === "string");
  });

  test("ExplainCodeResultSchema validates full structured breakdown", () => {
    const mockExplanation = {
      summary: "Computes the n-th Fibonacci number efficiently.",
      algorithmApproach: "Dynamic Programming / Memoization",
      keyComponents: [
        {
          name: "Memo Table",
          description: "Stores subproblem solutions in linear space.",
          lineRange: "2-4",
        },
      ],
      stepByStepExplanation: [
        "1. Base cases for 0 and 1.",
        "2. Iterate from 2 to n accumulating previous two states.",
      ],
      edgeCasesHandled: ["n = 0", "Negative inputs"],
      timeSpaceSummary: "O(n) Time / O(1) Auxiliary Space",
    };

    const parsed = ExplainCodeResultSchema.parse(mockExplanation);
    assert.equal(parsed.summary, mockExplanation.summary);
    assert.equal(parsed.keyComponents.length, 1);
  });

  test("CodeReviewResultSchema validates review report with score and grade", () => {
    const mockReview = {
      score: 92,
      grade: "A",
      summary: "Clean algorithmic implementation with sound variable naming.",
      items: [
        {
          id: "rev_1",
          category: "security",
          severity: "suggestion",
          title: "Input Boundary Assertion",
          description: "Consider checking for upper limits on n.",
          lineStart: 1,
          lineEnd: 3,
          recommendation: "Add assert(n < 100000) at function top.",
        },
      ],
      strengths: ["Linear complexity", "Clear control flow"],
      improvements: ["Add type annotations"],
    };

    const parsed = CodeReviewResultSchema.parse(mockReview);
    assert.equal(parsed.score, 92);
    assert.equal(parsed.grade, "A");
    assert.equal(parsed.items[0].category, "security");
  });

  test("ErrorExplanationResultSchema validates plain English error explanation", () => {
    const mockErrorExplanation = {
      errorType: "SyntaxError",
      rootCause: "Missing colon at the end of function declaration.",
      plainEnglishExplanation:
        "In Python, function headers must end with a colon ':' before the indented block.",
      offendingLocation: {
        line: 1,
        snippet: "def fib(n)",
      },
      suggestedFix: "Append ':' to line 1: `def fib(n):`",
      fixedCodeSnippet: "def fib(n):",
      preventionAdvice: "Ensure all if, for, while, and def headers end with a colon.",
    };

    const parsed = ErrorExplanationResultSchema.parse(mockErrorExplanation);
    assert.equal(parsed.errorType, "SyntaxError");
    assert.match(parsed.suggestedFix, /def fib\(n\):/);
  });

  test("DocumentationResultSchema validates generated docs with API reference", () => {
    const mockDocs = {
      title: "Fibonacci Calculation Module",
      overview: "Provides high-throughput iterative fibonacci calculations.",
      formattedCodeWithDocstrings: '"""Iterative Fibonacci"""\ndef fib(n):\n    return n\n',
      apiReference: [
        {
          name: "fib",
          kind: "function",
          signature: "fib(n: int) -> int",
          description: "Calculates n-th fibonacci sequence term.",
          params: [{ name: "n", type: "int", description: "Term index" }],
          returns: "Term value",
        },
      ],
      readmeMarkdown: "# Fibonacci\nUsage: `fib(10)`",
    };

    const parsed = DocumentationResultSchema.parse(mockDocs);
    assert.equal(parsed.title, mockDocs.title);
    assert.equal(parsed.apiReference[0].name, "fib");
  });

  test("aiService explainCode produces valid explanation", async () => {
    const code = `def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n`;
    const result = await aiService.explainCode(code, "python");
    assert.ok(result.summary.length > 0);
    assert.ok(result.stepByStepExplanation.length > 0);
  });

  test("aiService reviewCode produces valid review and score", async () => {
    const code = `def solve(arr):\n    # TODO: optimize this loop\n    for x in arr:\n        print(x)\n`;
    const result = await aiService.reviewCode(code, "python");
    assert.ok(result.score > 0 && result.score <= 100);
    assert.ok(result.items.length > 0);
  });

  test("aiService explainError produces actionable diagnosis", async () => {
    const rawError = `SyntaxError: expected ':' at line 3`;
    const code = `for i in range(10)\n    print(i)\n`;
    const result = await aiService.explainError(rawError, code, "python");
    assert.ok(result.errorType.includes("Syntax"));
    assert.ok(result.suggestedFix.length > 0);
  });

  test("aiService generateDocumentation produces README and API reference", async () => {
    const code = `def calculate_sum(a, b):\n    return a + b\n`;
    const result = await aiService.generateDocumentation(code, "python");
    assert.ok(result.readmeMarkdown.length > 0);
    assert.ok(result.apiReference.length > 0);
  });

  test("aiService chat responds with developer pair programmer advice", async () => {
    const reply = await aiService.chat("How do I implement binary search in Python?", {
      code: "def search(arr, target): pass",
      language: "python",
      activeFileName: "search.py",
    });
    assert.ok(typeof reply === "string");
    assert.ok(reply.length > 20);
  });
});
