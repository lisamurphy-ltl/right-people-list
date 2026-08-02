import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ICPClarityGuide from "@/components/ICPClarityGuide";
import { getLoginUrl } from "@/const";
import { ChevronRight, Zap, Shield, Search, Download, Lock } from "lucide-react";

// =============================================
// PRECISION INTELLIGENCE DESIGN SYSTEM
// Dark slate + electric gold + electric blue
// Archivo (display) / Inter (body) / JetBrains Mono (code)
// =============================================

const ROLES = ["Founder", "Owner", "CEO", "President"];
const INDUSTRIES = ["Coaching", "Consulting", "Marketing Agency", "Staffing"];
const PAIN_KEYWORDS = ["scale", "burnout", "growth", "hiring"];

const PLANS = [
  { name: "Free", price: "$0", period: "forever", features: ["25 leads/month", "ICP query builder", "CSV export"] },
  { name: "Paid Plans", price: "From $17", period: "/mo", features: ["100 leads/month", "Or a $27 one-time top-up", "No contracts, cancel anytime"], highlight: true },
  { name: "Prompt Pack", price: "$49", period: "one-time", features: ["Outreach email prompts", "Works with any plan", "Instant PDF download"] },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showClarityGuide, setShowClarityGuide] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.13 0.012 260)" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: "oklch(0.13 0.012 260 / 0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(0.22 0.012 260)" }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="The Right-People List Logo" className="w-9 h-9 rounded-full" style={{ boxShadow: "0 0 16px oklch(0.78 0.18 85 / 0.4)" }} />
          <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
            <span style={{ color: "oklch(0.92 0.005 260)" }}>The </span>
            <span className="text-chrome-gold">Right-People List</span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href="/pricing" style={{ color: "oklch(0.65 0.008 260)", fontFamily: "Archivo, sans-serif", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>Pricing</a>
          <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}
            style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, background: "oklch(0.22 0.012 260)", color: "oklch(0.80 0.008 260)", borderRadius: "0.375rem", padding: "0.5rem 1rem", textDecoration: "none", border: "1px solid oklch(0.32 0.012 260)", fontSize: "0.875rem" }}>
            {isAuthenticated ? "Dashboard" : "Sign In"}
          </a>
          <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}
            style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", borderRadius: "0.375rem", padding: "0.5rem 1.25rem", textDecoration: "none", fontSize: "0.875rem" }}>
            Get Started Free
          </a>
        </div>
      </nav>

      <main id="main-content">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden starfield">
        <div className="glow-orb glow-orb-gold glow-orb-drift" style={{ width: 420, height: 420, top: "-8%", left: "8%" }} />
        <div className="glow-orb glow-orb-blue glow-orb-drift" style={{ width: 380, height: 380, bottom: "-10%", right: "5%", animationDelay: "-6s" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.13 0.012 260 / 0.55) 0%, oklch(0.13 0.012 260 / 0.35) 50%, oklch(0.10 0.014 260 / 0.65) 100%)" }} />

        <div className="container relative z-10 py-24">
          <div className="max-w-3xl">
            <img src="/logo.png" alt="The Right-People List" className="fade-up fade-up-1 mb-8" style={{ width: 132, height: 132, filter: "drop-shadow(0 0 40px oklch(0.78 0.18 85 / 0.35))" }} />

            <div className="fade-up fade-up-2 inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{ background: "oklch(0.78 0.18 85 / 0.12)", border: "1px solid oklch(0.78 0.18 85 / 0.35)", color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>
              <Zap size={12} aria-hidden="true" /> No LinkedIn Account Required
            </div>

            <h1 className="fade-up fade-up-3 mb-6" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.97 0.005 260)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
              Stop guessing.<br />
              <span className="text-chrome-gold">Start finding the people</span><br />
              who actually need you.
            </h1>

            <p className="fade-up fade-up-4 mb-8 text-lg" style={{ color: "oklch(0.68 0.008 260)", maxWidth: "560px", lineHeight: 1.7 }}>
              We build a precision search of public LinkedIn profiles matching your exact ideal client — coaches, consultants, agency owners who are visibly struggling with the problems you solve — and deliver the list straight to your dashboard. No bots. No account bans. No guesswork.
            </p>

            <div className="fade-up fade-up-5 flex flex-wrap gap-4">
              <a href={isAuthenticated ? "/dashboard" : getLoginUrl()} style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif", fontWeight: 700, padding: "0.875rem 2rem", borderRadius: "0.375rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", transition: "all 160ms", fontSize: "1rem" }}>
                Get My List — Free to Start <ChevronRight size={16} aria-hidden="true" />
              </a>
              <a href="#pricing" style={{ color: "oklch(0.72 0.008 260)", fontFamily: "Inter, sans-serif", padding: "0.875rem 1.5rem", borderRadius: "0.375rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid oklch(0.30 0.012 260)", transition: "all 160ms", fontSize: "0.95rem" }}>
                See Pricing
              </a>
            </div>

            <div className="fade-up fade-up-5 mt-12 flex flex-wrap gap-6">
              {[
                { icon: <Shield size={14} aria-hidden="true" />, label: "No LinkedIn ban risk" },
                { icon: <Search size={14} aria-hidden="true" />, label: "Google-indexed profiles" },
                { icon: <Download size={14} aria-hidden="true" />, label: "Export to CSV" },
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>The Strategy</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
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
                body: "Google crawls and indexes all public LinkedIn profiles. By searching with the right operators, we get the same data — names, headlines, bios — without ever touching LinkedIn's servers.",
                accent: "oklch(0.78 0.18 85)",
              },
              {
                step: "03",
                title: "You get a targeted, clean list",
                body: "Tell us your ideal client. We run the search, score every lead High / Medium / Low, and hand you a ready-to-use list — no copying, no pasting, no manual work.",
                accent: "oklch(0.65 0.18 145)",
              },
            ].map((card) => (
              <div key={card.step} className="p-6 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
                <div className="mb-4 text-3xl font-black" aria-hidden="true" style={{ fontFamily: "Archivo, sans-serif", color: card.accent }}>{card.step}</div>
                <h3 className="mb-3 text-lg" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, color: "oklch(0.92 0.005 260)" }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.60 0.008 260)" }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />

      {/* ── LOCKED TOOL PREVIEW ── */}
      <section id="tool" className="py-24 relative" style={{ background: "oklch(0.13 0.012 260)" }}>
        <div className="container relative z-10">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>Interactive Tool</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              Build your ICP profile
            </h2>
            <p className="mt-3 text-base" style={{ color: "oklch(0.60 0.008 260)", maxWidth: "520px" }}>
              Select the tags that match your ideal client, and your account fills with a scored lead list automatically. Free to start — no credit card required.
            </p>
            <button
              onClick={() => setShowClarityGuide(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ background: "oklch(0.60 0.20 255 / 0.10)", border: "1px solid oklch(0.60 0.20 255 / 0.35)", color: "oklch(0.60 0.20 255)" }}>
              <span aria-hidden="true">🧭</span> Not sure who your ICP is? Start here — it's free
            </button>
          </div>

          <div className="relative rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0.26 0.012 260)" }}>
            {/* Decorative, non-interactive preview */}
            <div className="grid lg:grid-cols-5 gap-8 items-start p-7" style={{ background: "oklch(0.18 0.012 260)", filter: "blur(3px)", opacity: 0.5, pointerEvents: "none", userSelect: "none" }} aria-hidden="true">
              <div className="lg:col-span-3">
                {[
                  { label: "Job Titles / Roles", opts: ROLES },
                  { label: "Industry / Niche", opts: INDUSTRIES },
                  { label: "Pain Point Keywords", opts: PAIN_KEYWORDS },
                ].map((group) => (
                  <div key={group.label} className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "oklch(0.58 0.012 260)", fontFamily: "Archivo, sans-serif" }}>{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.opts.map((opt) => (
                        <span key={opt} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: "oklch(0.78 0.18 85 / 0.18)", color: "oklch(0.78 0.18 85)", border: "1px solid oklch(0.78 0.18 85 / 0.6)" }}>{opt}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-2">
                <div className="query-block min-h-[120px]">
                  Founders, Owners, CEOs in Coaching, Consulting dealing with burnout, scale near United States.
                </div>
              </div>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              style={{ background: "oklch(0.13 0.012 260 / 0.55)" }}>
              <div className="mb-4 p-4 rounded-full" style={{ background: "oklch(0.78 0.18 85 / 0.15)", border: "1px solid oklch(0.78 0.18 85 / 0.5)" }}>
                <Lock size={22} style={{ color: "oklch(0.78 0.18 85)" }} aria-hidden="true" />
              </div>
              <h3 className="mb-2" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "oklch(0.95 0.005 260)" }}>
                Free to unlock — no card required
              </h3>
              <p className="mb-6 text-sm max-w-sm" style={{ color: "oklch(0.65 0.008 260)" }}>
                Create your free account to build your ICP profile and get your first 25 leads this month, scored and ready.
              </p>
              <a href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded font-bold text-sm"
                style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif", textDecoration: "none" }}>
                Create Free Account <ChevronRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />

      {/* ── PRICING TEASER ── */}
      <section id="pricing" className="py-24 relative" style={{ background: "oklch(0.15 0.012 260)" }}>
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.15 }} />
        <div className="container relative z-10">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>Simple Pricing</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              Start free. Upgrade when you're ready.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div key={plan.name} className="p-6 rounded-xl relative"
                style={{
                  background: plan.highlight ? "oklch(0.20 0.014 260)" : "oklch(0.18 0.012 260)",
                  border: plan.highlight ? "1px solid oklch(0.78 0.18 85 / 0.6)" : "1px solid oklch(0.26 0.012 260)",
                  boxShadow: plan.highlight ? "0 8px 32px oklch(0.78 0.18 85 / 0.15)" : "none",
                }}>
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif" }}>
                    Most Popular
                  </span>
                )}
                <h3 className="mb-1" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "oklch(0.92 0.005 260)" }}>{plan.name}</h3>
                <div className="mb-4">
                  <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: "2rem", color: "oklch(0.78 0.18 85)" }}>{plan.price}</span>
                  <span style={{ color: "oklch(0.64 0.008 260)" }}>{plan.period}</span>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm" style={{ color: "oklch(0.68 0.008 260)" }}>✓ {f}</li>
                  ))}
                </ul>
                <a href="/pricing"
                  className="block text-center py-2.5 rounded font-bold text-sm"
                  style={{
                    background: plan.highlight ? "oklch(0.78 0.18 85)" : "oklch(0.22 0.012 260)",
                    color: plan.highlight ? "oklch(0.13 0.012 260)" : "oklch(0.80 0.008 260)",
                    border: plan.highlight ? "none" : "1px solid oklch(0.32 0.012 260)",
                    fontFamily: "Archivo, sans-serif", textDecoration: "none",
                  }}>
                  {plan.name === "Free" ? "Get Started Free" : plan.name === "Paid Plans" ? "Compare Plans" : "Learn More"}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm">
            <a href="/pricing" style={{ color: "oklch(0.60 0.20 255)", textDecoration: "none", fontWeight: 600 }}>See full plan comparison + the $49 Outreach Prompt Pack →</a>
          </p>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />

      {/* ── SCALING SECTION ── */}
      <section className="py-24" style={{ background: "oklch(0.13 0.012 260)" }}>
        <div className="container">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.18 85)", fontFamily: "Archivo, sans-serif" }}>Scale It Up</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              The professional workflow
            </h2>
            <p className="mt-3 text-base" style={{ color: "oklch(0.60 0.008 260)", maxWidth: "520px" }}>
              From sign-up to a full pipeline of scored, contactable leads.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "1",
                title: "Build Your ICP Profile",
                body: "Tell us your target roles, industries, pain keywords, and location — takes under two minutes, no code or setup required.",
                link: null, linkLabel: null,
              },
              {
                step: "2",
                title: "The Right-People List Finds Your Leads",
                body: "We run your search and score every lead High / Medium / Low, waiting in your dashboard — no manual searching or copy-pasting.",
                link: null, linkLabel: null,
              },
              {
                step: "3",
                title: "Get Verified Emails & Phone Numbers",
                body: "Upgrade to Pro+ and every lead is enriched with a verified email and phone number — confirmed deliverable, not pattern-guessed.",
                link: "/pricing", linkLabel: "See Pro+ Features →",
              },
              {
                step: "4",
                title: "Export & Outreach",
                body: "Download your leads as a clean CSV — Name, Title, LinkedIn URL, Email, Phone, and Relevance Score. Import into any CRM or outreach tool.",
                link: null, linkLabel: null,
              },
            ].map((card) => (
              <div key={card.step} className="p-6 rounded-lg" style={{ background: "oklch(0.18 0.012 260)", border: "1px solid oklch(0.26 0.012 260)" }}>
                <div className="flex items-start gap-4">
                  <span className="step-badge">{card.step}</span>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="mb-2 text-base" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, color: "oklch(0.92 0.005 260)" }}>{card.title}</h3>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "oklch(0.60 0.008 260)" }}>{card.body}</p>
                    {card.link && (
                      <a href={card.link} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "oklch(0.60 0.20 255)", textDecoration: "none" }}>
                        {card.linkLabel}
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
      <section className="py-24 relative overflow-hidden starfield">
        <div className="glow-orb glow-orb-gold glow-orb-drift" style={{ width: 340, height: 340, top: "20%", left: "50%", transform: "translateX(-50%)" }} />
        <div className="container relative z-10 text-center">
          <h2 className="mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
            Your next client is already on LinkedIn.<br />
            <span className="text-chrome-gold">Go get them.</span>
          </h2>
          <p className="mb-8 text-base" style={{ color: "oklch(0.58 0.008 260)", maxWidth: "460px", margin: "0 auto 2rem" }}>
            Build your profile, and let us find them for you. No guessing. No wasted outreach.
          </p>
          <a href={isAuthenticated ? "/dashboard" : getLoginUrl()} style={{ background: "oklch(0.78 0.18 85)", color: "oklch(0.13 0.012 260)", fontFamily: "Archivo, sans-serif", fontWeight: 700, padding: "0.9rem 2.25rem", borderRadius: "0.375rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", transition: "all 160ms" }}>
            Get Started Free <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* ── CLIENT ENGINE SUITE BUNDLE ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: "oklch(0.11 0.010 260)" }}>
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.12 }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-48 rounded-full blur-3xl"
          style={{ background: "oklch(0.60 0.20 255 / 0.06)" }} />
        <div className="container relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{ background: "oklch(0.60 0.20 255 / 0.10)", border: "1px solid oklch(0.60 0.20 255 / 0.30)", color: "oklch(0.60 0.20 255)", fontFamily: "Archivo, sans-serif" }}>
              Coming Soon — Bundle
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontFamily: "Archivo, sans-serif", fontWeight: 800, color: "oklch(0.95 0.005 260)", letterSpacing: "-0.025em" }}>
              The Client Engine Suite
            </h2>
            <p className="mt-3 text-base mx-auto" style={{ color: "oklch(0.58 0.008 260)", maxWidth: "540px", lineHeight: 1.7 }}>
              Three tools. One system. Find your people, build your offer, and convert them — without the chaos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                num: "01", name: "The Right-People List", tag: "You are here",
                tagColor: "oklch(0.78 0.18 85)", tagBg: "oklch(0.78 0.18 85 / 0.12)",
                desc: "Surface your exact ideal clients from public LinkedIn data. Build your ICP profile, score leads, and export to CSV — without touching LinkedIn directly.",
              },
              {
                num: "02", name: "Client Engine Builder", tag: "Available now",
                tagColor: "oklch(0.66 0.20 255)", tagBg: "oklch(0.60 0.20 255 / 0.10)",
                desc: "Define your ICP architecture, nail your positioning, and build the messaging framework that makes your outreach land. The strategy layer that makes The Right-People List 10x more effective.",
              },
              {
                num: "03", name: "Funnel Builder", tag: "Coming soon",
                tagColor: "oklch(0.68 0.008 260)", tagBg: "oklch(0.22 0.012 260)",
                desc: "Convert the leads you find into booked calls and paying clients. Automated follow-up sequences, landing pages, and conversion architecture — built for service-based businesses.",
              },
            ].map((tool) => (
              <div key={tool.num} className="p-6 rounded-xl relative"
                style={{ background: "oklch(0.16 0.012 260)", border: "1px solid oklch(0.24 0.012 260)" }}>
                <div className="flex items-start justify-between mb-4">
                  <span aria-hidden="true" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: "2rem", color: "oklch(0.54 0.012 260)", lineHeight: 1 }}>{tool.num}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: tool.tagBg, color: tool.tagColor, fontFamily: "Archivo, sans-serif" }}>{tool.tag}</span>
                </div>
                <h3 className="mb-2" style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "oklch(0.92 0.005 260)" }}>{tool.name}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.64 0.008 260)" }}>{tool.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm mb-4" style={{ color: "oklch(0.50 0.008 260)" }}>
              Bundle pricing will be announced when the Funnel Builder launches.
            </p>
            <a href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-bold"
              style={{ background: "oklch(0.22 0.012 260)", color: "oklch(0.72 0.008 260)", border: "1px solid oklch(0.32 0.012 260)", fontFamily: "Archivo, sans-serif", textDecoration: "none" }}>
              View The Right-People List Pricing →
            </a>
          </div>
        </div>
      </section>

      {/* ── GOLD RULE ── */}
      <div className="gold-rule" />
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-8" style={{ background: "oklch(0.11 0.010 260)", borderTop: "1px solid oklch(0.22 0.012 260)" }}>
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="The Right-People List" className="w-6 h-6 rounded-full" />
            <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "oklch(0.65 0.005 260)" }}>
              The <span className="text-chrome-gold">Right-People List</span>
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: "oklch(0.64 0.006 260)" }}>
            Built for service-based business owners who are done wasting time on bad leads. Use responsibly — scrape public data only.
          </p>
        </div>
      </footer>

      {showClarityGuide && <ICPClarityGuide onClose={() => setShowClarityGuide(false)} />}
    </div>
  );
}
