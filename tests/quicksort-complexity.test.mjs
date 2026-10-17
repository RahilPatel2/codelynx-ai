import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { algorithmicComplexityAnalyzer } from "../lib/analysis/complexity.ts";

describe("Algorithmic Complexity & QuickSort Rigorous Analysis", () => {
  test("Standard QuickSort distinguishes best/average O(n log n) from worst-case O(n²)", () => {
    const quicksortCode = `
void swap(int& a, int& b) {
    int t = a; a = b; b = t;
}

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}
`;

    const result = algorithmicComplexityAnalyzer.analyze(quicksortCode, "cpp");
    assert.equal(result.timeComplexity, "O(n log n)");
    assert.equal(result.averageCase, "O(n log n)");
    assert.equal(result.worstCase, "O(n²)");
    assert.equal(result.spaceComplexity, "O(log n)");
    assert.match(result.loopAndRecursionAnalysis, /T\(n\)\s*=\s*T\(k\)\s*\+\s*T\(n\s*-\s*k\s*-\s*1\)/i);
    assert.match(result.explanation, /in-place partitioning/i);
    assert.match(result.explanation, /worst-case time is O\(n²\)/i);
  });

  test("Hello World is classified as O(1) time and O(1) auxiliary space", () => {
    const code = `#include <iostream>\nint main() {\n    std::cout << "Hello, World!\\n";\n    return 0;\n}`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "cpp");
    assert.equal(result.timeComplexity, "O(1)");
    assert.equal(result.spaceComplexity, "O(1)");
    assert.equal(result.bestCase, "O(1)");
    assert.equal(result.worstCase, "O(1)");
  });

  test("Fixed-bound loop (e.g. 10 iterations) is classified as O(1) time", () => {
    const code = `for i in range(10):\n    print(i)`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "python");
    assert.equal(result.timeComplexity, "O(1)");
    assert.equal(result.spaceComplexity, "O(1)");
  });

  test("Single input-dependent loop is classified as O(n)", () => {
    const code = `def print_all(arr):\n    for item in arr:\n        print(item)`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "python");
    assert.equal(result.timeComplexity, "O(n)");
    assert.equal(result.spaceComplexity, "O(1)");
  });

  test("Nested input-dependent loops are classified as O(n²)", () => {
    const code = `def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr)):\n            if arr[i] > arr[j]:\n                pass`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "python");
    assert.equal(result.timeComplexity, "O(n²)");
  });

  test("Sequential input loops are classified as O(n), NOT O(n²)", () => {
    const code = `def process(arr):\n    for i in range(len(arr)):\n        print(arr[i])\n    for j in range(len(arr)):\n        print(arr[j])`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "python");
    assert.equal(result.timeComplexity, "O(n)");
    assert.match(result.loopAndRecursionAnalysis, /additive/i);
  });

  test("Logarithmic loop (multiplicative step i *= 2) is classified as O(log n)", () => {
    const code = `for (int i = 1; i < n; i *= 2) {\n    cout << i;\n}`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "cpp");
    assert.equal(result.timeComplexity, "O(log n)");
    assert.equal(result.spaceComplexity, "O(1)");
  });

  test("Dynamic auxiliary buffer vector<int> v(n) classified as O(n) space", () => {
    const code = `vector<int> v(n);\nfor (int i = 0; i < n; i++) v[i] = i;`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "cpp");
    assert.equal(result.timeComplexity, "O(n)");
    assert.equal(result.spaceComplexity, "O(n)");
  });

  test("Constant size buffer int arr[10] classified as O(1) space", () => {
    const code = `int arr[10];\nfor (int i = 0; i < 10; i++) arr[i] = i;`;
    const result = algorithmicComplexityAnalyzer.analyze(code, "cpp");
    assert.equal(result.timeComplexity, "O(1)");
    assert.equal(result.spaceComplexity, "O(1)");
  });

  test("MergeSort is classified as O(n log n) with O(n) auxiliary space", () => {
    const mergeCode = `void mergeSort(int arr[], int l, int r) {\n    if (l < r) {\n        int mid = l + (r - l) / 2;\n        mergeSort(arr, l, mid);\n        mergeSort(arr, mid + 1, r);\n        merge(arr, l, mid, r);\n    }\n}`;
    const result = algorithmicComplexityAnalyzer.analyze(mergeCode, "cpp");
    assert.equal(result.timeComplexity, "O(n log n)");
    assert.equal(result.spaceComplexity, "O(n)");
  });
});
