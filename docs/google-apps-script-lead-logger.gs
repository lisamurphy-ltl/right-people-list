/**
 * Deploy this bound to the "App-Scraped Leads" tab on Lisa's tracker spreadsheet
 * (docs.google.com/spreadsheets/d/1RPXpBcDL6248mkY4qOKjq2tUcbC9aTJannIxidy9OaQ).
 *
 * Setup (Extensions > Apps Script, from the spreadsheet):
 *   1. Paste this file's contents into Code.gs.
 *   2. Project Settings > Script Properties > add key "WEBHOOK_SECRET" with any
 *      random value you choose — this is the shared secret the server sends.
 *   3. Deploy > New deployment > type "Web app" > Execute as "Me",
 *      Who has access "Anyone" > Deploy. Copy the Web app URL.
 *   4. Set that URL as LEADS_SHEET_WEBHOOK_URL and the same secret as
 *      LEADS_SHEET_WEBHOOK_SECRET in Railway's environment variables.
 */

var SHEET_NAME = "App-Scraped Leads";

function doPost(e) {
  var expectedSecret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");

  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Invalid JSON body" });
  }

  if (!expectedSecret || body.secret !== expectedSecret) {
    return jsonResponse({ ok: false, error: "Unauthorized" });
  }

  var rows = body.rows || [];
  if (rows.length === 0) {
    return jsonResponse({ ok: true, appended: 0 });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ ok: false, error: "Sheet '" + SHEET_NAME + "' not found" });
  }

  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  var values = rows.map(function (r) {
    var nameParts = String(r.fullName || "").trim().split(/\s+/);
    var firstName = nameParts[0] || "";
    var lastName = nameParts.slice(1).join(" ");

    return [
      firstName,
      lastName,
      r.fullName || "",
      r.title || "",
      r.company || "",
      r.linkedinUrl || "",
      r.location || "",
      r.companySize || "",
      r.industry || "",
      r.relevanceScore || "",
      "New",
      today,
      r.source || "serpapi",
      r.searchQuery || "",
      "",
      "",
    ];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, values[0].length).setValues(values);

  return jsonResponse({ ok: true, appended: values.length });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
