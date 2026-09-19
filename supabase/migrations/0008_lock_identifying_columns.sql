-- Decision 46: make the NDA serializer the ONLY door to identifying columns.
-- Run this once in the Supabase SQL Editor, after 0007. Deploy the matching
-- app code first (it reads these tables with the service role and works
-- both before and after this migration).
--
-- Until now the public anon key could read listings.vineyard_name, user_id,
-- sub_ava, the raw region_ava and title, bulk_wine_details.wine_location_county
-- and listing_inquiries.seller_id straight from the REST API, so "hidden on
-- the site" did not mean "hidden". After this migration the anon and
-- authenticated roles can read only harmless key columns of those tables;
-- everything else is loaded by the Next.js server with the service role and
-- passed through src/lib/serializers/listing.ts. A column added to these
-- tables later is private by default (column grants are an allowlist).
--
-- What is deliberately left readable to the API roles:
--   listings.id, bulk_wine_details.listing_id  -- needed so owners can still
--       insert/update/delete their own rows through RLS (Postgres needs
--       SELECT on the columns a WHERE clause touches).
--   listing_inquiries (id, listing_id, buyer_id, created_at) and
--   listing_inquiry_messages (id, inquiry_id, body, created_at)
--       -- NOT seller_id / sender_id: for a confidential listing either one is
--       the seller's user id, which the public profiles_public view resolves
--       to a company name.

-- 1. Ownership / participation helpers ------------------------------------
-- Policies used to look at listings.user_id and listing_inquiries.seller_id
-- directly. Those columns are no longer readable by the caller, and
-- Postgres checks column privileges for tables referenced in a policy's
-- sub-select, so the checks move into SECURITY DEFINER functions.
create or replace function public.owns_listing(p_listing_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.listings where id = p_listing_id and user_id = auth.uid());
$$;

create or replace function public.is_inquiry_participant(p_inquiry_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.listing_inquiries
    where id = p_inquiry_id and (buyer_id = auth.uid() or seller_id = auth.uid())
  );
$$;

revoke all on function public.owns_listing(uuid) from public;
revoke all on function public.is_inquiry_participant(uuid) from public;
grant execute on function public.owns_listing(uuid) to anon, authenticated;
grant execute on function public.is_inquiry_participant(uuid) to anon, authenticated;

-- 2. Trigger functions that read listings on the caller's behalf ------------
-- They used to run as the caller and read listings.listing_type / user_id.
create or replace function public.check_bulk_wine_listing_type()
returns trigger
language plpgsql
security definer
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

create or replace function public.set_inquiry_seller_id()
returns trigger
language plpgsql
security definer
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

-- 3. Policies rewritten onto the helpers -------------------------------------
drop policy if exists "Growers can insert their own bulk wine details." on public.bulk_wine_details;
drop policy if exists "Growers can update their own bulk wine details." on public.bulk_wine_details;
drop policy if exists "Growers can delete their own bulk wine details." on public.bulk_wine_details;
create policy "Growers can insert their own bulk wine details." on public.bulk_wine_details
  for insert with check (public.owns_listing(listing_id));
create policy "Growers can update their own bulk wine details." on public.bulk_wine_details
  for update using (public.owns_listing(listing_id));
create policy "Growers can delete their own bulk wine details." on public.bulk_wine_details
  for delete using (public.owns_listing(listing_id));

drop policy if exists "Growers can set their own listing farming practices." on public.listing_farming_practices;
create policy "Growers can set their own listing farming practices." on public.listing_farming_practices
  for all using (public.owns_listing(listing_id)) with check (public.owns_listing(listing_id));

drop policy if exists "Owners and admins can view a listing's winemaker." on public.listing_winemakers;
drop policy if exists "Owners can add a winemaker to their own listing." on public.listing_winemakers;
drop policy if exists "Owners can update their own listing's winemaker." on public.listing_winemakers;
drop policy if exists "Owners can remove their own listing's winemaker." on public.listing_winemakers;
create policy "Owners and admins can view a listing's winemaker." on public.listing_winemakers
  for select using (public.is_admin() or public.owns_listing(listing_id));
create policy "Owners can add a winemaker to their own listing." on public.listing_winemakers
  for insert with check (public.owns_listing(listing_id));
create policy "Owners can update their own listing's winemaker." on public.listing_winemakers
  for update using (public.owns_listing(listing_id)) with check (public.owns_listing(listing_id));
create policy "Owners can remove their own listing's winemaker." on public.listing_winemakers
  for delete using (public.owns_listing(listing_id));

drop policy if exists "Participants can view their inquiry's messages." on public.listing_inquiry_messages;
drop policy if exists "Participants can send messages in their inquiry." on public.listing_inquiry_messages;
create policy "Participants can view their inquiry's messages." on public.listing_inquiry_messages
  for select using (public.is_inquiry_participant(inquiry_id) or public.is_admin());
create policy "Participants can send messages in their inquiry." on public.listing_inquiry_messages
  for insert with check (sender_id = auth.uid() and public.is_inquiry_participant(inquiry_id));

-- 4. Inquiry counterpart view: never hand a buyer the seller of a NDA lot ----
-- The view runs with its owner's privileges, so it can read listings.
create or replace view public.profiles_inquiry_counterpart as
  select p.id, p.company_name, p.full_name, p.region_ava, p.is_verified, p.username
  from public.profiles p
  where exists (
    select 1
    from public.listing_inquiries i
    join public.listings l on l.id = i.listing_id
    where (i.buyer_id = auth.uid() and i.seller_id = p.id and not l.is_nda)
       or (i.seller_id = auth.uid() and i.buyer_id = p.id)
  );

-- 5. Realtime broadcasts: no region for confidential listings ---------------
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
        'region_ava', case when new.is_nda then null else new.region_ava end,
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

create or replace function public.broadcast_new_bulk_wine_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing record;
begin
  select variety, region_ava, status, is_nda into v_listing from public.listings where id = new.listing_id;
  if v_listing.status = 'available' then
    perform realtime.send(
      jsonb_build_object(
        'variety', v_listing.variety,
        'quantity_gallons', new.quantity_gallons,
        'region_ava', case when v_listing.is_nda then null else v_listing.region_ava end,
        'listing_type', 'bulk_wine'
      ),
      'new_listing',
      'public-listings',
      false
    );
  end if;
  return null;
end;
$$;

-- 6. The lock itself: column-level allowlists --------------------------------
revoke select on public.listings from anon, authenticated;
grant select (id) on public.listings to anon, authenticated;

revoke select on public.bulk_wine_details from anon, authenticated;
grant select (listing_id) on public.bulk_wine_details to anon, authenticated;

revoke select on public.listing_inquiries from anon, authenticated;
grant select (id, listing_id, buyer_id, created_at) on public.listing_inquiries to authenticated;

revoke select on public.listing_inquiry_messages from anon, authenticated;
grant select (id, inquiry_id, body, created_at) on public.listing_inquiry_messages to authenticated;
