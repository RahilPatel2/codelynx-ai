import { z } from "zod";

export const SupportedThemes = [
  "codelynx-dark",
  "vs-dark",
  "vs-light",
  "monokai",
  "nord",
  "github-dark",
] as const;

export type MonacoTheme = (typeof SupportedThemes)[number];

export const SupportedFontFamilies = [
  "JetBrains Mono",
  "Fira Code",
  "Cascadia Code",
  "Source Code Pro",
  "Courier New",
] as const;

export type FontFamily = (typeof SupportedFontFamilies)[number];

export const SupportedAiModels = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-2.5-flash",
] as const;

export type AiModel = (typeof SupportedAiModels)[number];

export const SupportedDetailLevels = [
  "concise",
  "balanced",
  "detailed",
  "step-by-step",
] as const;

export type DetailLevel = (typeof SupportedDetailLevels)[number];

export const KeyboardShortcutsSchema = z.object({
  runCode: z.string().default("Ctrl+Enter"),
  runCodeAlt: z.string().default("Ctrl+F9"),
  saveProject: z.string().default("Ctrl+S"),
  findMistakes: z.string().default("Ctrl+Shift+D"),
  analyzeComplexity: z.string().default("Ctrl+Shift+C"),
  optimizeCode: z.string().default("Ctrl+Shift+O"),
  commandPalette: z.string().default("Ctrl+K"),
});

export type KeyboardShortcuts = z.infer<typeof KeyboardShortcutsSchema>;

export const WorkspaceSettingsSchema = z.object({
  theme: z.enum(SupportedThemes).default("codelynx-dark"),
  fontSize: z.number().int().min(11).max(28).default(14),
  fontFamily: z.enum(SupportedFontFamilies).default("JetBrains Mono"),
  wordWrap: z.boolean().default(true),
  minimap: z.boolean().default(true),
  lineNumbers: z.boolean().default(true),
  defaultLanguage: z.string().default("python"),
  aiModel: z.enum(SupportedAiModels).default("gemini-3.5-flash"),
  verbosity: z.enum(SupportedDetailLevels).default("balanced"),
  confirmPatches: z.boolean().default(true),
  keyboardShortcuts: KeyboardShortcutsSchema.default({
    runCode: "Ctrl+Enter",
    runCodeAlt: "Ctrl+F9",
    saveProject: "Ctrl+S",
    findMistakes: "Ctrl+Shift+D",
    analyzeComplexity: "Ctrl+Shift+C",
    optimizeCode: "Ctrl+Shift+O",
    commandPalette: "Ctrl+K",
  }),
});

export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  theme: "codelynx-dark",
  fontSize: 14,
  fontFamily: "JetBrains Mono",
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  defaultLanguage: "python",
  aiModel: "gemini-3.5-flash",
  verbosity: "balanced",
  confirmPatches: true,
  keyboardShortcuts: {
    runCode: "Ctrl+Enter",
    runCodeAlt: "Ctrl+F9",
    saveProject: "Ctrl+S",
    findMistakes: "Ctrl+Shift+D",
    analyzeComplexity: "Ctrl+Shift+C",
    optimizeCode: "Ctrl+Shift+O",
    commandPalette: "Ctrl+K",
  },
};

/**
 * Normalizes keyboard event into standard accelerator string (e.g., 'Ctrl+Shift+D')
 */
export function formatShortcutFromEvent(e: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];

  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  // Normalize key name
  let key = e.key;
  if (key === "Control" || key === "Meta" || key === "Alt" || key === "Shift") {
    // Modifier only, not a complete shortcut
    return "";
  }

  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();

  parts.push(key);
  return parts.join("+");
}

/**
 * Check if KeyboardEvent matches target shortcut string
 */
export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false;
  const current = formatShortcutFromEvent(e);
  return current.toLowerCase() === shortcut.toLowerCase();
}
