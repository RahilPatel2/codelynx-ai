import { test, describe } from "node:test";
import assert from "node:assert";
import {
  CODELYNX_APP_REGISTRY,
  buildCopilotSystemInstruction,
} from "../lib/ai/capabilities.ts";
import {
  scrubSensitiveData,
  sanitizeContext,
} from "../lib/ai/context-builder.ts";
import {
  determineDeterministicNextStep,
  NextStepAnalysisSchema,
} from "../lib/ai/next-step.ts";
import {
  HINT_LEVEL_METADATA,
  generateDeterministicHint,
  HintResultSchema,
} from "../lib/ai/hints.ts";
import {
  generateDeterministicPlan,
  CodingPlanSchema,
  PlanStepSchema,
} from "../lib/ai/plan.ts";

describe("Phase 2: Context-Aware AI Coding Copilot Engine", () => {
  // ==========================================
  // 1. Application Capability Registry & System Instruction
  // ==========================================
  describe("Subsystem 1: Application Capability Registry", () => {
    test("Registry contains all required platform routes and metadata", () => {
      assert.strictEqual(CODELYNX_APP_REGISTRY.platformName, "CODELYNX AI");
      assert.strictEqual(CODELYNX_APP_REGISTRY.version, "2.0.0");

      const paths = CODELYNX_APP_REGISTRY.routes.map((r) => r.path);
      assert.ok(paths.includes("/"));
      assert.ok(paths.includes("/dashboard"));
      assert.ok(paths.includes("/workspace"));
      assert.ok(paths.includes("/assistant"));
      assert.ok(paths.includes("/settings"));
      assert.ok(paths.includes("/documentation"));
      assert.ok(paths.includes("/history"));
    });

    test("Registry documents core FAQs including stdin, shortcuts, and optimizer", () => {
      assert.ok(CODELYNX_APP_REGISTRY.faqs.length >= 5);
      const stdinFaq = CODELYNX_APP_REGISTRY.faqs.find((f) =>
        f.question.toLowerCase().includes("standard input") || f.question.toLowerCase().includes("stdin")
      );
      assert.ok(stdinFaq, "Stdin FAQ must be present");
      assert.ok(stdinFaq.answer.toLowerCase().includes("stdin"));

      const optimizerFaq = CODELYNX_APP_REGISTRY.faqs.find((f) =>
        f.question.toLowerCase().includes("optim")
      );
      assert.ok(optimizerFaq, "Optimizer FAQ must be present");
      assert.ok(optimizerFaq.answer.includes("Apply to Editor") || optimizerFaq.answer.includes("Diff Viewer") || optimizerFaq.answer.includes("preview"));
    });

    test("buildCopilotSystemInstruction formats role and detail levels correctly", () => {
      const concisePrompt = buildCopilotSystemInstruction("concise");
      assert.ok(concisePrompt.includes("CODELYNX AI"));
      assert.ok(concisePrompt.toLowerCase().includes("concise"));

      const detailedPrompt = buildCopilotSystemInstruction("detailed");
      assert.ok(detailedPrompt.toLowerCase().includes("comprehensive") || detailedPrompt.toLowerCase().includes("detailed"));

      const balancedPrompt = buildCopilotSystemInstruction("balanced");
      assert.ok(balancedPrompt.toLowerCase().includes("balanced"));
    });
  });

  // ==========================================
  // 2. Token Hygiene & Sensitive Data Sanitization
  // ==========================================
  describe("Subsystem 2: Context Builder & Secret Sanitization", () => {
    test("scrubSensitiveData redacts Gemini API keys, Bearer tokens, and secrets", () => {
      const input = `
        const key = "AQ.MockTestingPlaceholderKeyMustBeRedactedByRegex4567890";
        const legacy = "AIzaSyD9-FakeTestingMockKey35Characters123";
        const auth = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret";
        const pass = 'password = "superSecretPassword123"';
        const uri = "mongodb+srv://admin:pass@cluster0.mongodb.net/prod";
      `;
      const scrubbed = scrubSensitiveData(input);

      assert.ok(!scrubbed.includes("AQ.MockTestingPlaceholder"));
      assert.ok(!scrubbed.includes("AIzaSyD9"));
      assert.ok(!scrubbed.includes("superSecretPassword123"));
      assert.ok(!scrubbed.includes("cluster0.mongodb.net"));
      assert.ok(scrubbed.includes("[REDACTED_SECRET]"));
    });

    test("sanitizeContext limits active file to 300 lines and bounds snippet length", () => {
      const longCode = Array.from({ length: 450 }, (_, i) => `int line_${i} = ${i};`).join("\n");
      const sanitized = sanitizeContext({
        activeFile: {
          name: "large_source.cpp",
          language: "cpp",
          content: longCode,
        },
        selectedSnippet: "A".repeat(5000),
      });

      assert.strictEqual(sanitized.hasContext, true);
      assert.ok(sanitized.activeFile);
      assert.strictEqual(sanitized.activeFile.totalLines, 450);
      assert.ok(sanitized.activeFile.content.includes("[Truncated 150 additional lines]"));
      assert.ok(sanitized.selectedSnippet && sanitized.selectedSnippet.length <= 2000);
    });

    test("sanitizeContext handles empty or null input gracefully", () => {
      const empty = sanitizeContext(undefined);
      assert.strictEqual(empty.hasContext, false);
      assert.strictEqual(empty.activeFile, undefined);
    });
  });

  // ==========================================
  // 3. Next-Step Coding Guide Engine
  // ==========================================
  describe("Subsystem 3: Next-Step Coding Guide Engine", () => {
    test("Prioritizes compiler errors as primary blocker (Priority 1)", () => {
      const nextStep = determineDeterministicNextStep("int main() { return 0 }", "cpp", {
        diagnostics: [{ line: 1, message: "expected ';' before '}' token", severity: "error" }],
      });

      assert.strictEqual(nextStep.currentState, "compilation_error");
      assert.strictEqual(nextStep.actionType, "fix_compiler_error");
      assert.ok(nextStep.primaryBlocker?.includes("Line 1"));
      assert.ok(nextStep.immediateAction.includes("Fix the syntax"));
      assert.ok(NextStepAnalysisSchema.safeParse(nextStep).success);
    });

    test("Prioritizes runtime exceptions over untested code (Priority 2)", () => {
      const nextStep = determineDeterministicNextStep("print(1/0)", "python", {
        lastExecution: {
          status: "runtime_error",
          exitCode: 1,
          stderr: "ZeroDivisionError: division by zero",
        },
      });

      assert.strictEqual(nextStep.currentState, "runtime_error");
      assert.strictEqual(nextStep.actionType, "fix_runtime_bug");
      assert.ok(nextStep.primaryBlocker?.includes("ZeroDivisionError") || nextStep.summary.includes("Runtime failure"));
      assert.ok(NextStepAnalysisSchema.safeParse(nextStep).success);
    });

    test("Suggests testing for unexecuted or untested code (Priority 3)", () => {
      const fullCleanCode = `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`;
      const nextStep = determineDeterministicNextStep(
        fullCleanCode,
        "python",
        {
          activeFile: {
            name: "solution.py",
            language: "python",
            content: fullCleanCode,
            totalLines: 12,
          },
        }
      );

      assert.strictEqual(nextStep.currentState, "untested");
      assert.strictEqual(nextStep.actionType, "write_tests");
      assert.ok(nextStep.immediateAction.includes("Create unit test") || nextStep.immediateAction.includes("test"));
      assert.ok(NextStepAnalysisSchema.safeParse(nextStep).success);
    });

    test("Recommends Big-O analysis or documentation for verified clean code (Priority 4)", () => {
      const nextStep = determineDeterministicNextStep("print('Hello CodeLynx')", "python", {
        lastExecution: {
          status: "success",
          exitCode: 0,
          stdout: "Hello CodeLynx",
        },
        diagnostics: [],
      });

      assert.strictEqual(nextStep.currentState, "verified_clean");
      assert.strictEqual(nextStep.actionType, "optimize_or_document");
      assert.ok(NextStepAnalysisSchema.safeParse(nextStep).success);
    });
  });

  // ==========================================
  // 4. Progressive 5-Level Hint Hierarchy
  // ==========================================
  describe("Subsystem 4: Progressive 5-Level Hint Hierarchy", () => {
    test("Enforces sequential hint progression through all 5 levels", () => {
      const levels = [
        "small_nudge",
        "stronger_pointer",
        "algorithmic_idea",
        "debugging_clue",
        "full_solution",
      ];

      levels.forEach((lvl, idx) => {
        const meta = HINT_LEVEL_METADATA[lvl];
        assert.strictEqual(meta.number, idx + 1);
        if (idx < 4) {
          assert.strictEqual(meta.next, levels[idx + 1]);
        } else {
          assert.strictEqual(meta.next, undefined);
        }
      });
    });

    test("Level 1 (small_nudge) never contains code snippets", () => {
      const hint = generateDeterministicHint(
        "def twoSum(nums, target): pass",
        "python",
        "small_nudge"
      );

      assert.strictEqual(hint.level, "small_nudge");
      assert.strictEqual(hint.levelNumber, 1);
      assert.strictEqual(hint.nextLevelAvailable, true);
      assert.strictEqual(hint.codeSnippet, undefined);
      assert.ok(HintResultSchema.safeParse(hint).success);
    });

    test("Level 3 (algorithmic_idea) explains algorithm paradigm without giving full solution", () => {
      const hint = generateDeterministicHint(
        "def twoSum(nums, target): pass",
        "python",
        "algorithmic_idea"
      );

      assert.strictEqual(hint.level, "algorithmic_idea");
      assert.strictEqual(hint.levelNumber, 3);
      assert.strictEqual(hint.nextLevelAvailable, true);
      assert.ok(hint.hint.toLowerCase().includes("hash") || hint.hint.toLowerCase().includes("lookup") || hint.hint.toLowerCase().includes("strategy") || hint.hint.toLowerCase().includes("space"));
      assert.ok(HintResultSchema.safeParse(hint).success);
    });

    test("Level 5 (full_solution) provides the complete working snippet", () => {
      const hint = generateDeterministicHint(
        "def rev(a): pass",
        "python",
        "full_solution"
      );

      assert.strictEqual(hint.level, "full_solution");
      assert.strictEqual(hint.levelNumber, 5);
      assert.strictEqual(hint.nextLevelAvailable, false);
      assert.ok(hint.codeSnippet && hint.codeSnippet.length > 0);
      assert.ok(HintResultSchema.safeParse(hint).success);
    });
  });

  // ==========================================
  // 5. Task-Aware Coding Plan Engine
  // ==========================================
  describe("Subsystem 5: Task-Aware Coding Plan Engine", () => {
    test("Generates structured coding plan with blocker flags and step rationale", () => {
      const plan = generateDeterministicPlan(
        "Implement LRU Cache with O(1) get and put",
        "cpp",
        "class LRUCache {};"
      );

      assert.ok(plan.id.startsWith("plan_"));
      assert.strictEqual(plan.language, "cpp");
      assert.ok(plan.steps.length >= 4);

      // Verify that at least one step handles boundary conditions and is marked as blocker
      const boundaryStep = plan.steps.find((s) => s.id === "step_3");
      assert.ok(boundaryStep);
      assert.strictEqual(boundaryStep.isBlocker, true);
      assert.ok(boundaryStep.whyNecessary?.length > 0);

      // Verify Definition of Done items
      assert.ok(plan.definitionOfDone.length >= 3);
      assert.ok(CodingPlanSchema.safeParse(plan).success);
    });

    test("PlanStepSchema validates custom step status updates", () => {
      const step = {
        id: "step_custom_1",
        title: "Write parameterized tests",
        description: "Test boundary inputs: empty array, single element, negative numbers.",
        status: "in_progress",
        isBlocker: false,
        whyNecessary: "Prevents undetected regressions.",
      };

      const parsed = PlanStepSchema.parse(step);
      assert.strictEqual(parsed.status, "in_progress");
      assert.strictEqual(parsed.isBlocker, false);
    });
  });
});
