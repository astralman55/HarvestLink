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

**Status: resolved in Phase 3.** Implemented exactly as planned above (migration `0005`): `profiles` select RLS is now self/admin-only via an `is_admin()` helper (avoids RLS self-reference recursion), `profiles_public` exposes the safe columns to everyone, and `src/lib/data/listings.ts` batch-fetches it separately rather than via PostgREST embedding, feeding both the raw row and the safe profile into `serializeListing()`.

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

---

## Phase 2 (Usernames)

### Decision 7 — Login-by-username resolves the email server-side via a service-role-only Postgres function, not a new RPC exposed to the anon key

**Problem:** Supabase Auth's `signInWithPassword` only accepts an email. USR-6 wants login by email *or* username, and USR-9 requires the email is "never exposed through any username lookup" — including to a caller hitting Supabase's REST API directly, not just through this app's own UI.

**Decision:** Added `public.get_email_for_login(identifier)` (migration `0004`, `SECURITY DEFINER`), with `EXECUTE` revoked from `anon`/`authenticated` and granted only to `service_role`. The login Server Action (`src/app/(auth)/login/actions.ts`) calls it through a new server-only admin client (`src/lib/supabase/admin.ts`, `SUPABASE_SERVICE_ROLE_KEY` — already documented in `.env.example`/`.env.local` but unused until now) to resolve a username to its account's email, then calls the normal `signInWithPassword` exactly as before. This preserves GoTrue's own password verification, session issuance, and behavior entirely; the function only does the identifier→email translation, and can't be reached by anyone who only holds the anon key. Considered and rejected: reimplementing password checks in SQL against `auth.users.encrypted_password` (a known pattern via `pgcrypto`'s `crypt()`) — works, but throws away Supabase Auth's own verification/session logic for a login-by-username convenience that doesn't need it.

A fixed dummy email (`no-such-account@harvestlink.invalid`) is used when the identifier doesn't resolve, so a failed sign-in still calls `signInWithPassword` on *something* — keeping response timing similar whether or not the username exists, as a secondary defense against username enumeration via timing.

### Decision 8 — Rate limiting is in-memory, not a shared store

USR-1 (availability check) and USR-6 (login attempts) both want rate limiting. No Redis/Upstash is configured. Added `src/lib/rate-limit.ts`: a fixed-window counter in a module-level `Map`, keyed by client IP (from `x-forwarded-for`/`x-real-ip`) + action name. This is a real deterrent for a single dev/small-scale deployment but is **not** correct once this app runs on multiple serverless instances or regions (each instance has its own Map, so the effective limit multiplies by instance count, and it resets on every redeploy/cold start). Flagged directly in the file's own doc comment. Revisit with Upstash Redis (or similar) before/at the point this ships on infrastructure that scales horizontally — there's no Vercel deployment yet (per the Phase 0 audit), so this hasn't mattered until now.

### Decision 9 — Password breach checking (HIBP) implemented; profanity filtering via the `obscenity` package

Both USR-5 ("reject passwords found in known-breach lists") and USR-4 ("apply a profanity/offensive-term filter") are phrased as SHOULD, with the spec's own rule being "do it unless you have a documented reason not to." Implemented both:
- `src/lib/password-breach.ts` calls the Have I Been Pwned k-anonymity range API (only a 5-character SHA-1 prefix ever leaves the server; the password itself never does). Fails open (never blocks signup) on any network/API error, verified live against the real API during Phase 2 testing.
- `src/lib/profanity.ts` wraps `obscenity` (MIT-licensed, purpose-built for exactly this, actively maintained), which also normalizes leetspeak/spacing tricks before matching. Verified live against known test strings.

### Decision 10 — Dark-launch gating is concentrated at trigger points, not scattered through every new file

Ground Rule: "Ship behind feature flags... merge dark, enable per environment." Rather than sprinkling `if (flags.usernames)` through every new function, gating was concentrated at the handful of places that actually change externally-visible behavior: the `RegisterSchema`'s `superRefine` (username only required/validated when the flag is on), the register/login page's conditional UI (username field shown, login label/type switches between "Email" and "Email or Username"), and the three points that would force existing users through the migration step (`login` action's `needsUsername`, the `/listings/create` page's redirect, and `/choose-username` itself redirecting away if the flag is off). Verified live with the dev server restarted in both states (`NEXT_PUBLIC_FEATURE_USERNAMES=false` shows zero trace of the username field/copy; `=true` shows the full flow) -- see CHANGELOG for what was checked.

One accepted minor UX regression while the flag is off: the login field's Zod validation (`LoginSchema.identifier`) is a bare non-empty-string check rather than `z.string().email()`, since it must also accept a username once the flag is on. With the flag off, a malformed email now surfaces as the generic "incorrect email/username or password" error instead of a specific "invalid email address" formatting error (the HTML `type="email"` attribute still restores native browser validation in that state, which covers most of the gap). Not worth a second parallel schema for what's meant to be a temporary dark period.

### Decision 11 (bug caught during live testing, fixed before commit) — the availability check was silently reporting DB query errors as "available"

`checkUsernameAvailability` destructured only `data` from its two Supabase queries (`reserved_usernames`, `profiles.username_normalized`) and never checked `error`. Live-tested against the real Supabase project *before* migration `0003`/`0004` were applied there (so the queries genuinely errored, missing table/column) — the function fell through both `if (reserved)`/`if (taken)` checks (both `null` on error) and returned `{ available: true }`. That's the dangerous direction: a broken check silently approving a username instead of blocking it. Fixed by checking each query's `error` and throwing into the existing catch block, which returns `{ available: false, reason: "Couldn't check availability right now..." }` instead. Caught by testing against the live (not-yet-migrated) database rather than by code review -- worth remembering that Supabase JS query errors don't throw, they return an `error` field that's easy to silently ignore if only `data` is destructured.

---

## Phase 3 (NDA listings + central serializer)

### Decision 12 — Grapes' location precision ("county"/"state") maps onto region_ava/sub_ava, since there are no county/state columns to reduce

The spec's WINE-5/NDA-3 assume a location that can be reduced to "county" or "state." Grapes listings only ever had `region_ava` (an AVA name, e.g. "Napa Valley") and `sub_ava` (e.g. "Atlas Peak") -- no county or state column exists on `listings` (only on the new `bulk_wine_details.wine_location_state/county`, which is a different field entirely -- see WINE-5, "where the wine is stored" vs. grape origin).

**Decision:** For grapes, `nda_location_precision = 'county'` shows `region_ava` and hides `sub_ava` (the AVA is the "broad" tier, the sub-AVA is the "narrow" tier); `'state'` additionally generalizes `region_ava` itself down to the state the AVA sits in, via a new `getStateForRegion()` helper in `src/lib/constants/viticulture.ts` (a lookup over the existing `AVA_REGIONS` data, which already tags every AVA with its state). Implemented in `serializeListing()`. This will need revisiting once bulk wine (Phase 5) lands its own real `wine_location_state`/`wine_location_county` columns, which map onto the spec's literal "county"/"state" concept directly.

### Decision 13 — Reference numbers (NDA-9) are computed from the listing's own UUID, not a database sequence

NDA-9 wants a per-listing reference (e.g. `G-10482`) instead of a per-seller anonymous ID, specifically so buyers can't correlate one seller's multiple NDA listings. Rather than adding a sequence/counter column, `computeReferenceNumber()` in `src/lib/serializers/listing.ts` derives it deterministically from the listing's existing UUID (`G-` or `W-` + the first 5 hex characters, uppercased). This needs no new schema, is already unique (it's derived from a UUID), and is pure/stateless so it works identically in the client-side NDA preview dialog (Decision 15) without a round trip.

### Decision 14 — Realtime now broadcasts a hand-picked payload instead of raw postgres_changes rows

Resolves Phase 0 audit Flag #8. `useRealtimeListings.ts` only ever rendered `variety`/`estimated_tons`/`region_ava`, but the underlying `postgres_changes` subscription sent the *entire* raw row (including `user_id`, and eventually `vineyard_name`) into every subscribed browser tab regardless. Fixed via a `realtime.send()` broadcast trigger (migration `0005`) that hand-picks exactly those safe fields, and the table was dropped from the `supabase_realtime` publication so no other client can get the raw row either. This is, structurally, a second small "serializer" -- but it lives in SQL because the broadcast trigger fires inside the same transaction as the insert and Realtime's broadcast-from-database feature only takes a payload built in SQL. It doesn't need `is_nda` branching: all three broadcast fields are already in NDA-3's "everyone can see" row.

### Decision 15 — The NDA preview (NDA-10) runs the real serializer client-side, not a server round trip

`serializeListing()` is a pure function with no I/O (no `createClient()`, no `fetch`), so `NdaPreviewDialog` imports and calls it directly in the browser against a synthetic `Listing` row built from the current form values, as an anonymous viewer. This satisfies NDA-10's requirement literally ("rendered through the *real* public serializer, not a hand-built mock") without needing a server action + loading state just to preview form values the browser already has.

### Decision 16 — NDA-8's "old URL 404s, never redirects" isn't achievable yet -- flagged, not silently skipped

Listing URLs are still the raw UUID (`/listings/{id}`, Phase 0 audit -- no slugs exist anywhere in the app yet; that's WINE-2, Phase 5/6 work). Because the ID never changes, toggling NDA on an existing listing cannot mint a new anonymized URL and 404 the old one the way the spec describes for a slug-based system. What *does* happen now: the confirmation modals (Appendix A copy) run, the audit log records the change (trigger, migration `0003`), all `revalidatePath` calls fire so cached copies are dropped, and the page at that same URL immediately starts rendering through the redacted path. The gap: anyone who saw the un-redacted page before and revisits the identical URL can trivially notice it's now confidential and infer why -- there's no way to close this without a URL change, which needs slugs. Revisit when Phase 5/6 add them.

### Decision 17 — Free-text guard doesn't scan the title, only the description

Resolves Phase 0 audit Flag #3. `listings.title` is always server-generated from controlled fields (`generateListingTitle(variety, clone, region)` -- variety/clone/region all come from fixed lookup lists, never seller-typed text), so it's structurally incapable of containing an identity string. NDA-6's free-text guard (`src/lib/validation/nda-guard.ts`) therefore only runs against `description`, the one genuinely seller-authored field today.

### Decision 18 — The contact relay stores buyer/seller messages in-app; no email notifications yet

NDA-7's own instruction is to build the minimum relay and flag anything beyond it. Built: `listing_inquiries`/`listing_inquiry_messages` (migration `0005`), one thread per buyer per listing, RLS-scoped to participants (+ admin), with `seller_id` derived server-side by trigger (never trusted from the client). A new `profiles_inquiry_counterpart` view lets each side see the other's name-only fields (company_name/full_name -- no phone/address/email) without broadening the general-public `profiles_public` view, gated to only rows where the caller actually shares an inquiry with that person. On an NDA listing, the buyer's view of the thread always labels the seller "Confidential Seller," even though the underlying relay correctly routes to the real seller.

**Flagged as a scope expansion needing a decision:** there is still no email provider configured (Phase 0 audit), so sellers/buyers are only notified of a new message by visiting `/inquiries` -- no "you have a new message" email goes out. Per the system's own integration guidance, picking a provider (Resend, Postmark, etc.) means loading the `marketplace` skill and provisioning a real account before writing code, which is a real scope/cost decision for the project owner, not something to default into silently.

### Decision 19 — The canary test (Section 8.1) runs as a Vitest unit suite against the serializer, not a full browser E2E test

No test framework, browser test runner, or CI existed before this phase (Phase 0 audit). Rather than standing up the full E2E harness Section 8.1 describes (fetching every surface -- sitemap, feeds, JSON-LD, image metadata, emails -- as anonymous/other-user/owner/admin) when most of those surfaces don't exist yet in this app, the canary test targets the one place ALL of that redaction logic actually lives: `serializeListing()` (NDA-4 explicitly calls this "the most important requirement" for exactly this reason). `src/lib/serializers/listing.test.ts` constructs an NDA listing with unmistakable canary strings and asserts they never appear in the output for an anonymous or other-logged-in viewer, do appear for the owner/admin, and that the seller's internal `user_id` never appears at all. Wired into CI (`.github/workflows/test.yml`, runs on every push/PR) so it can't be silently skipped. As real surfaces get built (search, sitemap, images, email), extend this test to cover them rather than starting a second canary suite.

### Decision 20 — The admin identity view (NDA-11) is one page, not an admin console

No admin infrastructure exists at all yet (Phase 0 audit -- the `admin` role exists in the enum but nothing gates on it anywhere). Built the minimum NDA-11 asks for: `/admin/listings/[id]`, gated by `profiles.role = 'admin'` (redirects non-admins to `/dashboard`), shows the real seller identity for an NDA listing, and writes one row to `admin_identity_view_log` per view. No listing/moderation console, no way to browse to it except by URL (an admin would need the listing ID) -- broader admin tooling is out of scope until the project owner asks for it.

---

## Phase 4 (Vineyard field)

### Decision 21 — No new migration needed

Phase 1's migration (`0003`) already added `listings.single_vineyard`, `vineyard_name`, `vineyard_name_normalized`, the CHECK constraint requiring `vineyard_name` to be null when `single_vineyard` is false, and the normalization trigger (lowercase, accents/punctuation stripped via `unaccent`) -- built forward-looking specifically for this phase. Phase 4 is UI, validation, and query logic only.

### Decision 22 — The vineyard field ships without its own feature flag, unlike the other three requirements

The spec's own Ground Rules table names exactly three flags for its four requirements: `feature.nda_listings`, `feature.bulk_wine`, `feature.usernames` -- Requirement 3 (vineyard) has no listed flag, and Phase 4's own delivery-plan row ("Vineyard field (Req. 3) incl. typeahead and NDA interplay | Vineyard criteria met") doesn't mention one either. Read this as deliberate: the field is purely additive (an optional Yes/No question defaulting to No, with no auth/security blast radius), builds entirely on infrastructure Phase 1 and Phase 3 already shipped and tested (the DB constraints, the normalization trigger, and `serializeListing()`'s `vineyard_withheld` handling, which was written NDA-aware from the start even though it stayed dormant until this phase). It ships live rather than dark. If this reading is wrong, it's a small, contained change to gate (`VineyardField` in `ListingForm.tsx`, `getVineyardNameSuggestions`, and the two new browse filters in `ViticultureFilterFields.tsx`).

### Decision 23 — Vineyard-name character-set validation lives only in Zod, not also as a DB CHECK constraint

Username format (Phase 2) is enforced both in Zod and as a DB CHECK constraint, as defense in depth. Considered doing the same for `vineyard_name`'s VIN-4 character allowlist (Unicode letters/numbers/spaces + `' . , - & ( ) # /`), but Postgres's native regex engine doesn't have a reliable Unicode-aware `\p{L}`-style letter class the way JavaScript does (`\p{L}` with the `u` flag) -- its POSIX character classes like `[[:alpha:]]` depend on the database's locale/collation in ways that are easy to get subtly wrong, and a wrong DB-side regex would silently reject legitimate accented vineyard names (e.g. "Clos Pégase") with a confusing generic constraint-violation error instead of Zod's specific, friendly message. Since there's no other insert/update path for listings besides the two Server Actions (both of which validate with the same `VineyardNameSchema` before ever reaching the database), Zod alone is the correct trust boundary here. The length (2-100) and single-vineyard-consistency CHECK constraints from Phase 1 remain as the DB-level backstop for the parts that don't need locale-sensitive regex.

### Decision 24 — Vineyard-name search excludes NDA listings unconditionally, even for their own owner browsing publicly

VIN-7 requires "searching 'Smith Vineyards' must not surface an NDA listing from Smith Vineyards" -- implemented in `getListings()` by ANDing `is_nda = false` onto the query only when a `vineyard_name` search term is present (general browsing is unaffected). This is enforced in the SQL query itself, before the per-viewer serializer ever runs, so it applies uniformly regardless of who's searching -- including the listing's own owner searching the public marketplace. A grower who wants to find their own NDA listing has `/listings/mine` for that; the public search page correctly treating "searchable by vineyard name" as mutually exclusive with "confidential" was judged more important than that small convenience.

### Decision 25 — Typeahead matches the raw `vineyard_name` column with `ilike`, not the normalized column

VIN-5's suggestions are explicitly "non-binding" and best-effort. Rather than reimplementing the DB trigger's `unaccent` + strip-non-alphanumeric normalization algorithm in JavaScript just to search `vineyard_name_normalized`, `getVineyardNameSuggestions()` does a case-insensitive substring match (`ilike`) against the plain display column. This won't catch every accent/punctuation variant (typing "Tokalon" won't suggest "To Kalon"), but it's simple, has no risk of drifting out of sync with the DB's own normalization logic, and still satisfies the requirement's actual purpose (reducing *spelling* variants for a still-free-text field, not guaranteeing exact-normalized recall). The privacy rule (VIN-5's real MUST) is independent of this choice and is covered by `filterVineyardSuggestions()` and its dedicated tests regardless of which column is searched.

---

## Phase 5 (Bulk wine marketplace)

### Decision 26 — Phase 5 scope is the form, detail page, and card only -- not routes, nav, or browse filters

The addendum's own Section 9 delivery-plan table splits Requirement 4 across two phases: Phase 5's checkpoint is "create flow, form, detail page, card, farming lookup, sulfites, location | Form + detail complete," while Phase 6 owns "Browse/filter/search/**nav** for both sections... **URL redirects**." WINE-2's `/grapes`, `/bulk-wine`, `/sell`, `/sell/grapes`, `/sell/bulk-wine` routes and WINE-3's header Grapes/Bulk Wine switch are read as Phase 6 work, along with the bulk-wine-specific browse filters in Section 6.5 (ABV/price/quantity range, max sulfites, farming-practice any-of). Bulk wine listings can be created and viewed starting this phase, but only through the existing `/listings/create` (behind a new type chooser) and `/listings/[id]` routes -- they show up mixed into the single `/listings` browse page alongside grapes until Phase 6 splits it. This is a deliberately honest interim state, not an oversight.

### Decision 27 — Wine location's "county" is a plain text field, not a full State→County dependent dropdown

WINE-4's table describes "Two dependent dropdowns: State → County/Region." A reliable, complete US county dataset (~3,000 entries, changes occasionally) doesn't exist anywhere in this app, and none of the addendum's other location fields use counties at all (grapes uses AVA/sub-AVA). Built `wine_location_state` as a real controlled dropdown (the 50-state list is small and static, `src/lib/constants/bulk-wine.ts`) and `wine_location_county` as a validated free-text field (length 2-100, same character-allowlist spirit as the vineyard name) rather than embedding and maintaining a large, rarely-updated reference dataset for comparatively low value. If a real county dataset becomes available later, swapping the input for a dependent `<Select>` is a contained, non-breaking change (the column already just stores a string).

### Decision 28 — Multi-table listing creation uses a compensating delete, not a database transaction or RPC

A bulk wine listing spans three tables (`listings`, `bulk_wine_details`, `listing_farming_practices`) with no natural single INSERT. This app has no ORM, no RPC layer, and no transaction support in its Supabase usage anywhere (Phase 0 audit) -- introducing one just for this would be a real architectural departure. `createNewBulkWineListing`/`updateBulkWineListing` insert the parent `listings` row first, then the child rows; if either child insert fails, the action deletes the just-created `listings` row before returning an error, rather than leaving an orphaned bulk-wine listing with no details row (the invariant flagged as an open item back in Decision 3, Phase 1). This is best-effort compensation, not a true transaction -- a crash between the parent insert and the compensating delete (vanishingly unlikely, but possible) could still leave an orphan. Acceptable for now; revisit if this becomes a real operational problem.

### Decision 29 — Grapes-only columns get placeholder zero values on a bulk-wine row, rather than making them nullable

`listings.estimated_tons`, `minimum_tons`, `price_per_ton`, `farming_practice`, and `harvest_year` are all `NOT NULL` (migration `0001`). Making them nullable to accommodate bulk wine would be a wider, backward-incompatible-feeling schema change touching the original grapes columns for every existing row. Instead, a bulk-wine `listings` row stores `0`/`'conventional'`/the vintage year (or current year for NV) in these columns -- they're never read for a bulk-wine row (the UI and `serializeListing()` branch on `listing_type` and read `bulk_wine_details` instead), matching the "structurally separate, not a shared unit-tagged column" approach already taken in Decision 3.

### Decision 30 — The realtime "new yield" broadcast needed a second trigger, on `bulk_wine_details`, not just `listings`

Migration 0005's broadcast trigger fires `AFTER INSERT ON listings` and only knew grapes' `estimated_tons`. For a bulk-wine listing, `quantity_gallons` doesn't exist at that instant -- `bulk_wine_details` is inserted in a second statement, right after, from the Server Action. Caught by reasoning through the insert sequence (not live-observed, since I don't have credentials to create a real bulk-wine listing against the live project) rather than by testing; added `bulk_wine_details_broadcast_new_listing` (migration `0006`) to broadcast once quantity/price actually exist, and made `useRealtimeListings.ts` branch on the payload's `listing_type`. This is the one genuinely new migration Phase 5 needed -- everything else (`bulk_wine_details`, `farming_practices`, `listing_farming_practices`) was already built in Phase 1.

### Decision 31 — `NdaFields` and `VineyardField` were refactored to plain controlled props

Both components were built in Phases 3-4 typed directly against `Control<CreateListingInput>` (react-hook-form's grapes-schema type). Reusing them from `BulkWineForm` -- which has its own, differently-shaped `CreateBulkWineListingInput` -- meant either fighting react-hook-form's generics across two schemas or decoupling the components from any specific form shape. Chose the latter: both now take plain `value`/`onChange`-style props (matching the existing pattern already used by `UsernameField` and `AddressAutocomplete`), and each form wires them via its own `watch`/`setValue` calls. No behavior change for the grapes form; this is what made sharing the NDA/vineyard UI across both listing types possible without duplicating either component.

### Decision 32 — `/listings/mine` got a type label and unit-aware summary line now, ahead of Phase 6's official "type-aware sweep"

Section 6.6 lists "'My listings' dashboard (add type label + filter)" as Phase 6 work. Left unfixed, a grower who published a bulk-wine listing in this phase would see their own listing on their own management page captioned with grape units ("... 0.0 tons · $0/ton") -- a real, immediately-visible defect directly caused by this phase's own change, not a pre-existing one. Fixed the type badge and the summary line's units now; left the *filter* (browsing/narrowing by type) for Phase 6 as planned, since that's additive UI rather than a correctness fix.

---

## Phase 6 (Nav, routing, browse filters, cross-cutting sweep)

### Decision 33 — Listing id parsing anchors on two known id shapes (UUID length, and the demo-N pattern), not a generic delimiter

WINE-2's `/grapes/{slug}-{id}` puts the id at the end of a hyphenated string, but the id itself (a UUID) also contains hyphens, so a naive split on `-` can't tell slug from id. `parseListingIdFromSlugParam()` (`src/lib/utils.ts`) instead anchors on the fact that a real id is always exactly 36 characters (a UUID's fixed string length) and takes the last 36 characters as a candidate, validating it against the UUID shape. Demo-mode ids (`DEMO_LISTINGS`, used only when no real Supabase project is reachable) don't fit that pattern, so they're matched by a second, explicit `demo-\d+$` pattern. Caught while building this, not via live testing: an early version only handled the UUID case, which would have 404'd every demo-listing card's own slugged link (`buildListingSlugPath` always appends the real id, slug and all, so a demo click would never have resolved back to itself). Fixed before it shipped.

### Decision 34 — Old-URL redirects split between next.config.ts (static, true 301) and a page-level permanentRedirect() (dynamic, 308)

`/listings` → `/grapes` and `/listings/create` → `/sell/grapes` don't depend on anything beyond the URL itself, so they're declared in `next.config.ts`'s `redirects()` with `permanent: true`, which Next.js serves as a real 301 in production. `/listings/{id}`'s target depends on that listing's `listing_type` -- a database lookup next.config.ts's static rules can't express -- so it's handled in the route itself via `permanentRedirect()` from `next/navigation`, which issues a 308 (the modern, method-preserving equivalent of a 301; for the GET requests these are, browsers and crawlers treat 301 and 308 identically for link-equity/caching purposes). Both are "301 redirects" in the spec's intended sense even though the literal status code differs between the two mechanisms.

### Decision 35 — No unified "global search" box; WINE-3's type tabs + counts apply to /grapes and /bulk-wine's own filter panels instead

WINE-3 describes "global search returns results with type tabs and counts ('Grapes (24) | Bulk Wine (7)')," implying a single search surface spanning both sections. This app has never had a free-text/global search at all (Phase 0 audit) -- browsing has always meant structured filters landing on a results page, and that page has always been section-specific once Phase 6 split it into `/grapes` and `/bulk-wine`. Built the header's persistent Grapes/Bulk Wine switch (WINE-3's other, literal requirement) instead of a combined search-with-tabs UI; a buyer moving between sections uses that switch, not a shared search box with tabs. Revisit if/when a real global search is built.

### Decision 36 — FilterPanel and BulkWineFilterPanel are separate components, not one generalized one

Grapes' filters (region, variety, farming practice, trellis, soil, exposure, slope, brix) and bulk wine's (vintage, grape origin, wine location, ABV/price/quantity ranges, farming-practice multi-select, max sulfites) share almost no fields in common beyond variety and NDA/vineyard toggles. Rather than building one filter panel parameterized by listing type (which would need most of its internals branching anyway), `BulkWineFilterFields`/`BulkWineFilterPanel` mirror the structure of the existing `ViticultureFilterFields`/`FilterPanel` as siblings. `FilterPanel` gained a `basePath` prop (default `/grapes`, its only real caller) so the same component still works if reused elsewhere later.

### Decision 37 — Sitemap, robots.txt, and per-listing metadata are new, not "made type-aware," since neither existed before this phase

Section 6.6 lists "sitemap" and "share/OG images" among the things needing a type-aware sweep, but the Phase 0 audit found neither existed at all (no `generateMetadata` anywhere, no sitemap route, no canonical tags). Added `src/app/sitemap.ts` (lists both sections' listings under their canonical URLs), `src/app/robots.ts`, and `generateMetadata()` on both `[slug]` detail routes via a shared `buildListingMetadata()` helper. NDA-safe by construction, not by extra filtering: titles are always server-generated from controlled fields (Decision 17) and descriptions are already covered by the NDA-6 free-text guard, so neither needs redaction before going into `<title>`/OG/canonical tags -- there was simply nothing unsafe being added. No JSON-LD structured data or OG images were added (no image pipeline exists at all yet -- Appendix B parking-lot territory); left for later if the project owner wants it.

### Decision 38 — Old chooser-embedded `/listings/create` page was deleted, not just superseded

Once `next.config.ts` redirects `/listings/create` to `/sell/grapes`, the old `(dashboard)/listings/create/page.tsx` (which rendered a client-side type chooser before either form) becomes unreachable -- Next.js's redirect config runs before any page match. Deleted it and its `CreateListingForm.tsx` wrapper rather than leaving dead code; their logic now lives directly in the two new dedicated routes (`(dashboard)/sell/grapes/page.tsx`, `(dashboard)/sell/bulk-wine/page.tsx`), each skipping the chooser entirely since the route itself already says which type it is (WINE-1: type is fixed at creation). The "switch type mid-form, keep shared fields" behavior WINE-4 describes for a single unified form doesn't apply anymore either, now that choosing a type means navigating to a different route rather than toggling within one page -- the two forms simply don't share mutable state to carry over.

### Decision 39 — The homepage's "Featured Lots" grid stays a mixed grapes/bulk-wine list, not split into two

WINE-3's "never a mixed, confusing list" principle is stated for *search results*. The homepage's Featured Lots section is a highlights strip, not a filtered result set, and every card already self-identifies its type (icon, badge, units) via the Phase 5 card work -- so a buyer scanning it isn't confused about what they're looking at the way a mixed *search result* list would be. Left `getListings({})` unscoped there (as it already was); the two-entry-point buttons above it, plus the header switch, are what satisfy WINE-3's actual requirement for the homepage.

## Phase 7 — Hardening

### Decision 40 — Accessibility testing runs as a temporary, scripted Playwright + axe-core pass, not a permanent addition to this repo's toolchain

Same reasoning as Decision 19 (why the canary test is a Vitest unit suite, not a full browser E2E harness): this project has never carried a browser test runner, and standing one up permanently -- with a matching CI job that installs a Chromium binary on every push -- is a real, ongoing cost this repo hasn't opted into anywhere else. Instead, this phase reused the same temporary-install-verify-uninstall pattern already used for live manual verification in every prior phase (`npm install --ignore-scripts --no-save playwright @axe-core/playwright`, run, then fully uninstalled and all scratch scripts deleted -- nothing from this pass is left in `package.json` or CI).

Scanned with `axe-core`'s `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa` rule sets against the pages Section 8.2 names: `/register` (signup), `/grapes` and `/bulk-wine` (browse), a real listing detail page of each type, and -- logging into a real test account created via the Supabase admin API to reach them, then deleted afterward -- both `/sell/grapes` and `/sell/bulk-wine` (the two listing forms). All ten scanned pages are clean (zero violations) as of this phase. The "manual keyboard-only pass" was a second scripted pass (Tab/Enter/Escape/Arrow-key checks against the mobile filter Sheet, the register page's role selector, and general homepage tab order), not an actual by-hand pass -- noted here so it isn't mistaken for literally what the spec asked for, though it exercises the same interactions a human keyboard user would.

**Real bugs found and fixed, not just findings noted:**
- `ViticultureFilterFields.tsx`/`BulkWineFilterFields.tsx`: every filter `<Select>`/`<Input>` had a visible `<Label>` sibling with no `htmlFor`/`id` pairing -- a critical `select-name` violation (no accessible name at all) on every filter field on both browse pages. Fixed by having `FieldShell` generate the pairing itself. Used React's `useId()`, not a slugified label string, because `FilterPanel`/`BulkWineFilterPanel` mount this same field set **twice at once** (desktop sidebar, CSS-hidden but still in the DOM, plus the mobile Sheet drawer) -- a hand-rolled id would have collided between the two instances, which would have made the visible label on the open mobile sheet focus the wrong (hidden, unfocusable) control. `useId()` is unique per mounted instance by construction, so this can't recur elsewhere the same pattern gets reused.
- `/register`'s role selector wrapped a `<label><input type="radio">` inside a `<button type="button">` that had no click handler of its own -- a `nested-interactive` violation (a real assistive-tech hazard, not just an axe technicality). The button added nothing; changed to a plain `<div>` since the Tailwind `has-[:checked]:` styling it existed for works identically on either element.
- Global color-contrast failures: this app's "eyebrow label" style (`text-xs font-semibold uppercase tracking-wide text-stone-400`) is `text-stone-400` on white/`stone-50`, which fails WCAG AA for text. It's used in ~15 places (footer headings, spec `<dt>` labels, card seller names, filter section headers, etc.) -- bumped to `text-stone-500` everywhere it renders visible text (not the `placeholder:text-stone-400` instances on `Input`/`Textarea`, which are a different, lower-stakes UX convention and weren't flagged). Re-scanned after the fix to confirm the violations were actually gone, not just plausible.

### Decision 41 — Decision 16's NDA-8 gap ("old URL can't 404, only slugs would fix it") was re-examined now that Phase 6 added slugs, and still holds

Decision 16 flagged this to revisit once slugs existed. They now do (`/grapes/{slug}`, `/bulk-wine/{slug}`), but the gap is unchanged: `buildListingSlugPath()` slugifies `listing.title`, which is always server-generated from controlled fields (variety/clone/region for grapes, variety/vintage/region for bulk wine -- Decision 17), never seller-typed text. So the slug never carried any seller identity to begin with, and toggling NDA doesn't change the title, so it doesn't change the URL either. There's still no way to make the *same* listing 404 at its old address and reappear at a new one without breaking "old URLs keep working" elsewhere in this same phase's own requirements -- this isn't a gap slugs happened to leave unresolved, it's a real tension between two requirements (NDA-8 and the redirect requirement) that a URL rotation can't satisfy simultaneously. Still handled the same way as before: confirmation modals, the audit log, and full `revalidatePath` on toggle.

### Decision 42 — Security review: two real fixes, one scoped non-fix

Read through every Server Action, the service-role key's usage, and the middleware's route protection looking specifically for gaps this addendum's own new surfaces could have introduced.

- **Fixed:** `register/actions.ts` treated *any* `supabase.auth.signUp()` failure as a username race ("That username was just taken by someone else") whenever `flags.usernames` was on, discarding the real error. Confirmed this live against the connected project: an invalid-email-domain rejection and an email-send rate limit both got relabeled as a username collision. Narrowed the relabel to `error.status === 500` specifically -- the one signature a failed `handle_new_user` trigger actually produces (email uniqueness fails earlier, in `auth.users` itself, with its own clear error; `username_normalized` is the only unique constraint the trigger itself can hit) -- and every other failure now shows its real message.
- **Fixed:** `/admin` was missing from `middleware.ts`'s `PROTECTED_PREFIXES`. The page itself already redirects a non-admin/anonymous visitor, so this wasn't an actual access-control hole, but it was the one route in the app that skipped the fast middleware-level check every other protected route gets -- added for consistency and defense-in-depth.
- **Fixed:** `listing_inquiries`/`listing_inquiry_messages` (`inquiries/actions.ts`) had no rate limit at all, unlike every other write-heavy action in this app -- a logged-in user could otherwise flood any counterpart's inbox with unlimited messages. Added the same `checkRateLimit` utility already used for signup/login/availability checks (20/minute, IP-keyed).
- **Considered, not changed:** listing create/edit actions also have no rate limit. Left alone -- publishing a listing requires filling out a full form (region, variety, description, pricing), which is a much higher-friction abuse path than sending a message to a specific person, and this project's existing NDA/vineyard free-text guards and required-field validation already constrain what a spammy listing could even contain.
- Audited and found clean: the service-role key is used in exactly one file (`src/lib/supabase/admin.ts`), guarded by `import "server-only"`; no `dangerouslySetInnerHTML` anywhere in the codebase; the NDA-6 free-text guard runs server-side in all four create/edit Server Actions, not just client-side; `.env.example` holds only placeholder values, not real secrets.

### Decision 43 — Rollback scripts for migrations 0003-0006 are written but not rehearsed against a live database

Section 10 asks for migrations "tested up and down." This project's migrations have always been plain SQL files run by hand in the Supabase SQL Editor (README's own instructions), with no down-migration tooling ever part of the workflow before this phase -- so "tested... down" wasn't something any earlier phase built toward. Wrote `supabase/rollback/0003_rollback.sql` through `0006_rollback.sql` (reverse order, one per forward migration) plus a README explaining the caveat plainly: they're accurate against a careful re-read of each forward migration, but the only Supabase project connected to this repo has the project owner's real listings in it, so none of them have actually been run. Rehearsing a rollback for real needs a disposable project seeded with a schema copy, which wasn't available this session -- flagged rather than either skipped silently or run against real data to "prove" it.

### Decision 44 — Performance: a plain production-build review, not a Lighthouse/Web Vitals audit

`npm run build` was clean (no errors, no new warnings introduced by this addendum) with every route's First Load JS in the 103-250 KB range -- unremarkable for this app, which has no images, no client-heavy charting on the new pages, and no new large dependencies added since Phase 0. `/planning` (242 KB, pre-existing, not part of this addendum) is the heaviest route in the app either way. No caching/ISR is configured anywhere (`export const revalidate`, `unstable_cache`, explicit `fetch` cache options) -- Next.js 15's default is fully dynamic rendering, so Section 8.1's "caches are purged" on an NDA toggle is trivially true today since there's no cache to purge; the existing `revalidatePath` calls on every mutation are future-proofing for if caching gets added later, not currently load-bearing. Didn't run a synthetic Lighthouse/Web Vitals pass -- there's no production deployment to measure yet (README's own "Not included" section), and a local dev-server measurement wouldn't reflect real production numbers.

## Post-Phase-7 additions

### Decision 45 -- A bulk wine listing's winemaker lives in its own owner/admin-only table, not a column

The project owner asked for a way for a lister to name the winemaker who made the wine. A winemaker can be exactly as identifying as the seller's own name (a well-known winemaker *is* the identity), so it has to be as protected as the vineyard name -- and the obvious home, a column on `bulk_wine_details` or `listings`, isn't safe: both tables have "viewable by anyone" RLS policies, so any column there is readable straight from the public REST API, bypassing the NDA serializer (see Decision 46, which found this is already true of existing columns).

So `listing_winemakers` (migration `0007`) is a separate table whose RLS lets only the listing's owner and admins read it through the public API. The site's server loads winemakers with the service role, and only for listings that are safe to show that viewer (`winemakerFetchIds()` in `src/lib/serializers/listing.ts`) -- a confidential listing's winemaker is never fetched into memory for an anonymous or other-member request, not merely redacted afterward. The serializer still redacts it as a second layer, and canary tests cover both layers. The name gets the same character allowlist and email/URL rejection as a vineyard name, and on NDA listings the description guard also refuses to let the description name the seller's winemaker(s). Everything degrades quietly if migration `0007` hasn't been run: creating/editing without a winemaker is unaffected, and only entering one fails.

### Decision 46 -- RESOLVED by migration 0008: identifying columns are no longer readable through the public API

Found while designing Decision 45 and confirmed live with the anon key: `GET /rest/v1/listings?select=vineyard_name,user_id` returns those columns to anyone, because the `listings` table's RLS policy is `using (true)`. The NDA serializer (`serializeListing`) only protects what the *site* renders; it can't stop someone from calling the database API directly. On a confidential listing that exposes, at minimum: `vineyard_name`, `user_id`, `sub_ava`, the raw `region_ava` (even when the seller chose "state only"), the stored `title`, and `bulk_wine_details.wine_location_county`. No confidential listing exists in production yet, so nothing has leaked, but this is the gap between "the site hides it" and "it is hidden."

**Resolution (Decision 50 has the details).** Migration `0008_lock_identifying_columns.sql` revokes table-level `SELECT` on `listings` and `bulk_wine_details` from `anon` and `authenticated` and grants back only a column allowlist (`listings.id`, `bulk_wine_details.listing_id`), so a column added later is private by default. Every listing read (browse, detail, owner dashboard, edit, admin, vineyard typeahead, inquiry inbox, notification emails) now uses the service-role client, with owner scoping done in the query from `auth.getUser()`, so `serializeListing` really is the only door. Run `node --env-file=.env.local scripts/audit-public-api.mjs` after applying the migration (and before promoting confidential listings) to prove it against the live project.

### Decision 47 -- Confidential listings' titles are rebuilt from the redacted region, not the stored title

Titles are generated when a listing is saved, from `sub_ava || region_ava`. `sub_ava` is redacted on NDA listings, but the stored title still contained it -- so it appeared in the page title, the URL slug, the sitemap and search results. That was true of the old curated sub-AVA names, and got worse when "Specific Area" became free text (a seller could type a vineyard name straight into a public title). `serializeListing` now regenerates the title of any confidential listing from the already-redacted region (so "state only" precision yields "... -- California"). The stored title is unchanged, so the owner and admins still see it. The canary fixtures now put the canary string in the stored title, so this can't regress unnoticed.

### Decision 48 -- Terms of Service and Privacy Policy are a drafted starting point, not legal advice

`/terms` and `/privacy` were written to match what the site actually does (Supabase, Vercel, Resend, address autocomplete, the breach-password check, NDA handling and admin access), not generic boilerplate. They deliberately leave out anything that needs the operator's real details: the legal entity name, governing law/venue, dispute resolution, and a contact address. Set `NEXT_PUBLIC_CONTACT_EMAIL` to show a contact address on both pages (left out entirely when unset rather than showing a placeholder). Have a lawyer review them before relying on them -- particularly the NDA language, which says outright that the NDA option is a site feature and not a contract between buyer and seller.

### Decision 49 -- Cross-browser testing used Playwright's Chromium, Firefox, and WebKit engines

Real Safari (especially iOS Safari) can't be driven from this environment; Playwright's WebKit is the closest available stand-in and catches most layout and JS differences, but it isn't the same as a real iPhone. All three engines were exercised at desktop and 375px widths against the public pages, both create forms, the range sliders, the mobile filter sheet and the header. A real-device pass on an iPhone and an Android phone is still worth doing before launch.

### Decision 50 -- Closing the raw-API gap (Decision 46) also closed two identity leaks Decision 46 didn't list

Auditing every path that could hand a buyer or the public a confidential seller's identity turned up three more than the original write-up:

1. **Inquiry threads.** `listing_inquiries.seller_id` and `listing_inquiry_messages.sender_id` are the seller's user id. A buyer who opened an inquiry on a confidential lot could read either straight from the API and resolve it through the public `profiles_public` view to the seller's company name; the `profiles_inquiry_counterpart` view returned the seller's name to that buyer directly. The UI showed "Confidential Seller", the API did not. Fixed: those two columns are no longer granted to `authenticated`, the counterpart view skips the seller of a confidential listing when the viewer is the buyer, and the inquiry pages read with the service role and derive "mine/theirs" server-side.
2. **Titles outside the listing's own pages.** The inquiry inbox and the inquiry notification email used the stored `listings.title`, which can contain the sub-appellation the seller hid. They now take the title from the serializer for that viewer (`getListingTitlesForViewer`).
3. **Realtime "new listing" broadcast.** It sent the raw `region_ava` on every listing, including "state only" confidential ones. Confidential listings now broadcast a null region and the alert simply omits "in <region>".

Implementation notes: policies that looked at `listings.user_id` or `listing_inquiries.seller_id` now call two `SECURITY DEFINER` helpers (`owns_listing`, `is_inquiry_participant`), because Postgres checks column privileges for tables referenced inside a policy sub-select, and the two trigger functions that read `listings` on the caller's behalf were made `SECURITY DEFINER` for the same reason. Write paths stay on the user client so RLS remains a second lock: owner checks that used `.eq("user_id", ...)` or `.eq("listing_type", ...)` in an UPDATE's WHERE (which would now need `SELECT` on those columns) do the check first with the service role and update by id.

Verified in an in-memory Postgres (PGlite) loaded with migrations 0001-0007 plus 0008: before 0008 the anon role reads `vineyard_name` and `user_id`; after it, every identifying column is denied to anon and to other members, owners can still insert/update/delete their listings, details, practices and winemaker, non-owners cannot touch them, and a buyer can no longer see a confidential seller through the counterpart view. `supabase/rollback/0008_rollback.sql` restores the previous state (and re-opens the gap, so it is documented as a last resort).

### Decision 51 -- Account confirmation is an emailed code, with a click-through link as a fallback

Signup used to end on "Account created -- redirecting to your dashboard", which bounced straight back to the login screen because the account was unconfirmed, and the confirmation link in the email had nowhere useful to land (there was no callback route). Signup now goes to `/verify-email`, which asks for the code Supabase just emailed ("Enter the code we sent to ..."), and a correct code signs the user in on the spot.

- **Code, not just a link:** a code works when the email is opened on a different device than the one that signed up (common: sign up on a laptop, read email on a phone), can't be broken by an email scanner pre-fetching the link, and is what people expect from modern sites. The email also carries a button pointing at `/auth/confirm?token_hash=...`, which verifies server-side and works cross-device too, unlike Supabase's default PKCE link.
- **Mechanics:** `signUp` -> `/verify-email?email=...` -> `verifyOtp({ type: "signup" })` (server action; the server client stores the session cookies). Verified against the live project: right code signs in, a wrong/expired/reused code all return the same generic message, a resend never reveals whether an address has an account. A 60-second resend cooldown mirrors Supabase's own limit.
- **Logging in before confirming:** Supabase reports `email_not_confirmed` only when the password was correct (a wrong password still gets `invalid_credentials`), so the login action can safely send a fresh code and route to the verify screen instead of a dead-end "incorrect password".
- **Safety:** `redirect_to` / `next` values now go through `safeRedirectPath` (same-site relative paths only) in the login page, verify page and confirm route; the login page previously pushed the raw query value.
- **Code length:** this project's Supabase setting produces 8-digit codes (6 is the more familiar length). The server accepts 6-10 digits; `NEXT_PUBLIC_OTP_LENGTH` only controls auto-submit and must match the dashboard's "Email OTP Length" (currently 8 in Vercel).
- **Dashboard steps (cannot be done from code):** paste `supabase/email-templates/confirm-signup.html` into Authentication -> Emails -> Confirm signup; set Authentication -> URL Configuration -> Site URL to `https://bulkwinegrapes.com` and add `https://bulkwinegrapes.com/**` (and `http://localhost:3000/**`) to Redirect URLs.
- **Known limits:** the in-memory rate limiter is per server instance (Decision 42's caveat), so it is a deterrent on top of Supabase's own verify limits, not a guarantee. Forgot password was added right after (Decision 53).

### Decision 52 -- Social sign-in (Google first) is deferred, with a plan

Not built yet; it needs credentials only the site owner can create, and a small onboarding step. Recommended scope: **Google only** at launch (growers and buyers overwhelmingly have one; it's free and skips email confirmation entirely). Apple is only required by Apple's rules if an iOS app offering other social logins is shipped, costs $99/year and has fiddly key rotation, so it can wait for a native app. Microsoft/LinkedIn add little for this audience.

What building it involves: (1) a Google Cloud OAuth client and the Supabase Google provider settings (owner action); (2) a "Continue with Google" button plus `/auth/callback` (`exchangeCodeForSession`); (3) an onboarding screen for first-time social users, because the profile trigger reads role / company / region / address from signup metadata that an OAuth sign-in doesn't have, and usernames are collected at signup (USR-1); (4) linking: Supabase links a Google login to an existing password account with the same verified email, which is the behavior we want but should be tested. Keep it behind its own feature flag until tested end to end.

### Decision 53 -- Forgot password reuses the emailed-code mechanism

`/login` links to `/forgot-password` (enter email) -> `/reset-password?email=...` (enter the emailed code, then choose a new password). The reset email carries both the code and a button to `/auth/confirm?type=recovery&next=/reset-password?step=new`, which signs the user in on a short recovery session and lands on the new-password step directly.

- **No account enumeration:** the request screen and the code screen look identical whether or not the address has an account (Supabase itself sends nothing for unknown addresses); wrong, expired and reused codes share one message.
- **Same password rules as signup:** at least 10 characters, plus the Have I Been Pwned breach check, enforced server-side in `setNewPassword`. Reusing the current password is rejected.
- **Authorization is the recovery session:** `verifyResetCode` (or the link) creates it; `setNewPassword` refuses without one and tells the user to request a new code.
- **Other sessions are revoked:** after a successful reset, `signOut({ scope: "others" })` ends every other session, verified end to end (a session opened before the reset is redirected to login).
- **Dashboard step:** paste `supabase/email-templates/reset-password.html` into Authentication -> Emails -> Reset password (subject `Your HarvestLink password reset code: {{ .Token }}`).
- Verified in Chromium against the live project: request -> wrong code -> right code -> validation (short, mismatch, breached) -> success; old password rejected, new accepted; link path; no-session state; 375px width. The same run also re-verified the logged-in NDA flows after migration 0008 (seller edit and save, buyer inquiry and thread, and raw API as a buyer denied every identifying column).
- Known limits: same as Decision 51 (per-instance rate limiter). Reset is by email only, not username.

### Decision 54 -- Search and AI-search readiness: what was built, and what was deliberately left alone

Owner decisions of September 19, 2026 (recorded so they aren't re-litigated): keep the HarvestLink name; keep the existing strong marketing wording ("world's best wineries and winemakers", "Verified"); no Google Analytics; don't worry about low inventory; no contact page; no fees and no payment through the site (buyers and sellers arrange everything privately); the repository stays public for now; Andrew L. is the blog author; avoid em dashes in copy.

Built: per-route unique titles and descriptions with canonical URLs; `noindex` on auth, dashboard, alerts and filtered browse pages (filtered views canonicalize to the clean URL); an extended `robots.txt` that explicitly welcomes search and AI crawlers (including Parallel Web Systems' `ShapBot`) while keeping private routes out; a duplicate-host guard that sends `X-Robots-Tag: noindex` on preview deployments and any host other than the canonical one; Organization, WebSite, FAQPage, BlogPosting, BreadcrumbList and NDA-safe Product/Offer JSON-LD, all server-rendered; `/llms.txt` and `/llms-full.txt`; a Markdown copy of every post at `/blog/{slug}.md`; an RSS feed; generated text-only social cards; a real sitemap with blog posts and per-listing modification times; a /faq page; editorial content on /grapes and /bulk-wine so those pages carry real text even when a search returns nothing; and 15 blog posts written to be quotable (a 40 to 60 word quick answer, question-style headings, tables, dated sources, visible authorship). No page depends on client-side rendering for its text.

Why this helps AI search specifically: retrieval systems such as Parallel's Search and Extract APIs favor pages that are crawlable, server-rendered, clearly structured and consistent about what the entity is. The site now describes itself with one canonical sentence everywhere, and exposes clean Markdown on request. No one can guarantee placement in a particular index; these are the inputs that are in our control.

Not built (by decision or dependency): a /contact page; the spec's "landing pages by region and variety" (need inventory and copy); image sourcing from stock sites (the site uses a generated brand card instead, avoiding licensing and identifiability risk); analytics. The spec's "Verified" and "world's best" cautions were not adopted, per the owner.

New dependencies, justified: `marked` (Markdown to HTML) and `gray-matter` (front matter). Posts live as reviewable files in `content/blog`; the alternative was hand-writing every post as JSX.

### Decision 55 -- Saved searches and email alerts

Members save the filters on /grapes or /bulk-wine and get one email a day only when something new matches. Stored as an allowlisted query string (`sanitizeSearchParams`), never raw client input. A Vercel Cron job (`vercel.json`, 15:00 UTC) calls `/api/cron/saved-searches`, which requires `Authorization: Bearer $CRON_SECRET`.

- **NDA-safe by construction:** the digest is built only from `PublicListing` objects serialized for the anonymous viewer, so no hidden detail can reach an email whoever the recipient is. A canary test proves this for both listing types.
- **Region-filter inference fixed:** a confidential lot that chose "state only" precision no longer matches a county or region filter (in browse or alerts). Before, a filter for "Napa County" would match it, letting anyone learn the hidden county by trial and error. Verified against production data with the live smoke test.
- **Reliability:** a listing is only considered once it is 10 minutes old (its bulk wine details row is created a moment after the parent row); the job only advances a search's "last checked" time after the email is accepted, so a failed send is retried the next day; one failing search never blocks the others; a member's own listings are excluded.
- **Controls:** at most 10 saved searches (20 at the database level); members can pause or delete on /alerts; every email has a per-search confirm-to-stop link (a confirm button, so email scanners can't cancel alerts) and a one-click List-Unsubscribe header that stops all of that member's alerts.
- **Security:** RLS limits rows to their owner; members can only change `name` and `is_active` (column grants), not the bookkeeping columns or the unsubscribe token; verified in a test database.
- Migration 0009 also adds `listings.updated_at` (private by default under 0008's column allowlist) so the sitemap reports real modification times.
- Frequency is daily only. "Instant" alerts were left out to keep the first version robust; the runner is a pure function with injected dependencies, so adding a second schedule is small.

### Decision 56 -- Brand assets

A grape-cluster mark plus a Playfair Display wordmark (outlined to paths, so it renders identically everywhere) in the existing burgundy. Files: `public/brand/` (light and dark wordmarks, mark, 512 px logo), `src/app/icon.svg`, `apple-icon.png`, `favicon.ico`. Playfair Display is licensed under the SIL Open Font License. It is a first proposal for the owner to approve or change.
