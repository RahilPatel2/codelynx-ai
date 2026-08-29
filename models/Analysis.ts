import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnalysis extends Document {
  ownerId: string;
  projectId?: string;
  language: string;
  type: "mistakes" | "complexity" | "optimization" | "tests";
  summary: string;
  findings: Record<string, any>[];
  complexity?: {
    timeComplexity: string;
    spaceComplexity: string;
    bestCase?: string;
    worstCase?: string;
    explanation: string;
    confidence: "high" | "medium" | "low";
  };
  createdAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    ownerId: { type: String, required: true, index: true },
    projectId: { type: String, index: true },
    language: { type: String, required: true },
    type: {
      type: String,
      enum: ["mistakes", "complexity", "optimization", "tests"],
      required: true,
    },
    summary: { type: String, default: "" },
    findings: [{ type: Schema.Types.Mixed }],
    complexity: {
      timeComplexity: { type: String },
      spaceComplexity: { type: String },
      bestCase: { type: String },
      worstCase: { type: String },
      explanation: { type: String },
      confidence: { type: String, enum: ["high", "medium", "low"] },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AnalysisSchema.index({ ownerId: 1, createdAt: -1 });

export const AnalysisModel: Model<IAnalysis> =
  mongoose.models.Analysis ||
  mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
