import type { NextRequest } from "next/server";
import { getProfile, putProfile } from "@/server/mock-db";
import type { Profile } from "@/lib/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET() {
  await wait(120);
  return Response.json(getProfile());
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Profile;
  await wait(300);
  return Response.json(putProfile(body));
}
