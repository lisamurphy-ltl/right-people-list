// Runs the ICP query against SerpApi's Google Search API and returns
// structured LinkedIn profile candidates. Requires SERPAPI_API_KEY.

export type SearchCandidate = {
  fullName: string;
  title: string | null;
  linkedinUrl: string;
};

function parseNameAndTitle(serpTitle: string): { fullName: string; title: string | null } {
  // SerpApi LinkedIn result titles are typically "Name - Title" or "Name - Title | Company"
  const dashSplit = serpTitle.split(/\s[-–]\s/);
  if (dashSplit.length >= 2) {
    return { fullName: dashSplit[0].trim(), title: dashSplit.slice(1).join(" - ").trim() };
  }
  return { fullName: serpTitle.trim(), title: null };
}

export async function searchLinkedInProfiles(query: string, limit = 10): Promise<SearchCandidate[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Lead search is not configured (missing SERPAPI_API_KEY).");
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(Math.min(limit, 20)));
  url.searchParams.set("api_key", apiKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new Error(`SerpApi request failed (${resp.status})`);
  }
  const data = (await resp.json()) as { organic_results?: { title?: string; link?: string }[] };
  const results = data.organic_results ?? [];

  const candidates: SearchCandidate[] = [];
  for (const r of results) {
    if (!r.link || !r.title) continue;
    if (!r.link.includes("linkedin.com/in/")) continue;
    const { fullName, title } = parseNameAndTitle(r.title);
    candidates.push({ fullName, title, linkedinUrl: r.link });
    if (candidates.length >= limit) break;
  }
  return candidates;
}
