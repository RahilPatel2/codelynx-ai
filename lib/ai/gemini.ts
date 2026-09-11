import { GoogleGenAI } from "@google/genai";

export class GeminiProvider {
  private client: GoogleGenAI | null = null;
  private candidateModels: string[];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new GoogleGenAI({ apiKey });
    }

    const preferred =
      process.env.GEMINI_MODEL ||
      process.env.GEMINI_API_MODEL ||
      process.env.GOOGLE_CLOUD_AI_MODEL ||
      "gemini-3.5-flash";

    // Deduplicated candidate models for resilient failover
    this.candidateModels = Array.from(
      new Set([
        preferred,
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.8-flash",
      ])
    );
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getModelName(): string {
    return this.candidateModels[0];
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
    options?: { temperature?: number; maxOutputTokens?: number; model?: string }
  ): Promise<string> {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const modelsToTry = options?.model
      ? Array.from(new Set([options.model, ...this.candidateModels]))
      : this.candidateModels;

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              "You are CodeLynx AI, an elite software architect, compiler engineer, and debugging specialist. Provide technically precise, clear, and actionable responses with syntax-highlighted code.",
            temperature: options?.temperature ?? 0.3,
            maxOutputTokens: options?.maxOutputTokens,
          },
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        // If 429 quota reached on this model, failover to next model
        if (err.message?.includes("429") || err.message?.includes("quota")) {
          console.warn(`Model ${model} quota exhausted, attempting failover...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error("Failed to generate response from all candidate models.");
  }

  async generateJson<T>(
    prompt: string,
    systemInstruction?: string,
    options?: { temperature?: number; model?: string }
  ): Promise<T> {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const modelsToTry = options?.model
      ? Array.from(new Set([options.model, ...this.candidateModels]))
      : this.candidateModels;

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await this.client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              "You are CodeLynx AI, an elite software architect and compiler specialist. Return valid JSON only, conforming strictly to the requested schema. Do not include markdown code fences or conversational prose.",
            responseMimeType: "application/json",
            temperature: options?.temperature ?? 0.1,
          },
        });

        const text = (response.text || "").trim();
        try {
          return JSON.parse(text) as T;
        } catch {
          const cleaned = text
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          return JSON.parse(cleaned) as T;
        }
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes("429") || err.message?.includes("quota")) {
          console.warn(`Model ${model} quota exhausted, attempting failover...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error("Failed to generate JSON from all candidate models.");
  }

  async *generateStream(
    prompt: string,
    systemInstruction?: string,
    options?: { temperature?: number; model?: string }
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const modelsToTry = options?.model
      ? Array.from(new Set([options.model, ...this.candidateModels]))
      : this.candidateModels;

    for (const model of modelsToTry) {
      try {
        const stream = await this.client.models.generateContentStream({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              "You are CodeLynx AI, an elite software architect, compiler engineer, and debugging specialist. Provide technically precise, clear, and actionable responses with syntax-highlighted code.",
            temperature: options?.temperature ?? 0.3,
          },
        });

        for await (const chunk of stream) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
        return;
      } catch (err: any) {
        if (err.message?.includes("429") || err.message?.includes("quota")) {
          console.warn(`Model ${model} quota reached in stream, failing over...`);
          continue;
        }
        throw err;
      }
    }
  }
}

export const geminiProvider = new GeminiProvider();

export async function generateGeminiResponse(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  return geminiProvider.generateText(prompt, systemInstruction);
}

export async function generateGeminiJson<T>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  return geminiProvider.generateJson<T>(prompt, systemInstruction);
}
