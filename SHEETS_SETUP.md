# Google Sheets Setup Guide

This app can sync your timeline to a Google Sheet so your events are stored in the cloud and shareable.

## Step 1 — Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename the first sheet tab to **`Events`**.
3. Add these exact column headers in row 1 (one per cell, A through H):

```
id | title | date | description | emoji | color | order
```

## Step 2 — Create the Apps Script

1. In your spreadsheet, click **Extensions → Apps Script**.
2. Delete any existing code and paste this:

```javascript
const SHEET_NAME = "Events";
const HEADERS = ["id", "title", "date", "description", "emoji", "color", "order"];

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return json({ events: [] });
  }
  const headers = data[0];
  const events = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  return json({ events });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (body.action === "create") {
    const row = HEADERS.map(h => body.event[h] ?? "");
    sheet.appendRow(row);

  } else if (body.action === "update") {
    const data = sheet.getDataRange().getValues();
    const idCol = HEADERS.indexOf("id");
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.event.id) {
        const row = HEADERS.map(h => body.event[h] ?? "");
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        break;
      }
    }

  } else if (body.action === "delete") {
    const data = sheet.getDataRange().getValues();
    const idCol = HEADERS.indexOf("id");
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }

  } else if (body.action === "reorder") {
    const data = sheet.getDataRange().getValues();
    const idCol = HEADERS.indexOf("id");
    const orderCol = HEADERS.indexOf("order");
    const orderMap = {};
    body.events.forEach(e => { orderMap[e.id] = e.order; });
    for (let i = 1; i < data.length; i++) {
      const id = data[i][idCol];
      if (id in orderMap) {
        sheet.getRange(i + 1, orderCol + 1).setValue(orderMap[id]);
      }
    }
  }

  return json({ success: true });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Save** (give the project any name you like, e.g. "Timeline API").

## Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Type" and select **Web app**.
3. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**.
5. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

## Step 4 — Connect to the App

1. In the root of this project, create a file called `.env.local`:

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Restart the dev server (`npm run dev`) and your timeline will now sync to Google Sheets!

> **Note**: The first load imports from localStorage into Sheets. Subsequent loads read from Sheets.
>
> **CORS**: All Sheet calls are proxied through the Next.js `/api/events` route, so there are no browser CORS issues.
