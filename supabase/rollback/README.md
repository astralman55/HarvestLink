# Rollback scripts for the scope addendum migrations

`supabase/migrations/0003` through `0007` are the five migrations added by
`SCOPE_ADDENDUM_NDA_USERNAME_VINEYARD_BULK_WINE.md`. These are the matching
rollback scripts, written to satisfy Section 10 of the Definition of Done
("all migrations tested up and down").

**Status: written and reviewed against the forward migrations they reverse,
but not executed.** This project's connected Supabase project has real data
in it (the project owner's own live listings), so none of these have been
run against it -- doing that would require a disposable/throwaway Supabase
project, which wasn't available in this session. If you want to actually
rehearse a rollback, do it against a fresh project seeded with a copy of the
schema first, not this one.

## Order

Run in **descending** order -- `0007_rollback.sql`, then `0006`, `0005`, `0004`,
`0003` -- since each migration builds on the one before it. Running them out
of order will fail (e.g. 0005's rollback drops `is_admin()`, which 0004's
objects don't depend on, but 0003's tables reference things 0004/0005 add
policies against).

## What's deliberately left alone

- The `unaccent` extension (0003) isn't dropped -- extensions are
  effectively global to the project and something else may come to depend
  on it; there's no real benefit to removing it.
- These scripts drop tables/columns, which **deletes data** in those
  tables/columns (usernames, NDA flags, vineyard names, bulk wine listings,
  inquiries, audit logs). That's inherent to rolling back an additive
  migration that other rows may have since used -- there's no way to
  "pause" the feature and keep the data without just leaving the columns in
  place and turning the feature flags off instead, which is the
  recommended way to disable this work if the schema itself doesn't need to
  change back.
