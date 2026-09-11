import { z } from "zod";
import { geminiProvider } from "./gemini";
import { SanitizedContext } from "./context-builder";

export const HintLevelSchema = z.enum([
  "small_nudge",
  "stronger_pointer",
  "algorithmic_idea",
  "debugging_clue",
  "full_solution",
]);

export type HintLevel = z.infer<typeof HintLevelSchema>;

export const HintResultSchema = z.object({
  level: HintLevelSchema,
  levelNumber: z.number().int().min(1).max(5),
  title: z.string(),
  hint: z.string(),
  targetFocus: z.string().nullable().optional(),
  codeSnippet: z.string().nullable().optional(),
  nextLevelAvailable: z.boolean(),
  nextLevelName: z.string().nullable().optional(),
});

export type HintResult = z.infer<typeof HintResultSchema>;

export const HINT_LEVEL_METADATA: Record<
  HintLevel,
  { number: number; name: string; next?: HintLevel; instruction: string }
> = {
  small_nudge: {
    number: 1,
    name: "Small Nudge",
    next: "stronger_pointer",
    instruction:
      "Provide only a gentle nudge or directional clue. Do NOT reveal formulas, algorithms, or code. Help the developer think about the problem from the right angle.",
  },
  stronger_pointer: {
    number: 2,
    name: "Logic & Invariant Pointer",
    next: "algorithmic_idea",
    instruction:
      "Point toward a specific condition, variable boundary, or loop invariant. Ask a probing question about what happens at the boundary without giving away the exact solution.",
  },
  algorithmic_idea: {
    number: 3,
    name: "Algorithmic Strategy",
    next: "debugging_clue",
    instruction:
      "Explain the optimal algorithmic paradigm (e.g. hash map lookup, two-pointers, sliding window, binary search) and why it achieves better complexity. Do NOT write out the full code implementation.",
  },
  debugging_clue: {
    number: 4,
    name: "Targeted Debugging Clue",
    next: "full_solution",
    instruction:
      "Point out the exact function, line area, or condition where the discrepancy or bug occurs. Explain what value violates assumptions.",
  },
  full_solution: {
    number: 5,
    name: "Full Solution Walkthrough",
    instruction:
      "The user has explicitly asked for the full solution. Provide a complete, production-quality implementation with line-by-line explanation.",
  },
};

/**
 * Deterministic fallback hint generator
 */
export function generateDeterministicHint(
  code: string,
  language: string,
  level: HintLevel = "small_nudge"
): HintResult {
  const meta = HINT_LEVEL_METADATA[level] || HINT_LEVEL_METADATA.small_nudge;

  if (level === "small_nudge") {
    return {
      level,
      levelNumber: 1,
      title: "Think About Inputs & Expected Output",
      hint: "What happens when your input collection has only 1 element, or when no target pair exists? Trace your variables with a small example on paper.",
      targetFocus: "Edge cases and initial loop bounds",
      nextLevelAvailable: true,
      nextLevelName: "Logic & Invariant Pointer",
    };
  }

  if (level === "stronger_pointer") {
    return {
      level,
      levelNumber: 2,
      title: "Inspect Loop Bounds and Index Offsets",
      hint: "Look closely at your index increments and range bounds. Are you checking elements beyond the end of the array or repeating comparisons?",
      targetFocus: "Loop condition (< vs <=)",
      nextLevelAvailable: true,
      nextLevelName: "Algorithmic Strategy",
    };
  }

  if (level === "algorithmic_idea") {
    return {
      level,
      levelNumber: 3,
      title: "Trade Space for Time with a Lookup Table",
      hint: "Instead of searching nested loops in O(n²), can you store previously seen elements in a hash map / dictionary to achieve O(1) average lookup?",
      targetFocus: "Hash map / Set data structure",
      nextLevelAvailable: true,
      nextLevelName: "Targeted Debugging Clue",
    };
  }

  if (level === "debugging_clue") {
    return {
      level,
      levelNumber: 4,
      title: "Check Complement Calculation",
      hint: "Calculate the needed complement (`target - current_value`). Check if it is already in your lookup before adding current value to avoid matching an element with itself.",
      targetFocus: "Self-match prevention in lookup",
      nextLevelAvailable: true,
      nextLevelName: "Full Solution Walkthrough",
    };
  }

  return {
    level: "full_solution",
    levelNumber: 5,
    title: "Optimized Single-Pass Solution",
    hint: "Use a hash table mapping each number to its index in a single linear O(n) scan.",
    codeSnippet:
      language === "python"
        ? `def solve(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return [seen[comp], i]\n        seen[num] = i\n    return []`
        : `// Single pass hash map solution with O(n) time and O(n) auxiliary space`,
    nextLevelAvailable: false,
  };
}

/**
 * Generate a progressive AI hint matching user's requested level
 */
export async function generateProgressiveHint(
  code: string,
  language: string,
  level: HintLevel = "small_nudge",
  context?: SanitizedContext,
  options?: { model?: string }
): Promise<HintResult> {
  const meta = HINT_LEVEL_METADATA[level] || HINT_LEVEL_METADATA.small_nudge;

  if (geminiProvider.isConfigured()) {
    try {
      const prompt = `You are CodeLynx AI Progressive Hint Guide.
The developer is asking for a Level ${meta.number} (${meta.name}) hint.

HINT LEVEL RULE (CRITICAL):
${meta.instruction}

Context:
- Language: ${language}
- Diagnostics: ${JSON.stringify(context?.diagnostics || [])}
- Last execution: ${JSON.stringify(context?.lastExecution || {})}

Code to hint on:
\`\`\`${language}
${code}
\`\`\`

Return a JSON object conforming strictly to:
{
  "level": "${level}",
  "levelNumber": ${meta.number},
  "title": "Engaging, pedagogical title",
  "hint": "The hint text adhering strictly to the level rule",
  "targetFocus": "Specific concept, function, or loop to inspect",
  "codeSnippet": ${level === "full_solution" ? `"Full code snippet"` : "null"},
  "nextLevelAvailable": ${meta.next ? "true" : "false"},
  "nextLevelName": ${meta.next ? `"${HINT_LEVEL_METADATA[meta.next].name}"` : "null"}
}`;

      const raw = await geminiProvider.generateJson<HintResult>(prompt, undefined, {
        model: options?.model,
      });
      return HintResultSchema.parse(raw);
    } catch (err: any) {
      console.warn("Gemini generateProgressiveHint error, using deterministic hint:", err.message);
      return generateDeterministicHint(code, language, level);
    }
  }

  return generateDeterministicHint(code, language, level);
}
