import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriptionHistory {
  fromPlan: string;
  toPlan: string;
  timestamp: Date;
  mode: "simulated" | "real";
  notes?: string;
}

export interface ISubscription extends Document {
  userId: string;
  userEmail: string;
  planId: "free" | "professional" | "pro";
  planName: "FREE" | "PROFESSIONAL" | "PRO";
  priceInr: number;
  currency: "INR";
  billingCycle: "monthly";
  status: "active" | "cancelled" | "past_due";
  activatedAt: Date;
  expiresAt: Date | null;
  purchaseMode: "simulated" | "real";
  subscriptionSource: "simulated_checkout" | "registration" | "system";
  history: ISubscriptionHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionHistorySchema = new Schema<ISubscriptionHistory>(
  {
    fromPlan: { type: String, required: true },
    toPlan: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    mode: { type: String, enum: ["simulated", "real"], default: "simulated" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    planId: {
      type: String,
      enum: ["free", "professional", "pro"],
      default: "free",
      required: true,
    },
    planName: {
      type: String,
      enum: ["FREE", "PROFESSIONAL", "PRO"],
      default: "FREE",
      required: true,
    },
    priceInr: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
      required: true,
    },
    billingCycle: {
      type: String,
      default: "monthly",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "past_due"],
      default: "active",
      required: true,
    },
    activatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    purchaseMode: {
      type: String,
      enum: ["simulated", "real"],
      default: "simulated",
      required: true,
    },
    subscriptionSource: {
      type: String,
      enum: ["simulated_checkout", "registration", "system"],
      default: "simulated_checkout",
      required: true,
    },
    history: [SubscriptionHistorySchema],
  },
  { timestamps: true }
);

export const SubscriptionModel: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
