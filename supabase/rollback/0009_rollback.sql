-- Rolls back 0009_saved_searches.sql. Deletes all saved searches.
drop trigger if exists listings_set_updated_at on public.listings;
drop function if exists public.set_listing_updated_at();
alter table public.listings drop column if exists updated_at;

drop trigger if exists saved_searches_enforce_limit on public.saved_searches;
drop function if exists public.enforce_saved_search_limit();
drop table if exists public.saved_searches;
