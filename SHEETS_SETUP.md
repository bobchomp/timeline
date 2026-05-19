# Google Sheets Setup Guide

Connect Timeline Studio to a Google Sheet so timelines are stored in the cloud and share links work across devices.

## Step 1 — Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Create **two sheet tabs** named exactly **`Timelines`** and **`Events`**.
3. Add these headers in row 1 of each tab:

**Timelines** tab (columns A–E):
```
id | name | description | editKey | createdAt
```

**Events** tab (columns A–H):
```
id | timelineId | title | date | description | emoji | color | order
```

## Step 2 — Create the Apps Script

1. In your spreadsheet, click **Extensions → Apps Script**.
2. Delete any existing code and paste the following:

```javascript
const ss = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  const action = e.parameter.action;
  if (action === "getTimeline") return getTimeline(e.parameter.id);
  if (action === "listTimelines") return listTimelines();
  return json({ error: "unknown_action" });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  switch (body.action) {
    case "createTimeline": return createTimeline(body.timeline);
    case "updateTimeline": return updateTimeline(body.id, body);
    case "deleteTimeline": return deleteTimeline(body.id, body.editKey);
    default: return json({ error: "unknown_action" });
  }
}

// ── Timelines ──────────────────────────────────────────────────

function listTimelines() {
  const sheet = ss.getSheetByName("Timelines");
  const rows = sheetToObjects(sheet);
  // Never expose editKey
  const safe = rows.map(({ id, name, description, createdAt }) => ({ id, name, description, createdAt }));
  return json({ timelines: safe });
}

function getTimeline(id) {
  const tSheet = ss.getSheetByName("Timelines");
  const timelines = sheetToObjects(tSheet);
  const timeline = timelines.find(t => t.id === id);
  if (!timeline) return json({ timeline: null });

  const eSheet = ss.getSheetByName("Events");
  const allEvents = sheetToObjects(eSheet);
  const events = allEvents.filter(e => e.timelineId === id);
  // editKey is intentionally stripped here
  const { editKey: _ek, ...safeTimeline } = timeline;
  return json({ timeline: { ...safeTimeline, events } });
}

function createTimeline(data) {
  const sheet = ss.getSheetByName("Timelines");
  const headers = ["id", "name", "description", "editKey", "createdAt"];
  sheet.appendRow(headers.map(h => data[h] ?? ""));

  // Save starter events if any
  if (data.events && data.events.length > 0) {
    const eSheet = ss.getSheetByName("Events");
    const eHeaders = ["id", "timelineId", "title", "date", "description", "emoji", "color", "order"];
    data.events.forEach(ev => eSheet.appendRow(eHeaders.map(h => ev[h] ?? "")));
  }

  return json({ success: true });
}

function updateTimeline(id, body) {
  const tSheet = ss.getSheetByName("Timelines");
  const tData = tSheet.getDataRange().getValues();
  const headers = tData[0];
  const idCol = headers.indexOf("id");
  const editKeyCol = headers.indexOf("editKey");

  // Validate editKey
  const row = tData.find((r, i) => i > 0 && r[idCol] === id);
  if (!row || row[editKeyCol] !== body.editKey) return json({ error: "unauthorized" });

  // Replace events for this timeline
  if (body.events) {
    const eSheet = ss.getSheetByName("Events");
    const eData = eSheet.getDataRange().getValues();
    const eHeaders = eData[0];
    const eTlIdCol = eHeaders.indexOf("timelineId");

    // Delete existing rows for this timeline (iterate in reverse to keep indices valid)
    for (let i = eData.length - 1; i >= 1; i--) {
      if (eData[i][eTlIdCol] === id) eSheet.deleteRow(i + 1);
    }

    // Re-append updated events
    const writeHeaders = ["id", "timelineId", "title", "date", "description", "emoji", "color", "order"];
    body.events.forEach(ev => eSheet.appendRow(writeHeaders.map(h => ev[h] ?? "")));
  }

  return json({ success: true });
}

function deleteTimeline(id, editKey) {
  const tSheet = ss.getSheetByName("Timelines");
  const tData = tSheet.getDataRange().getValues();
  const headers = tData[0];
  const idCol = headers.indexOf("id");
  const editKeyCol = headers.indexOf("editKey");

  for (let i = 1; i < tData.length; i++) {
    if (tData[i][idCol] === id) {
      if (tData[i][editKeyCol] !== editKey) return json({ error: "unauthorized" });
      tSheet.deleteRow(i + 1);
      break;
    }
  }

  // Also delete all events for this timeline
  const eSheet = ss.getSheetByName("Events");
  const eData = eSheet.getDataRange().getValues();
  const eTlIdCol = eData[0].indexOf("timelineId");
  for (let i = eData.length - 1; i >= 1; i--) {
    if (eData[i][eTlIdCol] === id) eSheet.deleteRow(i + 1);
  }

  return json({ success: true });
}

// ── Helpers ──────────────────────────────────────────────────

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Save** (name the project something like "Timeline Studio API").

## Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear ⚙️ next to "Type" and select **Web app**.
3. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy** and authorize when prompted.
5. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## Step 4 — Connect to the App

Create `.env.local` in the project root:

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Restart the dev server (`npm run dev`). Timelines you create will now sync to your Sheet, and share links will work across any device.

> **Security note**: The `editKey` is stored in the Sheet and validated server-side before any write.
> It is never returned by the API's GET endpoints — only the view-safe timeline data is sent to browsers.
>
> **CORS**: All Sheets calls go through Next.js API routes (`/api/timelines/*`), so there are no browser CORS issues.
