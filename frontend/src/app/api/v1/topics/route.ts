import type { NextRequest } from "next/server";
import { listSaved } from "@/server/mock-db";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// GET /api/v1/topics?status=saved  — v1 UI only needs the saved list.
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? "saved";
  await wait(150);
  if (status === "saved") return Response.json(listSaved());
  return Response.json([]);
}
