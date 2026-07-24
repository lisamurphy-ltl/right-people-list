# The Right-People List — Architecture Document

**Version:** 1.0  
**Last Updated:** July 2026

---

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 | Vite build tool |
| API Layer | tRPC 11 + Express 4 | End-to-end typed, no REST routes |
| Backend Runtime | Node.js (ESM, tsx in dev) | |
| Database | MySQL (TiDB) via Drizzle ORM | Managed, no maintenance required |
| Auth | Manus OAuth (JWT session cookie) | `protectedProcedure` for gated routes |
| Payments | Stripe | Subscriptions + one-time payments |
| File Storage | S3-compatible (Manus Forge) | For PDF delivery and exports |
| AI (built-in) | Manus Forge LLM API | `BUILT_IN_FORGE_API_KEY` already wired |
| AI (BYOK) | Multi-provider adapter (see Section 5) | User's own key, encrypted at rest |
| Hosting | Manus Autoscale (dev) → Vercel (production) | See Section 7 |

---

## 2. File Structure

```
icp-scraper-tool/
├── PRD.md                          ← Product requirements (read first)
├── ARCHITECTURE.md                 ← This file
├── ROADMAP.md                      ← Build sequence and priorities
├── todo.md                         ← Granular task checklist
├── client/
│   ├── index.html                  ← Fonts, meta, analytics
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx            ← Query builder, ICP Clarity Guide, Client Engine Suite
│       │   ├── Dashboard.tsx       ← Lead list, usage meter, enrichment, export
│       │   ├── Pricing.tsx         ← All tiers + $49 Prompt Pack card
│       │   ├── Download.tsx        ← Post-purchase PDF delivery
│       │   └── NotFound.tsx
│       ├── components/
│       │   ├── ICPClarityGuide.tsx ← 4-step ICP definition modal
│       │   ├── PaywallGate.tsx     ← Auth + usage limit enforcement
│       │   ├── AddLeadModal.tsx    ← Manual lead entry form
│       │   ├── DashboardLayout.tsx ← Sidebar layout for authenticated pages
│       │   └── ui/                 ← shadcn/ui components
│       ├── index.css               ← Global theme (dark slate + electric gold)
│       └── App.tsx                 ← Routes: /, /dashboard, /pricing, /download
├── server/
│   ├── routers.ts                  ← All tRPC procedures
│   ├── db.ts                       ← Drizzle query helpers
│   ├── enrichment.ts               ← Apollo API + email pattern matching
│   ├── storage.ts                  ← S3 file helpers
│   └── _core/                      ← Framework plumbing (do not edit)
├── drizzle/
│   └── schema.ts                   ← All database tables
└── shared/
    └── const.ts                    ← Shared constants
```

---

## 3. Database Schema

### 3.1 Existing Tables

**`users`** — Core auth table (Manus OAuth)
- `id`, `openId`, `name`, `email`, `loginMethod`, `role` (user/admin)
- `timezone` — **ADD THIS FIELD** — required for 5 AM local-time scheduling
- `aiProvider` — **ADD THIS FIELD** — selected AI provider (manus/openai/anthropic/gemini/perplexity/grok/other)
- `aiApiKey` — **ADD THIS FIELD** — encrypted API key for BYOK
- `aiApiEndpoint` — **ADD THIS FIELD** — custom endpoint for "Other" provider
- `outputDestination` — **ADD THIS FIELD** — in-app/google-sheets/notion
- `googleSheetsId` — **ADD THIS FIELD** — Google Sheet ID for output
- `notionToken` — **ADD THIS FIELD** — encrypted Notion integration token
- `notionDatabaseId` — **ADD THIS FIELD** — Notion database ID for output
- `createdAt`, `updatedAt`, `lastSignedIn`

**`subscriptions`** — Stripe subscription tracking
- `id`, `userId`, `stripeCustomerId`, `stripeSubscriptionId`
- `plan` (free/pro/pro_plus/agency), `status` (active/canceled/past_due)
- `currentPeriodStart`, `currentPeriodEnd`, `leadsUsedThisMonth`
- `createdAt`, `updatedAt`

**`leads`** — Individual lead records per user
- `id`, `userId`
- `fullName`, `company`, `title`, `linkedinUrl`, `website`
- `email`, `emailVerified` (boolean), `phone`
- `industry`, `icpStatus` (new/qualified/skipped_competitor/for_review)
- `relevanceScore` (high/medium/low)
- `articleType`, `articleTitle`, `articleUrl`, `articleSummary`
- `source`, `scrapedAt`, `processedAt`
- `createdAt`

**`icpProfiles`** — Saved ICP configurations per user (ADD — not yet built)
- `id`, `userId`, `name` (profile display name)
- `targetRoles` (JSON array), `targetIndustries` (JSON array)
- `painKeywords` (JSON array), `geography`
- `filterJson` (full filter object), `isActive` (boolean)
- `createdAt`, `updatedAt`

**`deepResearchRuns`** — Deep Research job tracking (ADD — not yet built)
- `id`, `userId`, `icpProfileId`
- `status` (pending/running/complete/failed)
- `icaFields` (JSON — the ICA form input)
- `resultsJson` (JSON — array of 100 lead records)
- `leadsGenerated` (count), `errorMessage`
- `startedAt`, `completedAt`, `createdAt`

**`sharedLeads`** — Central lead pool (ADD — not yet built)
- `id`, `fullName`, `company`, `title`, `linkedinUrl`, `website`
- `email`, `emailVerified`, `phone`
- `industry`, `vertical`, `geography`
- `source`, `queryPattern`
- `relevanceScore`, `icpStatus`
- `articleTitle`, `articleUrl`, `articleSummary`
- `scrapedAt`, `enrichedAt`
- `freshnessStatus` (fresh/aging/stale)
- `servedToUsersCount` (integer)
- `exclusiveToUserId` (nullable — Agency exclusivity)
- `exclusiveUntil` (nullable timestamp)

---

## 4. tRPC Router Structure

All procedures live in `server/routers.ts`. As the file grows past ~150 lines, split into `server/routers/[feature].ts`.

```
appRouter
├── system          ← Health check (framework)
├── auth
│   ├── me          ← Current user (public)
│   └── logout      ← Clear session cookie (public)
├── subscription
│   ├── get         ← Current plan + usage (protected)
│   ├── createCheckout  ← Stripe checkout session (protected)
│   └── webhook     ← Stripe webhook handler (public, verified)
├── leads
│   ├── list        ← User's leads with pagination (protected)
│   ├── add         ← Manual lead entry, tier-gated (protected)
│   ├── enrich      ← Apollo enrichment, tier-gated (protected)
│   ├── delete      ← Remove lead (protected)
│   └── export      ← CSV export (protected)
├── promptPack
│   ├── createCheckout  ← $49 one-time Stripe checkout (protected)
│   └── getDownloadUrl  ← Verify payment + return S3 URL (protected)
├── icpProfile      ← ADD: CRUD for saved ICP profiles (protected)
├── deepResearch    ← ADD: Run + retrieve Deep Research jobs (protected, Pro+/Agency)
├── settings        ← ADD: BYOK key, output destination, timezone (protected)
└── scheduler       ← ADD: Create/update/cancel per-user 5 AM job (protected)
```

---

## 5. BYOK AI Provider Adapter

All AI calls route through a single function. **Never call LLM SDKs directly in routers — always go through this adapter.**

```typescript
// server/ai/callAI.ts (ADD THIS FILE)

type AIProvider = 'manus' | 'openai' | 'anthropic' | 'gemini' | 'perplexity' | 'grok' | 'other';

interface AICallOptions {
  provider: AIProvider;
  apiKey?: string;           // User's BYOK key (decrypted)
  endpoint?: string;         // Custom endpoint for 'other' provider
  model?: string;            // Optional model override
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

async function callAI(options: AICallOptions): Promise<string> {
  // Route to correct adapter based on provider
  // OpenAI-compatible: openai, perplexity, grok, other
  // Anthropic: anthropic
  // Google: gemini
  // Manus: built-in Forge API (BUILT_IN_FORGE_API_KEY)
}
```

**Key rule:** The user's API key is decrypted from the database immediately before the call and held in memory only for the duration of the request. It is never logged, never returned to the frontend, never stored in plaintext.

---

## 6. Per-User 5 AM Scheduler

When a Pro+ or Agency subscription activates (Stripe webhook `customer.subscription.updated`):

1. Read the user's `timezone` field (e.g., `"America/New_York"`)
2. Calculate the UTC cron expression for 5 AM in that timezone
3. Create a scheduled job record in the database with the user ID, cron expression, and job type (`daily_lead_enrichment`)
4. The job runner picks up active jobs and executes the pipeline for each user

**CRITICAL:** Never hardcode `0 5 * * *` (UTC). Always convert from user's local timezone. Use the `date-fns-tz` or `luxon` library for timezone conversion.

**Job execution steps:**
1. Load user's active ICP profile
2. Check shared lead pool for matching fresh leads not yet served to this user
3. If pool is thin, run Google-indexed directory queries to fetch new leads
4. Filter leads through ICP rules (`is_competitor()`, `detect_industry()`)
5. Enrich leads with articles (using user's AI key via `callAI()`)
6. Verify article URLs
7. Score leads (High/Medium/Low relevance)
8. Write results to user's output destination (in-app DB, Google Sheets, or Notion)
9. Update `leadsUsedThisMonth` on the subscription record

---

## 7. Vercel Deployment (Future)

The app is designed to be Vercel-compatible from day one:
- No hardcoded ports (server reads from `process.env.PORT`)
- No local file storage (all files go to S3)
- Express app can be wrapped as a Vercel serverless function via `vercel.json`

When ready to migrate:
1. Add `vercel.json` at project root (see below)
2. Update `DATABASE_URL` env var in Vercel dashboard to point to external MySQL (PlanetScale recommended)
3. Update Stripe webhook URL to new Vercel domain
4. All other env vars copy directly from Manus Secrets to Vercel Environment Variables

```json
// vercel.json (ADD WHEN READY TO DEPLOY)
{
  "version": 2,
  "builds": [
    { "src": "dist/index.js", "use": "@vercel/node" },
    { "src": "client/dist/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "dist/index.js" },
    { "src": "/(.*)", "dest": "client/dist/$1" }
  ]
}
```

---

## 8. Security Notes

- All user API keys encrypted with AES-256 before database storage
- Keys never returned to frontend after initial entry
- Keys never appear in server logs
- Stripe webhook signature verified on every webhook call
- All lead enrichment and AI calls are server-side only
- Pipeline prompts are never exposed in API responses or frontend code
- `protectedProcedure` enforces authentication on all sensitive routes
- Tier enforcement is server-side — never trust the frontend for plan gating

---

## 9. Design System

**Theme:** Precision Intelligence — dark slate + electric gold + electric blue  
**Fonts:** Syne (display/headings), Inter (body), JetBrains Mono (code/query blocks)  
**Primary background:** `oklch(0.14 0.018 260)`  
**Gold accent:** `oklch(0.78 0.18 85)`  
**Electric blue:** `oklch(0.65 0.22 240)`  
**Default theme:** Dark (set in `ThemeProvider` in `App.tsx`)

All text must stay within its container on all screen sizes. Use `overflow-wrap: break-word`, `word-break: break-word`, and `min-width: 0` on flex children. The `query-block` class in `index.css` handles the generated query output box.
