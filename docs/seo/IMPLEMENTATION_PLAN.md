# SEO, AI-Search & Blog: Plan for Review

**Status (updated September 19, 2026):** the owner has answered the open decisions and asked for most of Phases A, B, D and G to be built; see Decision 54 in `docs/scope-addendum-decisions.md` and `docs/seo/blog-fact-check-log.md`. Items in this plan that the owner declined (trademark check, softening claims, analytics, private repo, contact page) are recorded there and are not open questions any more.
**Date:** September 19, 2026
**Inputs:** `SEO_GEO_IMPLEMENTATION_SPEC.md` and `BLOG_CONTENT_PLAN_15_POSTS.md` (both in this folder).
**What was done to produce this:** read both documents in full; re-verified the spec's audit against the code and the live site (the spec asks for this); spot-checked the arithmetic and a sample of its source links; checked a few things the spec does not cover.

---

## 1. Bottom line

The spec is strong: its strategy (content and hub pages carry SEO while inventory is thin, own the "confidential selling" topic, NDA-safe everywhere) is sound, and its rules against fabricated data and unsupported claims are the right ones. The plan below keeps it, with four changes:

1. **Do a small set of owner decisions first** (Section 4). Several of the spec's requirements cannot be built honestly until you answer them: the "Verified" claims, "alerts" and "compare side by side" copy that the product doesn't have, the brand/domain question, and analytics vs. our own Privacy Policy.
2. **Re-order the work by risk.** Technical foundations first (cheap, high value, no owner input needed), then core pages and homepage, then the blog in batches, with data-heavy posts (prices, market news) last.
3. **Add work the spec doesn't mention** (Section 3): a pre-existing set of gaps I found, plus product and launch-hardening items that determine whether SEO traffic converts.
4. **Reset the calendar.** The spec's schedule starts Monday, Sept 21 (two days away). That isn't achievable with owner review and real fact-checking. A realistic schedule is in Section 6.

**Honest expectation, worth repeating:** you currently have very little inventory (about one live listing). Organic search will bring visitors to a marketplace that has almost nothing to show them. The single biggest lever on results is **getting real sellers to list**, ahead of any SEO work. See Section 3, item A2.

---

## 2. Audit verification (the spec's findings vs. reality)

| Spec | Verdict | Evidence |
|---|---|---|
| F1 Duplicate titles/descriptions | **Confirmed, and worse than stated.** | `/`, `/grapes`, `/bulk-wine`, `/login`, and `/?market=bulk-wine` all return the identical title and description. Only `terms`, `privacy` and listing pages set their own. |
| F2 Grape-centric title | **Partly fixed.** | I already updated the description to mention bulk wine (last session). The title is still "HarvestLink — Wine Grape Marketplace". |
| F3 Two URLs for one concept | **Confirmed.** | `Navbar.tsx` links "Bulk Wine" to `/?market=bulk-wine`. That URL has no canonical tag and shows different content than `/`. |
| F4 Grapes-only homepage H1 | **Confirmed.** | Default H1: "Source exceptional wine grapes, direct from growers." |
| F5 Thin `/bulk-wine` | **Confirmed.** | H1 "Browse Bulk Wine", a result count, filters. No intro, pricing explainer, FAQ, or guides. |
| F6 No About/How it works/FAQ/Contact/Blog | **Confirmed.** | None exist. |
| F7 Faceted query-string links | **Confirmed.** | Homepage and footer link to `?region_ava=` URLs. |
| F8 Napa link mismatch | **Confirmed by code.** | Footer links `region_ava=Napa+Valley`; the region list uses county names ("Napa County"). That link can never match. |
| F9 Footer/meta grape-only | **Confirmed for the footer.** | Footer still says "The B2B marketplace connecting growers and buyers for grape lots and multi-year contracts." (You asked for "B2B" to come off the hero badge; it is still in the footer.) |
| F10 Long option lists in initial HTML | **Not measured.** | Needs a Lighthouse baseline before deciding how much to change. |
| F12 Unsupported claims | **Confirmed.** | Homepage: "Verified Growers" (line 15), "Verified buyers" (lines 212, 231). Listing cards show a "Verified" badge driven by a `profiles.is_verified` flag that exists in the database but has no verification workflow behind it. |
| F13 Brand vs. domain | **Confirmed as a risk.** | Not a code issue; see decision D1. |

**Spec claims I checked and found correct:** the gallon/bottle/barrel conversion constants and every row of the price-per-bottle table; the UN/CEFACT unit codes (`GLL`, `STN`); the statements that Google no longer uses `SearchAction` and limits FAQ rich results. **Not verified by me:** all 2026 market statistics and articles (they postdate my knowledge; the source links for TTB, Vinetur and Ciatti respond, while AgWest Farm Credit and Wine Enthusiast returned 403 to an automated fetch, most likely bot protection). Every number in the posts must be re-verified against a retrieved source, as the spec itself requires.

---

## 3. Additional findings and recommended actions (not in the spec)

### Problems found in the current site

| # | Finding | Recommended action |
|---|---|---|
| N1 | **The GitHub repository is public** (`visibility: public`). It contains the NDA design documents, every database migration (which document the security model), and the decisions log. I scanned tracked files and history: **no real secrets** were committed, only placeholders. | Make the repo private (Vercel deploys via the CLI, so nothing breaks). Costs nothing; removes a bad look for a confidentiality-focused product. |
| N2 | **`robots.txt` is missing the newest private routes** (`/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/auth/`, `/planning`) and there is no page-level `noindex` anywhere. No preview-deployment `noindex` either. | Add to Phase A (spec SEO-8). |
| N3 | **Sitemap `lastModified` is the listing's creation date** because the `listings` table has no `updated_at` column. The spec requires accurate dates and a 30-day sold-listing lifecycle, which needs `status_changed_at`. | New migration (additive). Columns not on the allowlist stay private automatically under migration 0008, and reads go through the server, so this is safe. |
| N4 | **The Privacy Policy I drafted says the site uses no analytics trackers.** The spec's GA4 plan contradicts it. | Decision D5. Whatever is chosen, the policy must match before anything ships. |
| N5 | **Homepage/spec copy promises features the product doesn't have:** "get alerts when new lots match your spec", "compare lots side by side", and several "Set an alert" CTAs in the blog plan. Today there are no saved searches; the only alert is a live banner for someone already browsing. | Decision D4: build it (recommended) or cut the copy. |
| N6 | **No logo asset** (the header uses an icon glyph in a circle; `public/` contains only the default Next.js SVGs). Organization JSON-LD and the generated OG card need one. | Owner supplies a logo, or I make a simple wordmark for approval. |
| N7 | **No DMARC record found** for `bulkwinegrapes.com` (DKIM and SPF were added earlier). Confirmation and reset emails now carry the login flow, so deliverability matters. | I can add a `p=none` DMARC record in Vercel DNS now, and tighten it later. |
| N8 | **Blog needs a content pipeline and there is no MDX dependency.** The spec says no new dependencies without justification. | Recommend a small, justified addition (a Markdown/MDX renderer plus front-matter parser) rather than hand-writing posts as React components. I'll write the justification when we get there. |

### Actions beyond the spec that I recommend

| # | Action | Why |
|---|---|---|
| A1 | **Saved searches and email alerts** (built on the Resend integration already in place) | Makes the homepage/blog copy true, gives every blog post a real CTA, and brings visitors back. Also the mechanism by which thin inventory still converts. |
| A2 | **Seller acquisition kit:** a short seller-onboarding page and email template, plus an admin-assisted way to list on a seller's behalf | Search and AI visibility improve when listings exist, and sellers are the bottleneck. Recruit 10 to 20 real sellers (bulk wine especially) before promoting content. |
| A3 | **Launch hardening (carried over from earlier):** real-device Safari/iOS/Android testing; load test; a shared rate limiter (the current one is per server instance); confirm Supabase backups/plan; error monitoring and an uptime check | These decide whether the first wave of visitors has a good experience. |
| A4 | **Legal review** of Terms, Privacy (now also covering analytics, emails, cookies), and post P13 (TTB/permits) by a qualified professional | Already on the open list; the blog raises the stakes. |
| A5 | **Search Console and Bing verification via DNS** | I can add the TXT/CNAME records through Vercel DNS as soon as you send me the verification token. Saves you the DNS step. |
| A6 | **Trademark clearance for "HarvestLink"** and a decision on the brand before publishing 15 posts under it | Renaming later means rewriting titles, schema, copy and redirects. |

---

## 4. Decisions needed from you (with my recommendation)

| ID | Decision | Recommendation |
|---|---|---|
| **D1** | Keep the "HarvestLink" name, or move toward a brand that matches the domain? Run a trademark search first. | Decide **before** publishing posts. Cheap to check now; costly to change after. |
| **D2** | Is there a real verification process? The site says "Verified Growers/buyers" and shows a Verified badge. | Remove the marketing claim now. Keep the badge only if someone (you) actually checks a seller, for example a TTB permit or business registration. |
| **D3** | Headline wording: your earlier instruction was "best wineries and winemakers in the world". The spec advises against claiming it without substantiation. | Adopt the spec's softer "established producers" wording. If it turns out a famous producer really lists, we can say so with permission. |
| **D4** | Build saved searches and email alerts, or remove the alert copy? | Build them (A1). |
| **D5** | Analytics: Google Analytics 4 (free, needs Privacy Policy update and probably a consent banner for some visitors) vs. a privacy-friendly tool (small monthly cost, no cookies, simpler policy). Note: Vercel's own analytics is an add-on; you had a bad experience with Vercel's paid add-ons earlier. | Privacy-friendly tool, or GA4 with a policy update. Either way: Search Console and Bing are free and needed regardless. |
| **D6** | Blog byline and reviewers: who is the named author? Who reviews P13 (compliance)? The spec forbids invented authors. | You (or a real team member) as author; a licensed professional for P13. |
| **D7** | The `{{CONFIRM}}` facts: fee model; who handles payment, shipping and compliance; verification process; contact email; origin story; social profiles; logo. | I can draft all pages with these left out where unknown, but About, How It Works, FAQ and Contact can't be finished without them. |
| **D8** | Make the GitHub repository private? | Yes. |
| **D9** | Let AI training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) in? Search/answer bots are allowed either way. | Allow, per the spec. NDA data is never in public HTML. |
| **D10** | Photography: free stock (vetted and logged) vs. paid stock for the hero. | Free vetted stock for most slots; paid for the hero and anything with people. |
| **D11** | How many posts at once, and how much review time can you give? | Batches of 3 to 5; roughly an hour of your review per batch with the fact-check log. |
| **D12** | Contact method on the public site: an address or a form? Do not use your personal Gmail. | A role address on the domain (for example a forwarding `hello@`), or a form that emails you. |

---

## 5. Recommended work plan

The spec's phases A to G, re-sequenced. Sizes are relative effort for me (S, M, L), not calendar time. "Owner input" = blocked without you.

| Phase | Scope | Size | Owner input |
|---|---|---|---|
| **0. Decisions and quick wins** | Answer D1 to D12. Make the repo private, add DMARC, supply Search Console/Bing tokens, finish the Supabase email templates. | S | Yes |
| **A. Technical foundations** (spec A) | Per-route metadata plus a build-time lint for titles and descriptions; canonical tags; `noindex` on auth/app/confirmation pages; extended `robots.txt`; preview-deployment `noindex`; one URL per concept (`/?market=bulk-wine` handling and nav links); fix the Napa link; remove "B2B" and unsupported claims; sitemap accuracy (new `updated_at` column); generated OG image; Organization, WebSite and Breadcrumb JSON-LD; IndexNow. NDA canary extended to sitemap and JSON-LD. | M | Logo (N6); D2, D3 |
| **B. Core pages and homepage** (spec B) | Homepage rewrite per spec section 5, trimmed to features that exist; `/about`, `/how-it-works`, `/faq`, `/contact`; editorial content and an honest empty state on `/grapes` and `/bulk-wine`; footer and nav. | M–L | D1, D4, D7, D12 (facts and copy) |
| **C. Imagery** (spec C) | Vet, log and optimize images per the spec's workflow; place IMG-1 to IMG-6. I can view candidates; rights can only be checked at the source pages, so licensing evidence is saved per image. | M | D10; your approval of picks |
| **D. Blog system and first batch** (spec D) | Blog engine (front matter, TOC, quick-answer box, FAQ, RSS, `Article` JSON-LD, gated `needs-review` status with sitemap/RSS/noindex exclusion, related-lots module). Batch 1 (lowest fabrication risk, derived from the product): P1, P3, P7, P8, P4. | L | D6; N8 approval |
| **D2. Later batches** | Batch 2: P6, P15, P11, P12, P10 (calculator). Batch 3 (data-dependent, needs live retrieval and dated sources): P5, P9, P14, P2. **P13 (legal) only with a professional reviewer.** | L | Fact-check reviews |
| **E. Landing pages and listing SEO** (spec E) | Capped at 20 landing pages, each with 150+ words of unique copy; indexed only with real content and at least one listing; listing JSON-LD (NDA-safe); sold-listing lifecycle. | M | Copy review |
| **F. Performance and GEO** (spec F) | Lighthouse baseline now and budgets later; lazy-load the long option lists; `llms.txt`; AI-visibility log baseline; extended axe checks. | M | None |
| **G. Alerts** (A1, if D4 says build) | Saved searches, email alerts, unsubscribe, NDA-safe matching. Can run in parallel with D. | M–L | None |
| **Launch hardening** (A3) | Real-device tests, load test, shared rate limiter, backups/monitoring. | M | Some |

**Why this order:** A and 0 need almost nothing from you and remove real defects (duplicate metadata, indexable login pages, a dead footer link). B needs your facts. C and D can then run in parallel. Data-heavy posts wait until the site has a working blog and retrieval has been done properly.

---

## 6. Proposed calendar (replaces the spec's September 21 start)

| When | What |
|---|---|
| This week | Phase 0 decisions; Phase A build and deploy. |
| Next 1–2 weeks | Phase B (as facts arrive), Phase C. |
| Weeks 3–4 | Blog system; Batch 1 posts delivered as `needs-review`; you review and publish 1 to 2 per week. |
| Weeks 5–8 | Batches 2 and 3; landing pages as inventory allows; alerts. |

Publishing dates are set by your approvals, not by the build. The spec's refresh cadence (monthly for P5/P9/P14) is a real ongoing commitment; decide who owns it.

---

## 7. Risks I want you to see

1. **Empty marketplace.** SEO without inventory converts poorly; see A2.
2. **Accuracy and liability.** Price, market and legal claims are the riskiest part of this project. The spec's "no number without a dated source" rule will mean some posts ship with fewer numbers than planned, and P13 should not publish without professional review.
3. **AI-drafted content.** Search engines and AI systems reward original value, not volume. The plan's "original value per post" rule and the aggregated, anonymized listing statistics (once enough listings exist) are what make this worth doing; I'd rather ship 5 excellent posts than 15 thin ones.
4. **NDA.** Every new public surface (sitemap, JSON-LD, OG images, landing pages, related-lots modules, blog embeds) goes through the central serializer and gets canary tests, as the spec requires.
5. **Analytics vs. privacy promises.** See N4 and D5.
6. **Brand risk.** See D1.

---

## 8. What I need from you to start

Minimum to begin **Phase 0 + A**: answers to **D2, D3, D5, D8**, a logo (or permission for me to draft a wordmark), and Search Console/Bing verification tokens (or tell me to leave those to you).
To begin **B**: **D1, D4, D7, D12**.
To begin **D**: **D6** and approval of the blog dependency (N8).

I am waiting for your review and will not start any of this until you tell me which phases to begin.
