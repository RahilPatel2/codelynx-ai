import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { ProjectModel } from "@/models/Project";
import { devStore } from "@/lib/database/dev-store";
import { getLanguageById } from "@/lib/languages/definitions";
import { checkProjectCreationEntitlement } from "@/lib/subscription/entitlements";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().default(""),
  language: z.string().default("python"),
  initialCode: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const db = await connectToDatabase();
  if (db) {
    const totalCount = await ProjectModel.countDocuments({ ownerId: user.userId });
    const projects = await ProjectModel.find({ ownerId: user.userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      projects: projects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        language: p.language,
        files: p.files,
        activeFileId: p.activeFileId,
        tags: p.tags,
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      storage: "mongodb",
    });
  }

  const isLocalDev = !process.env.APP_URL || process.env.APP_URL.includes("localhost") || process.env.APP_URL.includes("127.0.0.1");
  if (process.env.NODE_ENV === "production" && !isLocalDev) {
    return NextResponse.json(
      { error: "Database service unavailable. Cannot retrieve projects." },
      { status: 503 }
    );
  }

  // Fallback devStore projects for development only
  const devProjects = Array.from(devStore.projects.values()).filter(
    (p) => p.ownerId === user.userId || user.email === "demo@codelynx.ai"
  );

  return NextResponse.json({
    success: true,
    projects: devProjects.slice(skip, skip + limit),
    pagination: {
      page,
      limit,
      total: devProjects.length,
      totalPages: Math.ceil(devProjects.length / limit),
    },
    storage: "development-sandbox",
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, language, initialCode } = parsed.data;

    // Server-side entitlement check for project creation limits
    const entitlement = await checkProjectCreationEntitlement(user.userId, user.email);
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: entitlement.reason,
          code: entitlement.code || "PROJECT_LIMIT_EXCEEDED",
          currentCount: entitlement.currentCount,
          maxAllowed: entitlement.maxAllowed,
        },
        { status: 403 }
      );
    }
    const langDef = getLanguageById(language);
    const starter = initialCode || langDef.starterTemplate;

    const initialFiles = [
      {
        id: "file-1",
        name: langDef.defaultFileName,
        content: starter,
        language: langDef.id,
      },
    ];

    const db = await connectToDatabase();
    if (db) {
      const newProj = await ProjectModel.create({
        name,
        description: description || "",
        ownerId: user.userId,
        language: langDef.id,
        files: initialFiles,
        activeFileId: "file-1",
        tags: [langDef.id],
      });

      return NextResponse.json({
        success: true,
        project: {
          id: newProj._id.toString(),
          name: newProj.name,
          description: newProj.description,
          language: newProj.language,
          files: newProj.files,
          activeFileId: newProj.activeFileId,
          tags: newProj.tags,
          createdAt: newProj.createdAt,
          updatedAt: newProj.updatedAt,
        },
        storage: "mongodb",
      });
    }

    const isLocalDev = !process.env.APP_URL || process.env.APP_URL.includes("localhost") || process.env.APP_URL.includes("127.0.0.1");
    if (process.env.NODE_ENV === "production" && !isLocalDev) {
      return NextResponse.json(
        { error: "Database service unavailable. Cannot create project in production without database." },
        { status: 503 }
      );
    }

    // Dev store fallback for local development only
    const projId = `proj_${Date.now()}`;
    const newDevProj = {
      id: projId,
      name,
      description: description || "",
      ownerId: user.userId,
      language: langDef.id,
      files: initialFiles,
      activeFileId: "file-1",
      tags: [langDef.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    devStore.projects.set(projId, newDevProj);

    return NextResponse.json({
      success: true,
      project: newDevProj,
      storage: "development-sandbox",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
