import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { isTeamBoardAuthorized } from "@/lib/teamBoardAuth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTeamBoardAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { status, notes, title } = (body ?? {}) as Record<string, unknown>;
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  try {
    const result = await convex.mutation(api.teamBoard.update, {
      id: id as Id<"teamTasks">,
      status: typeof status === "string" ? status : undefined,
      notes: typeof notes === "string" ? notes : undefined,
      title: typeof title === "string" ? title : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "not_found" ? 404 : 400 });
    }
    return NextResponse.json(result);
  } catch {
    // Ungültiges Id-Format wirft in Convex einen Validation-Error
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }
}
