import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

const FREE_TIER = {
  name: "Free",
  price: "$0",
  period: "forever",
  leads: "25 leads / month",
  features: [
    "ICP query builder",
    "Automated LinkedIn profile search",
    "Relevance scoring (High/Medium/Low)",
    "CSV export",
    "ICP Clarity Guide",
  ],
  locked: ["More than 25 leads / month"],
};

const PAID_OPTIONS = [
  {
    key: "monthly" as const,
    name: "Monthly",
    price: "$17",
    period: "/ month",
    leads: "100 leads / month, every month",
    features: [
      "Everything in Free",
      "100 fresh leads per month",
      "Cancel anytime",
    ],
    locked: [],
    cta: "Go Pro — $17/mo",
  },
  {
    key: "topup" as const,
    name: "One-Time Top-Up",
    price: "$27",
    period: "one-time",
    leads: "100 leads, added to your account once",
    features: [
      "Everything in Free",
      "100 leads added on top of your current plan",
      "No subscription, no commitment",
    ],
    locked: [],
    cta: "Buy 100 Leads — $27",
  },
];

function FeatureList({ features, locked }: { features: string[]; locked: string[] }) {
  return (
    <div className="flex-1 mb-6 space-y-2">
      {features.map(f => (
        <div key={f} className="flex items-start gap-2 text-sm min-w-0">
          <Check size={14} style={{ color: "oklch(0.65 0.18 145)", marginTop: "2px", flexShrink: 0 }} aria-hidden="true" />
          <span style={{ color: "oklch(0.75 0.008 260)" }}>{f}</span>
        </div>
      ))}
      {locked.map(f => (
        <div key={f} className="flex items-start gap-2 text-sm">
          <span aria-hidden="true" style={{ color: "oklch(0.48 0.010 260)", marginTop: "2px", flexShrink: 0, fontSize: "0.85rem" }}>✕</span>
          <span style={{ color: "oklch(0.52 0.008 260)" }}><span className="sr-only">Not included: </span>{f}</span>
        </div>
      ))}
    </div>
  );
}

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [selectedPaid, setSelectedPaid] = useState<typeof PAID_OPTIONS[number]["key"]>("monthly");

  const promptPackMutation = trpc.promptPack.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const checkoutMutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const topUpMutation = trpc.subscription.createTopUpCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const handleFreeCTA = () => {
    window.location.href = isAuthenticated ? "/dashboard" : getLoginUrl();
  };

  const handlePaidCTA = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (selectedPaid === "monthly") checkoutMutation.mutate({ plan: "pro" });
    else topUpMutation.mutate();
  };

  const paidPending = checkoutMutation.isPending || topUpMutation.isPending;
  const activeTier = PAID_OPTIONS.find(t => t.key === selectedPaid)!;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.13 0.012 260)" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "oklch(0.13 0.012 260 / 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(0.22 0.012 260)" }}>
        <a href="/" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "oklch(0.92 0.005 260)", textDecoration: "none", letterSpacing: "-0.02em" }}>
          The <span className="text-chrome-gold">Right-People List</span>
        </a>
        <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}
          style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif", fontWeight: 700, padding: "0.5rem 1.25rem", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem" }}>
          {isAuthenticated ? "Dashboard" : "Sign In"}
        </a>
      </nav>

      <main id="main-content" className="pt-28 pb-20 container">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>Pricing</p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Find your people.<br /><span style={{ color: "oklch(0.78 0.18 85)" }}>Close more deals.</span>
          </h1>
          <p className="mt-4 text-base max-w-lg mx-auto" style={{ color: "oklch(0.60 0.008 260)" }}>
            Start free with 25 leads a month. Need more? Go monthly or grab a one-time top-up — no contracts, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {/* 1. FREE */}
          <div className="relative flex flex-col rounded-xl p-6" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.55 0.010 260)", fontFamily: "Archivo, sans-serif" }}>{FREE_TIER.name}</p>
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: "2.2rem", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", lineHeight: 1 }}>{FREE_TIER.price}</span>
                <span className="text-sm" style={{ color: "oklch(0.50 0.008 260)" }}>{FREE_TIER.period}</span>
              </div>
              <p className="mt-2 text-xs font-semibold" style={{ color: "oklch(0.60 0.20 255)" }}>{FREE_TIER.leads}</p>
            </div>
            <FeatureList features={FREE_TIER.features} locked={FREE_TIER.locked} />
            <button onClick={handleFreeCTA} className="w-full py-3 rounded font-bold text-sm transition-all"
              style={{ background: "oklch(0.24 0.014 260)", color: "oklch(0.80 0.008 260)", border: "1px solid oklch(0.32 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
              Get Started Free
            </button>
          </div>

          {/* 2. PAID PLANS — expandable tier picker */}
          <div className="relative flex flex-col rounded-xl p-6" style={{ background: "oklch(0.20 0.015 260)", border: "1px solid oklch(0.78 0.18 85 / 0.5)" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
              Most Popular
            </div>

            <div className="mb-4 flex gap-1.5 p-1 rounded-lg" style={{ background: "oklch(0.14 0.012 260)" }} role="radiogroup" aria-label="Paid plan option">
              {PAID_OPTIONS.map(t => (
                <button key={t.key} onClick={() => setSelectedPaid(t.key)}
                  role="radio" aria-checked={selectedPaid === t.key}
                  className="flex-1 py-1.5 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: selectedPaid === t.key ? "oklch(0.78 0.18 85)" : "transparent",
                    color: selectedPaid === t.key ? "oklch(0.13 0.012 260)" : "oklch(0.60 0.008 260)",
                    fontFamily: "Archivo, sans-serif",
                  }}>
                  {t.name}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: "2.2rem", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", lineHeight: 1 }}>{activeTier.price}</span>
                <span className="text-sm" style={{ color: "oklch(0.50 0.008 260)" }}>{activeTier.period}</span>
              </div>
              <p className="mt-2 text-xs font-semibold" style={{ color: "oklch(0.78 0.18 85)" }}>{activeTier.leads}</p>
            </div>
            <FeatureList features={activeTier.features} locked={activeTier.locked} />
            <button
              onClick={handlePaidCTA}
              disabled={paidPending}
              className="w-full py-3 rounded font-bold text-sm transition-all"
              style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
              {paidPending ? "Loading..." : activeTier.cta}
            </button>
          </div>

          {/* 3. PROMPT PACK */}
          <div className="relative flex flex-col rounded-xl p-6" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.55 0.010 260)", fontFamily: "Archivo, sans-serif" }}>Outreach Prompt Pack</p>
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: "2.2rem", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", lineHeight: 1 }}>$49</span>
                <span className="text-sm" style={{ color: "oklch(0.50 0.008 260)" }}>one-time</span>
              </div>
              <p className="mt-2 text-xs font-semibold" style={{ color: "oklch(0.60 0.20 255)" }}>Works with any plan</p>
            </div>
            <div className="flex-1 mb-6">
              <p className="text-sm leading-relaxed mb-3" style={{ color: "oklch(0.62 0.008 260)" }}>
                3 AI prompts that turn your lead CSV into a personalized, article-backed email drip campaign — in 15 minutes.
              </p>
              <div className="space-y-2">
                {["Article Finder Prompt", "Link Verifier Prompt", "3-Touch Email Drip Prompt", "Step-by-step guide"].map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm min-w-0">
                    <Check size={14} style={{ color: "oklch(0.65 0.18 145)", marginTop: "2px", flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ color: "oklch(0.75 0.008 260)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                promptPackMutation.mutate();
              }}
              disabled={promptPackMutation.isPending}
              className="w-full py-3 rounded font-bold text-sm transition-all"
              style={{ background: "oklch(0.24 0.014 260)", color: "oklch(0.80 0.008 260)", border: "1px solid oklch(0.32 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
              {promptPackMutation.isPending ? "Loading..." : "Get the Prompts →"}
            </button>
          </div>
        </div>

        {/* Legal compliance note */}
        <div className="mt-12 p-5 rounded-lg max-w-2xl mx-auto" style={{ background: "oklch(0.60 0.20 255 / 0.06)", border: "1px solid oklch(0.60 0.20 255 / 0.20)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.60 0.20 255)", fontFamily: "Archivo, sans-serif" }}>
            <Zap size={11} aria-hidden="true" style={{ display: "inline", marginRight: "4px" }} />Legal & Ethical Use
          </p>
          <p className="text-sm leading-relaxed break-words" style={{ color: "oklch(0.58 0.008 260)" }}>
            The Right-People List surfaces <strong style={{ color: "oklch(0.75 0.008 260)" }}>publicly available data only</strong> — profiles visible to anyone on the open internet. Scraping public data is legal in the US under the hiQ v. LinkedIn ruling (9th Circuit, 2022). Email enrichment via Apollo uses their licensed B2B database. All outreach must comply with CAN-SPAM: include a physical address, provide an unsubscribe option, and honor opt-outs within 10 business days. GDPR applies to EU contacts — The Right-People List targets US-based prospects by default.
          </p>
        </div>
      </main>
    </div>
  );
}
