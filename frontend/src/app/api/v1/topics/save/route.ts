import type { NextRequest } from "next/server";
import { saveDrafts } from "@/server/mock-db";
import type { Topic } from "@/lib/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST /api/v1/topics/save  -> { saved: number }
export async function POST(request: NextRequest) {
  const { drafts } = (await request.json()) as { drafts: Topic[] };
  await wait(350);
  const saved = saveDrafts(drafts ?? []);
  return Response.json({ saved });
}
