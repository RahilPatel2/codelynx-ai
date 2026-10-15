import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { compilerDiagnosticParser } from "../lib/diagnostics/compiler-parser.ts";
import { diagnosticsManager } from "../lib/diagnostics/manager.ts";
import { SandboxFallbackProvider } from "../lib/execution/sandbox-fallback.ts";

describe("Compiler Diagnostics & Parser Engine", () => {
  const sandbox = new SandboxFallbackProvider();

  test("Parses exact invalid C++ token '}dbdbsvsvs' diagnostic to Line 9", () => {
    const rawGccOutput = ` main.cpp:9:1: error: expected declaration before ‘}’ token
    9 | }dbdbsvsvs
      | ^
main.cpp:9:2: error: ‘dbdbsvsvs’ does not name a type
    9 | }dbdbsvsvs
      |  ^~~~~~~~~`;

    const diags = compilerDiagnosticParser.parse(rawGccOutput, "cpp", "main.cpp");
    assert.equal(diags.length >= 1, true, "Should parse at least one diagnostic");
    assert.equal(diags[0].line, 9, "Should report line 9");
    assert.equal(diags[0].severity, "error", "Severity must be error");
    assert.equal(diags[0].sourceProvider, "compiler");
  });

  test("Parses C++ missing semicolon diagnostic with exact line and column", () => {
    const rawGccOutput = `main.cpp:5:31: error: expected ';' before 'return'
    5 |     cout << "Hello World"
      |                          ^
      |                          ;
    6 |     return 0;`;

    const diags = compilerDiagnosticParser.parse(rawGccOutput, "cpp", "main.cpp");
    assert.equal(diags.length, 1);
    assert.equal(diags[0].line, 5);
    assert.equal(diags[0].column, 31);
    assert.equal(diags[0].severity, "error");
    assert.match(diags[0].message, /expected ';'/i);
  });

  test("Parses C++ undeclared identifier diagnostic", () => {
    const rawGccOutput = `main.cpp: In function 'int main()':
main.cpp:6:5: error: 'undeclared_var' was not declared in this scope
    6 |     undeclared_var = 42;
      |     ^~~~~~~~~~~~~~`;

    const diags = compilerDiagnosticParser.parse(rawGccOutput, "cpp", "main.cpp");
    assert.equal(diags.length, 1);
    assert.equal(diags[0].line, 6);
    assert.equal(diags[0].column, 5);
    assert.match(diags[0].message, /'undeclared_var' was not declared/i);
  });

  test("Parses Python traceback and SyntaxError with line number", () => {
    const pyOutput = `  File "main.py", line 4
    for i in range(10)
                      ^
SyntaxError: expected ':'`;

    const diags = compilerDiagnosticParser.parse(pyOutput, "python", "main.py");
    assert.equal(diags.length, 1);
    assert.equal(diags[0].line, 4);
    assert.equal(diags[0].category, "syntax");
    assert.match(diags[0].message, /SyntaxError: expected ':'/);
  });

  test("Parses Java compiler cannot find symbol error", () => {
    const javaOutput = `Main.java:5: error: cannot find symbol
        System.out.println(nonExistentVar);
                           ^
  symbol:   variable nonExistentVar
  location: class Main`;

    const diags = compilerDiagnosticParser.parse(javaOutput, "java", "Main.java");
    assert.equal(diags.length, 1);
    assert.equal(diags[0].line, 5);
    assert.equal(diags[0].severity, "error");
    assert.match(diags[0].message, /cannot find symbol/i);
  });

  test("Deterministic syntax checker catches unclosed bracket prior to dispatch", () => {
    const code = `int main() {\n    cout << "test";\n`;
    const err = sandbox.checkBasicSyntax(code, "cpp");
    assert.notEqual(err, null);
    assert.match(err, /Unclosed bracket '{'/);
  });

  test("Deterministic syntax checker catches unexpected bracket in '}dbdbsvsvs'", () => {
    const code = `#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}\n}dbdbsvsvs\n`;
    const err = sandbox.checkBasicSyntax(code, "cpp");
    assert.notEqual(err, null);
    assert.match(err, /Unexpected closing bracket '}' at line 6/);
  });

  test("DiagnosticsManager generates honest summary without false clean claims", () => {
    // When only basic syntax ran and compiler/AI have not run, status is honestly 'incomplete'
    const syntaxOnly = diagnosticsManager.generateSnapshot({
      sourceCode: `int main() { return 0; }`,
      language: "cpp",
      sourceVersion: 1,
      contentHash: "hash1",
      compilerAvailable: true,
      aiAvailable: false,
    });
    assert.equal(syntaxOnly.summary.status, "incomplete");
    assert.equal(syntaxOnly.summary.errorCount, 0);
    assert.equal(syntaxOnly.summary.checksExecuted.ai, false);

    // When full compiler check ran and succeeded, status is 'clean'
    const fullCheck = diagnosticsManager.generateSnapshot({
      sourceCode: `int main() { return 0; }`,
      language: "cpp",
      sourceVersion: 1,
      contentHash: "hash1",
      compilerOutput: { status: "accepted", compileOutput: "", stderr: "" },
      compilerAvailable: true,
      aiAvailable: false,
    });
    assert.equal(fullCheck.summary.status, "clean");
    assert.equal(fullCheck.summary.errorCount, 0);
  });

  test("DiagnosticsManager distinguishes compiler unavailable status honestly", () => {
    const snapshot = diagnosticsManager.generateSnapshot({
      sourceCode: `int main() { return 0; }`,
      language: "cpp",
      sourceVersion: 1,
      contentHash: "hash2",
      compilerAvailable: false,
      aiAvailable: false,
    });

    assert.equal(snapshot.summary.status, "compiler_unavailable");
    assert.match(snapshot.summary.title, /Compiler Unavailable/i);
  });
});
