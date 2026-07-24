# The Right-People List — Product Requirements Document

**Version:** 1.0  
**Owner:** Lisa Murphy, Limited to Limitless  
**Last Updated:** July 2026  
**Status:** Active Development

---

## 1. Product Vision

The Right-People List is a B2B lead intelligence platform that helps service-based business owners find, enrich, and reach out to their ideal clients — without needing to know how to code, run scripts, or manage proxies. The system does the prospecting work automatically every morning at 5 AM in the user's local timezone, delivering outreach-ready leads with verified contact information and hyper-personalized article hooks directly to their preferred destination (Google Sheets, Notion, or in-app dashboard).

The core philosophy: **the value lives in the execution, not the instructions.** All pipeline logic, prompts, ICP filters, and article research runs server-side and is never exposed to the user. Users see results — not machinery.

The Right-People List is the first product in the **Client Engine Suite**, which will eventually bundle The Right-People List + Client Engine Builder + Funnel Builder as a combined offering.

---

## 2. Target User

**Primary:** Service-based business owners (coaches, consultants, agency owners, professional services) generating $250K–$3M/year who need a consistent pipeline of qualified leads but don't have time or technical skills to build one themselves.

**Secondary:** Agencies and consultants running outreach campaigns for multiple clients (Agency tier).

---

## 3. Pricing Tiers

| Tier | Price | Leads/Month | Key Features |
|---|---|---|---|
| **Free** | $0 | 25 | Query builder, ICP Clarity Guide, in-app dashboard, 1 saved ICP profile |
| **Scout Pro** | $47/mo | 150 | + Unverified emails (pattern-matched), 1 saved ICP profile |
| **Scout Pro+** | $127/mo | 500 | + Verified emails + phone numbers (Apollo), Deep Research (100-lead AI profiles), article enrichment, 3 saved ICP profiles, 5 AM daily automation, BYOK AI, output to Google Sheets or Notion |
| **Agency** | $297/mo | Unlimited | Everything in Pro+ + exclusive leads (not shared with other users), unlimited saved ICP profiles, 5 team seats, white-label CSV export, freshness guarantee (7 days) |

### One-Time Add-On
- **Plug-and-Play Outreach System Prompt Pack** — $49 one-time. A downloadable PDF containing three battle-tested prompts: (1) Lead Research Prompt, (2) Article Research & Verification Prompt, (3) Email Drip Campaign Builder Prompt. Includes a step-by-step instruction sheet for running in any AI (Manus, ChatGPT, Claude, Gemini). Sold on the Pricing page. Delivered via Stripe checkout + instant download.

### Pay-Per-Use (Planned)
- **Outreach Copy Generation** — $2/lead or $35/batch of 25 or $97/batch of 100. Generates personalized first-touch LinkedIn DM + cold email for each lead using their bio, match signal, and the user's ICA problem statement.

---

## 4. Core Features

### 4.1 ICP Query Builder (Free)
A visual tag-selector interface on the Home page. Users click tags for roles, industries, pain keywords, and location. A Google search query generates in real time. One click runs the search on Google. One click copies the query. No login required to use the builder — login required to save leads.

### 4.2 ICP Clarity Guide (Free)
A 4-step modal that walks users through defining their ICP before touching the query builder. Steps: (1) Who do you help, (2) What problem are they in, (3) Where do they hang out online, (4) What does success look like for them. Answers auto-populate the Deep Research form fields for Pro+ users. Triggered by a "Not sure who your ICP is? Start here" button on the Home page and as a pre-flight prompt in the Deep Research form.

### 4.3 Lead Dashboard (All tiers)
- Lead list with name, title, company, LinkedIn URL, email, phone, relevance score, article title, article URL, article summary
- Usage meter showing leads used vs. monthly limit with reset date
- Add Lead manually or via CSV import
- Enrich selected leads (tier-gated)
- Export to CSV
- Export to Google Sheets (Pro+ and Agency)
- Export to Notion (Pro+ and Agency)

### 4.4 Paywall Gate
Every "Add Lead" or "Enrich" action checks: (1) Is the user authenticated? (2) Have they hit their monthly limit? Unauthenticated users see a sign-in CTA. Users at their limit see their current plan, reset date, and a one-click upgrade prompt.

### 4.5 Saved ICP Profiles
- Free/Pro: 1 saved ICP profile
- Pro+: 3 saved ICP profiles
- Agency: Unlimited saved ICP profiles

Each profile stores: profile name, target roles (array), target industries (array), pain keywords (array), geography, and filter JSON. Enforcement is a simple row count check against the tier limit.

### 4.6 Deep Research (Pro+ and Agency)
User fills in their ICA fields (industry, role, business size, geography, active signals, problem they're in, what they look like online). The system runs an AI-powered research pipeline that finds and profiles 100 real people matching the ICA. Each record includes: full name, company, role/title, 2–3 sentence bio, business overview, why they fit the ICA, and contact info (verified email or LinkedIn URL fallback).

**Limits:**
- Pro+: 2 Deep Research runs per month
- Agency: Unlimited Deep Research runs

### 4.7 Article Enrichment Pipeline (Pro+ and Agency)
For each lead, the pipeline: (1) detects the lead's industry vertical, (2) selects a relevant article from approved free sources (McKinsey, HBR free articles, Inc, Forbes, Fast Company, MIT Sloan, Entrepreneur), (3) verifies the URL is live and not paywalled, (4) generates a 2-sentence personalized summary explaining why that article is relevant to that specific person's role, vertical, and business situation.

**Approved sources only.** No paywalled content. No signup walls. URL verification is mandatory — hallucinated URLs are rejected and the pipeline retries.

### 4.8 5 AM Daily Automation (Pro+ and Agency)
When a Pro+ or Agency subscription activates, a scheduled job is created for that user. The job fires at 5 AM **in the user's local timezone** (timezone captured during onboarding). The job: (1) pulls the user's active ICP profile, (2) runs the lead sourcing pipeline using the shared lead pool (scraping only when the pool is thin), (3) enriches new leads with articles, (4) writes results to the user's chosen output destination.

**CRITICAL:** 5 AM must be in the user's timezone, not server time. Timezone is stored on the user record and used to calculate the UTC cron expression at job creation time.

### 4.9 Shared Lead Pool
All scrape results are stored in a central `shared_leads` table before being assigned to users. When a new search runs, the pool is checked first for matching leads under 30 days old that haven't been served to this user. Only the delta is scraped fresh. This eliminates redundant scraping costs as the user base grows.

**Freshness tiers:**
- 0–30 days: Fresh (served to Free/Pro users)
- 0–14 days: Fresh (served to Pro+ users)
- 0–7 days: Fresh (served to Agency users)
- 60+ days: Stale — flagged for re-enrichment

**Exclusivity:** Agency users can request exclusive leads — marked as served exclusively to that user for 30 days, not served to other users.

---

## 5. BYOK (Bring Your Own Key) — AI Provider Integration

**Philosophy:** The Right-People List never exposes its prompts or pipeline logic. The user's API key is the fuel; the The Right-People List engine is the car. Users see outputs, never prompts.

### 5.1 Supported Providers

| Provider | API Standard | Notes |
|---|---|---|
| **Manus** | Built-in (already wired) | Uses user's Manus credits via OAuth — no separate key needed |
| **OpenAI** (GPT-4o) | OpenAI standard | Baseline adapter |
| **Anthropic** (Claude Sonnet) | Anthropic SDK | Separate adapter |
| **Google Gemini** | Google AI SDK | Separate adapter |
| **Perplexity** | OpenAI-compatible | Recommended for article research step — returns live, verified URLs with citations |
| **Grok / xAI** | OpenAI-compatible | Same adapter as OpenAI |
| **Other (OpenAI-compatible)** | OpenAI-compatible | Catch-all: user pastes custom endpoint URL + key. Handles Groq, Mistral, Ollama, Azure OpenAI, etc. |

### 5.2 UI — AI Provider Settings (Account Settings page)

```
Primary AI (for ICP filtering, lead scoring, competitor exclusion, Deep Research)
  ○ Manus — use your Manus credits (no key needed)
  ○ OpenAI  [API key input]
  ○ Anthropic  [API key input]
  ○ Google Gemini  [API key input]
  ○ Grok / xAI  [API key input]
  ○ Other (OpenAI-compatible)  [Endpoint URL input] [API key input]

Article Research AI (optional — uses Perplexity's live web search for best results)
  ○ Same as Primary AI
  ○ Perplexity  [API key input]  ← recommended
```

### 5.3 Key Storage
- API keys are encrypted at rest using AES-256 before storing in the database
- Keys are never returned to the frontend after initial entry
- Keys are never logged
- Keys are decrypted server-side only at job execution time
- Users can rotate or delete their key at any time from Account Settings

### 5.4 Adapter Pattern
All AI calls go through a single `callAI(provider, model, messages, options)` function that routes to the correct SDK based on the provider type. OpenAI-compatible providers (OpenAI, Perplexity, Grok, Other) use one adapter. Anthropic uses its own adapter. Google uses its own adapter. Manus uses the built-in Forge API.

---

## 6. Output Destinations

Users choose where their enriched leads are delivered. Set once during onboarding, changeable in Account Settings.

| Destination | Setup Required | Notes |
|---|---|---|
| **In-App Dashboard** (default) | None | Leads stored in The Right-People List DB. CSV export available. |
| **Google Sheets** | One-time Google OAuth connection | New leads append to a designated sheet. User provides Sheet ID or creates a new one via the tool. |
| **Notion** | Paste Notion integration token + database ID | Leads write directly to a Notion database. User creates the integration in Notion settings and pastes the token. |

**Data retention:** Leads older than 90 days auto-delete from the The Right-People List database. Users who want permanent storage should connect Google Sheets or Notion. This keeps the database lean and reduces liability.

---

## 7. ICP Filtering Rules (Hard-Coded Pipeline Logic)

These rules run on every lead before it is stored or served. They are never exposed to the user.

### The One Test Every Lead Must Pass
> "Is this an overwhelmed owner/leader of a real, operating service business doing $250K+ a year who could actually hire Lisa's clients?"

### True Lead Criteria
- Title: Owner, Founder, President, CEO, COO, or Managing Partner
- Business: Real operating service business, $250K+ revenue, ≤250 employees
- NOT in the business of coaching/consulting/training other people

### Target Verticals
- **ICP-A (asset/vendor-heavy):** Trucking & Transportation, Construction & Trades (electrical, HVAC, plumbing, roofing), Insurance Agencies
- **ICP-B (professional services):** Accounting & Bookkeeping Firms, Law Firms

### Hard Excludes (Status: Skipped - Competitor)
Business coaching, executive coaching, life coaching, sales coaching, sales training, fractional executive/leadership services, management consulting, GTM consulting, marketing agencies, marketing consultants, HR consulting, solo-preneurs clearly under $250K.

### Ambiguous Cases (Status: For Lisa to Judge)
Anything that might be a peer but is not a hard exclude. Flagged for manual review.

---

## 8. Lead Record Schema

Each lead record contains the following fields:

| Field | Source | Notes |
|---|---|---|
| Full Name | Scraper | Required |
| Company Name | Scraper | Required |
| Title / Role | Scraper | Required |
| LinkedIn URL | Scraper | Required |
| Website | Scraper/enrichment | Optional |
| Email | Enrichment (Apollo / pattern-match) | Verified flag |
| Phone | Enrichment (Apollo) | Pro+ and Agency only |
| Industry Vertical | Pipeline (detect_industry) | One of 5 target verticals + Other |
| ICP Status | Pipeline filter | New / Qualified / Skipped - Competitor / For Lisa to Judge |
| Relevance Score | Pipeline scoring | High / Medium / Low |
| Article Type | Article pipeline | A/B/C/D/E |
| Article Title | Article pipeline | From approved sources only |
| Article URL | Article pipeline | Verified live, not paywalled |
| Article Summary | Article pipeline | 2 sentences, hyper-personalized |
| Source | Scraper | Which directory/query produced this lead |
| Scraped At | System | UTC timestamp |
| Served To Users | System | Count — used for exclusivity tracking |
| Processed Date | System | When article enrichment completed |

---

## 9. Lead Sourcing Strategy

### Primary Method: Google-Indexed Directory Queries
Rather than hitting association directories directly (fragile, dynamic rendering), the pipeline uses Google search queries targeting specific open directories:

| Vertical | Query Pattern | Data Available |
|---|---|---|
| HVAC/Trades | `site:acca.org "contractor" "owner"` | Phone + address |
| Plumbing | `site:phccweb.org "owner" "president"` | Phone + address |
| Trucking | `site:ntea.com "owner" "CEO"` | Phone + address |
| Law Firms | `site:texasbar.com "managing partner"` | Phone + address |
| Law Firms | `site:vsb.org "founding attorney"` | Phone + address |
| Accounting | `site:aicpa.org "CPA" "owner" "partner"` | Profile data |
| Insurance | `site:iiaba.net "agency owner" "principal"` | Phone + address |
| All verticals | `site:alignable.com "[vertical]" "owner" "founder" [state]` | Self-listed biz owners |
| All verticals | `site:linkedin.com/in/ "[role]" "[vertical]" "[pain keyword]" "United States"` | LinkedIn profiles |

12 verticals × 5 query variants = 60 targeted queries per daily run.

### Email Enrichment
Email is not expected from directory sources. The pipeline: (1) extracts the company domain from the result, (2) pattern-matches the likely email format (firstname@companydomain.com), (3) flags as unverified. Multi-source confirmation (LinkedIn + directory + website) = verified. Single source = unverified. Apollo API used for Pro+ verified enrichment.

---

## 10. What Is NOT Built Yet (As of July 2026)

| Feature | Priority | Notes |
|---|---|---|
| BYOK AI provider settings UI | High | Account Settings page — key storage, provider selector |
| AI provider adapter layer | High | callAI() function routing to correct SDK |
| Per-user 5 AM scheduler | High | Timezone-aware cron job creation on Pro+ activation |
| Deep Research backend (LLM pipeline) | High | Article research, ICP filtering, competitor exclusion wired to user's AI key |
| Google Sheets output connector | High | OAuth flow + append-on-run |
| Notion output connector | High | Token + database ID input + write-on-run |
| Shared lead pool | High | shared_leads table + dedup/freshness logic |
| Multiple saved ICP profiles UI | Medium | Profile switcher in dashboard, tier-gated count |
| Outreach copy generation (pay-per-use) | Medium | $2/lead or batch pricing, Stripe payment intent |
| Email capture gate on query builder | Medium | Capture email before showing full query on free tier |
| 90-day data retention auto-delete | Medium | Cron job or scheduled cleanup |
| PDF Prompt Pack rebuild (Typst) | Medium | Current PDF is low quality — needs professional rebuild |
| Exclusivity tracking for Agency leads | Low | served_exclusively flag + 30-day lock |
| Client Engine Suite bundle page | Low | Cross-sell The Right-People List + Client Engine Builder + Funnel Builder |
| Vercel deployment config | Low | vercel.json + serverless function wrapper for Express |

---

## 11. Transfer Notes for Coding Agent

When picking up this project, read in this order:
1. This file (PRD.md) — product requirements and feature specs
2. ARCHITECTURE.md — tech stack, data model, file structure
3. ROADMAP.md — what is built, what is next, sequenced priorities
4. `/home/ubuntu/icp-scraper-tool/todo.md` — granular task checklist
5. The Notion handoff page for the article research pipeline code: `https://app.notion.com/p/Lead-Enrichment-Engine-Code-Handoff-Thread-1-399b61b97bea816eaeacd7d462a61cb6`

**Do not publish the site** without Lisa's explicit instruction. The Publish button in the Manus Management UI is the only deployment mechanism — do not click it or trigger it programmatically.

**Do not expose prompts to users.** All pipeline logic runs server-side. Users see outputs only.

**5 AM jobs must fire in the user's local timezone.** Timezone is stored on the user record. Convert to UTC cron expression at job creation time.
