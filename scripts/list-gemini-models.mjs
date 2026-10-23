import fs from "node:fs";

// Load .env.local if present
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

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  try {
    const list = await ai.models.list();
    console.log("Available models count:", list.length);
    for await (const m of list) {
      console.log(m.name, m.displayName, m.supportedActions);
    }
  } catch (err) {
    console.error("List models error:", err);
  }
}

listModels();
