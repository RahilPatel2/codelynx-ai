import mongoose, { Schema, Document } from "mongoose";

export interface IExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isPublic: boolean;
}

export interface IHint {
  level: number;
  title: string;
  hint: string;
}

export interface IEditorial {
  mainIdea: string;
  approach: string;
  complexityExplanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  referenceCode?: Record<string, string>;
}

export interface IDSAProblem extends Document {
  id: string; // Stable ID e.g. "dsa_arr_001"
  slug: string; // e.g. "two-sum-target-pair"
  title: string;
  difficulty: "easy" | "medium" | "hard";
  primaryTopic: string;
  secondaryTopics: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: IExample[];
  starterCode: Record<string, string>;
  publicTestCases: ITestCase[];
  hiddenTestCases: ITestCase[];
  referenceSolution: Record<string, string>;
  referenceSolutionLanguage: string;
  expectedTimeComplexity: string;
  expectedSpaceComplexity: string;
  requiredConcepts: string[];
  prerequisiteConcepts: string[];
  hints: IHint[];
  editorial: IEditorial;
  tags: string[];
  isPublished: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExampleSchema = new Schema<IExample>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const TestCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
  },
  { _id: false }
);

const HintSchema = new Schema<IHint>(
  {
    level: { type: Number, required: true, min: 1, max: 3 },
    title: { type: String, required: true },
    hint: { type: String, required: true },
  },
  { _id: false }
);

const EditorialSchema = new Schema<IEditorial>(
  {
    mainIdea: { type: String, required: true },
    approach: { type: String, required: true },
    complexityExplanation: { type: String, required: true },
    timeComplexity: { type: String, required: true },
    spaceComplexity: { type: String, required: true },
    referenceCode: { type: Map, of: String },
  },
  { _id: false }
);

const DSAProblemSchema = new Schema<IDSAProblem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true,
    },
    primaryTopic: { type: String, required: true, index: true },
    secondaryTopics: [{ type: String }],
    statement: { type: String, required: true },
    inputFormat: { type: String, required: true },
    outputFormat: { type: String, required: true },
    constraints: [{ type: String }],
    examples: [ExampleSchema],
    starterCode: { type: Map, of: String, default: {} },
    publicTestCases: [TestCaseSchema],
    hiddenTestCases: [TestCaseSchema],
    referenceSolution: { type: Map, of: String, default: {} },
    referenceSolutionLanguage: { type: String, default: "python" },
    expectedTimeComplexity: { type: String, required: true },
    expectedSpaceComplexity: { type: String, required: true },
    requiredConcepts: [{ type: String }],
    prerequisiteConcepts: [{ type: String }],
    hints: [HintSchema],
    editorial: { type: EditorialSchema, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true, index: true },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DSAProblemModel =
  mongoose.models.DSAProblem ||
  mongoose.model<IDSAProblem>("DSAProblem", DSAProblemSchema);
