import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/database/mongodb";
import { ConversationModel } from "@/models/Conversation";
import { scrubSensitiveData } from "@/lib/ai/context-builder";
import { devStore } from "@/lib/database/dev-store";

const SaveMessageSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().optional(),
  title: z.string().optional().default("New Coding Chat"),
  message: z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1),
  }),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");
    const projectId = searchParams.get("projectId");

    const db = await connectToDatabase();
    if (db) {
      if (conversationId) {
        const conv = await ConversationModel.findOne({
          _id: conversationId,
          ownerId: user.userId,
        }).lean();
        if (!conv) {
          return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, conversation: conv, storage: "mongodb" });
      }

      const query: any = { ownerId: user.userId };
      if (projectId) query.projectId = projectId;

      const conversations = await ConversationModel.find(query)
        .sort({ updatedAt: -1 })
        .limit(30)
        .lean();

      return NextResponse.json({ success: true, conversations, storage: "mongodb" });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Database service unavailable." },
        { status: 503 }
      );
    }

    const devConvs = Array.from(devStore.conversations.values()).filter(
      (c: any) => c.ownerId === user.userId
    );
    return NextResponse.json({ success: true, conversations: devConvs, storage: "devStore" });
  } catch (err: any) {
    console.error("GET /api/ai/conversations error:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SaveMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { conversationId, projectId, title, message } = parsed.data;

    // Redact sensitive secrets from persisted conversation content
    const cleanContent = scrubSensitiveData(message.content);
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role: message.role,
      content: cleanContent,
      timestamp: new Date(),
    };

    const db = await connectToDatabase();
    if (db) {
      let conversation = null;
      if (conversationId) {
        conversation = await ConversationModel.findOne({
          _id: conversationId,
          ownerId: user.userId,
        });
      }

      if (conversation) {
        conversation.messages.push(newMsg as any);
        await conversation.save();
      } else {
        conversation = await ConversationModel.create({
          ownerId: user.userId,
          projectId,
          title: title || cleanContent.slice(0, 30),
          messages: [newMsg],
        });
      }

      return NextResponse.json({
        success: true,
        conversation,
        storage: "mongodb",
      });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Database service unavailable. Cannot persist conversation." },
        { status: 503 }
      );
    }

    // Dev fallback
    const id = conversationId || `conv_${Date.now()}`;
    let devConv = devStore.conversations.get(id);
    if (!devConv) {
      devConv = {
        id,
        ownerId: user.userId,
        projectId,
        title,
        messages: [],
        createdAt: new Date().toISOString(),
      };
    }
    devConv.messages.push(newMsg);
    devStore.conversations.set(id, devConv);

    return NextResponse.json({ success: true, conversation: devConv, storage: "devStore" });
  } catch (err: any) {
    console.error("POST /api/ai/conversations error:", err);
    return NextResponse.json({ error: "Failed to persist conversation" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      const res = await ConversationModel.findOneAndDelete({
        _id: conversationId,
        ownerId: user.userId,
      });
      if (!res) {
        return NextResponse.json({ error: "Conversation not found or forbidden" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Conversation deleted", storage: "mongodb" });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
    }

    devStore.conversations.delete(conversationId);
    return NextResponse.json({ success: true, message: "Conversation deleted", storage: "devStore" });
  } catch (err: any) {
    console.error("DELETE /api/ai/conversations error:", err);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
