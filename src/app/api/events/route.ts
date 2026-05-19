import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export async function GET() {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ configured: false, events: null });
  }
  try {
    const res = await fetch(APPS_SCRIPT_URL, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json({ configured: true, events: data.events ?? [] });
  } catch (err) {
    console.error("[events API] fetch failed:", err);
    return NextResponse.json({ configured: true, events: null, error: "fetch_failed" });
  }
}

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const body = await req.json();
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[events API] post failed:", err);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}
