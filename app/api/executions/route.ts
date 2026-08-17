import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executionService } from "@/lib/execution/adapter";
import { compilerDiagnosticParser } from "@/lib/diagnostics/compiler-parser";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { ExecutionModel } from "@/models/Execution";
import { devStore } from "@/lib/database/dev-store";

const RunCodeSchema = z.object({
  language: z.string(),
  sourceCode: z.string().min(1, "Source code cannot be empty").max(100000, "Source code exceeds 100KB limit"),
  stdin: z.string().optional().default(""),
  projectId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RunCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { language, sourceCode, stdin, projectId } = parsed.data;

    // Run code through the isolated execution provider
    const executionResult = await executionService.runCode({
      language,
      sourceCode,
      stdin,
      cpuTimeLimit: 5,
      memoryLimit: 128000,
    });

    // Optionally persist execution if user is authenticated
    const user = await getCurrentUser();
    let savedId: string | undefined = undefined;

    if (user) {
      const db = await connectToDatabase();
      const snippet = sourceCode.slice(0, 500);

      if (db) {
        const record = await ExecutionModel.create({
          ownerId: user.userId,
          projectId,
          language,
          sourceSnippet: snippet,
          status: executionResult.status,
          exitCode: executionResult.exitCode,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
          compileOutput: executionResult.compileOutput || "",
          executionTime: executionResult.executionTime,
          memoryUsage: executionResult.memoryUsage,
          provider: executionResult.provider,
        });
        savedId = record._id.toString();
      } else if (process.env.NODE_ENV !== "production") {
        savedId = `exec_${Date.now()}`;
        devStore.executions.unshift({
          id: savedId,
          ownerId: user.userId,
          projectId,
          language,
          sourceSnippet: snippet,
          status: executionResult.status,
          exitCode: executionResult.exitCode,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
          compileOutput: executionResult.compileOutput || "",
          executionTime: executionResult.executionTime,
          memoryUsage: executionResult.memoryUsage,
          provider: executionResult.provider,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Parse structured compiler diagnostics from compilation output and stderr
    const rawCompilerErrors = `${executionResult.compileOutput || ""}\n${executionResult.stderr || ""}`.trim();
    const diagnostics = compilerDiagnosticParser.parse(
      rawCompilerErrors,
      language,
      "main"
    );

    return NextResponse.json({
      success: true,
      result: executionResult,
      diagnostics,
      savedId,
    });
  } catch (err: any) {
    console.error("Execution route error:", err);
    return NextResponse.json(
      { error: "Execution service encountered an internal error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectToDatabase();
  if (db) {
    const list = await ExecutionModel.find({ ownerId: user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({
      success: true,
      executions: list.map((e) => ({
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
    });
  }

  const list = devStore.executions.filter(
    (e) => e.ownerId === user.userId || user.email === "demo@codelynx.ai"
  );
  return NextResponse.json({
    success: true,
    executions: list,
  });
}
