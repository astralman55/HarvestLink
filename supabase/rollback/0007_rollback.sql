-- Rollback for supabase/migrations/0007_bulk_wine_winemaker.sql
-- See supabase/rollback/README.md before running this. Run it before
-- 0006_rollback.sql. Deletes every listed winemaker.

drop policy if exists "Owners can remove their own listing's winemaker." on public.listing_winemakers;
drop policy if exists "Owners can update their own listing's winemaker." on public.listing_winemakers;
drop policy if exists "Owners can add a winemaker to their own listing." on public.listing_winemakers;
drop policy if exists "Owners and admins can view a listing's winemaker." on public.listing_winemakers;
drop table if exists public.listing_winemakers cascade;
