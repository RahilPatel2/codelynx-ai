import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { ExecutionModel } from "@/models/Execution";
import { devStore } from "@/lib/database/dev-store";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const langFilter = searchParams.get("language");
  const statusFilter = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const db = await connectToDatabase();
  if (db) {
    const query: any = { ownerId: user.userId };
    if (langFilter && langFilter !== "all") query.language = langFilter;
    if (statusFilter && statusFilter !== "all") query.status = statusFilter;

    const total = await ExecutionModel.countDocuments(query);
    const executions = await ExecutionModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      history: executions.map((e) => ({
        id: e._id.toString(),
        projectId: e.projectId,
        language: e.language,
        sourceSnippet: e.sourceSnippet,
        status: e.status,
        exitCode: e.exitCode,
        stdout: e.stdout,
        stderr: e.stderr,
        compileOutput: e.compileOutput,
        executionTime: e.executionTime,
        memoryUsage: e.memoryUsage,
        provider: e.provider,
        createdAt: e.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      storage: "mongodb",
    });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Database service unavailable." },
      { status: 503 }
    );
  }

  let list = devStore.executions.filter(
    (e) => e.ownerId === user.userId || user.email === "demo@codelynx.ai"
  );

  if (langFilter && langFilter !== "all") {
    list = list.filter((e) => e.language === langFilter);
  }
  if (statusFilter && statusFilter !== "all") {
    list = list.filter((e) => e.status === statusFilter);
  }

  return NextResponse.json({
    success: true,
    history: list.slice(skip, skip + limit),
    pagination: {
      page,
      limit,
      total: list.length,
      totalPages: Math.ceil(list.length / limit),
    },
    storage: "development-sandbox",
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const executionId = searchParams.get("id");

  const db = await connectToDatabase();
  if (db) {
    if (executionId) {
      await ExecutionModel.findOneAndDelete({
        _id: executionId,
        ownerId: user.userId,
      });
    } else {
      await ExecutionModel.deleteMany({ ownerId: user.userId });
    }
    return NextResponse.json({ success: true, message: "History updated", storage: "mongodb" });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Database service unavailable." },
      { status: 503 }
    );
  }

  if (executionId) {
    devStore.executions = devStore.executions.filter(
      (e) => !(e.id === executionId && (e.ownerId === user.userId || user.email === "demo@codelynx.ai"))
    );
  } else {
    devStore.executions = devStore.executions.filter(
      (e) => e.ownerId !== user.userId && user.email !== "demo@codelynx.ai"
    );
  }

  return NextResponse.json({ success: true, message: "History cleared", storage: "devStore" });
}
