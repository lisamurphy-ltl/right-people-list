import { and, eq, inArray, isNotNull, like, ne, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { enrichmentJobs, icpProfiles, InsertEnrichmentJob, InsertLead, InsertScrapedLeadIndexRow, InsertSubscription, leads, scrapedLeadsIndex, subscriptions, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function createUser(user: {
  openId: string;
  email: string;
  passwordHash: string;
  name?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const role = ENV.ownerEmail && user.email.toLowerCase() === ENV.ownerEmail ? "admin" : "user";

  await db.insert(users).values({
    openId: user.openId,
    email: user.email.toLowerCase(),
    passwordHash: user.passwordHash,
    name: user.name ?? null,
    loginMethod: "password",
    role,
    lastSignedIn: new Date(),
  });

  return getUserByEmail(user.email);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function touchLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free:     { leadsPerMonth: 25,   hasUnverifiedEmail: false, hasVerifiedEmail: false, hasPhone: false, teamSeats: 1 },
  pro:      { leadsPerMonth: 100,  hasUnverifiedEmail: true,  hasVerifiedEmail: false, hasPhone: false, teamSeats: 1 },
  pro_plus: { leadsPerMonth: 500,  hasUnverifiedEmail: true,  hasVerifiedEmail: true,  hasPhone: true,  teamSeats: 1 },
  agency:   { leadsPerMonth: 99999,hasUnverifiedEmail: true,  hasVerifiedEmail: true,  hasPhone: true,  teamSeats: 5 },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  // Create free subscription
  await db.insert(subscriptions).values({ userId, plan: "free", status: "active", leadsUsed: 0 });
  const created = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return created[0];
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId)).limit(1);
  return result[0] ?? null;
}

export async function updateSubscription(userId: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscriptions).set(data).where(eq(subscriptions.userId, userId));
}

export async function incrementLeadsUsed(userId: number, count = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const sub = await getOrCreateSubscription(userId);
  await db.update(subscriptions).set({ leadsUsed: sub.leadsUsed + count }).where(eq(subscriptions.userId, userId));
}

/**
 * Credits bonus leads for a top-up purchase, but only once per Stripe
 * session — guards against the success page being reloaded and re-crediting.
 * Returns false (no-op) if this sessionId was already processed.
 */
export async function addBonusLeadsOnce(userId: number, count: number, sessionId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const sub = await getOrCreateSubscription(userId);
  if (sub.lastTopUpSessionId === sessionId) return false;
  await db.update(subscriptions)
    .set({ bonusLeads: sub.bonusLeads + count, lastTopUpSessionId: sessionId })
    .where(eq(subscriptions.userId, userId));
  return true;
}

// ── ICP Profiles ─────────────────────────────────────────────────────────
// One profile per user, built up incrementally as they answer the ICP
// Discovery Questionnaire. `queryState` holds the full raw answer set as
// JSON; the other columns mirror the fields most relevant to building a
// search, kept in sync on every save so they're queryable without parsing JSON.

export async function getIcpProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(icpProfiles).where(eq(icpProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function saveIcpProfile(userId: number, data: {
  queryState: string;
  industry?: string;
  roles?: string;
  businessSize?: string;
  geography?: string;
  activeSignals?: string;
  problemTheyreIn?: string;
  whatTheyLookLike?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getIcpProfile(userId);
  if (existing) {
    await db.update(icpProfiles).set(data).where(eq(icpProfiles.id, existing.id));
  } else {
    await db.insert(icpProfiles).values({ userId, name: "My ICP", ...data });
  }
  return getIcpProfile(userId);
}

// ── Leads ──────────────────────────────────────────────────────────────────

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(leads).values(data);
  const created = await db.select().from(leads)
    .where(and(eq(leads.userId, data.userId!), eq(leads.linkedinUrl, data.linkedinUrl ?? "")))
    .limit(1);
  return created[0];
}

export async function getLeadsByUser(userId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.userId, userId)).limit(limit).offset(offset);
}

export async function getLeadById(leadId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function updateLead(leadId: number, userId: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set(data).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
}

export async function getLeadsCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(leads).where(eq(leads.userId, userId));
  return result.length;
}

export async function deleteAllLeads(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leads).where(eq(leads.userId, userId));
}

export async function markLeadsExported(userId: number, leadIds: number[]) {
  if (leadIds.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ exportedAt: new Date() })
    .where(and(eq(leads.userId, userId), inArray(leads.id, leadIds)));
}

// ── Scraped Lead Index ───────────────────────────────────────────────────────
// Shared cache of every profile SerpApi has ever returned, so a new search
// with overlapping ICP criteria can be served without another SerpApi call.

export async function findIndexedCandidates(params: {
  industries: string[];
  location: string;
  excludeUrls: string[];
  limit: number;
}) {
  const db = await getDb();
  if (!db || params.limit <= 0) return [];

  // A cached row without a company is a pre-quality-filter leftover (or a
  // gap) — never serve it, same bar as a fresh SerpApi result has to clear.
  const conditions = [isNotNull(scrapedLeadsIndex.company), ne(scrapedLeadsIndex.company, "")];
  if (params.industries.length > 0) {
    conditions.push(or(...params.industries.map(i => like(scrapedLeadsIndex.industry, `%${i}%`)))!);
  }
  if (params.location) {
    conditions.push(like(scrapedLeadsIndex.location, `%${params.location}%`));
  }

  const rows = await db.select().from(scrapedLeadsIndex)
    .where(and(...conditions))
    .limit(params.limit + params.excludeUrls.length);

  const excludeSet = new Set(params.excludeUrls);
  const hasFullName = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length < 2) return false;
    return words[words.length - 1].replace(/\.$/, "").length > 1;
  };
  return rows
    .filter(r => !excludeSet.has(r.linkedinUrl) && hasFullName(r.fullName))
    .slice(0, params.limit);
}

export async function upsertIndexedCandidates(rows: InsertScrapedLeadIndexRow[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return;
  for (const row of rows) {
    await db.insert(scrapedLeadsIndex).values(row)
      .onDuplicateKeyUpdate({ set: { title: row.title, company: row.company } });
  }
}

// ── Enrichment Jobs ────────────────────────────────────────────────────────

export async function createEnrichmentJob(data: InsertEnrichmentJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(enrichmentJobs).values(data);
}

export async function updateEnrichmentJob(jobId: number, data: Partial<InsertEnrichmentJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(enrichmentJobs).set(data).where(eq(enrichmentJobs.id, jobId));
}
