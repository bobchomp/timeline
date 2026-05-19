// Legacy single-timeline endpoint — kept for backwards compatibility.
// New multi-timeline endpoints are at /api/timelines/[id].
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ configured: false, events: null });
}
