-- Rolls back 0008_lock_identifying_columns.sql.
-- WARNING: this re-opens the raw-API read of vineyard_name / user_id /
-- sub_ava / region_ava / title / wine_location_county / seller_id /
-- sender_id to the public anon key (Decision 46). Only do it if 0008 broke
-- something you can't fix forward, and don't promote confidential listings
-- while it is rolled back. The app code works either way (it reads these
-- tables with the service role), so nothing else needs to change.

-- 1. Restore table-level SELECT.
grant select on public.listings to anon, authenticated;
grant select on public.bulk_wine_details to anon, authenticated;
grant select on public.listing_inquiries to anon, authenticated;
grant select on public.listing_inquiry_messages to anon, authenticated;

-- 2. Restore the original policies (dropped first because they depend on
--    the helper functions removed at the end).
drop policy if exists "Growers can insert their own bulk wine details." on public.bulk_wine_details;
drop policy if exists "Growers can update their own bulk wine details." on public.bulk_wine_details;
drop policy if exists "Growers can delete their own bulk wine details." on public.bulk_wine_details;
create policy "Growers can insert their own bulk wine details." on public.bulk_wine_details for insert
  with check (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));
create policy "Growers can update their own bulk wine details." on public.bulk_wine_details for update
  using (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));
create policy "Growers can delete their own bulk wine details." on public.bulk_wine_details for delete
  using (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));

drop policy if exists "Growers can set their own listing farming practices." on public.listing_farming_practices;
create policy "Growers can set their own listing farming practices." on public.listing_farming_practices for all
  using (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()))
  with check (exists (select 1 from public.listings where id = listing_id and user_id = auth.uid()));

drop policy if exists "Owners and admins can view a listing's winemaker." on public.listing_winemakers;
drop policy if exists "Owners can add a winemaker to their own listing." on public.listing_winemakers;
drop policy if exists "Owners can update their own listing's winemaker." on public.listing_winemakers;
drop policy if exists "Owners can remove their own listing's winemaker." on public.listing_winemakers;
create policy "Owners and admins can view a listing's winemaker." on public.listing_winemakers
  for select using (
    public.is_admin()
    or exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
  );
create policy "Owners can add a winemaker to their own listing." on public.listing_winemakers
  for insert with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
  );
create policy "Owners can update their own listing's winemaker." on public.listing_winemakers
  for update
  using (exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid()));
create policy "Owners can remove their own listing's winemaker." on public.listing_winemakers
  for delete using (
    exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
  );

drop policy if exists "Participants can view their inquiry's messages." on public.listing_inquiry_messages;
drop policy if exists "Participants can send messages in their inquiry." on public.listing_inquiry_messages;
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

-- 3. Restore the original inquiry counterpart view.
create or replace view public.profiles_inquiry_counterpart as
  select p.id, p.company_name, p.full_name, p.region_ava, p.is_verified, p.username
  from public.profiles p
  where exists (
    select 1 from public.listing_inquiries i
    where (i.buyer_id = auth.uid() and i.seller_id = p.id)
       or (i.seller_id = auth.uid() and i.buyer_id = p.id)
  );

-- 4. Restore the original trigger functions (caller-privileged, region always sent).
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

create or replace function public.broadcast_new_bulk_wine_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing record;
begin
  select variety, region_ava, status into v_listing from public.listings where id = new.listing_id;
  if v_listing.status = 'available' then
    perform realtime.send(
      jsonb_build_object(
        'variety', v_listing.variety,
        'quantity_gallons', new.quantity_gallons,
        'region_ava', v_listing.region_ava,
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

-- 5. Drop the helpers (nothing depends on them any more).
drop function if exists public.owns_listing(uuid);
drop function if exists public.is_inquiry_participant(uuid);
