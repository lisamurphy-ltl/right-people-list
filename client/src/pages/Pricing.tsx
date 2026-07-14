import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

const TIERS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    leads: "25 leads / month",
    features: [
      "ICP query builder",
      "Google search integration",
      "Basic profile data (name, title, LinkedIn URL)",
      "Relevance scoring",
      "CSV export",
      "ICP Clarity Guide",
      "1 saved ICP profile",
    ],
    locked: ["Unverified emails", "Verified emails", "Phone numbers", "Deep Research", "Team seats"],
    cta: "Get Started Free",
    highlight: false,
    plan: null,
  },
  {
    key: "pro",
    name: "Scout Pro",
    price: "$47",
    period: "/ month",
    leads: "150 leads / month",
    features: [
      "Everything in Free",
      "Unverified emails (pattern-matched)",
      "Company domain lookup",
      "150 leads per month",
      "1 saved ICP profile",
      "Priority support",
    ],
    locked: ["Verified emails", "Phone numbers", "Deep Research", "Team seats"],
    cta: "Start Scout Pro",
    highlight: false,
    plan: "pro",
  },
  {
    key: "pro_plus",
    name: "Scout Pro+",
    price: "$127",
    period: "/ month",
    leads: "500 leads / month",
    features: [
      "Everything in Scout Pro",
      "Verified emails via Apollo API",
      "Phone numbers via Apollo API",
      "500 leads per month",
      "3 saved ICP profiles",
      "Deep Research — AI finds 100 named leads with bios + contact info",
      "Enrichment status tracking",
    ],
    locked: ["Team seats"],
    cta: "Start Scout Pro+",
    highlight: true,
    plan: "pro_plus",
  },
  {
    key: "agency",
    name: "Agency",
    price: "$297",
    period: "/ month",
    leads: "Unlimited leads",
    features: [
      "Everything in Scout Pro+",
      "Unlimited leads per month",
      "Unlimited saved ICP profiles",
      "Deep Research — unlimited AI research runs",
      "Up to 5 team seats",
      "White-label CSV export",
      "Dedicated support",
    ],
    locked: [],
    cta: "Start Agency",
    highlight: false,
    plan: "agency",
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const promptPackMutation = trpc.promptPack.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const checkoutMutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: (e) => toast.error(e.message),
  });

  const handleCTA = (plan: string | null) => {
    if (!plan) {
      window.location.href = isAuthenticated ? "/dashboard" : getLoginUrl();
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    checkoutMutation.mutate({ plan: plan as "pro" | "pro_plus" | "agency" });
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.13 0.012 260)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "oklch(0.13 0.012 260 / 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(0.22 0.012 260)" }}>
        <a href="/" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "oklch(0.92 0.005 260)", textDecoration: "none", letterSpacing: "-0.02em" }}>
          ICP<span style={{ color: "oklch(0.78 0.18 85)" }}>Scout</span>
        </a>
        <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}
          style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif", fontWeight: 700, padding: "0.5rem 1.25rem", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem" }}>
          {isAuthenticated ? "Dashboard" : "Sign In"}
        </a>
      </nav>

      <div className="pt-28 pb-20 container">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>Pricing</p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Find your people.<br /><span style={{ color: "oklch(0.78 0.18 85)" }}>Close more deals.</span>
          </h1>
          <p className="mt-4 text-base max-w-lg mx-auto" style={{ color: "oklch(0.60 0.008 260)" }}>
            Start free. Upgrade when you're ready for verified emails and phone numbers. No contracts, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map(tier => (
            <div key={tier.key} className="relative flex flex-col rounded-xl p-6"
              style={{
                background: tier.highlight ? "oklch(0.20 0.015 260)" : "oklch(0.18 0.012 260)",
                border: `1px solid ${tier.highlight ? "oklch(0.78 0.18 85 / 0.5)" : "oklch(0.26 0.012 260)"}`,
              }}>
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif" }}>
                  Most Popular
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.55 0.010 260)", fontFamily: "Syne, sans-serif" }}>{tier.name}</p>
                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "2.2rem", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", lineHeight: 1 }}>{tier.price}</span>
                  <span className="text-sm" style={{ color: "oklch(0.50 0.008 260)" }}>{tier.period}</span>
                </div>
                <p className="mt-2 text-xs font-semibold" style={{ color: tier.highlight ? "oklch(0.78 0.18 85)" : "oklch(0.60 0.20 255)" }}>{tier.leads}</p>
              </div>

              <div className="flex-1 mb-6 space-y-2">
                {tier.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm min-w-0">
                    <Check size={14} style={{ color: "oklch(0.65 0.18 145)", marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ color: "oklch(0.75 0.008 260)" }}>{f}</span>
                  </div>
                ))}
                {tier.locked.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm opacity-35">
                    <span style={{ color: "oklch(0.40 0.008 260)", marginTop: "2px", flexShrink: 0, fontSize: "0.85rem" }}>✕</span>
                    <span style={{ color: "oklch(0.40 0.008 260)" }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCTA(tier.plan)}
                disabled={checkoutMutation.isPending}
                className="w-full py-3 rounded font-bold text-sm transition-all"
                style={{
                  background: tier.highlight ? "oklch(0.78 0.18 85)" : "oklch(0.24 0.014 260)",
                  color: tier.highlight ? "oklch(0.13 0.012 260)" : "oklch(0.80 0.008 260)",
                  border: tier.highlight ? "none" : "1px solid oklch(0.32 0.012 260)",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Prompt Pack Add-On */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="p-7 rounded-xl relative overflow-hidden" style={{ background: "oklch(0.18 0.012 260)", border: "2px solid oklch(0.78 0.18 85 / 0.35)" }}>
            {/* Gold glow */}
            <div className="absolute top-0 right-0 w-64 h-32 blur-3xl rounded-full pointer-events-none" style={{ background: "oklch(0.78 0.18 85 / 0.07)" }} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: "oklch(0.78 0.18 85 / 0.12)", border: "1px solid oklch(0.78 0.18 85 / 0.35)", color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>
                  One-Time Add-On
                </div>
                <h3 className="mb-1 text-xl" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", letterSpacing: "-0.02em" }}>
                  Plug-and-Play Outreach System
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "oklch(0.62 0.008 260)" }}>
                  3 AI prompts that turn your lead CSV into a personalized, article-backed email drip campaign — in 15 minutes. Drop your CSV into Manus, ChatGPT, or Claude and get outreach copy that doesn't sound like everyone else's.
                </p>
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: "oklch(0.55 0.008 260)" }}>
                  <span>✓ Article Finder Prompt</span>
                  <span>✓ Link Verifier Prompt</span>
                  <span>✓ 3-Touch Email Drip Prompt</span>
                  <span>✓ Step-by-step guide</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="text-center mb-1">
                  <span style={{ fontSize: "2rem", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", lineHeight: 1 }}>$49</span>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.008 260)" }}>one-time</p>
                </div>
                <button
                  onClick={() => {
                    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                    promptPackMutation.mutate();
                  }}
                  disabled={promptPackMutation.isPending}
                  className="px-6 py-2.5 rounded font-bold text-sm whitespace-nowrap transition-all"
                  style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif" }}
                >
                  {promptPackMutation.isPending ? "Loading..." : "Get the Prompts →"}
                </button>
                <p className="text-xs" style={{ color: "oklch(0.40 0.008 260)" }}>Instant PDF download</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal compliance note */}
        <div className="mt-12 p-5 rounded-lg max-w-2xl mx-auto" style={{ background: "oklch(0.60 0.20 255 / 0.06)", border: "1px solid oklch(0.60 0.20 255 / 0.20)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.60 0.20 255)", fontFamily: "Syne, sans-serif" }}>
            <Zap size={11} style={{ display: "inline", marginRight: "4px" }} />Legal & Ethical Use
          </p>
          <p className="text-sm leading-relaxed break-words" style={{ color: "oklch(0.58 0.008 260)" }}>
            ICP Scout surfaces <strong style={{ color: "oklch(0.75 0.008 260)" }}>publicly available data only</strong> — profiles visible to anyone on the open internet. Scraping public data is legal in the US under the hiQ v. LinkedIn ruling (9th Circuit, 2022). Email enrichment via Apollo uses their licensed B2B database. All outreach must comply with CAN-SPAM: include a physical address, provide an unsubscribe option, and honor opt-outs within 10 business days. GDPR applies to EU contacts — ICP Scout targets US-based prospects by default.
          </p>
        </div>
      </div>
    </div>
  );
}
