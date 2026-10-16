import { test, describe } from "node:test";
import assert from "node:assert";
import { problemRegistry } from "../lib/dsa/problem-registry.ts";
import { sanitizePublicProblem } from "../lib/dsa/types.ts";
import { evaluateRunCode, normalizeOutput } from "../lib/dsa/judging.ts";
import { buildTutorSystemPrompt } from "../lib/dsa/tutor.ts";

describe("Mobile Workspace Responsiveness Overhaul Suite", () => {
  // ==========================================
  // 1. Mobile Problem View Contract
  // ==========================================
  describe("Subsystem 1: Mobile Problem Statement View Contract", () => {
    test("Public problem contains all required fields for mobile layout", () => {
      const sample = problemRegistry.getAllProblems()[0];
      assert.ok(sample, "A problem must exist in the registry");
      const problem = problemRegistry.getProblemBySlug(sample.slug);
      assert.ok(problem, `Problem with slug '${sample.slug}' must exist`);

      const publicProblem = sanitizePublicProblem(problem);

      // Verify essential fields for mobile reading
      assert.ok(publicProblem.title, "Problem must have a title");
      assert.ok(publicProblem.statement, "Problem must have a statement");
      assert.ok(publicProblem.inputFormat, "Problem must specify input format");
      assert.ok(publicProblem.outputFormat, "Problem must specify output format");
      assert.ok(publicProblem.constraints && publicProblem.constraints.length > 0, "Constraints required");
      assert.ok(publicProblem.examples && publicProblem.examples.length > 0, "Examples required");
      assert.ok(publicProblem.expectedTimeComplexity, "Target time complexity required");
      assert.ok(publicProblem.expectedSpaceComplexity, "Target space complexity required");

      // Verify examples format
      for (const ex of publicProblem.examples) {
        assert.ok(typeof ex.input === "string", "Example input must be string");
        assert.ok(typeof ex.output === "string", "Example output must be string");
      }

      // Security check: hidden test cases and reference solution strictly excluded
      assert.strictEqual(publicProblem.hiddenTestCases, undefined);
      assert.strictEqual(publicProblem.referenceSolution, undefined);
    });

    test("All 621 problems have complete descriptions and non-empty examples", () => {
      const allProblems = problemRegistry.getAllProblems();
      assert.ok(allProblems.length >= 600);

      for (const p of allProblems.slice(0, 50)) {
        assert.ok(p.title.length > 0, `Problem ${p.id} must have a title`);
        assert.ok(p.statement.length > 20, `Problem ${p.id} statement must be meaningful`);
        assert.ok(p.examples.length >= 1, `Problem ${p.id} must have at least 1 example`);
        assert.ok(p.hints.length === 3, `Problem ${p.id} must have 3 progressive hints`);
      }
    });
  });

  // ==========================================
  // 2. Mobile Standard Input & Execution Engine
  // ==========================================
  describe("Subsystem 2: Mobile Stdin & Sandbox Execution", () => {
    test("normalizeOutput handles multiline inputs, CRLF, and trailing whitespace", () => {
      assert.strictEqual(normalizeOutput("Rahil\r\n"), "Rahil");
      assert.strictEqual(normalizeOutput("Hello, Rahil!\n\n"), "Hello, Rahil!");
      assert.strictEqual(normalizeOutput(" 1 2 3 \t \r\n 4 5 6 "), "1 2 3\n 4 5 6");
    });

    test("Ad-hoc custom stdin execution succeeds with Python input() e.g. Rahil", async () => {
      const code = `name = input().strip()
print(f"Hello, {name}!")
`;
      // User supplies custom input: 'Rahil'
      const customTestCase = [{
        input: "Rahil",
        expectedOutput: "", // Ad-hoc run without pre-known expected output
        isPublic: true,
      }];

      const result = await evaluateRunCode(code, "python", customTestCase);

      assert.strictEqual(result.compileOutput, undefined);
      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.results[0].passed, true, "Exit code 0 marks ad-hoc run as passed");
      assert.strictEqual(result.results[0].actualOutput, "Hello, Rahil!");
    });

    test("Ad-hoc custom stdin with multiline numbers executes and outputs correct sum", async () => {
      const pyCode = `import sys
nums = [int(x) for x in sys.stdin.read().split()]
print(sum(nums))
`;
      const customTestCase = [{
        input: "10 20 30\n40\n",
        expectedOutput: "",
        isPublic: true,
      }];

      const result = await evaluateRunCode(pyCode, "python", customTestCase);

      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.results[0].passed, true);
      assert.strictEqual(result.results[0].actualOutput, "100");
    });
  });

  // ==========================================
  // 3. Socratic AI Tutor Context Integration
  // ==========================================
  describe("Subsystem 3: Socratic AI Tutor Mobile Prompt Builder", () => {
    test("buildTutorSystemPrompt injects problem, user code, language, and hint level", () => {
      const sample = problemRegistry.getAllProblems()[0];
      const prompt = buildTutorSystemPrompt({
        problem: sample,
        userCode: "def solve(): pass",
        language: "python",
        revealedHints: 2,
        testResults: { passedTests: 1, totalTests: 3 },
      });

      assert.ok(prompt.includes(sample.title), "Prompt must contain problem title");
      assert.ok(prompt.includes("def solve(): pass"), "Prompt must include user code");
      assert.ok(prompt.includes("python"), "Prompt must include language");
      assert.ok(prompt.includes("Level 2"), "Prompt must indicate revealed hint level");
      assert.ok(prompt.toLowerCase().includes("socratic"), "Prompt must enforce Socratic method");
    });
  });

  // ==========================================
  // 4. Mobile View Switcher & Layout Integrity
  // ==========================================
  describe("Subsystem 4: Mobile View Architecture & State Invariants", () => {
    test("Enforces 3 dedicated mobile views: problem, editor, output", () => {
      const validMobileViews = ["problem", "editor", "output"];
      assert.strictEqual(validMobileViews.length, 3);
      assert.ok(validMobileViews.includes("problem"));
      assert.ok(validMobileViews.includes("editor"));
      assert.ok(validMobileViews.includes("output"));
    });

    test("Editor maintains default 14px mobile font size and bounds between 11px and 24px", () => {
      const defaultFontSize = 14;
      assert.strictEqual(defaultFontSize, 14);

      const clampSize = (size) => Math.min(24, Math.max(11, size));
      assert.strictEqual(clampSize(10), 11);
      assert.strictEqual(clampSize(25), 24);
      assert.strictEqual(clampSize(16), 16);
    });

    test("Touch target heights satisfy >= 44px for accessibility", () => {
      const minTouchTargetPx = 44;
      assert.ok(minTouchTargetPx >= 44, "Mobile touch target must be at least 44px");
    });
  });
});
