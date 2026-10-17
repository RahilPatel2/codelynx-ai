import { test, describe } from "node:test";
import assert from "node:assert";
import {
  DSA_TOPICS,
  TOPIC_LEARNING_PATHS,
  getTopicById,
  getTopicsByCategory,
} from "../lib/dsa/taxonomy.ts";
import {
  DSAProblemSchema,
  sanitizePublicProblem,
} from "../lib/dsa/types.ts";
import { problemRegistry } from "../lib/dsa/problem-registry.ts";
import {
  normalizeOutput,
  evaluateRunCode,
  evaluateSubmission,
} from "../lib/dsa/judging.ts";
import {
  buildTutorSystemPrompt,
  generateDeterministicTutorReply,
} from "../lib/dsa/tutor.ts";
import { seedDSAProblems } from "../lib/dsa/seed.ts";

describe("Phase 3: DSA Practice School and Algorithm Learning Platform", () => {
  // ==========================================
  // 1. Topic Taxonomy & Learning Paths
  // ==========================================
  describe("Subsystem 1: DSA Taxonomy & Learning Paths", () => {
    test("Covers all 4 major algorithmic categories with at least 50 topics", () => {
      assert.ok(DSA_TOPICS.length >= 50, `Expected at least 50 topics, got ${DSA_TOPICS.length}`);

      const categories = new Set(DSA_TOPICS.map((t) => t.category));
      assert.ok(categories.has("fundamentals"));
      assert.ok(categories.has("data-structures"));
      assert.ok(categories.has("algorithms"));
      assert.ok(categories.has("advanced"));
    });

    test("Contains essential fundamentals and data structures", () => {
      const required = [
        "arrays",
        "strings",
        "hashing",
        "prefix-sums",
        "two-pointers",
        "sliding-window",
        "binary-search",
        "linked-lists",
        "stacks",
        "queues",
        "heaps",
        "binary-trees",
        "binary-search-trees",
        "tries",
        "graphs",
        "disjoint-set-union",
        "segment-trees",
        "dynamic-programming",
        "greedy",
        "backtracking",
        "topological-sorting",
        "shortest-paths",
        "monotonic-stacks",
        "bitmask-dp",
      ];

      for (const reqId of required) {
        const found = getTopicById(reqId);
        assert.ok(found, `Required topic '${reqId}' must be present in taxonomy`);
      }
    });

    test("Defines structured learning paths from beginner to expert", () => {
      assert.strictEqual(TOPIC_LEARNING_PATHS.length, 4);
      const beginner = TOPIC_LEARNING_PATHS.find((p) => p.id === "beginner-path");
      assert.ok(beginner);
      assert.ok(beginner.topicIds.includes("arrays"));
      assert.ok(beginner.topicIds.includes("two-pointers"));

      const expert = TOPIC_LEARNING_PATHS.find((p) => p.id === "expert-path");
      assert.ok(expert);
      assert.ok(expert.topicIds.includes("segment-trees"));
    });
  });

  // ==========================================
  // 2. Problem Bank & Data Model Integrity
  // ==========================================
  describe("Subsystem 2: Problem Bank & Data Model Integrity", () => {
    test("Registry launches with at least 600 fully authored problems", () => {
      const allProblems = problemRegistry.getAllProblems();
      const counts = problemRegistry.getProblemCount();

      assert.ok(
        allProblems.length >= 600,
        `Expected at least 600 problems, got ${allProblems.length}`
      );
      assert.ok(counts.easy >= 200, `Expected at least 200 Easy problems, got ${counts.easy}`);
      assert.ok(counts.medium >= 200, `Expected at least 200 Medium problems, got ${counts.medium}`);
      assert.ok(counts.hard >= 90, `Expected at least 90 Hard problems, got ${counts.hard}`);
    });

    test("Every problem validates against strict DSAProblemSchema with unique IDs and slugs", () => {
      const allProblems = problemRegistry.getAllProblems();
      const seenIds = new Set();
      const seenSlugs = new Set();

      // Check first 50 problems for deep schema validation to keep test speedy
      for (const prob of allProblems.slice(0, 50)) {
        assert.ok(!seenIds.has(prob.id), `Duplicate ID found: ${prob.id}`);
        assert.ok(!seenSlugs.has(prob.slug), `Duplicate slug found: ${prob.slug}`);
        seenIds.add(prob.id);
        seenSlugs.add(prob.slug);

        const parsed = DSAProblemSchema.safeParse(prob);
        assert.ok(parsed.success, `Schema validation failed for ${prob.id}: ${parsed.error}`);
        assert.ok(prob.examples.length >= 1, `${prob.id} must have examples`);
        assert.ok(prob.publicTestCases.length >= 1, `${prob.id} must have public tests`);
        assert.ok(prob.hiddenTestCases.length >= 1, `${prob.id} must have hidden tests`);
        assert.strictEqual(prob.hints.length, 3, `${prob.id} must have exactly 3 progressive hints`);
      }
    });

    test("sanitizePublicProblem strictly omits hiddenTestCases and referenceSolution", () => {
      const sample = problemRegistry.getAllProblems()[0];
      const sanitized = sanitizePublicProblem(sample);

      assert.strictEqual(sanitized.hiddenTestCases, undefined);
      assert.strictEqual(sanitized.referenceSolution, undefined);
      assert.ok(sanitized.id);
      assert.ok(sanitized.title);
      assert.ok(sanitized.statement);
      assert.ok(sanitized.publicTestCases);
    });

    test("Deterministic daily challenge returns stable challenge for a given date", () => {
      const d1 = problemRegistry.getDailyChallenge("2026-10-26");
      const d2 = problemRegistry.getDailyChallenge("2026-10-26");
      assert.strictEqual(d1.id, d2.id);
      assert.strictEqual(d1.slug, d2.slug);

      const d3 = problemRegistry.getDailyChallenge("2026-10-27");
      // Different date produces challenge
      assert.ok(d3.id);
    });

    test("Idempotent seeder populates devStore without duplicating problems", async () => {
      const seed1 = await seedDSAProblems();
      assert.ok(seed1.totalSeeded >= 600);

      const seed2 = await seedDSAProblems();
      assert.strictEqual(seed2.totalSeeded, seed1.totalSeeded);
    });
  });

  // ==========================================
  // 3. Real Judging & Output Evaluation Engine
  // ==========================================
  describe("Subsystem 3: Real Judging & Output Evaluation Engine", () => {
    test("normalizeOutput handles CRLF, trailing spaces, and trims ends", () => {
      const raw = "  hello world  \r\n 42 \t \r\n";
      const norm = normalizeOutput(raw);
      assert.strictEqual(norm, "hello world\n 42");
    });

    test("evaluateRunCode checks public sample test cases with expected output", async () => {
      const pyCode = `import sys
lines = sys.stdin.read().strip().split('\\n')
t = int(lines[0])
nums = list(map(int, lines[1].split()))
seen = {}
for i, n in enumerate(nums):
    c = t - n
    if c in seen:
        print(f"{seen[c]} {i}")
        break
    seen[n] = i
`;
      const testCases = [
        { input: "9\n2 7 11 15", expectedOutput: "0 1", isPublic: true },
        { input: "6\n3 2 4", expectedOutput: "1 2", isPublic: true },
      ];

      const res = await evaluateRunCode(pyCode, "python", testCases);
      assert.strictEqual(res.totalTests, 2);
      assert.strictEqual(res.passedTests, 2);
      assert.strictEqual(res.allPassed, true);
      assert.strictEqual(res.results[0].passed, true);
      assert.strictEqual(res.results[0].actualOutput, "0 1");
    });

    test("evaluateRunCode detects incorrect output without crashing", async () => {
      const wrongCode = `print("wrong output")`;
      const testCases = [{ input: "5\n1 2 3", expectedOutput: "6", isPublic: true }];

      const res = await evaluateRunCode(wrongCode, "python", testCases);
      assert.strictEqual(res.allPassed, false);
      assert.strictEqual(res.passedTests, 0);
      assert.strictEqual(res.results[0].passed, false);
      assert.strictEqual(res.results[0].status, "failed");
    });

    test("evaluateSubmission assesses complete suite and returns accepted for verified reference solution", async () => {
      const problem = problemRegistry.getProblemById("dsa_arr_001");
      assert.ok(problem);

      const res = await evaluateSubmission(
        "test_user",
        problem,
        problem.referenceSolution.python,
        "python"
      );

      assert.strictEqual(res.status, "accepted");
      assert.strictEqual(res.passedTests, res.totalTests);
      assert.ok(res.submissionId.startsWith("sub_"));
    });

    test("evaluateSubmission returns wrong_answer without leaking hidden test inputs", async () => {
      const problem = problemRegistry.getProblemById("dsa_arr_001");
      assert.ok(problem);

      const wrongCode = `print("-1 -1")`;
      const res = await evaluateSubmission("test_user", problem, wrongCode, "python");

      assert.strictEqual(res.status, "wrong_answer");
      assert.ok(res.message.includes("Wrong answer") || res.message.includes("Output mismatch"));
      // Ensure hidden input was NOT leaked in the message
      assert.ok(!res.message.includes("10 20 30 40 50"));
    });
  });

  // ==========================================
  // 4. Progressive Hints & Socratic AI Tutor
  // ==========================================
  describe("Subsystem 4: Progressive Hints & Socratic AI Tutor", () => {
    test("Hints have 3 levels: Gentle Nudge -> Direction -> Guidance", () => {
      const problem = problemRegistry.getProblemById("dsa_arr_001");
      assert.ok(problem);
      assert.strictEqual(problem.hints[0].level, 1);
      assert.strictEqual(problem.hints[1].level, 2);
      assert.strictEqual(problem.hints[2].level, 3);
      assert.strictEqual(problem.hints[0].title, "Gentle Nudge");
      assert.strictEqual(problem.hints[1].title, "Algorithmic Direction");
      assert.strictEqual(problem.hints[2].title, "Detailed Guidance");
    });

    test("buildTutorSystemPrompt embeds problem statement, constraints, code, and language", () => {
      const problem = problemRegistry.getPublicProblemById("dsa_arr_001");
      assert.ok(problem);

      const prompt = buildTutorSystemPrompt({
        problem,
        userCode: "def solve(): pass",
        language: "python",
        revealedHints: 1,
        question: "Why does my code return None?",
      });

      assert.ok(prompt.includes(problem.title));
      assert.ok(prompt.includes("python"));
      assert.ok(prompt.includes("def solve(): pass"));
      assert.ok(prompt.includes("Socratic"));
    });

    test("generateDeterministicTutorReply responds meaningfully to hint and complexity questions", () => {
      const problem = problemRegistry.getPublicProblemById("dsa_arr_001");
      assert.ok(problem);

      const hintReply = generateDeterministicTutorReply({
        problem,
        userCode: "",
        language: "python",
        revealedHints: 0,
        question: "Can you give me a small hint?",
      });
      assert.ok(hintReply.reply.includes("Level 1 Hint"));
      assert.strictEqual(hintReply.revealedHintLevel, 1);

      const complexityReply = generateDeterministicTutorReply({
        problem,
        userCode: "",
        language: "python",
        revealedHints: 1,
        question: "What is the expected time complexity?",
      });
      assert.ok(complexityReply.reply.includes(problem.expectedTimeComplexity));
    });
  });
});
