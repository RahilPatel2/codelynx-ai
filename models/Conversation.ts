import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  codeBlocks?: { language: string; code: string }[];
  timestamp: Date;
}

export interface IConversation extends Document {
  ownerId: string;
  projectId?: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    codeBlocks: [{ type: Schema.Types.Mixed }],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    ownerId: { type: String, required: true, index: true },
    projectId: { type: String, index: true },
    title: { type: String, required: true, default: "New Coding Chat" },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

ConversationSchema.index({ ownerId: 1, updatedAt: -1 });

export const ConversationModel: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
