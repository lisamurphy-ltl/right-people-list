import Stripe from "stripe";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createLead,
  getLeadById,
  getLeadsByUser,
  getLeadsCount,
  getOrCreateSubscription,
  incrementLeadsUsed,
  PLAN_LIMITS,
  updateLead,
  updateSubscription,
} from "./db";
import { apolloEnrich, guessEmail } from "./enrichment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2026-06-24.dahlia" });

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
          const customer = await stripe.customers.create({
            email: ctx.user.email ?? undefined,
            name: ctx.user.name ?? undefined,
            metadata: { userId: String(ctx.user.id) },
          });
          customerId = customer.id;
          await updateSubscription(ctx.user.id, { stripeCustomerId: customerId });
        }

        const session = await stripe.checkout.sessions.create({
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
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${process.env.VITE_APP_URL ?? "https://localhost:3000"}/dashboard`,
      });
      return { url: session.url };
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
