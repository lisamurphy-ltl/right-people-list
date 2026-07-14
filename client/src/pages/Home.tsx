import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ICPClarityGuide from "@/components/ICPClarityGuide";
import { getLoginUrl } from "@/const";
import { Copy, Check, ChevronRight, Search, Zap, Shield, Download, ExternalLink } from "lucide-react";

// =============================================
// PRECISION INTELLIGENCE DESIGN SYSTEM
// Dark slate + electric gold + electric blue
// Syne (display) / Inter (body) / JetBrains Mono (code)
// =============================================

const ROLES = ["Founder", "Owner", "CEO", "President", "Managing Director", "Principal"];
const INDUSTRIES = ["Coaching", "Consulting", "Marketing Agency", "PR Agency", "Staffing", "Financial Advisory", "Legal Services", "Accounting", "IT Services", "Real Estate"];
const PAIN_KEYWORDS = ["scale", "scaling", "burnout", "growth", "overworked", "systems", "hiring", "stuck", "overwhelmed", "team", "delegation", "revenue"];
const LOCATIONS = ["United States", "Canada", "United Kingdom", "Australia", "Remote"];

function buildQuery(roles: string[], industries: string[], pains: string[], location: string): string {
  const roleStr = roles.length > 0 ? `(${roles.map(r => `"${r}"`).join(" OR ")})` : `("Founder" OR "Owner" OR "CEO")`;
  const indStr = industries.length > 0 ? `(${industries.map(i => `"${i}"`).join(" OR ")})` : `("Consulting" OR "Coaching" OR "Agency")`;
  const painStr = pains.length > 0 ? `(${pains.slice(0, 5).map(p => `"${p}"`).join(" OR ")})` : `("scale" OR "burnout" OR "growth")`;
  const locStr = location ? `"${location}"` : `"United States"`;
  return `site:linkedin.com/in/ ${roleStr} ${indStr} ${painStr} ${locStr}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200"
      style={{
        background: copied ? "oklch(0.78 0.18 85 / 0.15)" : "oklch(0.28 0.012 260)",
        color: copied ? "oklch(0.78 0.18 85)" : "oklch(0.72 0.005 260)",
        border: `1px solid ${copied ? "oklch(0.78 0.18 85 / 0.5)" : "oklch(0.35 0.012 260)"}`,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : "Copy Query"}
    </button>
  );
}

function TagSelector({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.58 0.012 260)", fontFamily: "Syne, sans-serif" }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="px-3 py-1 rounded-full text-sm font-medium transition-all duration-150"
              style={{
                background: active ? "oklch(0.78 0.18 85 / 0.18)" : "oklch(0.22 0.014 260)",
                color: active ? "oklch(0.78 0.18 85)" : "oklch(0.68 0.008 260)",
                border: `1px solid ${active ? "oklch(0.78 0.18 85 / 0.6)" : "oklch(0.30 0.012 260)"}`,
                transform: active ? "scale(1.02)" : "scale(1)",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showClarityGuide, setShowClarityGuide] = useState(false);
  const [roles, setRoles] = useState<string[]>(["Founder", "Owner", "CEO"]);
  const [industries, setIndustries] = useState<string[]>(["Coaching", "Consulting"]);
  const [pains, setPains] = useState<string[]>(["scale", "burnout", "growth"]);
  const [location, setLocation] = useState("United States");

  const toggle = (arr: string[], val: string, set: (a: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const query = buildQuery(roles, industries, pains, location);
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.13 0.012 260)" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "oklch(0.13 0.012 260 / 0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(0.22 0.012 260)" }}>
        <div className="flex items-center gap-3">
          <img src="/manus-storage/logo-icon_1f1861b3.png" alt="ICP Scout Logo" className="w-8 h-8 rounded" />
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "oklch(0.92 0.005 260)", letterSpacing: "-0.02em" }}>
            ICP<span style={{ color: "oklch(0.78 0.18 85)" }}>Scout</span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href="/pricing" style={{ color: "oklch(0.65 0.008 260)", fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>Pricing</a>
          <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}
            style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, background: "oklch(0.22 0.012 260)", color: "oklch(0.80 0.008 260)", borderRadius: "0.375rem", padding: "0.5rem 1rem", textDecoration: "none", border: "1px solid oklch(0.32 0.012 260)", fontSize: "0.875rem" }}>
            {isAuthenticated ? "Dashboard" : "Sign In"}
          </a>
          <a href="#tool"
            style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", textDecoration: "none", fontSize: "0.875rem" }}>
            Build My Query
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/manus-storage/hero-bg_48242f78.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.55 }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.13 0.012 260 / 0.85) 0%, oklch(0.13 0.012 260 / 0.60) 50%, oklch(0.13 0.012 260 / 0.80) 100%)" }} />
        </div>
        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.3 }} />

        <div className="container relative z-10 py-24">
          <div className="max-w-3xl">
            <div className="fade-up fade-up-1 inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{ background: "oklch(0.78 0.18 85 / 0.12)", border: "1px solid oklch(0.78 0.18 85 / 0.35)", color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>
              <Zap size={12} /> No LinkedIn Account Required
            </div>

            <h1 className="fade-up fade-up-2 mb-6" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
              Stop guessing.<br />
              <span style={{ color: "oklch(0.78 0.18 85)" }}>Start finding the people</span><br />
              who actually need you.
            </h1>

            <p className="fade-up fade-up-3 mb-8 text-lg" style={{ color: "oklch(0.68 0.008 260)", maxWidth: "560px", lineHeight: 1.7 }}>
              Build a precision Google search query that surfaces public LinkedIn profiles of your exact ideal clients — coaches, consultants, agency owners who are visibly struggling with the problems you solve. No bots. No account bans. No guesswork.
            </p>

            <div className="fade-up fade-up-4 flex flex-wrap gap-4">
              <a href="#tool" style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif", fontWeight: 700, padding: "0.875rem 2rem", borderRadius: "0.375rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", transition: "all 160ms", fontSize: "1rem" }}>
                Build My ICP Query <ChevronRight size={16} />
              </a>
              <a href="#how-it-works" style={{ color: "oklch(0.72 0.008 260)", fontFamily: "Inter, sans-serif", padding: "0.875rem 1.5rem", borderRadius: "0.375rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid oklch(0.30 0.012 260)", transition: "all 160ms", fontSize: "0.95rem" }}>
                How It Works
              </a>
            </div>

            {/* Social proof strip */}
            <div className="fade-up fade-up-5 mt-12 flex flex-wrap gap-6">
              {[
                { icon: <Shield size={14} />, label: "No LinkedIn ban risk" },
                { icon: <Search size={14} />, label: "Google-indexed profiles" },
                { icon: <Download size={14} />, label: "Export to CSV" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm" style={{ color: "oklch(0.60 0.010 260)" }}>
                  <span style={{ color: "oklch(0.60 0.20 255)" }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 relative" style={{ background: "oklch(0.15 0.012 260)" }}>
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.15 }} />
        <div className="container relative z-10">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>The Strategy</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              Why this works when<br />everything else gets you banned
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "LinkedIn blocks direct scrapers fast",
                body: "LinkedIn's fraud detection will flag your IP and lock your account within 50 profile views if you hit them directly. It's aggressive, and it doesn't care how careful you are.",
                accent: "oklch(0.60 0.20 255)",
              },
              {
                step: "02",
                title: "Google indexes every public profile",
                body: "Google crawls and indexes all public LinkedIn profiles. By searching Google with the right operators, you get the same data — names, headlines, bios — without ever touching LinkedIn's servers.",
                accent: "oklch(0.78 0.18 85)",
              },
              {
                step: "03",
                title: "You get a targeted, clean list",
                body: "The query builder below generates a precision Google search string. Paste it into Google, or run the Python script to auto-collect and export to CSV. Then enrich with Apollo or Hunter for emails.",
                accent: "oklch(0.65 0.18 145)",
              },
            ].map((card) => (
              <div key={card.step} className="p-6 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
                <div className="mb-4 text-3xl font-black" style={{ fontFamily: "Syne, sans-serif", color: card.accent, opacity: 0.6 }}>{card.step}</div>
                <h3 className="mb-3 text-lg" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "oklch(0.92 0.005 260)" }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.60 0.008 260)" }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />

      {/* ── ICP QUERY BUILDER TOOL ── */}
      <section id="tool" className="py-24 relative" style={{ background: "oklch(0.13 0.012 260)" }}>
        <div className="container relative z-10">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>Interactive Tool</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              Build your ICP search query
            </h2>
            <p className="mt-3 text-base" style={{ color: "oklch(0.60 0.008 260)", maxWidth: "520px" }}>
              Select the tags that match your ideal client. Your Google search query updates in real time below.
            </p>
            <button
              onClick={() => setShowClarityGuide(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ background: "oklch(0.60 0.20 255 / 0.10)", border: "1px solid oklch(0.60 0.20 255 / 0.35)", color: "oklch(0.60 0.20 255)" }}>
              🧭 Not sure who your ICP is? Start here — it's free
            </button>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* LEFT: Selectors */}
            <div className="lg:col-span-3 p-7 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
              <TagSelector label="Job Titles / Roles" options={ROLES} selected={roles} onToggle={(v) => toggle(roles, v, setRoles)} />
              <TagSelector label="Industry / Niche" options={INDUSTRIES} selected={industries} onToggle={(v) => toggle(industries, v, setIndustries)} />
              <TagSelector label="Pain Point Keywords" options={PAIN_KEYWORDS} selected={pains} onToggle={(v) => toggle(pains, v, setPains)} />

              {/* Location */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.58 0.012 260)", fontFamily: "Syne, sans-serif" }}>Location</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocation(loc)}
                      className="px-3 py-1 rounded-full text-sm font-medium transition-all duration-150"
                      style={{
                        background: location === loc ? "oklch(0.60 0.20 255 / 0.18)" : "oklch(0.22 0.014 260)",
                        color: location === loc ? "oklch(0.60 0.20 255)" : "oklch(0.68 0.008 260)",
                        border: `1px solid ${location === loc ? "oklch(0.60 0.20 255 / 0.6)" : "oklch(0.30 0.012 260)"}`,
                      }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Live Query Output */}
            <div className="lg:col-span-2 sticky top-24">
              <div className="p-6 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>
                    Your Google Query
                  </p>
                  <CopyButton text={query} />
                </div>

                <div className="query-block mb-5 min-h-[120px]">
                  {query}
                </div>

                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded font-bold text-sm transition-all duration-160"
                  style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif", textDecoration: "none", borderRadius: "0.375rem" }}
                >
                  <Search size={15} /> Run This Search on Google <ExternalLink size={13} />
                </a>

                <p className="mt-4 text-xs text-center" style={{ color: "oklch(0.45 0.008 260)" }}>
                  Opens Google in a new tab. No account needed.
                </p>
              </div>

              {/* Quick tip */}
              <div className="mt-4 p-4 rounded-lg text-sm" style={{ background: "oklch(0.60 0.20 255 / 0.08)", border: "1px solid oklch(0.60 0.20 255 / 0.25)", color: "oklch(0.72 0.010 260)", lineHeight: 1.6 }}>
                <span style={{ color: "oklch(0.60 0.20 255)", fontWeight: 600 }}>Pro tip:</span> Select 3–5 pain keywords max for tighter results. More keywords = broader, noisier list.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />

      {/* ── SCALING SECTION ── */}
      <section className="py-24" style={{ background: "oklch(0.15 0.012 260)" }}>
        <div className="container">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Syne, sans-serif" }}>Scale It Up</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              The professional workflow
            </h2>
            <p className="mt-3 text-base" style={{ color: "oklch(0.60 0.008 260)", maxWidth: "520px" }}>
              The query above gets you started. Here's how to turn it into a full prospecting machine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "1",
                title: "Build Your ICP Query",
                body: "Use the query builder above to select your target roles, industries, pain keywords, and location. Your precision Google search string generates in real time — no code, no setup required.",
                code: null,
                link: null,
                linkLabel: null,
              },
              {
                step: "2",
                title: "ICP Scout Finds Your Leads",
                body: "Sign up and ICP Scout runs your search automatically every morning at 5 AM your time. Leads are scored High / Medium / Low and waiting in your dashboard before you start your day.",
                code: null,
                link: null,
                linkLabel: null,
              },
              {
                step: "3",
                title: "Get Verified Emails & Phone Numbers",
                body: "Upgrade to Pro+ and every lead is enriched with a verified email and phone number — confirmed deliverable, not pattern-guessed. No third-party tools to manage, no extra accounts to set up.",
                code: null,
                link: "/pricing",
                linkLabel: "See Pro+ Features →",
              },
              {
                step: "4",
                title: "Export & Outreach",
                body: "Download your leads as a clean CSV — Name, Title, LinkedIn URL, Email, Phone, and Relevance Score. Import into any CRM or outreach tool. Start with High-score leads every time.",
                code: null,
                link: null,
                linkLabel: null,
              },
            ].map((card) => (
              <div key={card.step} className="p-6 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
                <div className="flex items-start gap-4">
                  <span className="step-badge">{card.step}</span>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="mb-2 text-base" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "oklch(0.92 0.005 260)" }}>{card.title}</h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "oklch(0.60 0.008 260)" }}>{card.body}</p>
                    {card.code && (
                      <pre className="query-block text-xs mb-3" style={{ fontSize: "0.75rem", padding: "0.75rem 1rem" }}>{card.code}</pre>
                    )}
                    {card.link && (
                      <a href={card.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "oklch(0.60 0.20 255)", textDecoration: "none" }}>
                        {card.linkLabel} <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />

      {/* ── CTA BANNER ── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "oklch(0.13 0.012 260)" }}>
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.2 }} />
        {/* Gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 rounded-full blur-3xl" style={{ background: "oklch(0.78 0.18 85 / 0.08)" }} />
        <div className="container relative z-10 text-center">
          <h2 className="mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
            Your next client is already on LinkedIn.<br />
            <span style={{ color: "oklch(0.78 0.18 85)" }}>Go get them.</span>
          </h2>
          <p className="mb-8 text-base" style={{ color: "oklch(0.58 0.008 260)", maxWidth: "460px", margin: "0 auto 2rem" }}>
            Build your query, run the search, and start prospecting with precision. No guessing. No wasted outreach.
          </p>
          <a href="#tool" style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Syne, sans-serif", fontWeight: 700, padding: "0.9rem 2.25rem", borderRadius: "0.375rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", transition: "all 160ms" }}>
            Build My Query Now <ChevronRight size={16} />
          </a>
        </div>
      </section>


      {/* ── CLIENT ENGINE SUITE BUNDLE ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: "oklch(0.11 0.010 260)" }}>
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.12 }} />
        {/* Blue glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full blur-3xl"
          style={{ background: "oklch(0.60 0.20 255 / 0.06)" }} />
        <div className="container relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{ background: "oklch(0.60 0.20 255 / 0.10)", border: "1px solid oklch(0.60 0.20 255 / 0.30)", color: "oklch(0.60 0.20 255)", fontFamily: "Syne, sans-serif" }}>
              Coming Soon — Bundle
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Syne, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              The Client Engine Suite
            </h2>
            <p className="mt-3 text-base mx-auto" style={{ color: "oklch(0.58 0.008 260)", maxWidth: "540px", lineHeight: 1.7 }}>
              Three tools. One system. Find your people, build your offer, and convert them — without the chaos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                num: "01",
                name: "ICP Scout",
                tag: "You are here",
                tagColor: "oklch(0.78 0.18 85)",
                tagBg: "oklch(0.78 0.18 85 / 0.12)",
                desc: "Surface your exact ideal clients from public LinkedIn data. Build precision search queries, score leads, and export to CSV — without touching LinkedIn directly.",
                status: "Live",
                statusColor: "oklch(0.65 0.18 145)",
              },
              {
                num: "02",
                name: "Client Engine Builder",
                tag: "Available now",
                tagColor: "oklch(0.60 0.20 255)",
                tagBg: "oklch(0.60 0.20 255 / 0.10)",
                desc: "Define your ICP architecture, nail your positioning, and build the messaging framework that makes your outreach land. The strategy layer that makes ICP Scout 10x more effective.",
                status: "Live",
                statusColor: "oklch(0.65 0.18 145)",
              },
              {
                num: "03",
                name: "Funnel Builder",
                tag: "Coming soon",
                tagColor: "oklch(0.55 0.008 260)",
                tagBg: "oklch(0.22 0.012 260)",
                desc: "Convert the leads you find into booked calls and paying clients. Automated follow-up sequences, landing pages, and conversion architecture — built for service-based businesses.",
                status: "In development",
                statusColor: "oklch(0.55 0.008 260)",
              },
            ].map((tool) => (
              <div key={tool.num} className="p-6 rounded-xl relative"
                style={{ background: "oklch(0.16 0.012 260)", border: "1px solid oklch(0.24 0.012 260)" }}>
                <div className="flex items-start justify-between mb-4">
                  <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 900, fontSize: "2rem", color: "oklch(0.28 0.012 260)", lineHeight: 1 }}>
                    {tool.num}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: tool.tagBg, color: tool.tagColor, fontFamily: "Syne, sans-serif" }}>
                    {tool.tag}
                  </span>
                </div>
                <h3 className="mb-2" style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "oklch(0.92 0.005 260)" }}>
                  {tool.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.55 0.008 260)" }}>
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm mb-4" style={{ color: "oklch(0.50 0.008 260)" }}>
              Bundle pricing will be announced when the Funnel Builder launches.
            </p>
            <a href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-bold"
              style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.72 0.008 260)", border: "1px solid oklch(0.32 0.012 260)", fontFamily: "Syne, sans-serif", textDecoration: "none" }}>
              View ICP Scout Pricing →
            </a>
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />
      {showClarityGuide && <ICPClarityGuide onClose={() => setShowClarityGuide(false)} />}

      {/* ── FOOTER ── */}
      <footer className="py-8" style={{ background: "oklch(0.11 0.010 260)", borderTop: "1px solid oklch(0.22 0.012 260)" }}>
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/logo-icon_1f1861b3.png" alt="ICP Scout" className="w-6 h-6 rounded" />
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "oklch(0.55 0.005 260)" }}>
              ICP<span style={{ color: "oklch(0.78 0.18 85)" }}>Scout</span>
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: "oklch(0.40 0.005 260)" }}>
            Built for service-based business owners who are done wasting time on bad leads. Use responsibly — scrape public data only.
          </p>
        </div>
      </footer>

      {showClarityGuide && <ICPClarityGuide onClose={() => setShowClarityGuide(false)} />}
    </div>
  );
}
