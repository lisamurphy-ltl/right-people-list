// Best-effort append of newly scraped leads to Lisa's existing Google Sheet
// tracker (the "App-Scraped Leads" tab) via an Apps Script Web App webhook.
// Logging failures must never break a lead search, so this never throws.

export type SheetLeadRow = {
  fullName: string;
  title: string | null;
  company: string | null;
  linkedinUrl: string;
  industry: string;
  location: string;
  companySize: string | null;
  relevanceScore: string;
  searchQuery: string;
  source: "serpapi" | "llm";
};

export async function logLeadsToSheet(rows: SheetLeadRow[]): Promise<void> {
  const webhookUrl = process.env.LEADS_SHEET_WEBHOOK_URL;
  if (!webhookUrl || rows.length === 0) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.LEADS_SHEET_WEBHOOK_SECRET ?? "", rows }),
    });
  } catch (error) {
    console.warn("[SheetLog] Failed to log leads to Google Sheet:", error);
  }
}
