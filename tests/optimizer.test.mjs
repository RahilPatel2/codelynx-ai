import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { optimizerEngine } from "../lib/optimizer/engine.ts";

describe("Verified Optimizer Engine - Subsystem D", () => {
  test("Step A: Captures an immutable snapshot with content hash and source version", () => {
    const code = `def solve(n):\n    return n * 2\n`;
    const snap = optimizerEngine.createSnapshot("file-1", "main.py", code, "python", 3);

    assert.equal(snap.fileId, "file-1");
    assert.equal(snap.fileName, "main.py");
    assert.equal(snap.language, "python");
    assert.equal(snap.sourceVersion, 3);
    assert.equal(typeof snap.contentHash, "string");
    assert.equal(snap.contentHash.length > 0, true);
  });

  test("Step B-C: Optimizes quadratic two-sum into linear O(n) hash map with concrete changes", async () => {
    const original = `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`;

    const snap = optimizerEngine.createSnapshot("f-py", "main.py", original, "python", 1);
    const result = await optimizerEngine.optimize(snap);

    assert.equal(result.hasMeaningfulChanges, true);
    assert.equal(result.isIdentical, false);
    assert.equal(result.category, "algorithmic");
    assert.equal(result.originalComplexity, "O(n²)");
    assert.equal(result.candidateComplexity, "O(n)");
    assert.equal(result.changes.length >= 1, true);
    assert.equal(result.validation.status, "verified");
    assert.equal(result.candidateSource.includes("lookup"), true);
  });

  test("Step E: Disables optimization for identical / optimal code without fake percentage claims", async () => {
    const optimalCode = `def hello():\n    print("Hello, world!")\n`;
    const snap = optimizerEngine.createSnapshot("f-opt", "main.py", optimalCode, "python", 1);
    const result = await optimizerEngine.optimize(snap);

    assert.equal(result.hasMeaningfulChanges, false);
    assert.equal(result.isIdentical, true);
    assert.equal(result.category, "none");
    assert.equal(result.changes.length, 0);
    assert.match(result.explanation, /No meaningful code changes were generated/i);
    // Never invent fake percentages for identical code
    assert.equal(result.candidateSource, optimalCode);
  });

  test("Step F: verifyCanApply rejects application when candidate is identical", () => {
    const code = `print("Hello")`;
    const snap = optimizerEngine.createSnapshot("f-1", "main.py", code, "python", 1);
    const check = optimizerEngine.verifyCanApply(code, snap, code);

    assert.equal(check.canApply, false);
    assert.match(check.reason, /identical/i);
  });

  test("Step F: verifyCanApply rejects application if source was edited after snapshot (conflict)", () => {
    const original = `for i in range(10):\n    pass`;
    const candidate = `lookup = {}`;
    const snap = optimizerEngine.createSnapshot("f-1", "main.py", original, "python", 1);

    const editedSource = `for i in range(10):\n    # user added edit here\n    pass`;
    const check = optimizerEngine.verifyCanApply(editedSource, snap, candidate);

    assert.equal(check.canApply, false);
    assert.match(check.reason, /modified/i);
  });

  test("Step F: verifyCanApply permits application when source matches snapshot and candidate differs", () => {
    const original = `for i in range(10):\n    pass`;
    const candidate = `lookup = {}`;
    const snap = optimizerEngine.createSnapshot("f-1", "main.py", original, "python", 1);

    const check = optimizerEngine.verifyCanApply(original, snap, candidate);
    assert.equal(check.canApply, true);
  });
});
