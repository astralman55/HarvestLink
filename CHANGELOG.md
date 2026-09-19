# Changelog

## Unreleased — SEO, AI-search, blog, FAQ, wordmark and email alerts

- **Blog:** 15 posts by Andrew L. in `content/blog` (how wine is made, terroir, Napa Valley, bulk wine, buying and selling, sulfites, ABV, brix, farming labels, contracts, and a tons-to-gallons calculator), with a quick answer, table of contents, FAQ, sources, RSS, Markdown copies and generated social cards. Fact-check log: `docs/seo/blog-fact-check-log.md`.
- **FAQ page** (`/faq`) with FAQPage structured data; FAQ and blog teasers on the homepage; editorial guides on /grapes and /bulk-wine.
- **Search and AI readiness (Decision 54):** unique metadata, canonicals, noindex rules, extended robots.txt (welcomes ShapBot, GPTBot, ClaudeBot, PerplexityBot and other search and AI crawlers), preview and duplicate-host noindex, JSON-LD, `/llms.txt`, `/llms-full.txt`, real sitemap dates.
- **Saved searches and email alerts (Decision 55):** save filters, get a daily digest, pause or delete on /alerts, one-click unsubscribe. Requires migration `0009` and the `CRON_SECRET` env var.
- **Security:** state-only confidential lots no longer match county or region filters (an inference leak).
- **Photography (Decision 57):** six vetted stock photos on the homepage (hero, marketplace cards, confidential section, how it works, closing banner), self-hosted as optimized WebP; credits in `docs/image-credits.md`.
- **Brand:** new wordmark, logo mark, favicon and app icon (Decision 56). Removed the unused default Next.js SVGs.
- Added a DMARC record (`p=none`) for `bulkwinegrapes.com` in Vercel DNS.

## Unreleased — NDA hardening and primary domain

- **Forgot password (Decision 53):** "Forgot password?" on the login page -> emailed code (or button) -> choose a new password. Same password rules as signup, breach check, other sessions signed out on success. Requires pasting `supabase/email-templates/reset-password.html` into Supabase's "Reset password" template.
- Migration `0008` applied and verified on the live project (`scripts/audit-public-api.mjs`: no identifying column readable).
- **Account confirmation by emailed code (Decision 51):** signup now goes to `/verify-email` ("Enter the code we sent to your email") and signs the user in on success; the email also has a click-through button (`/auth/confirm`). Logging in with an unconfirmed account sends a fresh code instead of failing. `redirect_to` values are now restricted to same-site paths. Requires the Supabase email-template and Site URL steps in Decision 51. Social sign-in is planned, not built (Decision 52).
- **Security (Decision 46, resolved):** migration `0008_lock_identifying_columns.sql` stops the public API from reading `listings.vineyard_name`, `user_id`, `sub_ava`, raw `region_ava`, `title`, `bulk_wine_details.wine_location_county`, `listing_inquiries.seller_id` and `listing_inquiry_messages.sender_id`. All listing reads now go through the server and the NDA serializer. Rollback: `supabase/rollback/0008_rollback.sql`. Prove it on the live project with `node --env-file=.env.local scripts/audit-public-api.mjs`.
- **Security (Decision 50):** a buyer can no longer resolve a confidential seller through an inquiry thread; the inquiry inbox and notification emails use the serialized title; the realtime new-listing alert no longer broadcasts a confidential listing's region.
- `bulkwinegrapes.com` is now the primary domain (`www.` and the Vercel URL are secondary); `NEXT_PUBLIC_APP_URL` and `metadataBase` point at it. Site description no longer says "B2B".

## Unreleased — Launch prep (legal pages, winemaker, homepage/mobile fixes)

- Added `/terms` (Terms of Service) and `/privacy` (Privacy Policy), linked from the footer and the signup form, and added to the sitemap. Drafts written around what the site actually does -- not legal advice (Decision 48). Set `NEXT_PUBLIC_CONTACT_EMAIL` to show a contact address on both.
- Bulk wine listings can now name the **winemaker**. Stored in a new owner/admin-only table (`listing_winemakers`, migration `0007`, rollback in `supabase/rollback/`) and hidden on every confidential listing (Decision 45). **Run `0007` in the Supabase SQL Editor before using it.**
- Security: confidential listings' public titles are now rebuilt from the redacted region, closing a leak of the free-text "Specific Area" through titles, URLs and the sitemap (Decision 47). Also documented an open gap where existing identifying columns are readable through the raw database API (Decision 46).
- Mobile: the Grapes/Bulk Wine switch and the Log in button no longer disappear on small screens (the switch moves to its own row under the header).
- Homepage: added an "Advanced Search" title above the search form, dropped "B2B" from the badge, made the Sell button a matching outlined pill, added a section about confidential lots from top wineries and winemakers (shown when NDA listings are enabled), and removed a stale "wine location" mention from the bulk wine subtext.
- Cross-browser tested in Chromium, Firefox and WebKit at desktop and 375px widths (Decision 49). Removed 13 unused Supabase/Postgres integration env vars from the Vercel project.

## Unreleased — UI refinements (post-addendum)

Product-owner-requested polish on top of the finished scope addendum, not part of `SCOPE_ADDENDUM_NDA_USERNAME_VINEYARD_BULK_WINE.md` itself.

- Header market switch ("Grapes" / "Bulk Wine") now takes you to the homepage for that market instead of straight to its results grid -- `/` reads a `?market=bulk-wine` query param to decide which hero copy and search form to show (`BulkWineSearchHero`, mirroring `GrapeSearchHero`). `/grapes` and `/bulk-wine` (the actual browse/results pages) are unchanged.
- Homepage hero subtext rewritten without an em dash.
- "Crop Planning" removed from the public header nav -- it's still reachable from the grower dashboard's own sidebar, where it always was.
- Homepage search (both markets) no longer has a free-text "Vineyard Name" field -- the full filter set including vineyard name search is still on `/grapes`'s own browse filters.
- Homepage search's tonnage, price, and brix (grapes) and ABV, price, and quantity (bulk wine) are now drag-to-search dual-handle range sliders (new `Slider` UI primitive on `@radix-ui/react-slider`, `RangeSliderField`) instead of separate min/max number inputs. Added matching `max_tons`/`min_price`/`max_brix` filters (grapes) so the full range is actually queryable, not just the existing single-bound ones.
- "Selling under NDA?" on the listing form is now a highlighted, always-visible amber box with Yes/No buttons instead of a small checkbox, so a decision with real privacy consequences isn't easy to miss. "Is this a single-vineyard offering?" swapped the other way, to a plain checkbox that reveals the name field in its own bordered "vineyard detail" box when checked.

## Unreleased — Scope addendum (NDA listings, usernames, vineyard field, bulk wine)

Per `SCOPE_ADDENDUM_NDA_USERNAME_VINEYARD_BULK_WINE.md`. All new behavior ships behind feature flags (`NEXT_PUBLIC_FEATURE_USERNAMES`, `NEXT_PUBLIC_FEATURE_NDA_LISTINGS`, `NEXT_PUBLIC_FEATURE_BULK_WINE`), default off.

### Phase 0 — Audit
- Added `docs/scope-addendum-audit.md`: full audit of the existing stack, auth, listings schema, and every seller-identity surface, per Section 2 of the addendum.

### Phase 1 — Data model & migrations
- Added `supabase/migrations/0003_scope_addendum_phase1.sql`:
  - `profiles.username` / `username_normalized` (nullable, unique, reserved-name table), forum-ready.
  - `listings.listing_type` (`grapes` | `bulk_wine`, default `grapes`, backfilled), `is_nda`, `nda_location_precision`, `single_vineyard`, `vineyard_name` / `vineyard_name_normalized`.
  - `bulk_wine_details` (1:1 with listings), `farming_practices` + `listing_farming_practices` (bulk wine's own multi-select vocabulary), `nda_audit_log` (trigger-populated), `admin_identity_view_log`, `reserved_usernames` (seeded).
  - RLS policies and normalization triggers for all of the above.
- Added `src/lib/flags.ts` and three `NEXT_PUBLIC_FEATURE_*` env vars.
- Extended `src/types/index.ts` to mirror the new schema (`ListingType`, `NdaLocationPrecision`, `BulkWineDetails`, `PublicProfile`, and the new `Listing`/`Profile` fields); updated `src/lib/demo-data.ts` accordingly.
- Added `docs/scope-addendum-decisions.md` recording judgment calls (deferred `profiles` RLS lockdown to Phase 3, separate bulk-wine farming-practice vocabulary, dedicated `bulk_wine_details` columns over a shared generic quantity/unit pair, env-var feature flags, trigger-based normalization, deferred NDA-7 contact relay).

### Phase 2 — Usernames
- Signup (`/register`) collects a username (behind `NEXT_PUBLIC_FEATURE_USERNAMES`): live rules + debounced availability check (`UsernameField`, `checkUsernameAvailability`), reserved-name + profanity filtering (`obscenity`), password bumped to a 10-128 char minimum with a live Have I Been Pwned breach check (fails open), show/hide password toggle (`PasswordInput`).
- Login (`/login`) accepts email or username; a service-role-only Postgres function (`get_email_for_login`, migration `0004`) resolves the identifier server-side so the email is never exposed to the anon key or the client. Errors are a single generic message regardless of which part was wrong.
- Existing accounts get a one-time blocking "choose your username" step (`/choose-username`) on next login before continuing to their destination; they can keep browsing without one but can't create a new listing until they pick one.
- Added `src/lib/rate-limit.ts` (in-memory, IP-keyed) on signup, login, and the availability check.
- All of the above is inert with the flag off — verified by restarting the dev server in both states.
- Bug caught during live testing (fixed before commit): the availability check ignored Supabase query errors and reported a broken check as "available" instead of blocking it. See `docs/scope-addendum-decisions.md`, Decision 11.

### Phase 3 — NDA listings + central public serializer
- Added `src/lib/serializers/listing.ts` (`serializeListing`, NDA-4): the one function every listing-reading surface goes through, deciding what a given viewer (anonymous/member/owner/admin) is allowed to see. Resolves Phase 0 audit Flags #1 and #2 (profiles RLS lockdown + `profiles_public` view, migration `0005`; the seller's `user_id` is never included in the public shape at all).
- Rewrote `src/lib/data/listings.ts` to fetch raw rows + a batched `profiles_public` lookup and pass both through the serializer, instead of the old unfiltered `select("*, profiles(...))`. `ListingCard` and the listing detail page now consume `PublicListing`, not the raw `Listing` row.
- NDA-1: "Selling under NDA?" checkbox + live "what buyers will see" panel + location-precision choice on the listing form (behind `NEXT_PUBLIC_FEATURE_NDA_LISTINGS`), `NdaFields`.
- NDA-6: free-text leak guard (`src/lib/validation/nda-guard.ts`) blocks the seller's own name/vineyard/email/phone/URL in an NDA listing's description before it can be saved.
- NDA-8: confirmation modals when an existing listing's NDA flag actually changes (`NdaToggleConfirmDialog`); known limitation logged as Decision 16 (URLs are still raw UUIDs, so the old URL can't be rotated/404'd the way the spec describes until slugs exist).
- NDA-9/NDA-10: per-listing reference numbers (`G-xxxxx`) instead of a per-seller id, and a "Preview as a buyer sees it" dialog that runs the real serializer client-side (`NdaPreviewDialog`).
- NDA-11: minimal admin identity view (`/admin/listings/[id]`), gated by role and logged to `admin_identity_view_log`.
- NDA-12: `NdaBadge` (Popover-based, works on touch/keyboard) on cards and the detail page; "Exclude NDA listings" browse filter.
- NDA-7 minimum viable contact relay: `listing_inquiries`/`listing_inquiry_messages` (migration `0005`), `/inquiries` inbox + thread view, replacing the dead "Sign In to Contact Grower" link. No email notifications yet -- flagged as a scope expansion needing a provider decision (Decision 18).
- Fixed a real pre-existing leak: Realtime broadcast full raw listing rows (including `user_id`) to every browser tab via `postgres_changes`; replaced with a `realtime.send()` trigger that only ever sends the three fields the UI actually shows (Decision 14).
- Added the mandatory NDA canary test (Section 8.1) as a Vitest suite against the serializer (`src/lib/serializers/listing.test.ts`, 18 tests) plus a minimal CI workflow (`.github/workflows/test.yml`) so it can never be silently skipped -- first test framework and CI this project has had (Decision 19).
- All of the above is inert with `NEXT_PUBLIC_FEATURE_NDA_LISTINGS` off — verified by restarting the dev server in both states.

### Phase 4 — Vineyard field
- "Is this a single-vineyard offering?" Yes/No toggle + name field (`VineyardField`) in the listing form's "Seller & Source" section, next to the NDA checkbox. No new migration -- Phase 1 already built the full data model for this. Ships live, no feature flag (see Decision 22 for why, unlike the other three requirements).
- `src/lib/validation/vineyard.ts` (`VineyardNameSchema`, VIN-4): length, Unicode-aware character allowlist, and email/URL rejection (reuses the patterns from the NDA-6 guard).
- VIN-5 typeahead: `getVineyardNameSuggestions` + a pure, separately-tested `filterVineyardSuggestions` (`src/lib/serializers/vineyard-suggestions.ts`, 6 new tests) that guarantees another user's NDA vineyard name is never suggested.
- Cards and the detail page show "Vineyard: {name}" (or "name withheld" under NDA) for single-vineyard listings; the NDA preview dialog shows the same line. Two new browse filters: search by vineyard name (excludes NDA listings from matching, per VIN-7) and "Single vineyard only."
- The create/edit Server Actions now null out `vineyard_name` server-side whenever `single_vineyard` is off, regardless of what the form still holds in memory (VIN-2), and include the listing's own (possibly just-typed) vineyard name in the NDA-6 free-text guard's check, not just past listings.
- `serializeListing()`'s vineyard redaction (`vineyard_withheld`, written dormant back in Phase 3) is now genuinely exercised for the first time.

### Phase 5 — Bulk wine marketplace (form, detail page, card)
- New listing type, behind `NEXT_PUBLIC_FEATURE_BULK_WINE`: `/listings/create` now shows a "Sell Grapes / Sell Bulk Wine" chooser (`ListingTypeChooser`) when the flag is on; grapes stays the unchanged default when it's off.
- `BulkWineForm` (`src/components/listings/BulkWineForm.tsx`): grape variety + grape origin (reusing the existing AVA/varietal controls), a separate "Wine Location" section (state dropdown + county text field, never synced with grape origin -- WINE-5), vintage/NV, ABV, total SO₂ with soft over-limit warnings, a 6-value farming-practices multi-select (Demeter auto-checks Biodynamic), quantity/price with a live cents-exact "Total Lot Value," and the same NDA/vineyard sections as grapes (`NdaFields`/`VineyardField`, refactored this phase into plain controlled components so both forms can share them -- Decision 31).
- `serializeListing()` now carries a `bulk_wine` object with its own NDA-aware redaction: wine specs (quantity, price, ABV, SO2, vintage, farming practices) are always public per NDA-3's table, while `wine_location_county` is hidden under NDA "state" precision exactly like grapes' `sub_ava` -- new canary tests (7) covering this, since "NDA works identically on both types" is an explicit acceptance criterion (6.7).
- Cards, the detail page ("Wine Specs" block), and `/listings/mine` all branch on `listing_type` to show gallons/price-per-gal/ABV instead of tons/price-per-ton.
- `createNewBulkWineListing`/`updateBulkWineListing` write across three tables (`listings`, `bulk_wine_details`, `listing_farming_practices`) with a compensating delete if a child insert fails (Decision 28) -- no ORM/transaction support exists in this app to do it more atomically.
- Migration `0006`: a second realtime broadcast trigger, on `bulk_wine_details` rather than `listings`, since quantity/price don't exist yet at the moment a bulk-wine `listings` row is first inserted (Decision 30) -- everything else bulk wine needed was already built in Phase 1.
- Phase 5 deliberately does *not* include the `/grapes`, `/bulk-wine`, `/sell` routes, the header nav switch, URL redirects, or bulk-wine-specific browse filters (ABV/price/quantity range, max sulfites) -- those are Phase 6's explicit scope per the addendum's own delivery-plan table (Decision 26).

### Phase 6 — Nav, routing, browse filters, cross-cutting sweep
- New canonical routes: `/grapes` and `/bulk-wine` (browse, each with their own filter panel and sort), `/grapes/[slug]` and `/bulk-wine/[slug]` (detail, `{kebab-title}-{id}`), `/sell` (chooser, public), `/sell/grapes` and `/sell/bulk-wine` (the actual create forms, protected, no more embedded chooser).
- Old URLs keep working: `/listings` → `/grapes` and `/listings/create` → `/sell/grapes` are true 301s (`next.config.ts`); `/listings/{id}` → the correct canonical section (a runtime `listing_type` lookup, so it's a page-level `permanentRedirect()` / 308 instead -- Decision 34). Visiting a detail page by bare id (no slug) also self-redirects to the canonical slugged URL.
- `BulkWineFilterFields`/`BulkWineFilterPanel`: the full 6.5 filter set (vintage, grape origin, wine location, ABV/price/quantity ranges, farming-practice any-of, max sulfites, single vineyard, NDA include/exclude) plus sort (newest/price/quantity/ABV). `getListings()` now takes a `listing_type` scope and filters/sorts on the embedded `bulk_wine_details` table via `!inner` joins.
- Header: persistent Grapes/Bulk Wine switch (`Navbar`, behind the flag) replacing the single "Browse Grapes" link; a single "Sell" CTA replacing "Sell Your Harvest." Homepage gets two equal entry-point buttons plus the Sell CTA above the existing search hero.
- Added this project's first sitemap (`src/app/sitemap.ts`), `robots.ts`, and per-listing `generateMetadata()` (title/description/canonical/OG) -- all new, not retrofits, and NDA-safe by construction since titles/descriptions were already safe-by-design (Decision 37).
- Deleted the now-unreachable chooser-embedded `(dashboard)/listings/create/page.tsx` and its wrapper; the two dedicated `/sell/*` routes replace it.
- All of the above is inert with `NEXT_PUBLIC_FEATURE_BULK_WINE` off — verified by restarting the dev server in both states, including that "Bulk Wine" doesn't appear anywhere in the rendered homepage HTML when dark.

### Phase 7 — Hardening
- Canary test extended to the surfaces Phase 6 added: `src/lib/listing-metadata.test.ts` and `src/app/sitemap.test.ts` mock the data layer with a canary NDA listing (grapes and bulk wine) and assert the per-listing metadata (title/description/canonical/OG) and the sitemap never leak the seller. The serializer-level canary (`listing.test.ts`) already covered bulk wine as of Phase 5; its fixtures are now shared via `src/lib/serializers/canary-fixtures.ts` instead of duplicated.
- Accessibility pass (axe-core against every page Section 8.2 names, plus a scripted keyboard-only pass) found and fixed three real bugs: unlabeled filter `<Select>`/`<Input>` fields on both browse pages (critical -- no accessible name at all), a `<button>` wrapping an `<input type="radio">` on the register page (an invalid nested-interactive pattern), and app-wide `text-stone-400` label text failing WCAG AA color contrast (~15 places, bumped to `text-stone-500`). All ten scanned pages (signup, login, both browse pages, both listing forms, a detail page of each type, the sell chooser, the homepage) are clean after the fixes. Full writeup: `docs/scope-addendum-decisions.md`, Decision 40.
- Mobile/tablet verified at 375px/768px/1280px on six pages plus a listing detail page -- no horizontal overflow anywhere.
- Security review (Decision 42): fixed `register/actions.ts` mislabeling *any* signup failure (invalid email, rate limit) as a username collision instead of just the one failure mode that actually is one; added `/admin` to the middleware's protected-route list for defense-in-depth; added rate limiting to the inquiry message-sending actions, which had none.
- Rollback scripts for migrations 0003-0006 added under `supabase/rollback/` (written and reviewed, not rehearsed against a live database -- see the README there and Decision 43).
- `npm run build` reviewed for performance: clean, no new warnings, all routes in the 103-250 KB First Load JS range (Decision 44).
- Added `docs/how-to-test-manually.md` (Definition of Done's required manual-testing note) and this Phase 7 write-up.
