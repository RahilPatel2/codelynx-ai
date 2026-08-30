import mongoose, { Schema, Document } from "mongoose";

export type DSASubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "internal_error";

export interface IDSASubmission extends Document {
  id: string;
  userId: string;
  problemId: string;
  problemSlug: string;
  code: string;
  language: string;
  status: DSASubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtime: number; // in milliseconds
  memory: number; // in KB
  failedTestIndex?: number;
  errorMessage?: string;
  submittedAt: Date;
}

const DSASubmissionSchema = new Schema<IDSASubmission>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    problemId: { type: String, required: true, index: true },
    problemSlug: { type: String, required: true, index: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "accepted",
        "wrong_answer",
        "compilation_error",
        "runtime_error",
        "time_limit_exceeded",
        "memory_limit_exceeded",
        "internal_error",
      ],
      required: true,
      index: true,
    },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    runtime: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    failedTestIndex: { type: Number },
    errorMessage: { type: String },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const DSASubmissionModel =
  mongoose.models.DSASubmission ||
  mongoose.model<IDSASubmission>("DSASubmission", DSASubmissionSchema);
