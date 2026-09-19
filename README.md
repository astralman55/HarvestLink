# HarvestLink — Wine Grape Marketplace

A B2B marketplace connecting wine grape growers and buyers, built from
[`vintnerlink_blueprint.md`](./vintnerlink_blueprint.md) on Next.js 15 (App
Router), Supabase, and Tailwind CSS.

## What's implemented

- **Public marketplace** (`/`, `/listings`, `/listings/[id]`) — homepage with
  a full viticulture search (region, variety, harvest year, farming
  practice, trellis system, soil type, sun exposure, slope, tonnage, price,
  brix), synced to the URL so results are shareable/bookmarkable.
- **Auth** (`/login`, `/register`) — Supabase email/password auth with
  grower/buyer role selection, via Server Actions + Zod validation.
- **Grower dashboard** (`/dashboard`, `/listings/create`, `/planning`) —
  protected by middleware; create listings with full vineyard detail, and
  forecast future harvest blocks grouped by year (`crop_plans`).
- **Realtime yield alerts** — a Supabase Realtime hook shows a banner when a
  new listing is inserted while a buyer is browsing.
- **Database schema + RLS** — `supabase/migrations/0001_init.sql` (extends
  the blueprint's schema with `farming_practice`, `trellis_system`,
  `soil_type`, `sun_exposure`, `slope_percent`, `harvest_year` on
  `listings`).

### Demo mode (no Supabase project needed to look around)

`.env.local` ships with placeholder Supabase credentials so `npm run dev`
runs immediately. The public marketplace pages (`/`, `/listings`,
`/listings/[id]`) detect the missing project and transparently fall back to
a bundled sample catalog (`src/lib/demo-data.ts`) — filters, search, and
listing detail pages all work against that data out of the box.

Auth and the grower dashboard genuinely need a real Supabase project (you
can't fake sign-up/sign-in) — `/login` and `/register` will show a clear
"couldn't reach Supabase" message until you connect one.

## Connect a real Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project Settings → API** values into `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
3. Run the files in `supabase/migrations/` **in order** (`0001_init.sql`
   through `0008_lock_identifying_columns.sql` — Phase 4 needed no
   new migration) in the Supabase SQL Editor. Rollback scripts for
   `0003`–`0008` are in `supabase/rollback/` if you ever need to back the
   addendum out (see the README there — written, not yet rehearsed against
   live data).
4. Restart `npm run dev`. Register an account — the `profiles` row is
   created automatically via trigger.

## Scope addendum in progress (NDA listings, usernames, vineyard field, bulk wine)

A larger feature set is being built per
[`SCOPE_ADDENDUM_NDA_USERNAME_VINEYARD_BULK_WINE.md`](./SCOPE_ADDENDUM_NDA_USERNAME_VINEYARD_BULK_WINE.md).
Status:

- **Phase 0 (Audit)** — done. See
  [`docs/scope-addendum-audit.md`](./docs/scope-addendum-audit.md).
- **Phase 1 (Data model & migrations)** — done. See
  `supabase/migrations/0003_scope_addendum_phase1.sql`.
- **Phase 2 (Usernames)** — done. See
  `supabase/migrations/0004_scope_addendum_phase2_usernames.sql`. Signup
  (behind the flag) collects a username with a live availability check;
  login accepts email or username; existing accounts get a one-time
  "choose your username" prompt and can't create a new listing until they
  do. Full details and judgment calls in
  [`docs/scope-addendum-decisions.md`](./docs/scope-addendum-decisions.md).
- **Phase 3 (NDA listings + central serializer)** — done. See
  `supabase/migrations/0005_scope_addendum_phase3_nda.sql`. Every listing
  read now goes through one central, NDA-aware serializer
  (`src/lib/serializers/listing.ts`); sellers can mark a listing
  confidential with a live preview and free-text leak guard; buyers reach
  sellers through an on-site inquiry inbox (`/inquiries`) instead of a dead
  link; admins have a minimal, audit-logged identity view. Ships its own
  test suite (`npm run test`) and CI workflow — the mandatory NDA "canary"
  test (Section 8.1) runs there and must never be skipped.
- **Phase 4 (Vineyard field)** — done. "Is this a single-vineyard
  offering?" on the listing form, with typeahead suggestions that never
  leak another seller's NDA vineyard name, shown on cards/detail pages,
  and searchable (excluding NDA listings) on the browse filters. Ships
  live with no feature flag of its own — see
  [`docs/scope-addendum-decisions.md`](./docs/scope-addendum-decisions.md),
  Decision 22, for why.
- **Phase 5 (Bulk wine marketplace: form, detail page, card)** — done.
  See `supabase/migrations/0006_scope_addendum_phase5_bulk_wine.sql`.
  `/listings/create` offers a Grapes/Bulk Wine chooser behind
  `NEXT_PUBLIC_FEATURE_BULK_WINE`; the bulk-wine form covers grape
  origin, a separate wine-location field, vintage, ABV, sulfites, a
  farming-practices multi-select, and quantity/price with a live total
  lot value; the serializer, cards, detail page, and "My Listings" are
  all bulk-wine-aware, with NDA redaction working identically to grapes
  (new canary tests cover this). Deliberately does **not** yet include
  the `/grapes`/`/bulk-wine`/`/sell` routes, header nav, URL redirects,
  or bulk-wine browse filters — see
  [`docs/scope-addendum-decisions.md`](./docs/scope-addendum-decisions.md),
  Decision 26: those are Phase 6's explicit scope per the addendum's own
  delivery plan.
- **Phase 6 (Nav, routing, browse filters, cross-cutting sweep)** — done.
  No new migration. Real `/grapes` and `/bulk-wine` browse/detail routes
  with old-URL 301s (`/listings` → `/grapes`, etc. — a dynamic
  `/listings/{id}` gets a runtime, type-aware redirect instead), a
  persistent Grapes/Bulk Wine header switch, `/sell` + `/sell/grapes` +
  `/sell/bulk-wine` as the new create-listing entry points, the full
  bulk-wine browse filter set (vintage, wine location, ABV/price/quantity
  ranges, farming practice, max sulfites) with sort, and this project's
  first sitemap/robots.txt/per-listing metadata.
- **Phase 7 (Hardening)** — done. Canary test extended to the surfaces
  Phase 6 added (sitemap, per-listing metadata); an accessibility pass
  (axe-core + a scripted keyboard-only pass) found and fixed three real
  bugs — unlabeled filter fields, an invalid nested-interactive role
  selector, and app-wide color-contrast failures — see
  [`docs/scope-addendum-decisions.md`](./docs/scope-addendum-decisions.md),
  Decision 40; mobile/tablet verified at 375px/768px/1280px with no
  horizontal overflow; a security review fixed a misleading signup error
  message, closed a middleware gap on `/admin`, and added rate limiting to
  the inquiry relay (Decision 42); rollback scripts for migrations
  0003–0006 added under `supabase/rollback/` (written, not rehearsed
  against live data — Decision 43); a production build was reviewed for
  performance (Decision 44). See
  [`docs/how-to-test-manually.md`](./docs/how-to-test-manually.md) for a
  step-by-step manual test of the whole addendum.
- Everything new ships behind `NEXT_PUBLIC_FEATURE_USERNAMES` /
  `NEXT_PUBLIC_FEATURE_NDA_LISTINGS` / `NEXT_PUBLIC_FEATURE_BULK_WINE` in
  `.env.local` (see `src/lib/flags.ts`), all `false` by default in
  `.env.example` — existing behavior is unchanged until each phase lands
  and a flag is flipped. All three flags are turned on in this repo's own
  `.env.local` so Phases 2, 3, 5, and 6 are testable once you've run the
  migrations through `0006`.

## Deployment

The site is deployed on Vercel at https://bulkwinegrapes.com (`www.` redirects to it) with the
production env vars listed in `.env.example`; email goes through Resend
(sending domain `bulkwinegrapes.com`), including Supabase's signup
confirmation emails via Supabase's custom SMTP setting. Signup confirms
the email with a one-time code (see Decision 51 for the Supabase email-template
and Site URL settings it needs). `/terms` and
`/privacy` are drafts (see Decision 48 in
[`docs/scope-addendum-decisions.md`](./docs/scope-addendum-decisions.md)).

## Not included yet

- **Stripe** — env vars are scaffolded (`.env.example`) but no billing flow
  is wired up; the blueprint marks this "future scope."
- **Real-device browser testing and load testing** — cross-browser checks
  used Playwright's Chromium/Firefox/WebKit engines (Decision 49).
- **Verifying the NDA lock on your own project** — after running migration
  `0008`, `node --env-file=.env.local scripts/audit-public-api.mjs` probes the
  live public API and fails if any identifying column is readable
  (Decisions 46 and 50).

## Development

```bash
npm run dev      # start the dev server at localhost:3000
npm run build    # production build
npm run lint     # eslint
npm run test     # vitest -- includes the mandatory NDA canary test
```

Project structure follows the blueprint's layout under `src/`, with two
adjustments made for a real B2B storefront feel: the public marketplace
(`(marketing)` route group: home, listings, listing detail) uses a
marketing navbar/footer shell, while the authenticated app
(`(dashboard)` route group: overview, create listing, planning) uses a
sidebar app shell — both share the same `/listings` URL space via Next.js
route groups.
# HarvestLink
