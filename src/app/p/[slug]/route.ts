import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

// Öffentliche Preview-Auslieferung: unerratbarer Slug = Zugriffsschutz, noindex.
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(slug)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const preview = await convex.query(api.previews.getBySlug, { slug });
  if (!preview) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(preview.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
