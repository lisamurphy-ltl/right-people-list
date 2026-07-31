import { randomUUID } from "crypto";
import Stripe from "stripe";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashPassword, verifyPassword } from "./_core/password";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addBonusLeadsOnce,
  createLead,
  createUser,
  deleteAllLeads,
  findIndexedCandidates,
  getIcpProfile,
  getLeadById,
  getLeadsByUser,
  getLeadsCount,
  getOrCreateSubscription,
  getUserByEmail,
  incrementLeadsUsed,
  PLAN_LIMITS,
  saveIcpProfile,
  touchLastSignedIn,
  updateLead,
  updateSubscription,
  upsertIndexedCandidates,
} from "./db";
import { apolloEnrich, guessEmail } from "./enrichment";
import { searchLinkedInProfiles } from "./leadSearch";
import { logLeadsToSheet, SheetLeadRow } from "./sheetLog";

// Company-size descriptor a real LinkedIn bio might actually contain as
// literal text — headcount ranges themselves never appear in profile snippets.
const HEADCOUNT_DESCRIPTOR: Record<string, string> = {
  "1 (solo)": "solopreneur",
  "2–10": "small team",
  "11–50": "growing team",
  "51–200": "established company",
  "201–500": "established company",
};

type IcpAnswers = Record<string, string | string[] | undefined>;

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v.filter(Boolean) : [v].filter(Boolean);
}

// Builds the ICP profile answers into a searchable Google/LinkedIn query.
// Kept to titles + industries + location as required groups — every extra
// required group multiplies how narrow the literal-text match has to be,
// and Google search only matches literal text, not meaning. Company size
// is included as a soft (optional) hint, not a requirement.
function buildIcpQueryFromAnswers(a: IcpAnswers): { query: string; titles: string[]; industries: string[] } {
  const titles = asArray(a.q10);
  const industries = asArray(a.q4);
  const specificLocation = (a.q7_metro as string) || (a.q7_state as string) || (a.q7_regional as string) || "";
  const locationOptions = asArray(a.q7).filter(l => l !== "Global — location doesn't matter");
  const headcounts = asArray(a.q6);
  const sizeDescriptor = headcounts.map(h => HEADCOUNT_DESCRIPTOR[h]).find(Boolean);

  const roleStr = titles.length > 0 ? `(${titles.map(t => `"${t}"`).join(" OR ")})` : `("Founder" OR "Owner" OR "CEO")`;
  const indStr = industries.length > 0 ? `(${industries.map(i => `"${i}"`).join(" OR ")})` : "";
  const locStr = specificLocation ? `"${specificLocation}"` : locationOptions.length > 0 ? `"${locationOptions[0]}"` : "";
  const sizeStr = sizeDescriptor ? `"${sizeDescriptor}"` : "";

  const query = ["site:linkedin.com/in/", roleStr, indStr, locStr, sizeStr].filter(Boolean).join(" ");
  return { query, titles, industries };
}

const EMAIL_SCHEMA = z.string().trim().toLowerCase().email();
const PASSWORD_SCHEMA = z.string().min(8, "Password must be at least 8 characters");

async function issueSession(ctx: { req: any; res: any }, userId: number) {
  const sessionToken = await sdk.createSessionToken(userId, { expiresInMs: ONE_YEAR_MS });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

// Prompt pack PDF — served after successful payment
// TODO: drop the real PDF at client/public/downloads/right-people-list-outreach-system.pdf
const PROMPT_PACK_PDF_PATH = "/downloads/right-people-list-outreach-system.pdf";
const PROMPT_PACK_PRICE = 4900; // $49.00 in cents

// Lazily instantiated so a missing/invalid key fails only the Stripe-dependent
// procedures that call getStripe(), not the whole server at boot.
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY).");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
  }
  return _stripe;
}

// Stripe Price IDs — set via env after creating products in Stripe dashboard
const PRICE_IDS = {
  pro:      process.env.STRIPE_PRICE_PRO      ?? "",
  pro_plus: process.env.STRIPE_PRICE_PRO_PLUS ?? "",
  agency:   process.env.STRIPE_PRICE_AGENCY   ?? "",
};
const TOP_UP_PRICE_ID = process.env.STRIPE_PRICE_TOPUP ?? "";
const TOP_UP_LEADS = 100;

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    signup: publicProcedure
      .input(z.object({
        email: EMAIL_SCHEMA,
        password: PASSWORD_SCHEMA,
        name: z.string().trim().min(1).max(256).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new Error("An account with this email already exists.");

        const passwordHash = await hashPassword(input.password);
        const user = await createUser({
          openId: randomUUID(),
          email: input.email,
          passwordHash,
          name: input.name ?? null,
        });
        if (!user) throw new Error("Failed to create account.");

        await issueSession(ctx, user.id);
        return user;
      }),

    login: publicProcedure
      .input(z.object({ email: EMAIL_SCHEMA, password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new Error("Invalid email or password.");
        }

        await touchLastSignedIn(user.id);
        await issueSession(ctx, user.id);
        return user;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Subscription ──────────────────────────────────────────────────────────
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getOrCreateSubscription(ctx.user.id);
      const limits = PLAN_LIMITS[sub.plan];
      return {
        ...sub,
        limits,
        leadsRemaining: limits.leadsPerMonth === 99999
          ? 99999
          : Math.max(0, limits.leadsPerMonth + sub.bonusLeads - sub.leadsUsed),
      };
    }),

    createCheckout: protectedProcedure
      .input(z.object({ plan: z.enum(["pro", "pro_plus", "agency"]) }))
      .mutation(async ({ ctx, input }) => {
        const priceId = PRICE_IDS[input.plan];
        if (!priceId) throw new Error(`Stripe price ID not configured for plan: ${input.plan}`);

        const sub = await getOrCreateSubscription(ctx.user.id);
        let customerId = sub.stripeCustomerId ?? undefined;

        if (!customerId) {
          const customer = await getStripe().customers.create({
            email: ctx.user.email ?? undefined,
            name: ctx.user.name ?? undefined,
            metadata: { userId: String(ctx.user.id) },
          });
          customerId = customer.id;
          await updateSubscription(ctx.user.id, { stripeCustomerId: customerId });
        }

        const session = await getStripe().checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          mode: "subscription",
          allow_promotion_codes: true,
          success_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/dashboard?upgraded=1`,
          cancel_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/pricing`,
          metadata: { userId: String(ctx.user.id), plan: input.plan },
        });

        return { url: session.url };
      }),

    createPortal: protectedProcedure.mutation(async ({ ctx }) => {
      const sub = await getOrCreateSubscription(ctx.user.id);
      if (!sub.stripeCustomerId) throw new Error("No Stripe customer found");
      const session = await getStripe().billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/dashboard`,
      });
      return { url: session.url };
    }),

    createTopUpCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      if (!TOP_UP_PRICE_ID) throw new Error("Lead top-up is not configured yet.");

      const sub = await getOrCreateSubscription(ctx.user.id);
      let customerId = sub.stripeCustomerId ?? undefined;

      if (!customerId) {
        const customer = await getStripe().customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateSubscription(ctx.user.id, { stripeCustomerId: customerId });
      }

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: TOP_UP_PRICE_ID, quantity: 1 }],
        mode: "payment",
        allow_promotion_codes: true,
        success_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/dashboard?topup_session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/pricing`,
        metadata: { userId: String(ctx.user.id), product: "lead_topup" },
      });

      return { url: session.url };
    }),

    verifyTopUp: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getStripe().checkout.sessions.retrieve(input.sessionId);
        const paid = session.payment_status === "paid";
        const isOwner = session.metadata?.userId === String(ctx.user.id);
        const isTopUp = session.metadata?.product === "lead_topup";

        if (!paid || !isOwner || !isTopUp) {
          throw new Error("Payment not verified or session does not belong to this user.");
        }

        const credited = await addBonusLeadsOnce(ctx.user.id, TOP_UP_LEADS, input.sessionId);
        return { added: credited ? TOP_UP_LEADS : 0, alreadyCredited: !credited };
      }),
  }),

  // ── Prompt Pack (one-time $49 purchase) ──────────────────────────────────
  promptPack: router({
    createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      const sub = await getOrCreateSubscription(ctx.user.id);
      let customerId = sub.stripeCustomerId ?? undefined;

      if (!customerId) {
        const customer = await getStripe().customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        await updateSubscription(ctx.user.id, { stripeCustomerId: customerId });
      }

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: PROMPT_PACK_PRICE,
            product_data: {
              name: "Plug-and-Play Outreach System",
              description: "3 AI prompts that turn your ICP lead list into a personalized, article-backed email drip campaign — in 15 minutes flat.",
              images: [],
            },
          },
          quantity: 1,
        }],
        mode: "payment",
        allow_promotion_codes: true,
        success_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/download?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/pricing`,
        metadata: { userId: String(ctx.user.id), product: "prompt_pack" },
      });

      return { url: session.url };
    }),

    verifyAndGetDownload: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ ctx, input }) => {
        const session = await getStripe().checkout.sessions.retrieve(input.sessionId);
        const paid = session.payment_status === "paid";
        const isOwner = session.metadata?.userId === String(ctx.user.id);
        const isPromptPack = session.metadata?.product === "prompt_pack";

        if (!paid || !isOwner || !isPromptPack) {
          throw new Error("Payment not verified or session does not belong to this user.");
        }

        return {
          downloadUrl: PROMPT_PACK_PDF_PATH,
          fileName: "ICP_Scout_Plug_and_Play_Outreach_System.pdf",
        };
      }),
  }),

  // ── Leads ─────────────────────────────────────────────────────────────────
  leads: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const items = await getLeadsByUser(ctx.user.id, input.limit, input.offset);
        const total = await getLeadsCount(ctx.user.id);
        return { items, total };
      }),

    runSearch: protectedProcedure
      .mutation(async ({ ctx }) => {
        const profile = await getIcpProfile(ctx.user.id);
        const answers: IcpAnswers = profile?.queryState ? JSON.parse(profile.queryState) : {};
        const { query, titles, industries } = buildIcpQueryFromAnswers(answers);
        const location = (answers.q7_metro as string) || (answers.q7_state as string) || (answers.q7_regional as string)
          || asArray(answers.q7)[0] || "";
        const companySize = asArray(answers.q6)[0] || "";

        if (titles.length === 0 || industries.length === 0) {
          throw new Error("Finish your ICP profile first (job titles and industries are required) before running a search.");
        }

        const sub = await getOrCreateSubscription(ctx.user.id);
        const limits = PLAN_LIMITS[sub.plan];
        const remaining = limits.leadsPerMonth === 99999
          ? 25
          : Math.max(0, limits.leadsPerMonth + sub.bonusLeads - sub.leadsUsed);

        if (remaining <= 0) {
          throw new Error(`Monthly lead limit reached (${limits.leadsPerMonth}). Upgrade or buy a lead top-up to run more searches.`);
        }

        // One click should be able to fill the whole month's quota, not a
        // small arbitrary batch — 100 is Google/SerpApi's practical ceiling
        // for a single request anyway, which happens to match the Pro plan.
        const cap = Math.min(remaining, 100);

        const existing = await getLeadsByUser(ctx.user.id, 1000, 0);
        const existingUrls = new Set(existing.map(l => l.linkedinUrl).filter((u): u is string => !!u));

        // Real signal, not a guess: does the candidate's own title actually
        // contain one of the exact titles the user asked for.
        const scoreFor = (text: string | null) => {
          if (!text) return "medium" as const;
          const lower = text.toLowerCase();
          return titles.some(t => lower.includes(t.toLowerCase())) ? "high" as const : "medium" as const;
        };

        // Tier 1: check the shared index of already-scraped leads first, so
        // matching ICP criteria don't cost another SerpApi call.
        const indexed = await findIndexedCandidates({
          industries,
          location,
          excludeUrls: Array.from(existingUrls),
          limit: cap,
        });

        let added = 0;
        for (const row of indexed) {
          if (added >= cap) break;
          await createLead({
            userId: ctx.user.id,
            fullName: row.fullName,
            title: row.title ?? undefined,
            company: row.company ?? undefined,
            linkedinUrl: row.linkedinUrl,
            relevanceScore: scoreFor(row.title),
            searchQuery: row.searchQuery ?? query,
          });
          added++;
        }

        // Tier 2: only hit SerpApi for the shortfall the index couldn't cover.
        const shortfall = cap - added;
        let freshFound = 0;
        if (shortfall > 0) {
          const candidates = await searchLinkedInProfiles(query, shortfall);
          freshFound = candidates.length;
          const newlyIndexed: SheetLeadRow[] = [];

          for (const c of candidates) {
            if (existingUrls.has(c.linkedinUrl)) continue;
            if (added >= cap) break;
            const relevanceScore = scoreFor(c.title);
            await createLead({
              userId: ctx.user.id,
              fullName: c.fullName,
              title: c.title ?? undefined,
              company: c.company ?? undefined,
              linkedinUrl: c.linkedinUrl,
              relevanceScore,
              searchQuery: query,
            });
            added++;

            newlyIndexed.push({
              fullName: c.fullName,
              title: c.title,
              company: c.company,
              linkedinUrl: c.linkedinUrl,
              industry: industries.join(", "),
              location,
              companySize: companySize || null,
              relevanceScore,
              searchQuery: query,
              source: "serpapi",
            });
          }

          if (newlyIndexed.length > 0) {
            await upsertIndexedCandidates(newlyIndexed.map(r => ({
              fullName: r.fullName,
              title: r.title,
              company: r.company,
              linkedinUrl: r.linkedinUrl,
              industry: r.industry,
              location: r.location,
              companySize: r.companySize,
              searchQuery: r.searchQuery,
              source: r.source,
            })));
            // Fire-and-forget: never let sheet-logging block or fail the search.
            void logLeadsToSheet(newlyIndexed);
          }
        }

        if (added > 0) await incrementLeadsUsed(ctx.user.id, added);

        return { added, found: indexed.length + freshFound, fromIndex: indexed.length, query };
      }),

    add: protectedProcedure
      .input(z.object({
        fullName: z.string().optional(),
        title: z.string().optional(),
        linkedinUrl: z.string().optional(),
        headline: z.string().optional(),
        location: z.string().optional(),
        company: z.string().optional(),
        companyDomain: z.string().optional(),
        relevanceScore: z.enum(["high", "medium", "low"]).optional(),
        searchQuery: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sub = await getOrCreateSubscription(ctx.user.id);
        const limits = PLAN_LIMITS[sub.plan];

        if (limits.leadsPerMonth !== 99999 && sub.leadsUsed >= limits.leadsPerMonth + sub.bonusLeads) {
          throw new Error(`Monthly lead limit reached (${limits.leadsPerMonth}). Upgrade or buy a lead top-up to add more leads.`);
        }

        const lead = await createLead({ ...input, userId: ctx.user.id });
        await incrementLeadsUsed(ctx.user.id);
        return lead;
      }),

    enrich: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sub = await getOrCreateSubscription(ctx.user.id);
        const limits = PLAN_LIMITS[sub.plan];
        const lead = await getLeadById(input.leadId, ctx.user.id);
        if (!lead) throw new Error("Lead not found");

        const updates: Record<string, unknown> = { enrichmentStatus: "pending" };

        // Pro: unverified email via pattern matching
        if (limits.hasUnverifiedEmail && !lead.emailUnverified) {
          const domain = lead.companyDomain ?? "";
          if (lead.fullName && domain) {
            updates.emailUnverified = guessEmail(lead.fullName, domain);
          }
        }

        // Pro Plus / Agency: verified email + phone via Apollo
        if (limits.hasVerifiedEmail && !lead.apolloEnriched) {
          const nameParts = (lead.fullName ?? "").trim().split(/\s+/);
          const enriched = await apolloEnrich({
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(" "),
            linkedinUrl: lead.linkedinUrl ?? undefined,
            company: lead.company ?? undefined,
          });

          if (enriched.emailVerified) updates.emailVerified = enriched.emailVerified;
          if (enriched.phone) updates.phone = enriched.phone;
          if (enriched.company) updates.company = enriched.company;
          if (enriched.companyDomain) updates.companyDomain = enriched.companyDomain;
          updates.apolloEnriched = true;
          updates.emailVerifiedAt = new Date();
        }

        updates.enrichmentStatus = "enriched";
        await updateLead(input.leadId, ctx.user.id, updates as Parameters<typeof updateLead>[2]);
        return getLeadById(input.leadId, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lead = await getLeadById(input.leadId, ctx.user.id);
        if (!lead) throw new Error("Lead not found");
        const { getDb } = await import("./db");
        const { leads: leadsTable } = await import("../drizzle/schema");
        const { and, eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(leadsTable).where(and(eq(leadsTable.id, input.leadId), eq(leadsTable.userId, ctx.user.id)));
        return { success: true };
      }),

    clearAll: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteAllLeads(ctx.user.id);
      // Also reset the monthly counter so clearing test leads actually frees
      // up quota to run a fresh test, not just tidies the list.
      await updateSubscription(ctx.user.id, { leadsUsed: 0 });
      return { success: true };
    }),
  }),

  icpProfile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getIcpProfile(ctx.user.id);
      if (!profile) return null;
      return {
        ...profile,
        answers: profile.queryState ? JSON.parse(profile.queryState) : {},
      };
    }),

    save: protectedProcedure
      .input(z.object({
        answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        industry: z.string().optional(),
        roles: z.string().optional(),
        businessSize: z.string().optional(),
        geography: z.string().optional(),
        activeSignals: z.string().optional(),
        problemTheyreIn: z.string().optional(),
        whatTheyLookLike: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await saveIcpProfile(ctx.user.id, {
          queryState: JSON.stringify(input.answers),
          industry: input.industry,
          roles: input.roles,
          businessSize: input.businessSize,
          geography: input.geography,
          activeSignals: input.activeSignals,
          problemTheyreIn: input.problemTheyreIn,
          whatTheyLookLike: input.whatTheyLookLike,
          isActive: input.isActive,
        });
        return {
          ...profile,
          answers: profile?.queryState ? JSON.parse(profile.queryState) : {},
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
