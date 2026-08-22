import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  authProvider: "credentials" | "google";
  googleId?: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
  company?: string;
  githubHandle?: string;
  status?: string;
  subscription?: {
    plan: "FREE" | "PROFESSIONAL" | "PRO";
    status: string;
    priceInr?: number;
    currency?: string;
    purchaseMode?: string;
    activatedAt?: Date;
  };
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, select: true },
    authProvider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
      index: true,
    },
    googleId: { type: String, sparse: true, index: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    role: { type: String, default: "Software Engineer" },
    company: { type: String, default: "" },
    githubHandle: { type: String, default: "" },
    status: { type: String, default: "active" },
    subscription: {
      plan: {
        type: String,
        enum: ["FREE", "PROFESSIONAL", "PRO"],
        default: "FREE",
      },
      status: {
        type: String,
        default: "active",
      },
      priceInr: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
      purchaseMode: {
        type: String,
        default: "simulated",
      },
      activatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: () => ({
        theme: "codelynx-dark",
        fontSize: 14,
        fontFamily: "JetBrains Mono",
        wordWrap: true,
        minimap: true,
        lineNumbers: true,
        defaultLanguage: "python",
        aiModel: "gemini-3.5-flash",
        verbosity: "balanced",
        confirmPatches: true,
      }),
    },
  },
  { timestamps: true }
);

// Compound and single indexes
UserSchema.index({ email: 1, authProvider: 1 });

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
