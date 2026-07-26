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
- Stripe checkout for the $17/mo plan and $27 top-up (checkout session creation confirmed; full payment→credit flow not yet tested with a real card)
- SerpApi lead search returning real LinkedIn profiles — **verify this is still working**, see Open Items
- DB auto-migration on boot
- Custom domain + SSL

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

1. **No Stripe webhook.** When someone pays, checkout succeeds but nothing tells the database "this person is now Pro" except the client-side redirect flow (`?upgraded=1` / `?topup_session=`). If a customer closes the tab before the redirect completes, they'll have paid but not be upgraded. A webhook handler for `checkout.session.completed` / `customer.subscription.updated` is the real fix — flagged repeatedly this session, never built.
2. **No email verification / password reset flow.** Signup just takes an email at face value.
3. **The $49 Prompt Pack PDF file doesn't exist.** `server/routers.ts` points at `/downloads/right-people-list-outreach-system.pdf`, which isn't in the repo. Anyone who buys it will hit a 404. Needs the real file dropped in `client/public/downloads/`.
4. **No hero photo** — Home.tsx uses a CSS starfield/gradient instead of a real image. Fine as a design choice, but originally a placeholder.
5. **Apollo enrichment (verified email/phone)** code still exists (`server/enrichment.ts`, Pro+/Agency plan logic) but isn't sold or reachable from the current UI. Dead code, not wired to anything a user can click.

## Open items for next session

1. **Confirm `SERPAPI_API_KEY` is actually working.** Lisa pasted it with escaped quotes at least once (`\"...\"` instead of `"..."`), which made it invalid. Last known state: unconfirmed whether the corrected version was ever verified end-to-end — retest with a real signup + search before assuming it works.
2. **Confirm the new $17/$27 Stripe price IDs were pasted into Railway** (see env var table above) — pushed in code but needed Lisa to update Railway manually; not confirmed as of this handoff.
3. Build the Stripe webhook (item 1 above) before real customers rely on this for money.
4. Get the real Prompt Pack PDF from Lisa and upload it.
5. Ask Lisa if she wants the old Pro+/Agency enrichment tiers fully removed from the code, or kept dormant for a future relaunch.

## Gotchas learned this session (save yourself the debugging time)

- **Railway's bundled runtime path is `dist/`, not the source file's original location.** Any `path.resolve(import.meta.dirname, ...)` code needs `process.env.NODE_ENV === "production"` branching — one extra `".."` here took the site down for ~15 minutes (migrations folder resolved outside the repo entirely).
- **The custom domain's Cloudflare DNS record must stay "DNS only" (grey cloud), never "Proxied."** It flipped to Proxied on its own at least once and caused 502s. If the site 502s again, check this first.
- **Railway's target port matters.** The container actually listens on 8080 (visible in Deploy Logs: `Server running on http://localhost:8080/`), not 3000 — the custom domain's configured port must match, or every request 502s in ~2ms (that speed is the tell: it means the edge never reached the app at all).
- **When Lisa manually edits Railway's Raw Editor, watch for stray `\"` characters** — happened twice, made Stripe/SerpApi keys invalid without any obvious error until tested.
- **A missing/invalid `STRIPE_SECRET_KEY` used to crash the whole server** (Stripe client was instantiated eagerly at module load). Fixed — it's now lazy, so a bad key only breaks Stripe-dependent calls, not the whole site. Don't reintroduce eager instantiation for future third-party clients (SerpApi's `leadSearch.ts` already follows the lazy pattern).
- **DB schema changes require both editing `drizzle/schema.ts` AND running `drizzle-kit generate`** to produce a migration file — editing the schema alone does nothing to the live database. Migrations now auto-apply on boot, so once generated and committed, no manual `db:push` step is needed.
- **My browser automation tools cannot reach railway.com** (org policy, not fixable by reboot/retry) — Railway-side verification always needs either Lisa's screen or her doing the click herself. Stripe API access works fine via Composio-connected MCP tools.
