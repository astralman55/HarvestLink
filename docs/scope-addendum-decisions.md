# Scope Addendum: Architectural Decisions

Per Section 0.6 of `SCOPE_ADDENDUM_NDA_USERNAME_VINEYARD_BULK_WINE.md`: places where the spec left room for judgment, the choice made, and why. Flag any of these to the project owner if a different call is wanted — nothing here is set in stone.

---

### Decision 1 — Profiles RLS lockdown is deferred to Phase 3, not done in Phase 1

**Audit finding:** `public.profiles` currently has `for select using (true)` with no column restriction (`0001_init.sql:108`). Combined with `src/lib/data/listings.ts` embedding `profiles(company_name, region_ava, is_verified)` via PostgREST's FK-based join, this means the anon key can technically `select *` on any profile row today — including `contact_phone` and `address` — regardless of what the app's own queries request.

**Why not fixed in Phase 1:** Tightening the RLS `select` policy to `auth.uid() = id` (self-only) would immediately break the *existing* public marketplace, because the embedded `profiles(...)` join in `getListings`/`getListingById` would start returning null for every listing not owned by the viewer — anonymous buyers would stop seeing grower company names at all. That's a regression to current behavior, which the addendum's ground rules forbid ("Existing listings... must keep working").

**Decision:** Bundle the RLS lockdown with Phase 3 (the central public-listing serializer required by NDA-4), where `listings.ts`'s data-fetching is being rewritten anyway. The plan for that phase:
- Restrict `profiles` base-table `select` RLS to `auth.uid() = id` (or admin).
- Add a `profiles_public` view (default `security_invoker = false`, so it runs with the view owner's rights and isn't blocked by the tightened base-table RLS) exposing only the safe columns: `id, company_name, region_ava, is_verified, username`.
- Change the listing data layer to fetch `profiles_public` rows for card/detail display (a second batched query, not a PostgREST embed — view-embedding through PostgREST's FK inference is fragile enough that an explicit fetch is safer and is also what NDA-4's "one central serializer with viewer context" needs anyway, since NDA listings must suppress the seller row entirely rather than just narrowing its columns).

Until Phase 3 lands, this is a known, documented pre-existing exposure — not newly introduced by this addendum, but worth prioritizing.

---

### Decision 2 — Bulk wine gets its own 6-value multi-select farming-practices vocabulary; grapes' existing 4-value enum is untouched

**Audit finding:** `listings.farming_practice` already exists (`conventional | sustainable | organic | biodynamic`, single-select enum, `0001_init.sql:12`). The addendum's bulk-wine spec (WINE-6) requires a different 6-value, multi-select list (`organic, biodynamic, natural, sustainable, regenerative_organic, demeter_certified_biodynamic`).

**Decision:** This is exactly the addendum's own Open Question 6, whose stated safe default is: "Shared lookup created. Grapes form untouched unless approved." Implemented that literally — new `farming_practices` lookup table + `listing_farming_practices` join table, used only by bulk wine. The grapes `farming_practice` enum column is unchanged. If the project owner wants the two unified later, that's a separate, explicitly-approved migration (would need to decide whether to migrate existing grape listings' single value into the join table, and whether grapes moves to multi-select too).

---

### Decision 3 — Bulk wine's quantity/price live on a dedicated `bulk_wine_details` table with named columns, not a shared generic `quantity`/`price_amount` + unit-tag column

**Spec's conceptual model (Section 7.1)** sketches `quantity`/`quantity_unit` and `price_amount`/`price_unit` as generic columns shared across types. The existing schema instead uses named, type-specific columns (`estimated_tons`, `price_per_ton`) with no unit column at all — the unit is implicit in the column name.

**Decision:** Followed the spec's own guidance ("adapt to existing conventions... prefer whichever is least invasive"). `listings.estimated_tons`/`price_per_ton` stay exactly as-is for grapes. Bulk wine's `quantity_gallons`/`price_per_gallon` live on the new 1:1 `bulk_wine_details` table alongside its other type-specific fields (ABV, SO2, vintage, wine location). This satisfies WINE-7's "bulk wine can't use tons, grapes can't use gallons" requirement structurally — the gallon columns don't exist on a grapes row at all — rather than via a CHECK constraint against a shared unit-tag value.

A trigger (`check_bulk_wine_listing_type`) enforces that a `bulk_wine_details` row can only reference a listing whose `listing_type = 'bulk_wine'`. The inverse invariant (every `bulk_wine` listing *must* have a details row) is left as an application-layer guarantee for Phase 5: the create-listing Server Action will insert both rows in the same request. Revisit with a stricter DB-level constraint (e.g. deferred FK/trigger) if that invariant ever needs to be bulletproof against non-app writers.

---

### Decision 4 — Feature flags are environment variables, not a database table

**Spec:** "Ship behind feature flags: `feature.nda_listings`, `feature.bulk_wine`, `feature.usernames`. Merge dark, enable per environment."

**Decision:** No admin UI or DB-backed config system exists in this app yet, and the project's existing convention for environment-specific toggles is `.env.local`/`.env.example` (Supabase keys, Google Maps key). Added three `NEXT_PUBLIC_FEATURE_*` env vars and a typed `src/lib/flags.ts` helper instead of a new `feature_flags` table. This matches "merge dark, enable per environment" exactly (flip the var per Vercel environment) with far less new infrastructure. If per-user or runtime-toggleable flags are ever needed (e.g. enabling NDA for one admin account before a full rollout), that would justify moving to a DB table later — not needed for this rollout.

---

### Decision 5 — Username normalization and vineyard-name normalization are enforced by DB triggers, not application code alone

**Why:** Ground Rule: "Server is the source of truth... never rely on hiding something in the UI." Both `username_normalized` (lowercase) and `vineyard_name_normalized` (lowercase, accents/punctuation stripped, per VIN-4) are computed by `before insert or update` triggers on the respective tables, so the normalized value can never drift out of sync with the display value regardless of which code path writes the row (Server Action today, admin tooling or a script later). The `unaccent` Postgres extension is enabled for this.

---

### Decision 6 — NDA-7's contact/inquiry relay: not built in Phase 1

Per the audit, no messaging/contact system exists at all today ("Sign In to Contact Grower" is a dead link to `/login`). Per NDA-7's own instruction, building this is flagged as a scope expansion to raise with the project owner before implementing beyond the minimum described (buyer submits inquiry → seller notified by email with a link to reply on-site → replies relayed without exposing the seller's email). No schema for this was added in Phase 1; it lands in Phase 3 alongside the rest of Requirement 1, and needs an email provider decision first (none is currently configured — see audit 2.1).
