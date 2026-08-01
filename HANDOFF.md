# The Right-People List — Handoff (2026-07-25)

Replaces PRD.md / ARCHITECTURE.md / ROADMAP.md, which describe the old
Manus-hosted version and are now stale. This is the current state of
the product, written at the end of the session that migrated it off
Manus and onto its own stack.

## What this is

A lead-finding tool for coaches/consultants/agency owners: build an ICP
profile (roles, industry, pain keywords, location, company size), and
it runs a real search and drops matching LinkedIn profiles into a
dashboard as scored leads (High/Medium/Low).

**Live at:** https://therightpeoplelist.limitedtolimitless.com
**Repo:** github.com/lisamurphy-ltl/right-people-list (renamed from icp-scraper-tool)
**Local path:** `~/projects/right-people-list`
**Hosting:** Railway (auto-deploys on push to `main`) — project id `8d85cac2-3e1a-453f-aee3-6ddc8aac24f3`, service `right-people-list`, plus a MySQL service in the same project.

## Stack

- Vite + React + wouter (client), Express + tRPC (server), Drizzle ORM + MySQL
- Auth: email/password (scrypt hash), JWT session cookie — **not** Manus OAuth anymore
- Payments: Stripe (account `acct_1QLAuALeweUh8LMa`), checkout via tRPC procedures
- Lead search: SerpApi (Google search API) — real results, not an LLM guessing
- DB migrations: auto-run on every server boot (`server/_core/migrate.ts`) — never needs manual `db:push` again

## Pricing (current, live in Stripe)

Product `prod_UwQ7uq4ZnHe6a7`. Three options, matches the "narrow to 3 categories" design:

| Tier | Price | Leads | Stripe Price ID |
|---|---|---|---|
| Free | $0/mo forever | 25/mo | n/a |
| Pro (monthly) | $17/mo | 100/mo | `price_1Tx4ZJLeweUh8LMaz8Fdz5pN` |
| Lead Top-Up (one-time) | $27 | +100, stacks on current plan | `price_1Tx4ZKLeweUh8LMahiRzJaYo` |
| Outreach Prompt Pack (unrelated add-on) | $49 one-time | — | (pre-existing, untouched) |

Old $47/$127/$297 Pro/Pro+/Agency tier prices still exist in Stripe but are **deactivated** (not deleted — safe to ignore, don't reuse).

Coupons live: `ICP1` (100% off, single-use, scoped to this product) and `OWNERTEST` (100% off, no product restriction, reusable — pre-existing account-wide test code).

**⚠️ Pricing note:** Lisa said she may revisit the exact $17/$27 numbers — check with her before assuming these are final.

## Required Railway environment variables

All set except where noted:

```
DATABASE_URL=${{MySQL.MYSQL_URL}}
NODE_ENV=production
JWT_SECRET=<set>
OWNER_EMAIL=lisa.murphy@limitedtolimitless.com
VITE_APP_URL=https://therightpeoplelist.limitedtolimitless.com
STRIPE_SECRET_KEY=<set>
STRIPE_PRICE_PRO=price_1Tx4ZJLeweUh8LMaz8Fdz5pN
STRIPE_PRICE_TOPUP=price_1Tx4ZKLeweUh8LMahiRzJaYo
SERPAPI_API_KEY=<set, but confirm — had quote-escaping issues, see Gotchas>
LEADS_SHEET_WEBHOOK_URL=<not set yet — Apps Script Web App URL, see "Lead index" below>
LEADS_SHEET_WEBHOOK_SECRET=<not set yet — must match the Apps Script's WEBHOOK_SECRET property>
```

`STRIPE_PRICE_PRO_PLUS` / `STRIPE_PRICE_AGENCY` are still read by the code but unused now that those tiers are hidden from the UI — harmless if unset.

## What's confirmed working (tested live, not just "should work")

- Signup / login / logout
- Stripe checkout for the $17/mo plan and $27 top-up (checkout session creation confirmed returns a real checkout.stripe.com URL; full payment→credit flow via a real card still not tested)
- SerpApi lead search returning real, quality-filtered leads (real full names, real companies, live-checked LinkedIn URLs — confirmed 2026-07-31)
- ICP Discovery wizard (18 questions) persists correctly and drives the search
- DB auto-migration on boot
- Custom domain + SSL
- **Railway is directly API-accessible now** — a project-scoped Railway API token is available for this project; env vars can be read/written via `https://backboard.railway.app/graphql/v2` (`variables` query, `variableUpsert` mutation) with `projectId: 8d85cac2-3e1a-453f-aee3-6ddc8aac24f3`, `environmentId: bc1e607f-5123-4f02-aee2-4d30190e90fb`, `serviceId: 69cee3d6-a064-4d11-8596-17b471e386db`. No more relaying values through Lisa for env var fixes — huge time saver, use this first.

## ICP Discovery Questionnaire (18 questions, replaced the old 5-tag builder)

The old `QueryBuilder.tsx` (5 flat tags: roles/industries/pains/location/companySize,
**with a visible raw Google search string + Copy Query button** — a real bug,
it let anyone copy the search and skip paying, fixed the same day it was
reported) is gone. It's replaced by `IcpWizard.tsx` + `icpQuestionnaire.ts`,
which implement Lisa's full 18-question ICP Discovery Questionnaire (5
sections: Ground Truth, Company, Person, Pain & Trigger, Filter) with
conditional follow-ups, per-question Other boxes, and character limits,
matching `ICP_Discovery_Questionnaire.md`.

Answers persist to the existing (previously unused) `icpProfiles` table —
one profile per user, autosaved per question, full raw answer set as JSON in
`queryState`, key fields mirrored into named columns. `leads.runSearch` now
reads the user's saved profile server-side instead of taking search params
from the client at all — nothing about how the search is built is ever sent
to or exposed in the browser.

**What's NOT wired into the live search yet:** only job titles (Q10),
industries (Q4), location (Q7), and a soft company-size hint (Q6) actually
shape today's SerpApi/Google query — adding more required literal-text
groups (seniority, company type, growth signals, etc.) would just return
zero results, since Google search only matches literal text, not meaning.
The rest of the 18 answers (pain language, trigger events, objections,
disqualifiers, decision-maker mapping) are captured and stored for the
one-sentence ICP summary and for whenever a structured-filter search source
(Apollo, Google free search — discussed but not yet built, see Open Items)
replaces literal-text Google dorking as the primary discovery method.

## Lead search index (3-tier search)

`leads.runSearch` in `server/routers.ts` now checks a shared `scraped_leads_index`
MySQL table (every profile any user's search has ever surfaced, tagged with the
industries/location/company-size active at scrape time) **before** calling
SerpApi. Only the shortfall SerpApi can't cover from the index gets a live API
call — this is what cuts down SerpApi usage over time as the index grows.

Every new SerpApi result also gets: (1) upserted into `scraped_leads_index`,
and (2) POSTed to a Google Apps Script Web App webhook (`server/sheetLog.ts`)
that appends a row to the **"App-Scraped Leads"** tab on Lisa's real tracker
spreadsheet (`1RPXpBcDL6248mkY4qOKjq2tUcbC9aTJannIxidy9OaQ` — the same one with
her ICP-A/ICP-B/Industry tabs, which this never touches). The Apps Script
source is at `docs/google-apps-script-lead-logger.gs` with deploy steps in its
header comment.

**Not done yet:** the Apps Script hasn't been deployed by Lisa, so
`LEADS_SHEET_WEBHOOK_URL`/`LEADS_SHEET_WEBHOOK_SECRET` aren't set — the index
lookup and SerpApi fallback both work today, but new leads aren't being
written to the sheet until that webhook is deployed and wired in.

**Tier 3 (LLM fallback) is intentionally not built.** Lisa asked for the
search to "only go to an LLM model when needed" as a last resort. Earlier
this session I flagged that free OpenRouter models hallucinate fake leads —
building an LLM fallback that fabricates plausible-but-fake "leads" would be
actively harmful (wastes a real person's search allowance on garbage data
that looks real). Needs a real conversation with Lisa about what that tier
should actually do before it gets built.

## What's NOT built yet (be honest with Lisa about these if asked)

1. **No email verification / password reset flow.** Signup just takes an email at face value.
2. **The $49 Prompt Pack PDF file doesn't exist.** `server/routers.ts` points at `/downloads/right-people-list-outreach-system.pdf`, which isn't in the repo. Anyone who buys it will hit a 404. Needs the real file dropped in `client/public/downloads/`.
3. **No hero photo** — Home.tsx uses a CSS starfield/gradient instead of a real image. Fine as a design choice, but originally a placeholder.
4. **Apollo enrichment (verified email/phone)** code still exists (`server/enrichment.ts`, Pro+/Agency plan logic) but isn't sold or reachable from the current UI. Dead code, not wired to anything a user can click.

## Stripe webhook (built 2026-08-01)

`server/stripeWebhook.ts`, registered at `POST /api/stripe/webhook` in `server/_core/index.ts` **before** the global `express.json()` parser (needs the raw body for signature verification). Handles `checkout.session.completed` (subscription mode — upgrades the plan), `customer.subscription.updated`, and `customer.subscription.deleted` (downgrades to free). `STRIPE_WEBHOOK_SECRET` is set on Railway; the endpoint is registered in Stripe (`we_1TzLMhLeweUh8LMa8mmC7ZdP`).

**Why this got built:** a real customer (Lisa, testing with her own card) paid for Pro and the dashboard kept showing Free — the success redirect only ever had a verify step for the one-time top-up (`?topup_session=`), never for subscription checkouts (`?upgraded=1` did nothing). Her account was manually corrected directly in MySQL once the real Stripe subscription was confirmed server-side; the webhook is the permanent fix so this can't happen to a real customer again. Dashboard also now briefly polls `subscription.get` after an `?upgraded=1` redirect so the UI updates within seconds instead of requiring a manual refresh.

## Open items for next session

1. Build the Stripe webhook — checkout can still succeed while the DB never learns about it if the client-side redirect/verify flow doesn't complete. Real gap before real customers rely on this for money.
2. Get the real Prompt Pack PDF from Lisa and upload it.
3. Ask Lisa if she wants the old Pro+/Agency enrichment tiers fully removed from the code, or kept dormant for a future relaunch.
4. **Apollo free People Search** was researched but not built. Apollo's search/filter endpoint (title, seniority, industry, headcount, revenue) doesn't consume credits — but their own docs show an *obfuscated* last name and no LinkedIn URL in the raw search response, which contradicts the "fully free" read. Waiting on Lisa to create a free Apollo account and send an API key so a real test call can confirm what the free tier actually returns before building it in as the primary discovery source (ahead of SerpApi).
5. **Google's free Custom Search API (100/day)** was agreed as a second free discovery source, ahead of paid SerpApi — not built yet either. Needs Lisa to create a free Google Programmable Search Engine + API key (her Google login, can't be done for her).
6. Deploy the Google Apps Script webhook (see "Lead search index" above) so scraped leads actually start writing to the "App-Scraped Leads" tab.

~~Confirm SERPAPI_API_KEY / Stripe price IDs are working~~ — **resolved 2026-07-31**, see "What's confirmed working" above.

## Gotchas learned this session (save yourself the debugging time)

- **Railway's bundled runtime path is `dist/`, not the source file's original location.** Any `path.resolve(import.meta.dirname, ...)` code needs `process.env.NODE_ENV === "production"` branching — one extra `".."` here took the site down for ~15 minutes (migrations folder resolved outside the repo entirely).
- **The custom domain's Cloudflare DNS record must stay "DNS only" (grey cloud), never "Proxied."** It flipped to Proxied on its own at least once and caused 502s. If the site 502s again, check this first.
- **Railway's target port matters.** The container actually listens on 8080 (visible in Deploy Logs: `Server running on http://localhost:8080/`), not 3000 — the custom domain's configured port must match, or every request 502s in ~2ms (that speed is the tell: it means the edge never reached the app at all).
- **When Lisa manually edits Railway's Raw Editor, watch for stray `\"` characters** — happened twice, made Stripe/SerpApi keys invalid without any obvious error until tested. Worse case found 2026-07-31: a Raw Editor paste merged a whole extra `KEY="value"` fragment into a DIFFERENT variable's value (`VITE_APP_URL` ended up containing `...com" STRIPE_PRICE_PRO="price_...`), which took a while to spot because the app's error message ("Not a valid URL") didn't obviously point at which variable was the problem. If a Railway-sourced env var is behaving strangely, read its *exact* value via the API (see below) before assuming the value itself is simply wrong — check for merged/truncated content first.
- **Railway is directly API-accessible — use this instead of relaying values through Lisa.** A project-scoped Railway API token exists for this project (generated 2026-07-31; ask Lisa for a fresh one from Railway → Account Settings → Tokens if it's no longer valid — account tokens are plain UUIDs). Browser automation cannot reach railway.com at all (confirmed org policy), but raw HTTPS calls are NOT blocked — use `curl`/`fetch` directly against `https://backboard.railway.app/graphql/v2` with `Authorization: Bearer <token>`. Project-scoped tokens can't query `me` (expect "Not Authorized" there — that's normal, not a broken token), but project/environment/service/variable queries and mutations work fine. Key queries: `variables(projectId, environmentId, serviceId)` to read all vars as a flat object, `variableUpsert(input: {projectId, environmentId, serviceId, name, value})` to set one. IDs for this project: `projectId: 8d85cac2-3e1a-453f-aee3-6ddc8aac24f3`, `environmentId: bc1e607f-5123-4f02-aee2-4d30190e90fb`, `serviceId: 69cee3d6-a064-4d11-8596-17b471e386db` (right-people-list service; MySQL service id is different).
- **A missing/invalid `STRIPE_SECRET_KEY` used to crash the whole server** (Stripe client was instantiated eagerly at module load). Fixed — it's now lazy, so a bad key only breaks Stripe-dependent calls, not the whole site. Don't reintroduce eager instantiation for future third-party clients (SerpApi's `leadSearch.ts` already follows the lazy pattern).
- **DB schema changes require both editing `drizzle/schema.ts` AND running `drizzle-kit generate`** to produce a migration file — editing the schema alone does nothing to the live database. Migrations now auto-apply on boot, so once generated and committed, no manual `db:push` step is needed.
- **My browser automation tools cannot reach railway.com** (org policy, not fixable by reboot/retry) — Railway-side verification always needs either Lisa's screen or her doing the click herself. Stripe API access works fine via Composio-connected MCP tools.
