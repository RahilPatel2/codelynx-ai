import { test, describe } from "node:test";
import assert from "node:assert";
import { DeterministicCodeAnalyzer } from "../lib/ai/heuristics.ts";

describe("Deterministic Complexity & Code Analyzer - Phase 5 Strict Verification", () => {
  const analyzer = new DeterministicCodeAnalyzer();

  test("TEST A — Hello World is classified as O(1) time and O(1) space", () => {
    const code = `
    #include <iostream>
    using namespace std;
    int main() {
        cout << "Hello World";
        return 0;
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(1)");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("TEST B — Constant arithmetic is classified as O(1) time and O(1) space", () => {
    const code = `
    int x = 5;
    int y = 10;
    int z = x + y;
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(1)");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("TEST C — Single input-dependent loop is classified as O(n) time and O(1) space", () => {
    const code = `
    for (int i = 0; i < n; i++) {
        cout << i;
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(n)");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("TEST D — Nested input-dependent loops are classified as O(n²) time and O(1) space", () => {
    const code = `
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << i << j;
        }
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(n²)");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("TEST E — Logarithmic loop (i *= 2) is classified as O(log n) time and O(1) space", () => {
    const code = `
    for (int i = 1; i < n; i *= 2) {
        cout << i;
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(log n)");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("TEST F — Sequential loops are classified as O(n) time, NOT O(n²)", () => {
    const code = `
    for (int i = 0; i < n; i++) {
        cout << i;
    }
    for (int j = 0; j < n; j++) {
        cout << j;
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(n)");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("TEST G — Linear auxiliary allocation is classified as O(n) space", () => {
    const code = `
    vector<int> values(n);
    for (int i = 0; i < n; i++) {
        values[i] = i;
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.spaceComplexity, "O(n)");
  });

  test("TEST H — Constant-size allocation is classified as O(1) space", () => {
    const code = `
    int values[10];
    for (int i = 0; i < 10; i++) {
        values[i] = i;
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("TEST J — Fixed-count loop is classified as O(1) time and O(1) space", () => {
    const code = `
    for (int i = 0; i < 10; i++) {
        cout << i;
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(1)");
    assert.strictEqual(result.spaceComplexity, "O(1)");
  });

  test("Divide and conquer (QuickSort) is classified as O(n log n)", () => {
    const code = `
    void quickSort(vector<int>& arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }
    `;
    const result = analyzer.analyzeComplexity(code, "cpp");
    assert.strictEqual(result.timeComplexity, "O(n log n)");
    assert.strictEqual(result.spaceComplexity, "O(log n)");
  });

  test("Bug detection: Detects off-by-one error in python range", () => {
    const code = `
    for i in range(len(nums) + 1):
        print(nums[i])
    `;
    const bugs = analyzer.analyzeBugs(code, "python");
    assert.strictEqual(bugs.hasCriticalBugs, true);
    assert.strictEqual(bugs.findings[0].id, "bug_off_by_one_python");
    assert.strictEqual(bugs.findings[0].severity, "high");
    assert.strictEqual(bugs.findings[0].lineStart, 2);
  });

  test("Bug fix: Corrects off-by-one bug automatically", () => {
    const code = `
    for i in range(len(nums) + 1):
        print(nums[i])
    `;
    const fix = analyzer.fixCode(code, "python");
    assert.strictEqual(fix.changesList.length > 0, true);
    assert.strictEqual(fix.fixedCode.includes("+ 1"), false);
  });
});
