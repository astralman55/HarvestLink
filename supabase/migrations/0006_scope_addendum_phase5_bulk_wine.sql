-- Scope Addendum Phase 5: bulk wine realtime alert.
-- Run this once in the Supabase SQL Editor, after 0005.
--
-- The rest of Phase 5's schema (bulk_wine_details, farming_practices,
-- listing_farming_practices) was already built forward-looking in
-- migration 0003 -- this is the one genuinely new piece.
--
-- migration 0005's broadcast_new_listing() trigger fires AFTER INSERT ON
-- listings and only knows grapes' estimated_tons -- for a bulk wine
-- listing, the bulk_wine_details row (quantity_gallons) doesn't exist yet
-- at that point, since the app inserts it in a second statement right
-- after. A separate trigger on bulk_wine_details itself broadcasts once
-- that data actually exists.

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

create trigger bulk_wine_details_broadcast_new_listing
  after insert on public.bulk_wine_details
  for each row execute procedure public.broadcast_new_bulk_wine_listing();
