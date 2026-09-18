-- Rollback for supabase/migrations/0006_scope_addendum_phase5_bulk_wine.sql
-- See supabase/rollback/README.md before running this.

drop trigger if exists bulk_wine_details_broadcast_new_listing on public.bulk_wine_details;
drop function if exists public.broadcast_new_bulk_wine_listing();
