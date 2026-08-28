import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface IProject extends Document {
  name: string;
  description?: string;
  ownerId: string;
  language: string;
  files: IProjectFile[];
  activeFileId: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectFileSchema = new Schema<IProjectFile>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: String, default: "" },
    language: { type: String, required: true },
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    ownerId: { type: String, required: true, index: true },
    language: { type: String, required: true, default: "python" },
    files: { type: [ProjectFileSchema], default: [] },
    activeFileId: { type: String, default: "file-1" },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

ProjectSchema.index({ ownerId: 1, updatedAt: -1 });

export const ProjectModel: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
