import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { isTeamBoardAuthorized } from "@/lib/teamBoardAuth";

export const dynamic = "force-dynamic";

function convex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function GET(req: NextRequest) {
  if (!isTeamBoardAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const project = req.nextUrl.searchParams.get("project") ?? undefined;
  const tasks = await convex().query(api.teamBoard.list, { project });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  if (!isTeamBoardAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { agent, title, status, notes, project } = (body ?? {}) as Record<string, unknown>;
  if (typeof agent !== "string" || !agent.trim() || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "agent_and_title_required" }, { status: 400 });
  }
  const result = await convex().mutation(api.teamBoard.create, {
    agent: agent.trim(),
    title: title.trim(),
    status: typeof status === "string" ? status : undefined,
    notes: typeof notes === "string" ? notes : undefined,
    project: typeof project === "string" ? project : undefined,
  });
  return NextResponse.json(result, { status: 201 });
}
