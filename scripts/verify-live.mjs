async function test() {
  const base = "http://localhost:3001";

  console.log("=== 1. Testing System Status ===");
  const sysRes = await fetch(`${base}/api/system-status`);
  const sysData = await sysRes.json();
  console.log("Database status:", sysData.database.status);
  console.log("Execution status:", sysData.execution.status, `(${sysData.execution.endpoint})`);
  console.log("AI status:", sysData.ai.status);

  console.log("\n=== 2. Testing Hello World Complexity (Expect O(1) Time, O(1) Space) ===");
  const helloRes = await fetch(`${base}/api/analysis/complexity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 'print("Hello, World!")',
      language: "python"
    })
  });
  const helloData = await helloRes.json();
  const c = helloData.complexity;
  console.log("Time Complexity:", c.timeComplexity);
  console.log("Space Complexity:", c.spaceComplexity);
  console.log("Recurrence / Operation:", c.dominantOperations[0]);
  console.log("Verified O(1)?", c.timeComplexity === "O(1)" && c.spaceComplexity === "O(1)" ? "YES (PASSED)" : "FAILED");

  console.log("\n=== 3. Testing Nested Loop Complexity (Expect O(n²) Time) ===");
  const nestedRes = await fetch(`${base}/api/analysis/complexity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 'def bubble(arr):\n  for i in range(len(arr)):\n    for j in range(len(arr)):\n      pass',
      language: "python"
    })
  });
  const nestedData = await nestedRes.json();
  console.log("Nested Loop Time:", nestedData.complexity?.timeComplexity);
  console.log("Verified O(n²)?", nestedData.complexity?.timeComplexity === "O(n²)" ? "YES (PASSED)" : "FAILED");

  console.log("\n=== 4. Testing Real Code Execution with Stdin (C++ 5 7 -> 12) ===");
  const execRes = await fetch(`${base}/api/executions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceCode: '#include <iostream>\nusing namespace std;\nint main() {\n  int a, b;\n  if (cin >> a >> b) cout << a + b << endl;\n  return 0;\n}',
      language: "cpp",
      stdin: "5 7"
    })
  });
  const execData = await execRes.json();
  const r = execData.result;
  console.log("Execution Status:", r.status);
  console.log("Execution Stdout:", JSON.stringify(r.stdout));
  console.log("Execution Duration:", r.executionTime, "ms");
  console.log("Execution Provider:", r.provider);
  console.log("Verified 5 + 7 = 12?", r.stdout?.trim() === "12" ? "YES (PASSED)" : "FAILED");

  console.log("\n=== 5. Testing Debugger Bug Detection & Off-by-one Line Markers ===");
  const debugRes = await fetch(`${base}/api/ai/debug`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 'def find_sum(nums):\n  for i in range(len(nums) + 1):\n    print(nums[i])',
      language: "python"
    })
  });
  const debugData = await debugRes.json();
  const findings = debugData.analysis?.findings || [];
  console.log("Findings Count:", findings.length);
  if (findings.length > 0) {
    console.log("Finding 1 - LineStart:", findings[0].lineStart);
    console.log("Finding 1 - Severity:", findings[0].severity);
    console.log("Finding 1 - Title:", findings[0].title);
    console.log("Finding 1 - Explanation:", findings[0].explanation);
  }
  console.log("Verified Line 2 marker?", findings[0]?.lineStart === 2 ? "YES (PASSED)" : "FAILED");

  console.log("\n=== 6. Testing Workspace Page Response ===");
  const wsRes = await fetch(`${base}/workspace`);
  console.log("Workspace HTTP Status:", wsRes.status, wsRes.status === 200 ? "OK" : "ERROR");
}

test().catch(console.error);
