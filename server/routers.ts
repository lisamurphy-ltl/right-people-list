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
  createLead,
  createUser,
  getLeadById,
  getLeadsByUser,
  getLeadsCount,
  getOrCreateSubscription,
  getUserByEmail,
  incrementLeadsUsed,
  PLAN_LIMITS,
  touchLastSignedIn,
  updateLead,
  updateSubscription,
} from "./db";
import { apolloEnrich, guessEmail } from "./enrichment";

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
          : Math.max(0, limits.leadsPerMonth - sub.leadsUsed),
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

        if (limits.leadsPerMonth !== 99999 && sub.leadsUsed >= limits.leadsPerMonth) {
          throw new Error(`Monthly lead limit reached (${limits.leadsPerMonth}). Upgrade to add more leads.`);
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
  }),
});

export type AppRouter = typeof appRouter;
