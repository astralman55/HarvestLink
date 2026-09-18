# Changelog

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
