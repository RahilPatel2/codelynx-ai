import fs from "node:fs";

// Load .env.local
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { GoogleGenAI } from "@google/genai";

async function verifyGemini() {
  console.log("=================================================");
  console.log("GOOGLE GEMINI API LIVE ENDPOINT VERIFICATION");
  console.log("=================================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("FAILED: GEMINI_API_KEY is not defined in environment.");
    process.exit(1);
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  console.log("Configured Target Model:", modelName);
  console.log("API Key Present:", apiKey ? `Yes (${apiKey.slice(0, 6)}...${apiKey.slice(-4)})` : "No");

  const ai = new GoogleGenAI({ apiKey });

  const testPrompt = "Explain the time complexity of binary search in one concise sentence.";
  console.log("\nSending Real Prompt to Gemini API:", `"${testPrompt}"`);

  const startTime = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: testPrompt,
    });

    const duration = Date.now() - startTime;
    console.log("\nAPI Call Successful!");
    console.log("Latency:", `${duration}ms`);
    console.log("Live Model Response:\n");
    console.log(response.text);
    console.log("\nToken Usage Metrics:", {
      promptTokens: response.usageMetadata?.promptTokenCount,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount,
      totalTokens: response.usageMetadata?.totalTokenCount,
    });
    console.log("\n=================================================");
    console.log("GEMINI API VERIFICATION: 100% PASSED (LIVE TEST)");
    console.log("=================================================");
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    process.exit(1);
  }
}

verifyGemini();
