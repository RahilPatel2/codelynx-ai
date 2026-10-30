import { z } from "zod";

export const ExampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional(),
});

export const TestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isPublic: z.boolean().default(false),
});

export const HintSchema = z.object({
  level: z.number().int().min(1).max(3),
  title: z.string(),
  hint: z.string(),
});

export const EditorialSchema = z.object({
  mainIdea: z.string(),
  approach: z.string(),
  complexityExplanation: z.string(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  referenceCode: z.record(z.string()).optional(),
});

export const DSAProblemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  primaryTopic: z.string(),
  secondaryTopics: z.array(z.string()).default([]),
  statement: z.string(),
  inputFormat: z.string(),
  outputFormat: z.string(),
  constraints: z.array(z.string()),
  examples: z.array(ExampleSchema),
  starterCode: z.record(z.string()),
  publicTestCases: z.array(TestCaseSchema),
  hiddenTestCases: z.array(TestCaseSchema),
  referenceSolution: z.record(z.string()),
  referenceSolutionLanguage: z.string().default("python"),
  expectedTimeComplexity: z.string(),
  expectedSpaceComplexity: z.string(),
  requiredConcepts: z.array(z.string()).default([]),
  prerequisiteConcepts: z.array(z.string()).default([]),
  hints: z.array(HintSchema),
  editorial: EditorialSchema,
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
  orderIndex: z.number().default(0),
});

export type DSAProblem = z.infer<typeof DSAProblemSchema>;

/**
 * Public problem representation stripped of hidden test cases and unrevealed reference solutions
 */
export type PublicDSAProblem = Omit<
  DSAProblem,
  "hiddenTestCases" | "referenceSolution"
>;

export function sanitizePublicProblem(problem: DSAProblem): PublicDSAProblem {
  const { hiddenTestCases, referenceSolution, ...publicData } = problem;
  return publicData;
}
