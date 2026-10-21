import type { NextRequest } from "next/server";
import { draftForFiles } from "@/server/mock-db";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST /api/v1/recordings/process  — transcribe + structure (mocked: empty STAR drafts)
export async function POST(request: NextRequest) {
  const { files } = (await request.json()) as {
    files: { id: string; fileName: string }[];
  };
  await wait(900);
  return Response.json(draftForFiles(files ?? []));
}
