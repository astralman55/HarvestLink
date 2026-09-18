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
