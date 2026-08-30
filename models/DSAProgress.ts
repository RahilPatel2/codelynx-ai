import mongoose, { Schema, Document } from "mongoose";

export interface IDSAProgress extends Document {
  userId: string;
  solvedProblems: string[]; // problem IDs
  attemptedProblems: string[]; // problem IDs
  bookmarkedProblems: string[]; // problem IDs
  revealedHints: Record<string, number>; // problemId -> max revealed hint level (1..3)
  drafts: Record<string, { code: string; language: string; updatedAt: Date }>; // key: `${problemId}:${language}`
  streakCount: number;
  lastActiveDate: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

const DSAProgressSchema = new Schema<IDSAProgress>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    solvedProblems: [{ type: String }],
    attemptedProblems: [{ type: String }],
    bookmarkedProblems: [{ type: String }],
    revealedHints: { type: Map, of: Number, default: {} },
    drafts: { type: Map, of: Object, default: {} },
    streakCount: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: "" },
  },
  { timestamps: true }
);

export const DSAProgressModel =
  mongoose.models.DSAProgress ||
  mongoose.model<IDSAProgress>("DSAProgress", DSAProgressSchema);
