import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { CodingPlanModel } from "@/models/CodingPlan";
import { devStore } from "@/lib/database/dev-store";
import { generateCodingPlan, CodingPlan } from "@/lib/ai/plan";

const CreatePlanSchema = z.object({
  goal: z.string().min(2, "Goal must be at least 2 characters"),
  language: z.string().default("python"),
  code: z.string().optional(),
  projectId: z.string().optional(),
  model: z.string().optional(),
});

const UpdateStepSchema = z.object({
  planId: z.string(),
  stepId: z.string(),
  status: z.enum(["pending", "in_progress", "completed"]),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "local-workspace";
    const ownerId = user?.userId || "anon_developer";

    const db = await connectToDatabase();
    if (db) {
      const planDoc = await CodingPlanModel.findOne({ ownerId, projectId })
        .sort({ updatedAt: -1 })
        .lean();
      if (planDoc) {
        return NextResponse.json({ success: true, plan: planDoc });
      }
    } else {
      const plan = devStore.codingPlans.get(`${ownerId}_${projectId}`);
      if (plan) {
        return NextResponse.json({ success: true, plan });
      }
    }

    return NextResponse.json({ success: true, plan: null });
  } catch (err: any) {
    console.error("GET /api/ai/plan error:", err);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = CreatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { goal, language, code, projectId = "local-workspace", model } = parsed.data;
    const ownerId = user?.userId || "anon_developer";

    const generated = await generateCodingPlan(goal, language, code, { model });

    const db = await connectToDatabase();
    if (db) {
      const newPlan = await CodingPlanModel.create({
        ownerId,
        projectId,
        goal: generated.goal,
        language: generated.language,
        steps: generated.steps,
        definitionOfDone: generated.definitionOfDone,
      });
      return NextResponse.json({ success: true, plan: newPlan });
    } else {
      devStore.codingPlans.set(`${ownerId}_${projectId}`, generated);
      return NextResponse.json({ success: true, plan: generated });
    }
  } catch (err: any) {
    console.error("POST /api/ai/plan error:", err);
    return NextResponse.json(
      { error: "Failed to create coding plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = UpdateStepSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { planId, stepId, status } = parsed.data;
    const ownerId = user?.userId || "anon_developer";

    const db = await connectToDatabase();
    if (db) {
      let planDoc = null;
      try {
        planDoc = await CodingPlanModel.findById(planId);
      } catch {
        // Handle invalid ObjectId
      }
      if (!planDoc) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      if (planDoc.ownerId !== ownerId && ownerId !== "anon_developer") {
        return NextResponse.json({ error: "Forbidden: Not your coding plan" }, { status: 403 });
      }
      const step = planDoc.steps.find((s) => s.id === stepId);
      if (step) {
        step.status = status;
        planDoc.markModified("steps");
        await planDoc.save();
      }
      return NextResponse.json({ success: true, plan: planDoc, storage: "mongodb" });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    // Find in devStore
    for (const [key, plan] of Array.from(devStore.codingPlans.entries())) {
      if (plan.id === planId) {
        const step = plan.steps.find((s: any) => s.id === stepId);
        if (step) {
          step.status = status;
          devStore.codingPlans.set(key, plan);
        }
        return NextResponse.json({ success: true, plan, storage: "devStore" });
      }
    }
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  } catch (err: any) {
    console.error("PATCH /api/ai/plan error:", err);
    return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
  }
}
