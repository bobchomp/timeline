import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

async function callScript(body: object) {
  if (!APPS_SCRIPT_URL) return null;
  const res = await fetch(APPS_SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "follow",
  });
  return res.json();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ configured: false, timeline: null });
  }
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getTimeline&id=${id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.timeline) {
      // Strip editKey before sending to client
      const { editKey: _ek, ...safeTimeline } = data.timeline;
      return NextResponse.json({ configured: true, timeline: safeTimeline });
    }
    return NextResponse.json({ configured: true, timeline: null });
  } catch (err) {
    console.error("[timelines/id] GET failed:", err);
    return NextResponse.json({ configured: true, timeline: null, error: "fetch_failed" });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ configured: false });
  }
  const body = await req.json();
  // editKey must be in the request body for auth
  if (!body.editKey) {
    return NextResponse.json({ error: "missing_edit_key" }, { status: 401 });
  }
  try {
    const data = await callScript({
      action: "updateTimeline",
      id,
      editKey: body.editKey,
      events: body.events,
      layout: body.layout,
    });
    return NextResponse.json(data ?? { success: true });
  } catch (err) {
    console.error("[timelines/id] PUT failed:", err);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ configured: false });
  }
  const body = await req.json();
  if (!body.editKey) {
    return NextResponse.json({ error: "missing_edit_key" }, { status: 401 });
  }
  try {
    const data = await callScript({ action: "deleteTimeline", id, editKey: body.editKey });
    return NextResponse.json(data ?? { success: true });
  } catch (err) {
    console.error("[timelines/id] DELETE failed:", err);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
