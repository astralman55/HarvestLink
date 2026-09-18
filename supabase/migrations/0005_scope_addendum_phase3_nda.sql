-- Scope Addendum Phase 3: central public serializer + NDA listings.
-- Run this once in the Supabase SQL Editor, after 0004.

-- 1. is_admin() helper -----------------------------------------------------
-- SECURITY DEFINER so its own internal query bypasses RLS on profiles
-- (avoids the self-referencing-policy recursion problem of writing
-- `exists (select 1 from profiles where id = auth.uid() and role = 'admin')`
-- directly inside a profiles RLS policy).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 2. Lock down profiles (docs/scope-addendum-decisions.md, Decision 1) -----
-- The blanket "select using (true)" policy let the anon key read every
-- column of every profile (phone, address included). Replaced with
-- self/admin-only full-row access; the public marketplace instead reads
-- safe columns through the profiles_public view below, and the listing
-- serializer (src/lib/serializers/listing.ts) decides whether to pass that
-- identity through at all for a given listing/viewer.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Users can view their own full profile." on public.profiles
  for select using (auth.uid() = id);
create policy "Admins can view any full profile." on public.profiles
  for select using (public.is_admin());

create view public.profiles_public as
  select id, company_name, region_ava, is_verified, username
  from public.profiles;
-- Views default to running with the view owner's privileges (not the
-- caller's), so this stays readable even though the base table's RLS is
-- now self/admin-only -- the exposed column list is the allowlist.
grant select on public.profiles_public to anon, authenticated;

-- 3. Realtime: stop broadcasting full listing rows --------------------------
-- postgres_changes sends the entire NEW row over the wire to every
-- subscribed browser tab, independent of what the client code chooses to
-- render -- already present today (user_id, and future vineyard_name) even
-- though useRealtimeListings.ts only reads 3 fields (Phase 0 audit, Flag
-- #8). Replaced with a broadcast trigger that hand-picks a safe payload,
-- and the table is dropped from the publication so no other client can get
-- the raw row either.
alter publication supabase_realtime drop table public.listings;

create or replace function public.broadcast_new_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'available' then
    perform realtime.send(
      jsonb_build_object(
        'variety', new.variety,
        'estimated_tons', new.estimated_tons,
        'region_ava', new.region_ava,
        'harvest_year', new.harvest_year,
        'listing_type', new.listing_type
      ),
      'new_listing',
      'public-listings',
      false
    );
  end if;
  return null;
end;
$$;

create trigger listings_broadcast_new_listing
  after insert on public.listings
  for each row execute procedure public.broadcast_new_listing();

-- 4. NDA-7 minimal contact relay --------------------------------------------
-- No messaging system exists at all today (Phase 0 audit). This is the
-- minimum viable relay per NDA-7: a buyer opens an inquiry on a listing,
-- then buyer and seller exchange messages within it. seller_id is derived
-- server-side from the listing (trigger below), never trusted from the
-- client. No email notifications yet (no provider configured -- flagged in
-- docs/scope-addendum-decisions.md as a scope expansion needing a decision).
create table public.listing_inquiries (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (listing_id, buyer_id)
);

create index listing_inquiries_listing_id_idx on public.listing_inquiries (listing_id);
create index listing_inquiries_buyer_id_idx on public.listing_inquiries (buyer_id);
create index listing_inquiries_seller_id_idx on public.listing_inquiries (seller_id);

create or replace function public.set_inquiry_seller_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select user_id into new.seller_id from public.listings where id = new.listing_id;
  if new.seller_id is null then
    raise exception 'Listing not found.';
  end if;
  return new;
end;
$$;

create trigger listing_inquiries_set_seller_id
  before insert on public.listing_inquiries
  for each row execute procedure public.set_inquiry_seller_id();

alter table public.listing_inquiries enable row level security;
create policy "Participants can view their own inquiries." on public.listing_inquiries
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());
create policy "Buyers can open an inquiry." on public.listing_inquiries
  for insert with check (auth.uid() = buyer_id);

create table public.listing_inquiry_messages (
  id uuid default gen_random_uuid() primary key,
  inquiry_id uuid references public.listing_inquiries(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index listing_inquiry_messages_inquiry_id_idx on public.listing_inquiry_messages (inquiry_id);

alter table public.listing_inquiry_messages enable row level security;
create policy "Participants can view their inquiry's messages." on public.listing_inquiry_messages
  for select using (
    exists (
      select 1 from public.listing_inquiries i
      where i.id = inquiry_id and (auth.uid() = i.buyer_id or auth.uid() = i.seller_id or public.is_admin())
    )
  );
create policy "Participants can send messages in their inquiry." on public.listing_inquiry_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.listing_inquiries i
      where i.id = inquiry_id and (auth.uid() = i.buyer_id or auth.uid() = i.seller_id)
    )
  );

-- Lets inquiry participants see who they're talking to (name-only fields,
-- no phone/address/email) without broadening the general-public
-- profiles_public view. The WHERE clause does the real narrowing per
-- caller even though the view itself bypasses base-table RLS (same
-- definer-view mechanism as profiles_public above).
create view public.profiles_inquiry_counterpart as
  select p.id, p.company_name, p.full_name, p.region_ava, p.is_verified, p.username
  from public.profiles p
  where exists (
    select 1 from public.listing_inquiries i
    where (i.buyer_id = auth.uid() and i.seller_id = p.id)
       or (i.seller_id = auth.uid() and i.buyer_id = p.id)
  );
grant select on public.profiles_inquiry_counterpart to authenticated;
