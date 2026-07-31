// Runs the ICP query against SerpApi's Google Search API and returns
// structured LinkedIn profile candidates. Requires SERPAPI_API_KEY.

export type SearchCandidate = {
  fullName: string;
  title: string | null;
  company: string | null;
  linkedinUrl: string;
};

function parseTitleLine(serpTitle: string): { fullName: string; title: string | null; company: string | null } {
  // SerpApi LinkedIn result titles are typically one of:
  //   "Name - Title - Company | LinkedIn"
  //   "Name - Title at Company | LinkedIn"
  //   "Name - Title | LinkedIn"
  //   "Name - Title"
  const withoutSiteSuffix = serpTitle.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
  const parts = withoutSiteSuffix.split(/\s[-–]\s/).map(p => p.trim()).filter(Boolean);

  if (parts.length === 0) return { fullName: serpTitle.trim(), title: null, company: null };
  const fullName = parts[0];
  if (parts.length === 1) return { fullName, title: null, company: null };

  if (parts.length >= 3) {
    return { fullName, title: parts[1], company: parts.slice(2).join(" - ") };
  }

  // parts.length === 2: check for "Title at Company" inside the second segment.
  const atMatch = parts[1].match(/^(.*)\bat\b\s+(.+)$/i);
  if (atMatch) {
    return { fullName, title: atMatch[1].trim(), company: atMatch[2].trim() };
  }
  return { fullName, title: parts[1], company: null };
}

// LinkedIn increasingly truncates out-of-network names to "First L." — that's
// not enough identifying info to be a usable lead, so we filter it out rather
// than hand someone an unusable half-name.
function hasFullName(fullName: string): boolean {
  const words = fullName.trim().split(/\s+/);
  if (words.length < 2) return false;
  const last = words[words.length - 1].replace(/\.$/, "");
  return last.length > 1;
}

// Confirms the profile URL doesn't 404 before we hand it out as a lead.
// Only treats a confirmed 404 as invalid — network errors/timeouts or
// LinkedIn's bot-suspicion status codes are left alone rather than
// penalizing a candidate for something on our end.
async function urlLooksValid(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);
    return resp.status !== 404;
  } catch {
    return true;
  }
}

export async function searchLinkedInProfiles(query: string, limit = 10): Promise<SearchCandidate[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Lead search is not configured (missing SERPAPI_API_KEY).");
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  // Over-fetch relative to `limit` since some raw results get filtered out
  // for missing last names, missing companies, or dead links. 100 is
  // Google/SerpApi's practical ceiling for a single request.
  url.searchParams.set("num", String(Math.min(limit * 2, 100)));
  url.searchParams.set("api_key", apiKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new Error(`SerpApi request failed (${resp.status})`);
  }
  const data = (await resp.json()) as { organic_results?: { title?: string; link?: string }[] };
  const results = data.organic_results ?? [];

  const parsed: SearchCandidate[] = [];
  for (const r of results) {
    if (!r.link || !r.title) continue;
    if (!r.link.includes("linkedin.com/in/")) continue;
    const { fullName, title, company } = parseTitleLine(r.title);
    if (!hasFullName(fullName)) continue;
    if (!company) continue;
    parsed.push({ fullName, title, company, linkedinUrl: r.link });
    if (parsed.length >= limit * 2) break;
  }

  const validityChecks = await Promise.all(parsed.map(c => urlLooksValid(c.linkedinUrl)));
  const candidates = parsed.filter((_, i) => validityChecks[i]).slice(0, limit);
  return candidates;
}
