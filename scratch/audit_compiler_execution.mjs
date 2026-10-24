async function auditCompiler() {
  console.log("=== AUDITING COMPILER & EXECUTION ENGINE ===");

  // TEST 1: C++ with stdin Rahil
  const cppCode = `#include <iostream>
using namespace std;

int main() {
    string name;
    cin >> name;
    cout << "Hello " << name;
    return 0;
}`;

  console.log("\n[Test 1] C++ stdin execution (Rahil -> Hello Rahil)...");
  const cppRes = await fetch("http://127.0.0.1:3001/api/executions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "cpp",
      sourceCode: cppCode,
      stdin: "Rahil"
    })
  });
  const cppData = await cppRes.json();
  const cppOut = cppData.result?.stdout?.trim();
  console.log("C++ Status:", cppData.result?.status);
  console.log("C++ Output:", `"${cppOut}"`);
  console.log("C++ Match:", cppOut === "Hello Rahil");

  // TEST 2: Python with stdin Rahil
  const pyCode = `name = input()
print("Hello", name)
`;
  console.log("\n[Test 2] Python stdin execution (Rahil -> Hello Rahil)...");
  const pyRes = await fetch("http://127.0.0.1:3001/api/executions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "python",
      sourceCode: pyCode,
      stdin: "Rahil"
    })
  });
  const pyData = await pyRes.json();
  const pyOut = pyData.result?.stdout?.trim();
  console.log("Python Status:", pyData.result?.status);
  console.log("Python Output:", `"${pyOut}"`);
  console.log("Python Match:", pyOut === "Hello Rahil");

  // TEST 3: Invalid C++ source (snvwribvs)
  const invalidCpp = `int main() {
    snvwribvs
    return 0;
}`;
  console.log("\n[Test 3] Invalid C++ compilation failure diagnostic...");
  const errRes = await fetch("http://127.0.0.1:3001/api/executions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "cpp",
      sourceCode: invalidCpp
    })
  });
  const errData = await errRes.json();
  console.log("Error status:", errData.result?.status);
  console.log("Has compiler output:", Boolean(errData.result?.compileOutput || errData.result?.stderr));
  console.log("Diagnostic excerpt:", (errData.result?.compileOutput || errData.result?.stderr || "").slice(0, 100));

  // TEST 4: Java Stdin Execution
  const javaCode = `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.next();
        System.out.println("Hello " + name);
    }
}`;
  console.log("\n[Test 4] Java stdin execution...");
  const javaRes = await fetch("http://127.0.0.1:3001/api/executions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "java",
      sourceCode: javaCode,
      stdin: "Rahil"
    })
  });
  const javaData = await javaRes.json();
  const javaOut = javaData.result?.stdout?.trim();
  console.log("Java Status:", javaData.result?.status);
  console.log("Java Output:", `"${javaOut}"`);
  console.log("Java Match:", javaOut === "Hello Rahil");

  // TEST 5: Timeout handling
  const timeoutPy = `while True:
    pass
`;
  console.log("\n[Test 5] Infinite loop timeout handling...");
  const timeRes = await fetch("http://127.0.0.1:3001/api/executions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "python",
      sourceCode: timeoutPy
    })
  });
  const timeData = await timeRes.json();
  console.log("Timeout status:", timeData.result?.status);
  console.log("Is timeout or error:", timeData.result?.status === "time_limit_exceeded" || timeData.result?.status === "runtime_error");
}

auditCompiler().catch(console.error);
