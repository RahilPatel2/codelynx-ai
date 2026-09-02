import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { ProjectModel } from "@/models/Project";
import { devStore } from "@/lib/database/dev-store";

const UpdateProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  language: z.string().optional(),
  files: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        content: z.string(),
        language: z.string(),
      })
    )
    .optional(),
  activeFileId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  const db = await connectToDatabase();

  if (db) {
    let proj = null;
    try {
      proj = await ProjectModel.findById(projectId);
    } catch {
      // Handle non-ObjectId strings gracefully
    }
    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (proj.ownerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden: Not your project" }, { status: 403 });
    }
    return NextResponse.json({
      success: true,
      project: {
        id: proj._id.toString(),
        name: proj.name,
        description: proj.description,
        language: proj.language,
        files: proj.files,
        activeFileId: proj.activeFileId,
        tags: proj.tags,
        createdAt: proj.createdAt,
        updatedAt: proj.updatedAt,
      },
    });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Database service unavailable." },
      { status: 503 }
    );
  }

  const devProj = devStore.projects.get(projectId);
  if (!devProj) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (devProj.ownerId !== user.userId) {
    return NextResponse.json({ error: "Forbidden: Not your project" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    project: devProj,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  const body = await req.json();
  const parsed = UpdateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const db = await connectToDatabase();
  if (db) {
    let proj = null;
    try {
      proj = await ProjectModel.findById(projectId);
    } catch {
      // Handle non-ObjectId strings gracefully
    }
    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (proj.ownerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden: Not your project" }, { status: 403 });
    }

    if (parsed.data.name) proj.name = parsed.data.name;
    if (parsed.data.description !== undefined) proj.description = parsed.data.description;
    if (parsed.data.language) proj.language = parsed.data.language;
    if (parsed.data.files) proj.files = parsed.data.files;
    if (parsed.data.activeFileId) proj.activeFileId = parsed.data.activeFileId;
    if (parsed.data.tags) proj.tags = parsed.data.tags;

    await proj.save();

    return NextResponse.json({
      success: true,
      project: {
        id: proj._id.toString(),
        name: proj.name,
        description: proj.description,
        language: proj.language,
        files: proj.files,
        activeFileId: proj.activeFileId,
        tags: proj.tags,
        updatedAt: proj.updatedAt,
      },
      message: "Project saved successfully.",
    });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Database service unavailable." },
      { status: 503 }
    );
  }

  const devProj = devStore.projects.get(projectId);
  if (!devProj) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (devProj.ownerId !== user.userId) {
    return NextResponse.json({ error: "Forbidden: Not your project" }, { status: 403 });
  }

  if (parsed.data.name) devProj.name = parsed.data.name;
  if (parsed.data.description !== undefined) devProj.description = parsed.data.description;
  if (parsed.data.language) devProj.language = parsed.data.language;
  if (parsed.data.files) devProj.files = parsed.data.files;
  if (parsed.data.activeFileId) devProj.activeFileId = parsed.data.activeFileId;
  if (parsed.data.tags) devProj.tags = parsed.data.tags;
  devProj.updatedAt = new Date().toISOString();

  return NextResponse.json({
    success: true,
    project: devProj,
    message: "Project updated in local session.",
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  const db = await connectToDatabase();

  if (db) {
    let proj = null;
    try {
      proj = await ProjectModel.findById(projectId);
    } catch {
      // Handle non-ObjectId strings gracefully
    }
    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (proj.ownerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden: Not your project" }, { status: 403 });
    }
    await ProjectModel.findByIdAndDelete(projectId);
    return NextResponse.json({ success: true, message: "Project deleted" });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Database service unavailable." },
      { status: 503 }
    );
  }

  const devProj = devStore.projects.get(projectId);
  if (devProj && devProj.ownerId !== user.userId) {
    return NextResponse.json({ error: "Forbidden: Not your project" }, { status: 403 });
  }
  devStore.projects.delete(projectId);
  return NextResponse.json({ success: true, message: "Project deleted from session" });
}
