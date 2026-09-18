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
3. Run `supabase/migrations/0001_init.sql` in the Supabase SQL Editor.
4. Restart `npm run dev`. Register an account — the `profiles` row is
   created automatically via trigger.

## Not included (needs your accounts/decisions)

- **Vercel deployment** (blueprint Phase 9) — linking a GitHub repo to
  Vercel and setting production env vars needs your Vercel/GitHub accounts.
- **Live E2E audit against production** (blueprint Phase 10) — needs a
  deployed instance to measure.
- **Stripe** — env vars are scaffolded (`.env.example`) but no billing flow
  is wired up; the blueprint marks this "future scope."

## Development

```bash
npm run dev      # start the dev server at localhost:3000
npm run build    # production build
npm run lint     # eslint
```

Project structure follows the blueprint's layout under `src/`, with two
adjustments made for a real B2B storefront feel: the public marketplace
(`(marketing)` route group: home, listings, listing detail) uses a
marketing navbar/footer shell, while the authenticated app
(`(dashboard)` route group: overview, create listing, planning) uses a
sidebar app shell — both share the same `/listings` URL space via Next.js
route groups.
# HarvestLink
