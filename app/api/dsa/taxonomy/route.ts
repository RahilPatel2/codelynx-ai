import { NextResponse } from "next/server";
import { DSA_TOPICS, TOPIC_LEARNING_PATHS } from "@/lib/dsa/taxonomy";

export async function GET() {
  return NextResponse.json({
    success: true,
    topics: DSA_TOPICS,
    learningPaths: TOPIC_LEARNING_PATHS,
    totalTopics: DSA_TOPICS.length,
  });
}
