-- Rollback for supabase/migrations/0003_scope_addendum_phase1.sql
-- See supabase/rollback/README.md before running this. Run 0004_rollback.sql
-- first.

-- 8. Backfill was a no-op UPDATE; nothing to reverse beyond dropping the
--    column below.

-- 7. Bulk wine farming practices.
drop policy if exists "Growers can set their own listing farming practices." on public.listing_farming_practices;
drop policy if exists "Listing farming practices are viewable by anyone." on public.listing_farming_practices;
drop table if exists public.listing_farming_practices cascade;

drop policy if exists "Farming practices are viewable by anyone." on public.farming_practices;
drop table if exists public.farming_practices cascade;

-- 6. Bulk wine details.
drop policy if exists "Growers can delete their own bulk wine details." on public.bulk_wine_details;
drop policy if exists "Growers can update their own bulk wine details." on public.bulk_wine_details;
drop policy if exists "Growers can insert their own bulk wine details." on public.bulk_wine_details;
drop policy if exists "Bulk wine details are viewable by anyone." on public.bulk_wine_details;
drop trigger if exists bulk_wine_details_check_listing_type on public.bulk_wine_details;
drop function if exists public.check_bulk_wine_listing_type();
drop table if exists public.bulk_wine_details cascade;

-- 5. Admin identity view log.
drop policy if exists "Admins can view and log their own identity-view records." on public.admin_identity_view_log;
drop table if exists public.admin_identity_view_log cascade;

-- 4. NDA audit log.
drop trigger if exists listings_log_nda_change on public.listings;
drop function if exists public.log_nda_change();
drop policy if exists "Admins can view the NDA audit log." on public.nda_audit_log;
drop table if exists public.nda_audit_log cascade;

-- 3. Listings: listing type, NDA, vineyard.
drop trigger if exists listings_set_vineyard_name_normalized on public.listings;
drop function if exists public.set_vineyard_name_normalized();
drop index if exists public.listings_vineyard_name_normalized_idx;
drop index if exists public.listings_is_nda_idx;
drop index if exists public.listings_listing_type_idx;
alter table public.listings
  drop column if exists vineyard_name_normalized,
  drop column if exists vineyard_name,
  drop column if exists single_vineyard,
  drop column if exists nda_location_precision,
  drop column if exists is_nda,
  drop column if exists listing_type;

-- 2. Usernames (profiles).
alter table public.profiles drop constraint if exists profiles_username_format;
drop trigger if exists profiles_set_username_normalized on public.profiles;
drop function if exists public.set_username_normalized();
drop index if exists public.profiles_username_normalized_key;
alter table public.profiles
  drop column if exists username_normalized,
  drop column if exists username;

drop policy if exists "Reserved usernames are viewable by anyone." on public.reserved_usernames;
drop table if exists public.reserved_usernames cascade;

-- 1. Enums (must come after every column using them is dropped, above).
drop type if exists nda_location_precision;
drop type if exists listing_type;

-- The unaccent extension is deliberately left installed -- see
-- supabase/rollback/README.md.
