// Keeps the subscriptions table in sync with Stripe as the source of truth.
// Without this, a checkout can succeed on Stripe's side while the app never
// finds out — the client-side redirect is not reliable (closed tab, network
// blip, etc). This is the backstop that always catches it.

import type { Request, Response } from "express";
import Stripe from "stripe";
import { getSubscriptionByStripeCustomerId, updateSubscription } from "./db";

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

type PlanType = "pro" | "pro_plus" | "agency";

function priceToPlan(priceId: string | null | undefined): PlanType | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_PRO_PLUS) return "pro_plus";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency";
  return null;
}

const KNOWN_STATUSES = ["active", "canceled", "past_due", "trialing", "incomplete"];
function mapStatus(status: string): "active" | "canceled" | "past_due" | "trialing" | "incomplete" {
  return (KNOWN_STATUSES.includes(status) ? status : "canceled") as any;
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting.");
    res.status(500).send("Webhook not configured");
    return;
  }

  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature as string, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    res.status(400).send("Invalid signature");
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ? parseInt(session.metadata.userId, 10) : null;
        if (!userId || !session.subscription) break; // top-up (mode: payment) is handled by verifyTopUp client-side

        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
        const item = subscription.items.data[0];
        const plan = priceToPlan(item?.price.id) ?? "pro";

        await updateSubscription(userId, {
          plan,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: item?.price.id,
          status: mapStatus(subscription.status),
          currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
          currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
        });
        console.log(`[Stripe Webhook] checkout.session.completed → user ${userId} upgraded to ${plan}`);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = await getSubscriptionByStripeCustomerId(subscription.customer as string);
        if (!sub) break;

        const item = subscription.items.data[0];
        const plan = event.type === "customer.subscription.deleted"
          ? "free"
          : (priceToPlan(item?.price.id) ?? sub.plan);

        await updateSubscription(sub.userId, {
          plan: plan as any,
          stripePriceId: item?.price.id,
          status: mapStatus(subscription.status),
          currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
          currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
        });
        console.log(`[Stripe Webhook] ${event.type} → user ${sub.userId} now ${plan}`);
        break;
      }
    }
  } catch (err) {
    // Log and still 200 — a bug on our end shouldn't make Stripe retry forever.
    console.error("[Stripe Webhook] Handler error:", err);
  }

  res.json({ received: true });
}
