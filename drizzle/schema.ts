import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Subscriptions ──────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["free", "pro", "pro_plus", "agency"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing", "incomplete"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  leadsUsed: int("leadsUsed").default(0).notNull(),
  // One-time lead top-up purchases credited for the current month; added
  // on top of the plan's monthly allotment, reset to 0 whenever leadsUsed resets.
  bonusLeads: int("bonusLeads").default(0).notNull(),
  // Guards against re-crediting bonusLeads if the checkout success page reloads.
  lastTopUpSessionId: varchar("lastTopUpSessionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ── Leads ──────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Profile data (Free+)
  fullName: varchar("fullName", { length: 256 }),
  title: varchar("title", { length: 256 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  headline: text("headline"),
  location: varchar("location", { length: 256 }),
  // Unverified email (Pro+)
  emailUnverified: varchar("emailUnverified", { length: 320 }),
  // Verified enrichment (Pro Plus+)
  emailVerified: varchar("emailVerified", { length: 320 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  phone: varchar("phone", { length: 64 }),
  company: varchar("company", { length: 256 }),
  companyDomain: varchar("companyDomain", { length: 256 }),
  // Scoring
  relevanceScore: mysqlEnum("relevanceScore", ["high", "medium", "low"]).default("medium"),
  searchQuery: text("searchQuery"),
  enrichmentStatus: mysqlEnum("enrichmentStatus", ["pending", "enriched", "failed", "not_enriched"]).default("not_enriched").notNull(),
  apolloEnriched: boolean("apolloEnriched").default(false).notNull(),
  // Outreach tracking
  lastContactedAt: timestamp("lastContactedAt"),
  notAFit: boolean("notAFit").default(false).notNull(),
  exportedAt: timestamp("exportedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ── Enrichment Jobs ────────────────────────────────────────────────────────
export const enrichmentJobs = mysqlTable("enrichment_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId").notNull(),
  type: mysqlEnum("type", ["email_unverified", "email_verified", "phone"]).notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed"]).default("pending").notNull(),
  result: text("result"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EnrichmentJob = typeof enrichmentJobs.$inferSelect;
export type InsertEnrichmentJob = typeof enrichmentJobs.$inferInsert;

// ── ICP Profiles ───────────────────────────────────────────────────────────
export const icpProfiles = mysqlTable("icp_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  industry: text("industry"),
  roles: text("roles"),
  businessSize: text("businessSize"),
  geography: varchar("geography", { length: 256 }),
  activeSignals: text("activeSignals"),
  problemTheyreIn: text("problemTheyreIn"),
  whatTheyLookLike: text("whatTheyLookLike"),
  queryState: text("queryState"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IcpProfile = typeof icpProfiles.$inferSelect;
export type InsertIcpProfile = typeof icpProfiles.$inferInsert;

// ── Deep Research Runs ─────────────────────────────────────────────────────
export const deepResearchRuns = mysqlTable("deep_research_runs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  icpProfileId: int("icpProfileId"),
  status: mysqlEnum("status", ["pending", "running", "complete", "failed"]).default("pending").notNull(),
  icaSnapshot: text("icaSnapshot"),
  results: text("results"),
  totalFound: int("totalFound").default(0).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeepResearchRun = typeof deepResearchRuns.$inferSelect;
export type InsertDeepResearchRun = typeof deepResearchRuns.$inferInsert;

// ── Scraped Lead Index ──────────────────────────────────────────────────────
// Shared across all users: every profile SerpApi ever returns gets cached here
// so future searches with overlapping ICP criteria can be served without a
// fresh SerpApi call. Tagged with the ICP criteria active when it was scraped
// (not parsed from the profile itself, since SerpApi only gives us a title line).
export const scrapedLeadsIndex = mysqlTable("scraped_leads_index", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 256 }).notNull(),
  title: varchar("title", { length: 256 }),
  company: varchar("company", { length: 256 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }).notNull().unique(),
  industry: text("industry"),
  location: varchar("location", { length: 256 }),
  companySize: varchar("companySize", { length: 64 }),
  searchQuery: text("searchQuery"),
  source: mysqlEnum("source", ["serpapi", "llm"]).default("serpapi").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScrapedLeadIndexRow = typeof scrapedLeadsIndex.$inferSelect;
export type InsertScrapedLeadIndexRow = typeof scrapedLeadsIndex.$inferInsert;
