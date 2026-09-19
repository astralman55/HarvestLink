-- Bulk wine: "who made the wine" (winemaker) on a listing.
-- Run this once in the Supabase SQL Editor, after 0006.
--
-- Deliberately its own table instead of a column on bulk_wine_details or
-- listings: both of those are readable by anyone holding the public anon
-- key ("... are viewable by anyone" policies), so a winemaker stored there
-- would be readable straight from the REST API on a confidential (NDA)
-- listing, bypassing the NDA serializer. A winemaker can be exactly as
-- identifying as the seller's own name.
--
-- Here, only the listing's owner and admins can read a row through the
-- public API. The site's server loads winemakers with the service role, and
-- only for listings that are safe to show that viewer (see
-- winemakerFetchIds() in src/lib/serializers/listing.ts) -- a confidential
-- listing's winemaker is never fetched for an anonymous or other-member
-- request at all.

create table public.listing_winemakers (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  winemaker_name varchar(100) not null
    check (char_length(winemaker_name) between 2 and 100)
);

alter table public.listing_winemakers enable row level security;

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
