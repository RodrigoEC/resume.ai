import type { NextRequest } from "next/server";
import { matchTopics } from "@/server/mock-db";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST /api/v1/match  { jobDescription, topN } -> Match[]
export async function POST(request: NextRequest) {
  const { jobDescription, topN } = (await request.json()) as {
    jobDescription: string;
    topN?: number;
  };
  await wait(700);
  return Response.json(matchTopics(jobDescription ?? "", topN ?? 5));
}
