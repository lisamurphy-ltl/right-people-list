import { useState } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";

type Promo = {
  key: string;
  eyebrow: string;
  headline: string;
  cta: string;
  url: string;
};

// Rotates weekly (by ISO week number) across Lisa's other free funnels.
// Add/remove/reorder freely — rotation just cycles through whatever's here.
const PROMOS: Promo[] = [
  {
    key: "time-eaters",
    eyebrow: "Free Tool",
    headline: "Find out how many hours your business is quietly losing every week.",
    cta: "Try the free Time Calculator",
    url: "https://hoursback.limitedtolimitless.com/time-eaters",
  },
  {
    key: "ai-visibility",
    eyebrow: "AI Visibility Audit",
    headline: "See whether AI search engines like ChatGPT can actually find your business.",
    cta: "Run Your AI Visibility Audit",
    url: "https://aivisibility.limitedtolimitless.com/",
  },
  {
    key: "free-ai-tools",
    eyebrow: "Free Tools",
    headline: "Explore more free AI tools built to save your business time.",
    cta: "Browse free AI tools",
    url: "https://freeaitools.limitedtolimitless.com/",
  },
  {
    key: "client-builder",
    eyebrow: "Free to Start",
    headline: "Build your own AI-powered client engine — no developer needed.",
    cta: "Try the Client Engine Builder",
    url: "https://clientbuilder.limitedtolimitless.com/",
  },
  {
    key: "plan-to-profit",
    eyebrow: "Free Workshop",
    headline: "Get 5 hours back in your week without hiring anyone.",
    cta: "Join the free workshop",
    url: "https://plantoprofit.limitedtolimitless.com/workshop",
  },
];

function getIsoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function CrossPromoBanner() {
  const weekNumber = getIsoWeekNumber(new Date());
  const promo = PROMOS[weekNumber % PROMOS.length];
  const dismissKey = `promo-dismissed-${promo.key}-w${weekNumber}`;

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  return (
    <div role="region" aria-label="Promotion" className="mb-6 p-4 rounded-lg flex items-center justify-between gap-4 flex-wrap"
      style={{ background: "oklch(0.60 0.20 255 / 0.08)", border: "1px solid oklch(0.60 0.20 255 / 0.25)" }}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full shrink-0" style={{ background: "oklch(0.60 0.20 255 / 0.15)" }}>
          <Sparkles size={16} style={{ color: "oklch(0.60 0.20 255)" }} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: "oklch(0.60 0.20 255)", fontFamily: "Archivo, sans-serif" }}>{promo.eyebrow}</p>
          <p className="text-sm" style={{ color: "oklch(0.82 0.008 260)" }}>{promo.headline}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href={promo.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-bold whitespace-nowrap"
          style={{ background: "oklch(0.60 0.20 255)", color: "oklch(0.98 0.005 260)", fontFamily: "Archivo, sans-serif", textDecoration: "none" }}>
          {promo.cta} <ArrowRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
        </a>
        <button
          onClick={() => {
            try { localStorage.setItem(dismissKey, "1"); } catch { /* ignore */ }
            setDismissed(true);
          }}
          className="p-2 rounded"
          style={{ color: "oklch(0.50 0.010 260)" }}
          aria-label="Dismiss this promotion">
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
