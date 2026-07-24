# The Right-People List — Build Roadmap

**Version:** 1.0  
**Last Updated:** July 2026

Read PRD.md for feature specs. Read ARCHITECTURE.md for technical design. This document tracks build status and sequence.

---

## What Is Built (As of July 2026)

| Feature | Status | Notes |
|---|---|---|
| Home page with ICP query builder | ✅ Done | Tag selector for roles, industries, pain keywords, location. Real-time query generation. |
| ICP Clarity Guide modal | ✅ Done | 4-step ICP definition walkthrough. Triggered from Home page. |
| Client Engine Suite bundle teaser | ✅ Done | The Right-People List + Client Engine Builder + Funnel Builder section on Home page. |
| Manus OAuth authentication | ✅ Done | Login/logout, session cookie, `useAuth()` hook. |
| Lead Dashboard | ✅ Done | Lead list, usage meter, monthly reset date, manual add, relevance score display. |
| Paywall gate | ✅ Done | Checks auth + monthly usage limit. Unauthenticated and over-limit users see upgrade CTA. |
| Stripe subscription billing | ✅ Done | Checkout sessions for Pro ($47), Pro+ ($127), Agency ($297). Webhook handler wired. Awaiting live Price IDs in Secrets. |
| Apollo enrichment backend | ✅ Done | `enrichment.ts` wired. Tier-gated: unverified email on Pro, verified email + phone on Pro+/Agency. Awaiting Apollo API key in Secrets. |
| $49 Prompt Pack (one-time product) | ✅ Done | Stripe one-time checkout. Download page with payment verification. PDF generated (needs quality rebuild — see below). |
| Pricing page | ✅ Done | All four tiers + $49 Prompt Pack card. |
| Responsive layout (mobile/desktop) | ✅ Done | Text overflow fixed. All cards contain text on all screen sizes. |
| Database schema (core tables) | ✅ Done | `users`, `subscriptions`, `leads` tables live and migrated. |
| Database schema (future tables) | ✅ Done (schema only) | `icpProfiles`, `deepResearchRuns` defined in schema.ts. Not yet migrated or wired. |
| PRD.md | ✅ Done | This session. |
| ARCHITECTURE.md | ✅ Done | This session. |
| ROADMAP.md | ✅ Done | This session. |

---

## What Needs to Be Done — Priority Order

### Priority 1 — Activate Paid Tiers (Blocking Revenue)

These items are built and waiting for credentials. Zero code changes needed.

| Task | Action Required |
|---|---|
| Wire Stripe Price IDs | Add `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_PLUS`, `STRIPE_PRICE_AGENCY` to Secrets in Manus Management UI |
| Wire Apollo API key | Add `APOLLO_API_KEY` to Secrets. Enables verified email + phone enrichment on Pro+/Agency. |
| Test end-to-end checkout | Sign up as a test user, complete Stripe test checkout, verify subscription record created, verify tier gating works. |

---

### Priority 2 — BYOK AI Provider Settings

**Why first:** Everything in Priority 3+ depends on users having an AI key configured. Build the settings UI and key storage before building any AI-powered features.

Tasks:
- Add fields to `users` table: `timezone`, `aiProvider`, `aiApiKey` (encrypted), `aiApiEndpoint`, `outputDestination`, `googleSheetsId`, `notionToken` (encrypted), `notionDatabaseId`
- Run `pnpm db:push` after schema change
- Build Account Settings page with sections: AI Provider, Output Destination, Schedule
- Build `server/ai/callAI.ts` — the multi-provider adapter function
- Encrypt/decrypt API keys using AES-256 (use Node.js `crypto` module — no new dependencies)
- Capture timezone during onboarding (add to signup flow or first-login prompt)

---

### Priority 3 — Saved ICP Profiles

**Why here:** Required before the scheduler can run per-user jobs (the job needs to know which ICP profile to use).

Tasks:
- Migrate `icpProfiles` table (`pnpm db:push`)
- Build tRPC procedures: `icpProfile.list`, `icpProfile.create`, `icpProfile.update`, `icpProfile.delete`, `icpProfile.setActive`
- Enforce tier limits server-side: Free/Pro = 1 profile max, Pro+ = 3 max, Agency = unlimited
- Build ICP Profile switcher UI in Dashboard sidebar
- Wire ICP Clarity Guide answers to auto-populate new profile form

---

### Priority 4 — Shared Lead Pool

**Why here:** The scheduler (Priority 5) needs the pool to exist before it can check it.

Tasks:
- Add `sharedLeads` table to schema.ts and run `pnpm db:push`
- Build `server/leadPool.ts` with functions: `checkPool(vertical, geography, userId)`, `addToPool(leads[])`, `markServed(leadId, userId)`, `markExclusive(leadId, userId)`
- Update lead sourcing to write to pool first, then assign to user
- Implement freshness tiers: 30 days (Free/Pro), 14 days (Pro+), 7 days (Agency)
- Implement exclusivity: Agency users can request exclusive leads

---

### Priority 5 — Per-User 5 AM Scheduler + Pipeline

**Why here:** Depends on BYOK keys (Priority 2), ICP profiles (Priority 3), and lead pool (Priority 4).

Tasks:
- Build `server/ai/pipeline.ts` — the full enrichment pipeline:
  - `detectIndustry(title, company)` — maps to 5 target verticals
  - `isCompetitor(title, company, bio)` — hard-exclude filter
  - `researchArticle(lead, icpContext)` — finds + verifies article from approved sources
  - `verifyArticleUrl(url)` — checks live, not paywalled, approved domain
  - `scoreLead(lead, icpProfile)` — High/Medium/Low relevance
  - Reference the Notion handoff for battle-tested function logic: `https://app.notion.com/p/Lead-Enrichment-Engine-Code-Handoff-Thread-1-399b61b97bea816eaeacd7d462a61cb6`
- Build `server/scheduler.ts` — creates/updates/cancels per-user cron jobs
  - **CRITICAL:** Convert user's `timezone` to UTC cron expression. Use `date-fns-tz` or `luxon`. Never hardcode UTC 5 AM.
  - Trigger on Stripe webhook `customer.subscription.updated` when plan = pro_plus or agency
  - Cancel job on subscription cancellation
- Build output writers: `writeToGoogleSheets(userId, leads[])`, `writeToNotion(userId, leads[])`, `writeToInAppDB(userId, leads[])`

---

### Priority 6 — Deep Research Feature (Pro+ and Agency)

Tasks:
- Migrate `deepResearchRuns` table (`pnpm db:push`)
- Build Deep Research ICA form UI (8 fields matching the research prompt structure)
- Wire ICP Clarity Guide as pre-flight step — answers auto-populate ICA form
- Build `deepResearch.run` tRPC procedure — tier-gated (Pro+: 2 runs/month, Agency: unlimited)
- Run the pipeline: ICA fields → LLM finds 100 matching people → each record gets bio, match signal, contact
- Store results in `deepResearchRuns.resultsJson`
- Build results view: 100-record list with bio, match signal, contact, relevance score
- Add "Export to CSV" and "Export to Google Sheets/Notion" on results
- Apply relevance scoring to all 100 results

---

### Priority 7 — PDF Prompt Pack Rebuild

The current $49 Prompt Pack PDF was generated with WeasyPrint and the quality is unacceptable. Rebuild with Typst for commercial-grade output.

Tasks:
- Read `/home/ubuntu/skills/typst-pdf-maker/SKILL.md` before starting
- Install Typst if not available: `curl -fsSL https://typst.app/install.sh | sh`
- Rebuild `/home/ubuntu/outreach-prompt-pack/ICP_Scout_Outreach_System.pdf` using Typst
- Design requirements: dark cover page (slate + gold), clean section headers, prompt blocks in monospace with gold borders, page numbers, footer with Limited to Limitless branding
- Upload rebuilt PDF to webdev static assets: `manus-upload-file --webdev path/to/rebuilt.pdf`
- Update the S3 key reference in `server/routers.ts` `promptPack.getDownloadUrl` procedure

---

### Priority 8 — Email Capture Gate on Free Query Builder

Tasks:
- After user selects ICP tags and the query generates, show a lightweight modal: "Enter your email to see your full query and run it"
- Store email in a `leads_captured` table (not the main leads table)
- After email entry, show the query and enable the "Run on Google" button
- This turns every free visitor into a lead for Lisa before they hit the paywall

---

### Priority 9 — Outreach Copy Generation (Pay-Per-Use)

Tasks:
- Build "Generate Outreach" button on each lead in the dashboard
- Trigger Stripe Payment Intent for $2/lead, $35/25 leads, or $97/100 leads
- After payment confirmation, call `callAI()` with lead bio + match signal + user's ICA problem statement
- Generate: one LinkedIn DM draft + one cold email draft per lead
- Display in a modal with copy buttons
- Store generated copy on the lead record

---

### Priority 10 — Vercel Migration

Tasks:
- Add `vercel.json` to project root (see ARCHITECTURE.md Section 7 for template)
- Test build locally: `pnpm build`
- Set up external MySQL database (PlanetScale recommended — free tier, MySQL-compatible)
- Export Manus Secrets to Vercel Environment Variables
- Update Stripe webhook URL to Vercel domain
- Test full flow on Vercel preview deployment before cutting over DNS

---

## Privacy Policy

**REQUIRED on every page.** Link to: `https://docs.google.com/document/d/1Sx6jQKGpWPD6ja-8AvkIK0rh-ME2CPOW9UcdUIPixJc/edit?usp=sharing`

Add to footer of Home, Pricing, Dashboard, and Download pages. This has not been added yet — add it in the next build session.

---

## Notes for the Next Coding Agent

1. **Do not publish the site** without Lisa's explicit instruction. The Publish button in the Manus Management UI is the only deployment mechanism.
2. **Do not expose prompts.** All pipeline logic is server-side. Users see outputs only.
3. **5 AM jobs must fire in the user's local timezone.** Never hardcode UTC.
4. **Read the Notion handoff** for battle-tested Python pipeline functions to port to TypeScript: `https://app.notion.com/p/Lead-Enrichment-Engine-Code-Handoff-Thread-1-399b61b97bea816eaeacd7d462a61cb6`
5. **The console error** `Neither apiKey nor config.authenticator provided` is a non-blocking warning from the Apollo client initializing without a key. It does not affect the app — it resolves when the `APOLLO_API_KEY` secret is added.
6. **Design system** is dark slate + electric gold. Do not introduce new color schemes. See ARCHITECTURE.md Section 9.
7. **Text overflow rule:** Every card, box, and container must use `overflow-wrap: break-word` and `min-width: 0` on flex children. Test on mobile before every checkpoint.
