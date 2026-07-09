import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { enrichmentJobs, InsertEnrichmentJob, InsertLead, InsertSubscription, InsertUser, leads, subscriptions, users } from "../drizzle/schema";
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free:     { leadsPerMonth: 25,   hasUnverifiedEmail: false, hasVerifiedEmail: false, hasPhone: false, teamSeats: 1 },
  pro:      { leadsPerMonth: 150,  hasUnverifiedEmail: true,  hasVerifiedEmail: false, hasPhone: false, teamSeats: 1 },
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
