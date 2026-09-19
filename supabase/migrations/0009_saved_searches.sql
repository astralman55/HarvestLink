-- Saved searches and email alerts, plus listings.updated_at for accurate sitemaps.
-- Run this once in the Supabase SQL Editor, after 0008.
--
-- A saved search stores the filters a member set on /grapes or /bulk-wine.
-- A daily job (GET /api/cron/saved-searches, run by Vercel Cron with the
-- service role) finds listings created since the search was last checked and
-- emails the owner a digest. The digest is built from the NDA serializer's
-- anonymous view, so an alert can never reveal a confidential seller.

-- 1. saved_searches -----------------------------------------------------------
create table public.saved_searches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name varchar(80) not null check (char_length(btrim(name)) between 1 and 80),
  listing_type listing_type not null,
  -- The sanitized query string of the filters, e.g. "variety=Pinot+Noir&region_ava=Sonoma+County".
  query text not null default '' check (char_length(query) <= 1500),
  is_active boolean not null default true,
  -- Lets an email's unsubscribe link work without logging in. Never shown to other users.
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  -- Only listings created after this moment count as "new" for the next digest.
  last_checked_at timestamp with time zone not null default now(),
  last_notified_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index saved_searches_user_id_idx on public.saved_searches (user_id);
create index saved_searches_active_idx on public.saved_searches (is_active) where is_active;

alter table public.saved_searches enable row level security;

create policy "Members can view their own saved searches." on public.saved_searches
  for select using (auth.uid() = user_id);
create policy "Members can create their own saved searches." on public.saved_searches
  for insert with check (auth.uid() = user_id);
create policy "Members can update their own saved searches." on public.saved_searches
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Members can delete their own saved searches." on public.saved_searches
  for delete using (auth.uid() = user_id);

-- A member can only change the on/off switch and the name. The bookkeeping
-- columns and the unsubscribe token are managed by the server.
revoke update on public.saved_searches from anon, authenticated;
grant update (name, is_active) on public.saved_searches to authenticated;
revoke all on public.saved_searches from anon;

-- Hard cap so nobody can create thousands of searches (the app also checks).
create or replace function public.enforce_saved_search_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.saved_searches where user_id = new.user_id) >= 20 then
    raise exception 'You can save up to 20 searches.';
  end if;
  return new;
end;
$$;

create trigger saved_searches_enforce_limit
  before insert on public.saved_searches
  for each row execute procedure public.enforce_saved_search_limit();

-- 2. listings.updated_at ------------------------------------------------------
-- Real modification times for the sitemap's lastModified. Not granted to the
-- public API roles (migration 0008's column allowlist), so it is private by
-- default and only the server reads it.
alter table public.listings add column if not exists updated_at timestamp with time zone not null default now();
update public.listings set updated_at = created_at;

create or replace function public.set_listing_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute procedure public.set_listing_updated_at();
