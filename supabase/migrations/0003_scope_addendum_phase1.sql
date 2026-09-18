-- Scope Addendum Phase 1: Data model & migrations
-- Adds the schema needed for NDA listings, usernames, the vineyard field,
-- and the bulk-wine marketplace, without touching any existing behavior.
-- Run this once in the Supabase SQL Editor for the connected project,
-- after 0001_init.sql and 0002_buyer_profile_fields.sql.
--
-- Additive only. Every new column is nullable-or-defaulted so existing
-- rows keep working untouched, and every new table is independent of
-- existing ones except via new foreign keys. See
-- docs/scope-addendum-decisions.md for the reasoning behind choices made
-- where the addendum spec left room for judgment.

create extension if not exists "unaccent";

-- 1. Enums -------------------------------------------------------------
create type listing_type as enum ('grapes', 'bulk_wine');
create type nda_location_precision as enum ('county', 'state');

-- 2. Usernames (profiles) -----------------------------------------------
-- Nullable for now (USR-7): existing users are prompted to choose one on
-- next login (Phase 2 app code); NOT NULL is only enforced once every
-- account has one. Uniqueness is enforced at the DB level on the
-- normalized column via a partial unique index (nulls excluded).
alter table public.profiles
  add column username text,
  add column username_normalized text,
  add constraint profiles_username_format
    check (username is null or username ~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$');

create unique index profiles_username_normalized_key
  on public.profiles (username_normalized)
  where username_normalized is not null;

create or replace function public.set_username_normalized()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.username_normalized := case when new.username is null then null else lower(new.username) end;
  return new;
end;
$$;

create trigger profiles_set_username_normalized
  before insert or update of username on public.profiles
  for each row execute procedure public.set_username_normalized();

-- Reserved/blocked usernames (USR-4). Stored in a table, not code, so the
-- list can be updated without a deploy. Seeded with route-colliding names
-- for this app plus the spec's baseline list.
create table public.reserved_usernames (
  term text primary key
);

insert into public.reserved_usernames (term) values
  ('admin'), ('administrator'), ('support'), ('help'), ('staff'),
  ('moderator'), ('mod'), ('system'), ('root'), ('official'), ('team'),
  ('harvestlink'), ('null'), ('undefined'), ('anonymous'), ('confidential'),
  ('nda'), ('seller'), ('buyer'), ('anon'),
  ('login'), ('logout'), ('signup'), ('register'), ('api'), ('dashboard'),
  ('listings'), ('planning'), ('grapes'), ('bulk-wine'), ('bulkwine'),
  ('sell'), ('settings'), ('account'), ('about'), ('contact');

alter table public.reserved_usernames enable row level security;
create policy "Reserved usernames are viewable by anyone." on public.reserved_usernames for select using (true);

-- 3. Listings: listing type, NDA, vineyard ------------------------------
alter table public.listings
  add column listing_type listing_type not null default 'grapes',
  add column is_nda boolean not null default false,
  add column nda_location_precision nda_location_precision not null default 'county',
  add column single_vineyard boolean not null default false,
  add column vineyard_name varchar(100),
  add column vineyard_name_normalized varchar(100),
  add constraint listings_vineyard_name_requires_flag
    check (single_vineyard = true or vineyard_name is null),
  add constraint listings_vineyard_name_length
    check (vineyard_name is null or char_length(vineyard_name) between 2 and 100);

create index listings_listing_type_idx on public.listings (listing_type);
create index listings_is_nda_idx on public.listings (is_nda);
create index listings_vineyard_name_normalized_idx on public.listings (vineyard_name_normalized)
  where vineyard_name_normalized is not null;

create or replace function public.set_vineyard_name_normalized()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.vineyard_name_normalized := case
    when new.vineyard_name is null then null
    else regexp_replace(lower(unaccent(new.vineyard_name)), '[^a-z0-9]+', '', 'g')
  end;
  return new;
end;
$$;

create trigger listings_set_vineyard_name_normalized
  before insert or update of vineyard_name on public.listings
  for each row execute procedure public.set_vineyard_name_normalized();

-- 4. NDA audit log --------------------------------------------------------
-- Every change to is_nda is logged automatically via trigger so app code
-- can't forget to record it (NDA-2). No seller identity is stored here,
-- only the actor's internal user id.
create table public.nda_audit_log (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  old_value boolean not null,
  new_value boolean not null,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index nda_audit_log_listing_id_idx on public.nda_audit_log (listing_id);

alter table public.nda_audit_log enable row level security;
create policy "Admins can view the NDA audit log." on public.nda_audit_log for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create or replace function public.log_nda_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_nda is distinct from new.is_nda then
    insert into public.nda_audit_log (listing_id, old_value, new_value, actor_id)
    values (new.id, old.is_nda, new.is_nda, auth.uid());
  end if;
  return new;
end;
$$;

create trigger listings_log_nda_change
  after update of is_nda on public.listings
  for each row execute procedure public.log_nda_change();

-- 5. Admin identity view log (NDA-11) --------------------------------------
-- Written by the (future, Phase 3) admin panel every time an admin views
-- the real identity behind an NDA listing.
create table public.admin_identity_view_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references public.profiles(id) on delete set null not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index admin_identity_view_log_listing_id_idx on public.admin_identity_view_log (listing_id);

alter table public.admin_identity_view_log enable row level security;
create policy "Admins can view and log their own identity-view records." on public.admin_identity_view_log
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (admin_id = auth.uid());

-- 6. Bulk wine ---------------------------------------------------------
-- Grapes keeps its existing estimated_tons/minimum_tons/price_per_ton
-- columns untouched. Bulk wine gets its own 1:1 details table with its
-- own gallon/ABV/SO2/vintage/wine-location fields rather than a shared
-- generic quantity+unit column pair -- see decisions log (Decision 3):
-- this makes "grapes can't use gallons, bulk wine can't use tons"
-- structurally true (the column doesn't exist on the wrong type) instead
-- of relying on a CHECK against a shared unit-tag column.
create table public.bulk_wine_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  quantity_gallons integer not null check (quantity_gallons between 1 and 5000000),
  price_per_gallon numeric(10,2) not null check (price_per_gallon between 0.01 and 1000.00),
  abv numeric(4,1) not null check (abv between 5.0 and 25.0),
  total_so2_ppm integer check (total_so2_ppm between 0 and 1000),
  vintage_year smallint,
  is_multi_vintage boolean not null default false,
  wine_location_state text,
  wine_location_county text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Grape origin/appellation for bulk wine reuses listings.region_ava /
-- sub_ava (WINE-4) -- wine_location_state/county above is the physically-
-- separate "where the wine is stored" field (WINE-5); the two are never
-- synced by any trigger or default here.

create or replace function public.check_bulk_wine_listing_type()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  lt listing_type;
begin
  select listing_type into lt from public.listings where id = new.listing_id;
  if lt is distinct from 'bulk_wine' then
    raise exception 'bulk_wine_details.listing_id must reference a listing with listing_type = bulk_wine';
  end if;
  return new;
end;
$$;

create trigger bulk_wine_details_check_listing_type
  before insert or update on public.bulk_wine_details
  for each row execute procedure public.check_bulk_wine_listing_type();

alter table public.bulk_wine_details enable row level security;
create policy "Bulk wine details are viewable by anyone." on public.bulk_wine_details for select using (true);
create policy "Growers can insert their own bulk wine details." on public.bulk_wine_details for insert
  with check (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));
create policy "Growers can update their own bulk wine details." on public.bulk_wine_details for update
  using (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));
create policy "Growers can delete their own bulk wine details." on public.bulk_wine_details for delete
  using (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));

-- 7. Bulk wine farming practices (multi-select) ---------------------------
-- Deliberately a separate vocabulary from the existing grapes
-- farming_practice enum (conventional/sustainable/organic/biodynamic,
-- single-select) -- see decisions log (Decision 2). The grapes form and
-- column are untouched per the addendum's own default (Open Question 6).
create table public.farming_practices (
  code text primary key
);

insert into public.farming_practices (code) values
  ('organic'), ('biodynamic'), ('natural'), ('sustainable'),
  ('regenerative_organic'), ('demeter_certified_biodynamic');

alter table public.farming_practices enable row level security;
create policy "Farming practices are viewable by anyone." on public.farming_practices for select using (true);

create table public.listing_farming_practices (
  listing_id uuid references public.listings(id) on delete cascade not null,
  practice_code text references public.farming_practices(code) not null,
  primary key (listing_id, practice_code)
);

alter table public.listing_farming_practices enable row level security;
create policy "Listing farming practices are viewable by anyone." on public.listing_farming_practices for select using (true);
create policy "Growers can set their own listing farming practices." on public.listing_farming_practices for all
  using (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()))
  with check (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));

-- 8. Backfill --------------------------------------------------------------
-- Every existing listing predates listing_type; the column default
-- already backfills it to 'grapes' for existing rows in Postgres when
-- added with `not null default 'grapes'` above, so no separate UPDATE is
-- required. Left here as an explicit, idempotent no-op safety net.
update public.listings set listing_type = 'grapes' where listing_type is null;
