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
