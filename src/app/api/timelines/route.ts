import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

async function callScript(body: object) {
  if (!APPS_SCRIPT_URL) return null;
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "follow",
  });
  return res.json();
}

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ configured: false, timelines: [] });
  }
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=listTimelines`, { cache: "no-store" });
    const data = await res.json();
    // Never return editKey to the public list
    const safe = (data.timelines ?? []).map(
      ({ id, name, description, createdAt }: { id: string; name: string; description: string; createdAt: string }) =>
        ({ id, name, description, createdAt })
    );
    return NextResponse.json({ configured: true, timelines: safe });
  } catch (err) {
    console.error("[timelines] GET failed:", err);
    return NextResponse.json({ configured: true, timelines: [], error: "fetch_failed" });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!APPS_SCRIPT_URL) {
    // No Sheets — tell client to store locally only
    return NextResponse.json({ configured: false });
  }
  try {
    const data = await callScript({ action: "createTimeline", timeline: body });
    return NextResponse.json({ configured: true, ...data });
  } catch (err) {
    console.error("[timelines] POST failed:", err);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
