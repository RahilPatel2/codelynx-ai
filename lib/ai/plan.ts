import { z } from "zod";
import { geminiProvider } from "./gemini";

export const PlanStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  isBlocker: z.boolean().default(false),
  whyNecessary: z.string().nullable().optional(),
  suggestedCodeSnippet: z.string().nullable().optional(),
});

export type PlanStep = z.infer<typeof PlanStepSchema>;

export const CodingPlanSchema = z.object({
  id: z.string(),
  goal: z.string(),
  language: z.string().default("python"),
  steps: z.array(PlanStepSchema),
  definitionOfDone: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CodingPlan = z.infer<typeof CodingPlanSchema>;

export function generateDeterministicPlan(
  goal: string,
  language: string,
  code?: string
): CodingPlan {
  const planId = `plan_${Date.now()}`;
  return {
    id: planId,
    goal: goal || "Build and verify target algorithm",
    language,
    steps: [
      {
        id: "step_1",
        title: "Define Data Model & Function Signatures",
        description: "Establish input parameters, return types, and clear variable naming.",
        status: "completed",
        isBlocker: false,
        whyNecessary: "Ensures type safety and clear contractual interface for callers.",
      },
      {
        id: "step_2",
        title: "Implement Core Algorithmic Logic",
        description: "Write the central loop, calculation, or data structure traversal.",
        status: "in_progress",
        isBlocker: false,
        whyNecessary: "Delivers the core functional requirement.",
      },
      {
        id: "step_3",
        title: "Add Boundary Condition Guards",
        description: "Handle empty inputs, 0, negative values, and out-of-bounds index cases.",
        status: "pending",
        isBlocker: true,
        whyNecessary: "Prevents runtime crashes such as IndexError, NullPointer, or division by zero.",
      },
      {
        id: "step_4",
        title: "Execute Unit Test Suite",
        description: "Run automated tests verifying output across normal and adversarial cases.",
        status: "pending",
        isBlocker: false,
        whyNecessary: "Proves correctness before deploying to production.",
      },
      {
        id: "step_5",
        title: "Analyze Asymptotic Complexity (Big-O)",
        description: "Verify that runtime fits within acceptable time and auxiliary memory limits.",
        status: "pending",
        isBlocker: false,
        whyNecessary: "Ensures scalability under maximum input size constraints.",
      },
    ],
    definitionOfDone: [
      "All edge cases handled without runtime exceptions",
      "Code compiles cleanly without diagnostic errors",
      "Unit test suite passes with 100% assertions satisfied",
      "Time complexity is within expected asymptotic bounds",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function generateCodingPlan(
  goal: string,
  language: string,
  currentCode?: string,
  options?: { model?: string }
): Promise<CodingPlan> {
  if (geminiProvider.isConfigured()) {
    try {
      const prompt = `You are CodeLynx AI Software Architect.
Create an actionable, production-grade coding plan for this goal in ${language}.

Goal: "${goal}"
${currentCode ? `Current Codebase:\n\`\`\`${language}\n${currentCode}\n\`\`\`` : ""}

Return a JSON object conforming strictly to:
{
  "id": "plan_${Date.now()}",
  "goal": "${goal.replace(/"/g, '\\"')}",
  "language": "${language}",
  "steps": [
    {
      "id": "step_1",
      "title": "Clear step title",
      "description": "Specific action to perform",
      "status": "pending",
      "isBlocker": boolean,
      "whyNecessary": "Clear explanation of why this step is critical",
      "suggestedCodeSnippet": "Code snippet example for this step (optional)"
    }
  ],
  "definitionOfDone": [
    "Criteria 1",
    "Criteria 2"
  ],
  "createdAt": "${new Date().toISOString()}",
  "updatedAt": "${new Date().toISOString()}"
}`;

      const raw = await geminiProvider.generateJson<CodingPlan>(prompt, undefined, {
        model: options?.model,
      });
      return CodingPlanSchema.parse(raw);
    } catch (err: any) {
      console.warn("Gemini generateCodingPlan error, using fallback plan:", err.message);
      return generateDeterministicPlan(goal, language, currentCode);
    }
  }

  return generateDeterministicPlan(goal, language, currentCode);
}
