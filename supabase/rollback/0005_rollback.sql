-- Rollback for supabase/migrations/0005_scope_addendum_phase3_nda.sql
-- See supabase/rollback/README.md before running this. Run 0006_rollback.sql
-- first.

-- 4. NDA-7 contact relay.
drop view if exists public.profiles_inquiry_counterpart;

drop policy if exists "Participants can send messages in their inquiry." on public.listing_inquiry_messages;
drop policy if exists "Participants can view their inquiry's messages." on public.listing_inquiry_messages;
drop table if exists public.listing_inquiry_messages cascade;

drop policy if exists "Buyers can open an inquiry." on public.listing_inquiries;
drop policy if exists "Participants can view their own inquiries." on public.listing_inquiries;
drop trigger if exists listing_inquiries_set_seller_id on public.listing_inquiries;
drop function if exists public.set_inquiry_seller_id();
drop table if exists public.listing_inquiries cascade;

-- 3. Realtime broadcast trigger, and put listings back on the publication
--    the way it was before this migration.
drop trigger if exists listings_broadcast_new_listing on public.listings;
drop function if exists public.broadcast_new_listing();
alter publication supabase_realtime add table public.listings;

-- 2. Restore the original profiles policy from 0001_init.sql, and drop the
--    view that exists only to make the locked-down table still readable.
drop view if exists public.profiles_public;
drop policy if exists "Admins can view any full profile." on public.profiles;
drop policy if exists "Users can view their own full profile." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

-- 1. is_admin() helper.
drop function if exists public.is_admin();
