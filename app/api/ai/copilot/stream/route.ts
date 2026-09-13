import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geminiProvider } from "@/lib/ai/gemini";
import { sanitizeContext, buildPromptWithContext } from "@/lib/ai/context-builder";
import { buildCopilotSystemInstruction } from "@/lib/ai/capabilities";

const StreamRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  context: z.any().optional(),
  model: z.string().optional(),
  detailLevel: z.string().default("balanced"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StreamRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { message, context, model, detailLevel, conversationHistory = [] } = parsed.data;
    const sanitized = sanitizeContext(context);
    const systemPrompt = buildCopilotSystemInstruction(detailLevel);

    // Build context-aware prompt
    let promptWithContext = buildPromptWithContext(message, sanitized);

    // Prepend limited conversation history (up to last 6 messages)
    if (conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-6);
      const historyStr = recent
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");
      promptWithContext = `CONVERSATION HISTORY:\n${historyStr}\n\nLATEST QUERY:\n${promptWithContext}`;
    }

    // Set up SSE stream response
    const encoder = new TextEncoder();

    if (geminiProvider.isConfigured()) {
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const stream = geminiProvider.generateStream(
              promptWithContext,
              systemPrompt,
              { model }
            );

            for await (const chunk of stream) {
              const payload = JSON.stringify({ chunk });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }

            controller.enqueue(encoder.encode(`data: {"done": true}\n\n`));
            controller.close();
          } catch (err: any) {
            console.error("Stream generation error:", err);
            const errorMsg = JSON.stringify({
              error: err.message || "Streaming interrupted.",
              fallback:
                "\n\n*(Gemini API experienced a transient interruption. Please retry your request or switch models in Settings.)*",
            });
            controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Fallback streaming simulation if GEMINI_API_KEY is not configured
    const customReadable = new ReadableStream({
      async start(controller) {
        const fallbackText =
          `### CodeLynx AI Copilot (Offline Mode)\n\n` +
          `The Google Gemini API is currently running in offline fallback mode because \`GEMINI_API_KEY\` is not set in the server environment.\n\n` +
          `**Analysis for your request:** "${message}"\n\n` +
          `**Available Features:**\n` +
          `- Use **What should I do next?** to get automated guidance on your code state.\n` +
          `- Use **Give me a hint** to receive step-by-step progressive clues.\n` +
          `- Open **Settings** (/settings) to configure editor themes, font size, or custom shortcuts.\n\n` +
          `*To connect real Gemini AI responses, add \`GEMINI_API_KEY=...\` to your \`.env.local\` file.*`;

        const words = fallbackText.split(" ");
        for (const word of words) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: word + " " })}\n\n`));
          await new Promise((r) => setTimeout(r, 20));
        }

        controller.enqueue(encoder.encode(`data: {"done": true}\n\n`));
        controller.close();
      },
    });

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("POST /api/ai/copilot/stream route error:", err);
    return NextResponse.json(
      { error: "Internal server error starting stream" },
      { status: 500 }
    );
  }
}
