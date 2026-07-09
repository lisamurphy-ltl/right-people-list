/**
 * Apollo.io enrichment service
 * Tier gates:
 *   Pro      → unverified email (pattern-matched from public sources)
 *   Pro Plus → verified email + phone (Apollo People Match API)
 *   Agency   → same as Pro Plus, unlimited
 */

import { PLAN_LIMITS, PlanType } from "./db";

const APOLLO_API_KEY = process.env.APOLLO_API_KEY ?? "";
const APOLLO_BASE = "https://api.apollo.io/v1";

export interface EnrichmentResult {
  emailUnverified?: string;
  emailVerified?: string;
  phone?: string;
  company?: string;
  companyDomain?: string;
  apolloId?: string;
}

/**
 * Pattern-match an unverified email from a LinkedIn URL + name.
 * This is a heuristic — not verified. Used for Pro tier.
 */
export function guessEmail(fullName: string, companyDomain: string): string | undefined {
  if (!fullName || !companyDomain) return undefined;
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) return undefined;
  const first = parts[0].replace(/[^a-z]/g, "");
  const last = parts[parts.length - 1].replace(/[^a-z]/g, "");
  if (!first || !last) return undefined;
  // Most common B2B email patterns
  return `${first}.${last}@${companyDomain}`;
}

/**
 * Call Apollo People Match API for verified email + phone.
 * Requires APOLLO_API_KEY env var.
 */
export async function apolloEnrich(params: {
  firstName?: string;
  lastName?: string;
  linkedinUrl?: string;
  company?: string;
}): Promise<EnrichmentResult> {
  if (!APOLLO_API_KEY) {
    console.warn("[Apollo] No API key configured — returning empty enrichment");
    return {};
  }

  try {
    const body: Record<string, string> = { api_key: APOLLO_API_KEY };
    if (params.firstName) body.first_name = params.firstName;
    if (params.lastName) body.last_name = params.lastName;
    if (params.linkedinUrl) body.linkedin_url = params.linkedinUrl;
    if (params.company) body.organization_name = params.company;

    const res = await fetch(`${APOLLO_BASE}/people/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("[Apollo] API error:", res.status, await res.text());
      return {};
    }

    const data = await res.json() as {
      person?: {
        email?: string;
        phone_numbers?: Array<{ sanitized_number?: string }>;
        organization?: { primary_domain?: string; name?: string };
        id?: string;
      };
    };

    const person = data.person;
    if (!person) return {};

    return {
      emailVerified: person.email ?? undefined,
      phone: person.phone_numbers?.[0]?.sanitized_number ?? undefined,
      company: person.organization?.name ?? undefined,
      companyDomain: person.organization?.primary_domain ?? undefined,
      apolloId: person.id ?? undefined,
    };
  } catch (err) {
    console.error("[Apollo] Enrichment failed:", err);
    return {};
  }
}

/**
 * Determine what enrichment a plan is allowed to perform.
 */
export function getPlanEnrichmentCapabilities(plan: PlanType) {
  return PLAN_LIMITS[plan];
}
