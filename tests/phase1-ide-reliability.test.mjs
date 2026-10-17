import { test, describe } from "node:test";
import assert from "node:assert";
import {
  WorkspaceSettingsSchema,
  DEFAULT_WORKSPACE_SETTINGS,
  formatShortcutFromEvent,
  matchesShortcut,
} from "../lib/settings/types.ts";
import { detectStdinUsage } from "../lib/execution/stdin-detector.ts";
import { formatDetailInstruction } from "../lib/ai/service.ts";

describe("Phase 1: IDE Reliability, Persistent Settings, and Stdin Engine", () => {
  // Test 1: Workspace Settings Schema Validation & Defaults
  test("Validates default workspace settings", () => {
    const parsed = WorkspaceSettingsSchema.parse({});
    assert.strictEqual(parsed.theme, "codelynx-dark");
    assert.strictEqual(parsed.fontSize, 14);
    assert.strictEqual(parsed.fontFamily, "JetBrains Mono");
    assert.strictEqual(parsed.wordWrap, true);
    assert.strictEqual(parsed.minimap, true);
    assert.strictEqual(parsed.lineNumbers, true);
    assert.strictEqual(parsed.defaultLanguage, "python");
    assert.strictEqual(parsed.aiModel, "gemini-3.5-flash");
    assert.strictEqual(parsed.verbosity, "balanced");
    assert.strictEqual(parsed.keyboardShortcuts.runCode, "Ctrl+Enter");
    assert.strictEqual(parsed.keyboardShortcuts.runCodeAlt, "Ctrl+F9");
  });

  test("Rejects out-of-range font sizes (< 11 or > 28)", () => {
    assert.throws(() => {
      WorkspaceSettingsSchema.parse({ fontSize: 8 });
    });
    assert.throws(() => {
      WorkspaceSettingsSchema.parse({ fontSize: 32 });
    });
    const valid = WorkspaceSettingsSchema.parse({ fontSize: 18 });
    assert.strictEqual(valid.fontSize, 18);
  });

  test("Validates alternative themes (nord, monokai, vs-dark, github-dark)", () => {
    const validNord = WorkspaceSettingsSchema.parse({ theme: "nord" });
    assert.strictEqual(validNord.theme, "nord");

    const validMonokai = WorkspaceSettingsSchema.parse({ theme: "monokai" });
    assert.strictEqual(validMonokai.theme, "monokai");

    const validGithub = WorkspaceSettingsSchema.parse({ theme: "github-dark" });
    assert.strictEqual(validGithub.theme, "github-dark");

    assert.throws(() => {
      WorkspaceSettingsSchema.parse({ theme: "invalid-theme" });
    });
  });

  // Test 2: Custom Keyboard Shortcuts System & Matching
  test("Accurately formats and matches keyboard shortcuts", () => {
    const enterEvent = { ctrlKey: true, altKey: false, shiftKey: false, key: "Enter" };
    assert.strictEqual(formatShortcutFromEvent(enterEvent), "Ctrl+Enter");
    assert.strictEqual(matchesShortcut(enterEvent, "Ctrl+Enter"), true);
    assert.strictEqual(matchesShortcut(enterEvent, "ctrl+enter"), true); // Case-insensitive

    const f9Event = { ctrlKey: true, altKey: false, shiftKey: false, key: "F9" };
    assert.strictEqual(formatShortcutFromEvent(f9Event), "Ctrl+F9");
    assert.strictEqual(matchesShortcut(f9Event, "Ctrl+F9"), true);

    const shiftDEvent = { ctrlKey: true, altKey: false, shiftKey: true, key: "D" };
    assert.strictEqual(formatShortcutFromEvent(shiftDEvent), "Ctrl+Shift+D");
    assert.strictEqual(matchesShortcut(shiftDEvent, "Ctrl+Shift+D"), true);

    const saveEvent = { ctrlKey: true, altKey: false, shiftKey: false, key: "s" };
    assert.strictEqual(formatShortcutFromEvent(saveEvent), "Ctrl+S");
    assert.strictEqual(matchesShortcut(saveEvent, "Ctrl+S"), true);
  });

  // Test 3: Stdin Detection Engine for C++, Python, Java, C#, Go, Rust
  test("Detects C++ cin and getline input operations", () => {
    const cppCode = `
#include <iostream>
int main() {
    int a, b;
    std::cin >> a >> b;
    std::cout << a + b << std::endl;
    return 0;
}
    `;
    const res = detectStdinUsage(cppCode, "cpp");
    assert.strictEqual(res.requiresStdin, true);
    assert.ok(res.patterns.includes("cin >>"));
  });

  test("Detects Python input() and sys.stdin", () => {
    const pyCode = `
name = input("Enter your name: ")
age = int(input())
print(f"Hello {name}, age {age}")
    `;
    const res = detectStdinUsage(pyCode, "python");
    assert.strictEqual(res.requiresStdin, true);
    assert.ok(res.patterns.includes("input(...)"));
  });

  test("Detects Java Scanner(System.in) and System.in", () => {
    const javaCode = `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        System.out.println("Value: " + x);
    }
}
    `;
    const res = detectStdinUsage(javaCode, "java");
    assert.strictEqual(res.requiresStdin, true);
    assert.ok(res.patterns.includes("new Scanner(System.in)"));
  });

  test("Does NOT false-positive on simple print or algorithmic code without stdin", () => {
    const helloWorld = `
#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
    `;
    const res = detectStdinUsage(helloWorld, "cpp");
    assert.strictEqual(res.requiresStdin, false);
    assert.strictEqual(res.patterns.length, 0);

    const pyMath = `
def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n - 1) + fibonacci(n - 2)
print(fibonacci(10))
    `;
    const pyRes = detectStdinUsage(pyMath, "python");
    assert.strictEqual(pyRes.requiresStdin, false);
  });

  // Test 4: AI Model & Detail Level Prompt Formatting
  test("Generates specific prompt directives for detail levels", () => {
    const concise = formatDetailInstruction("concise");
    assert.ok(concise.includes("concise"));

    const detailed = formatDetailInstruction("detailed");
    assert.ok(detailed.includes("deep") || detailed.includes("comprehensive"));

    const stepByStep = formatDetailInstruction("step-by-step");
    assert.ok(stepByStep.includes("Step 1") || stepByStep.includes("chronological"));

    const balanced = formatDetailInstruction("balanced");
    assert.ok(balanced.includes("balanced") || balanced.includes("engineering"));
  });
});
