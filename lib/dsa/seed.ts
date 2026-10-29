import { problemRegistry } from "./problem-registry";
import { devStore } from "../database/dev-store";
import { connectDB } from "../database/connection";
import { DSAProblemModel } from "../../models/DSAProblem";

export async function seedDSAProblems(forceUpdate = false): Promise<{
  totalSeeded: number;
  easy: number;
  medium: number;
  hard: number;
  source: "mongodb" | "devStore";
}> {
  const problems = problemRegistry.getAllProblems();
  const counts = problemRegistry.getProblemCount();

  // 1. Always seed the in-memory devStore
  for (const p of problems) {
    if (forceUpdate || !devStore.dsaProblems.has(p.id)) {
      devStore.dsaProblems.set(p.id, p);
    }
  }

  // 2. If MongoDB is configured and connected, sync idempotently
  let isMongo = false;
  try {
    const conn = await connectDB();
    if (conn) {
      isMongo = true;
      const existingCount = await DSAProblemModel.countDocuments();
      if (existingCount < problems.length || forceUpdate) {
        for (const p of problems) {
          await DSAProblemModel.findOneAndUpdate(
            { id: p.id },
            { $set: p },
            { upsert: true, new: true }
          );
        }
      }
    }
  } catch (err: any) {
    console.warn("MongoDB seeding skipped, using devStore:", err.message);
  }

  return {
    totalSeeded: problems.length,
    easy: counts.easy,
    medium: counts.medium,
    hard: counts.hard,
    source: isMongo ? "mongodb" : "devStore",
  };
}
