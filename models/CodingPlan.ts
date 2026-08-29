import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlanStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  isBlocker?: boolean;
  whyNecessary?: string;
  suggestedCodeSnippet?: string;
}

export interface ICodingPlan extends Document {
  ownerId: string;
  projectId?: string;
  goal: string;
  language: string;
  steps: IPlanStep[];
  definitionOfDone: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PlanStepSchema = new Schema<IPlanStep>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    isBlocker: { type: Boolean, default: false },
    whyNecessary: { type: String },
    suggestedCodeSnippet: { type: String },
  },
  { _id: false }
);

const CodingPlanSchema = new Schema<ICodingPlan>(
  {
    ownerId: { type: String, required: true, index: true },
    projectId: { type: String, index: true },
    goal: { type: String, required: true },
    language: { type: String, required: true, default: "python" },
    steps: { type: [PlanStepSchema], default: [] },
    definitionOfDone: { type: [String], default: [] },
  },
  { timestamps: true }
);

CodingPlanSchema.index({ ownerId: 1, updatedAt: -1 });

export const CodingPlanModel: Model<ICodingPlan> =
  mongoose.models.CodingPlan ||
  mongoose.model<ICodingPlan>("CodingPlan", CodingPlanSchema);
