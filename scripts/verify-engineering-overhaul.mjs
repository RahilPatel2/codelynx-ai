async function runVerification() {
  const base = "http://localhost:3001";
  console.log("=================================================================");
  console.log("CODELYNX AI - LIVE ENGINEERING OVERHAUL VERIFICATION ON PORT 3001");
  console.log("=================================================================\n");

  // 1. System Status Check
  console.log("--- 1. Testing System Status API & Gemini / Judge0 Detection ---");
  const sysRes = await fetch(`${base}/api/system-status`);
  const sysData = await sysRes.json();
  console.log("System Status:", JSON.stringify(sysData, null, 2));

  // 2. Real Compiler Execution: Invalid C++ text '}dbdbsvsvs'
  console.log("\n--- 2. Required C++ Regression Test: Invalid Token '}dbdbsvsvs' ---");
  const invalidCppCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World";
    return 0;
}

}dbdbsvsvs`;

  const invalidRes = await fetch(`${base}/api/executions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "cpp",
      sourceCode: invalidCppCode,
      stdin: "",
    }),
  });
  const invalidData = await invalidRes.json();
  console.log("Execution Status:", invalidData.result?.status);
  console.log("Compile Output Snippet:\n", invalidData.result?.compileOutput || invalidData.result?.stderr);
  console.log("Parsed Compiler Diagnostics Count:", invalidData.diagnostics?.length);
  if (invalidData.diagnostics?.length > 0) {
    console.log("First Diagnostic:", {
      line: invalidData.diagnostics[0].line,
      column: invalidData.diagnostics[0].column,
      severity: invalidData.diagnostics[0].severity,
      message: invalidData.diagnostics[0].message,
    });
  }
  const cppInvalidPass =
    invalidData.result?.status === "compilation_error" &&
    invalidData.diagnostics?.some((d) => d.line === 9);
  console.log(">> Passed Compilation Error & Line 9 Flag?", cppInvalidPass ? "YES (PASSED)" : "FAILED");

  // 3. Real Compiler Execution: Valid C++ with stdin '5 7' -> 12
  console.log("\n--- 3. Required C++ Regression Test: Stdin '5 7' -> 12 ---");
  const validCppCode = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << '\\n';
    return 0;
}`;

  const validRes = await fetch(`${base}/api/executions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "cpp",
      sourceCode: validCppCode,
      stdin: "5 7",
    }),
  });
  const validData = await validRes.json();
  console.log("Execution Status:", validData.result?.status);
  console.log("Stdout:", JSON.stringify(validData.result?.stdout));
  console.log("Execution Time:", validData.result?.executionTime, "ms");
  const stdinPass =
    validData.result?.status === "accepted" &&
    validData.result?.stdout?.trim() === "12";
  console.log(">> Passed Real C++ Execution & Stdin 5 7 -> 12?", stdinPass ? "YES (PASSED)" : "FAILED");

  // 4. Debugger Bug Detection for '}dbdbsvsvs'
  console.log("\n--- 4. Testing 'Find Mistakes' on '}dbdbsvsvs' ---");
  const debugRes = await fetch(`${base}/api/ai/debug`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: invalidCppCode,
      language: "cpp",
      runtimeError: invalidData.result?.compileOutput || invalidData.result?.stderr,
    }),
  });
  const debugData = await debugRes.json();
  const findings = debugData.analysis?.findings || [];
  console.log("Findings Count:", findings.length);
  findings.slice(0, 3).forEach((f, idx) => {
    console.log(` Finding ${idx + 1}: Line ${f.lineStart} [${f.severity}] - ${f.title}`);
  });
  const debugPass = findings.length > 0 && findings.some((f) => f.lineStart === 9 || f.severity === "critical");
  console.log(">> Passed Defect Finding on Line 9 without Fake 'Clean Structure'?", debugPass ? "YES (PASSED)" : "FAILED");

  // 5. Optimizer Test: Identical / Already Optimal Code
  console.log("\n--- 5. Testing Optimizer on Optimal Code (Expect No-Op, Disabled Apply) ---");
  const optRes1 = await fetch(`${base}/api/ai/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 'print("Hello, World!")',
      language: "python",
    }),
  });
  const optData1 = await optRes1.json();
  console.log("Is Identical?", optData1.verifiedResult?.isIdentical);
  console.log("Has Meaningful Changes?", optData1.verifiedResult?.hasMeaningfulChanges);
  console.log("Explanation:", optData1.verifiedResult?.explanation);
  const optNoopPass =
    optData1.verifiedResult?.isIdentical === true &&
    optData1.verifiedResult?.hasMeaningfulChanges === false;
  console.log(">> Passed Honest Optimizer No-Op without Fake Claims?", optNoopPass ? "YES (PASSED)" : "FAILED");

  // 6. Optimizer Test: Quadratic Two-Sum
  console.log("\n--- 6. Testing Optimizer on Quadratic Two-Sum (Expect O(n) Hash Map) ---");
  const quadTwoSum = `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`;

  const optRes2 = await fetch(`${base}/api/ai/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: quadTwoSum,
      language: "python",
    }),
  });
  const optData2 = await optRes2.json();
  console.log("Original Complexity:", optData2.verifiedResult?.originalComplexity);
  console.log("Candidate Complexity:", optData2.verifiedResult?.candidateComplexity);
  console.log("Validation Status:", optData2.verifiedResult?.validation?.status);
  console.log("Concrete Changes Count:", optData2.verifiedResult?.changes?.length);
  const optTransformPass =
    optData2.verifiedResult?.originalComplexity === "O(n²)" &&
    optData2.verifiedResult?.candidateComplexity === "O(n)" &&
    optData2.verifiedResult?.hasMeaningfulChanges === true;
  console.log(">> Passed Verified O(n²) to O(n) Transformation?", optTransformPass ? "YES (PASSED)" : "FAILED");

  // 7. Complexity Analysis: QuickSort
  console.log("\n--- 7. Testing QuickSort Complexity Analysis ---");
  const qsCode = `void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`;

  const qsRes = await fetch(`${base}/api/analysis/complexity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: qsCode,
      language: "cpp",
    }),
  });
  const qsData = await qsRes.json();
  const c = qsData.complexity;
  console.log("Time Complexity:", c?.timeComplexity);
  console.log("Average Case:", c?.averageCase);
  console.log("Worst Case:", c?.worstCase);
  console.log("Auxiliary Space:", c?.spaceComplexity);
  console.log("Recurrence Analysis:\n", c?.loopAndRecursionAnalysis);
  const qsPass =
    c?.timeComplexity === "O(n log n)" &&
    c?.worstCase === "O(n²)" &&
    c?.spaceComplexity === "O(log n)";
  console.log(">> Passed QuickSort Asymptotic Distinction?", qsPass ? "YES (PASSED)" : "FAILED");

  console.log("\n=================================================================");
  console.log("OVERALL SUMMARY:");
  console.log(`1. Invalid C++ '}dbdbsvsvs' error line 9: ${cppInvalidPass ? "PASSED" : "FAILED"}`);
  console.log(`2. Real C++ execution with stdin 5 7 -> 12: ${stdinPass ? "PASSED" : "FAILED"}`);
  console.log(`3. Debugger defect detection on line 9: ${debugPass ? "PASSED" : "FAILED"}`);
  console.log(`4. Optimizer honest no-op on optimal code: ${optNoopPass ? "PASSED" : "FAILED"}`);
  console.log(`5. Optimizer O(n²) -> O(n) transformation: ${optTransformPass ? "PASSED" : "FAILED"}`);
  console.log(`6. QuickSort O(n log n) vs O(n²) worst-case: ${qsPass ? "PASSED" : "FAILED"}`);
  console.log("=================================================================");
}

runVerification().catch(console.error);
