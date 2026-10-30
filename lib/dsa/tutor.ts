import { PublicDSAProblem } from "./types";
import { geminiProvider } from "../ai/gemini";
import { scrubSensitiveData } from "../ai/context-builder";

export interface DSATutorContext {
  problem: PublicDSAProblem;
  userCode: string;
  language: string;
  diagnostics?: Array<{ line: number; message: string; severity: string }>;
  testResults?: {
    passedTests: number;
    totalTests: number;
    failedInput?: string;
    actualOutput?: string;
    expectedOutput?: string;
    compileOutput?: string;
  };
  revealedHints: number;
  question: string;
  detailLevel?: string;
  conversationHistory?: Array<{ role: "user" | "model"; text: string }>;
}

export interface DSATutorResponse {
  reply: string;
  suggestedPatchSnippet?: string;
  revealedHintLevel?: number;
  provider: string;
}

export function buildTutorSystemPrompt(ctx: DSATutorContext): string {
  const prob = ctx.problem;
  return `You are CodeLynx AI DSA Tutor, an expert algorithms educator, competitive programming coach, and mentor.

CURRENT PROBLEM CONTEXT:
- Problem: "${prob.title}" (${prob.difficulty.toUpperCase()})
- Primary Topic: ${prob.primaryTopic} (${prob.secondaryTopics.join(", ") || "General"})
- Expected Time Complexity: ${prob.expectedTimeComplexity}
- Expected Space Complexity: ${prob.expectedSpaceComplexity}
- Problem Statement:
${prob.statement}

CONSTRAINTS:
${prob.constraints.join("\n")}

ACTIVE WORKSPACE STATE:
- Active Language: ${ctx.language}
- User's Current Editor Code:
\`\`\`${ctx.language}
${scrubSensitiveData(ctx.userCode || "(No code written yet)")}
\`\`\`

DIAGNOSTICS & TEST RUN STATUS:
- Compiler Diagnostics: ${
    ctx.diagnostics && ctx.diagnostics.length > 0
      ? ctx.diagnostics.map((d) => `Line ${d.line}: ${d.message}`).join(", ")
      : "Clean / No compiler warnings"
  }
- Test Results: ${
    ctx.testResults
      ? `${ctx.testResults.passedTests}/${ctx.testResults.totalTests} tests passed.` +
        (ctx.testResults.compileOutput ? ` Compiler output: ${ctx.testResults.compileOutput}` : "")
      : "No sample test runs yet"
  }
- Hints revealed by user so far: Level ${ctx.revealedHints} of 3

PEDAGOGICAL PRINCIPLES (STRICT):
1. Socratic Mentorship: Guide the developer to uncover insights themselves. Ask guiding questions about edge cases, loop bounds, or invariant violations rather than dumping full solutions.
2. Honest Debugging: When the user asks about an error, distinguish verified compiler diagnostics from hypotheses.
3. Propose Diffs: If the user explicitly asks for code repairs, provide a concise diff or targeted code snippet rather than replacing their entire code.
4. Response Preference: ${ctx.detailLevel || "balanced"}. Be encouraging, clear, and technically precise.
5. If the user asks for a hint, provide advice calibrated to their current hint level (Level ${
    ctx.revealedHints + 1
  }). Never spoil advanced solutions on level 1 questions.`;
}

/**
 * Deterministic fallback reply when Gemini API is unavailable or experiencing spikes
 */
export function generateDeterministicTutorReply(ctx: DSATutorContext): DSATutorResponse {
  const q = ctx.question.toLowerCase();
  const prob = ctx.problem;

  if (q.includes("hint") || q.includes("clue") || q.includes("stuck")) {
    const nextLevel = Math.min(3, ctx.revealedHints + 1);
    const hintObj = prob.hints.find((h) => h.level === nextLevel) || prob.hints[0];
    return {
      reply: `Here is a Level ${hintObj.level} Hint (${hintObj.title}):\n\n> ${hintObj.hint}\n\nThink about how this applies to your current approach in ${ctx.language}.`,
      revealedHintLevel: nextLevel,
      provider: "deterministic-tutor",
    };
  }

  if (q.includes("time") || q.includes("complexity") || q.includes("big-o") || q.includes("space")) {
    return {
      reply: `For **${prob.title}**, the optimal target is:\n- **Time Complexity**: \`${prob.expectedTimeComplexity}\`\n- **Auxiliary Space**: \`${prob.expectedSpaceComplexity}\`\n\nExamine your loops and auxiliary collections to check if you are within these bounds.`,
      provider: "deterministic-tutor",
    };
  }

  if (q.includes("explain") || q.includes("what does") || q.includes("understand")) {
    return {
      reply: `### Problem Breakdown: ${prob.title}\n\n**Goal**: ${prob.statement.slice(
        0,
        250
      )}...\n\n**Key Constraints**:\n${prob.constraints
        .map((c) => `- \`${c}\``)
        .join("\n")}\n\nTry tracing the first sample example by hand before coding!`,
      provider: "deterministic-tutor",
    };
  }

  // Default guidance
  return {
    reply: `Let's work through **${prob.title}** together.\n\n1. **Topic Focus**: This problem tests **${
      prob.primaryTopic
    }**.\n2. **Target Complexity**: \`${prob.expectedTimeComplexity}\` time and \`${
      prob.expectedSpaceComplexity
    }\` space.\n3. **Current State**: You have ${
      ctx.userCode.trim().length > 0 ? "written code" : "starter template loaded"
    }. Would you like a small hint, an edge-case checklist, or a complexity walkthrough?`,
    provider: "deterministic-tutor",
  };
}

/**
 * Interactive Gemini AI tutor
 */
export async function askDSATutor(ctx: DSATutorContext): Promise<DSATutorResponse> {
  if (geminiProvider.isConfigured()) {
    try {
      const systemInstruction = buildTutorSystemPrompt(ctx);
      const contents: any[] = [];

      // Add conversation history if present
      if (ctx.conversationHistory && ctx.conversationHistory.length > 0) {
        for (const item of ctx.conversationHistory.slice(-6)) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text }],
          });
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: ctx.question }],
      });

      const raw = await geminiProvider.generateText(
        `User Question: ${ctx.question}`,
        systemInstruction,
        { model: "gemini-3.5-flash" }
      );

      if (raw && raw.trim().length > 0) {
        return {
          reply: raw.trim(),
          provider: "gemini-3.5-flash",
        };
      }
    } catch (err: any) {
      console.warn("DSATutor Gemini call failed, using fallback:", err.message);
    }
  }

  return generateDeterministicTutorReply(ctx);
}
