import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExecution extends Document {
  ownerId: string;
  projectId?: string;
  language: string;
  sourceSnippet: string;
  status:
    | "queued"
    | "processing"
    | "accepted"
    | "compilation_error"
    | "runtime_error"
    | "time_limit_exceeded"
    | "memory_limit_exceeded"
    | "error";
  exitCode: number;
  stdout: string;
  stderr: string;
  compileOutput: string;
  executionTime: number; // in milliseconds
  memoryUsage: number; // in kilobytes
  provider: string; // e.g., 'judge0' or 'sandbox'
  createdAt: Date;
}

const ExecutionSchema = new Schema<IExecution>(
  {
    ownerId: { type: String, required: true, index: true },
    projectId: { type: String, index: true },
    language: { type: String, required: true },
    sourceSnippet: { type: String, required: true, maxlength: 4000 },
    status: {
      type: String,
      enum: [
        "queued",
        "processing",
        "accepted",
        "compilation_error",
        "runtime_error",
        "time_limit_exceeded",
        "memory_limit_exceeded",
        "error",
      ],
      required: true,
    },
    exitCode: { type: Number, default: 0 },
    stdout: { type: String, default: "" },
    stderr: { type: String, default: "" },
    compileOutput: { type: String, default: "" },
    executionTime: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 },
    provider: { type: String, default: "sandbox" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ExecutionSchema.index({ ownerId: 1, createdAt: -1 });

export const ExecutionModel: Model<IExecution> =
  mongoose.models.Execution ||
  mongoose.model<IExecution>("Execution", ExecutionSchema);
