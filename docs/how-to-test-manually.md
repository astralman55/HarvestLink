# How to test the scope addendum manually

For the project owner. Covers the walkthrough Section 10 of the addendum
asks for: sign up with a username, create a grapes NDA listing, create a
bulk wine NDA listing, view both as an anonymous visitor, and confirm
nothing identifying appears. ~10 minutes.

## 0. Before you start

- `.env.local` needs a real connected Supabase project with migrations
  `0001` through `0006` applied, and all three feature flags on:
  `NEXT_PUBLIC_FEATURE_USERNAMES=true`, `NEXT_PUBLIC_FEATURE_NDA_LISTINGS=true`,
  `NEXT_PUBLIC_FEATURE_BULK_WINE=true`. Restart `npm run dev` after changing
  any of these.
- Use a throwaway email you can sign up with more than once if needed
  (`you+test1@gmail.com` works fine).

## 1. Sign up with a username

1. Go to `/register`. Pick a role (Grower or Buyer), fill in the required
   fields, and enter a username in the **Username** field -- you should see
   a live "Available" / "Taken" indicator as you type.
2. Submit. You should land on `/dashboard`.
3. Sign out and back in from `/login` using the **username** you just
   picked instead of the email -- it should work identically to logging in
   with the email.

## 2. Create a grapes NDA listing

1. From the dashboard, click **Sell** (or go to `/sell/grapes`).
2. Fill in the listing. Under **Seller & Source**, check **Selling under
   NDA?** -- a panel should appear listing what's hidden vs. visible to
   buyers. Try typing your own business or vineyard name into the
   Description field: it should be blocked with a warning before you can
   submit.
3. Optionally check **Is this a single-vineyard offering?** and enter a
   vineyard name.
4. Use **Preview as a buyer sees it** before submitting -- confirm your
   name, business, username, and vineyard name are absent, and the badge
   reads "Confidential Seller (NDA)."
5. Publish.

## 3. Create a bulk wine NDA listing

1. Go to `/sell/bulk-wine`.
2. Fill in grape variety/origin, a **separate** wine location (state +
   county) -- confirm it does NOT auto-fill from the grape origin you just
   picked, they're independent fields.
3. Fill in vintage (or check non-vintage), ABV, quantity, and price --
   watch the **Total Lot Value** update live as you type quantity/price.
4. Check **Selling under NDA?** the same way as step 2.
5. Publish.

## 4. View both as an anonymous visitor

1. Open a private/incognito browser window (no login).
2. Go to `/grapes` and `/bulk-wine`, find your two new listings, and open
   each detail page.
3. Confirm on both:
   - The seller section reads "Confidential Seller," not your name/company.
   - No vineyard name is shown (if you set one) -- it should say the
     vineyard is withheld, not show the name.
   - View the page source (Ctrl+U / Cmd+Opt+U) and search (Ctrl+F) for your
     real name, business name, username, and vineyard name -- none should
     appear anywhere, including in the `<title>`, meta tags, or any
     embedded JSON.
   - The location shown is generalized per whatever precision you chose
     (state-only hides the county/sub-AVA).
4. Try contacting the seller -- it should go through the on-site **Send an
   inquiry** flow, not reveal an email address or expose a mailto link.

## 5. Confirm the toggle behaves as documented

1. Log back in as yourself and open one of the listings you just made.
2. Toggle NDA off. You should see a confirmation dialog warning that this
   makes your identity public going forward. Confirm.
3. Revisit the public detail page (private window) -- your real name should
   now appear.
4. Known limitation (documented, not a bug): the URL doesn't change when
   you toggle NDA either direction, and doesn't need to -- see
   `docs/scope-addendum-decisions.md`, Decisions 16 and 41.

## 6. Quick regression check (existing grapes flow, non-NDA)

1. With all three flags left on, create one more grapes listing with NDA
   **off**. Confirm it looks and behaves exactly as before this addendum:
   real seller name shown, no confidentiality badge, findable through the
   ordinary browse filters.
2. Flip all three feature flags to `false` in `.env.local`, restart
   `npm run dev`, and spot-check `/`, `/listings` (redirects to `/grapes`),
   and the create-listing flow -- everything should look and work exactly
   as it did before this addendum existed, with no "Bulk Wine," NDA, or
   username UI visible anywhere.
