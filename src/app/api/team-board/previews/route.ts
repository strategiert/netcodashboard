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
  const previews = await convex().query(api.previews.list, {});
  return NextResponse.json({ previews });
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
  const { title, html, agent, project, slug } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof title !== "string" || !title.trim() ||
    typeof html !== "string" || !html.trim() ||
    typeof agent !== "string" || !agent.trim()
  ) {
    return NextResponse.json({ error: "title_html_agent_required" }, { status: 400 });
  }
  const result = await convex().mutation(api.previews.publish, {
    title: title.trim(),
    html,
    agent: agent.trim(),
    project: typeof project === "string" ? project : undefined,
    slug: typeof slug === "string" && slug.trim() ? slug.trim() : undefined,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  const origin = req.nextUrl.origin;
  return NextResponse.json(
    { ok: true, slug: result.slug, url: `${origin}/p/${result.slug}` },
    { status: 201 }
  );
}
