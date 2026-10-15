import { test, describe } from "node:test";
import assert from "node:assert";
import {
  SUPPORTED_LANGUAGES,
  getLanguageById,
} from "../lib/languages/definitions.ts";
import { SandboxFallbackProvider } from "../lib/execution/sandbox-fallback.ts";
import { Judge0Provider } from "../lib/execution/judge0.ts";

describe("Execution & Languages Suite - Phase 2 Verification", () => {
  test("Exposes 10 fully configured programming languages", () => {
    assert.strictEqual(SUPPORTED_LANGUAGES.length, 10);
    const python = getLanguageById("python");
    assert.strictEqual(python.judge0Id, 71);
    assert.strictEqual(python.extension, "py");

    const cpp = getLanguageById("cpp");
    assert.strictEqual(cpp.judge0Id, 54);
    assert.strictEqual(cpp.isCompiled, true);

    const rust = getLanguageById("rust");
    assert.strictEqual(rust.judge0Id, 73);
  });

  test("Syntax checker catches unclosed brackets prior to submission", async () => {
    const sandbox = new SandboxFallbackProvider();
    const brokenCode = "def test():\n    if True:\n        arr = [1, 2, 3\n";
    const result = await sandbox.execute({
      language: "python",
      sourceCode: brokenCode,
    });
    assert.strictEqual(result.status, "compilation_error");
    assert.strictEqual(result.exitCode, 1);
    assert.strictEqual(result.stderr.includes("Unclosed bracket"), true);
  });

  test("Unconfigured sandbox returns clear service notification, not fake output", async () => {
    const sandbox = new SandboxFallbackProvider();
    const validCode = 'print("Hello CodeLynx")';
    const result = await sandbox.execute({
      language: "python",
      sourceCode: validCode,
    });
    assert.strictEqual(result.status, "error");
    assert.strictEqual(result.stdout, "");
    assert.strictEqual(result.stderr.includes("Execution Service Not Configured"), true);
  });

  test("Real execution provider executes C++ with stdin (5 7) and outputs 12", async () => {
    const judge0 = new Judge0Provider();
    assert.strictEqual(judge0.isConfigured(), true);

    const cppCode = `#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

    const result = await judge0.execute({
      language: "cpp",
      sourceCode: cppCode,
      stdin: "5 7",
    });

    assert.strictEqual(result.status, "accepted");
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout.trim(), "12");
    assert.strictEqual(typeof result.executionTime, "number");
    assert.strictEqual(typeof result.memoryUsage, "number");
  });
});
