-- Rollback for supabase/migrations/0004_scope_addendum_phase2_usernames.sql
-- See supabase/rollback/README.md before running this. Run 0005_rollback.sql
-- first.

-- 2. Username-aware login lookup function.
revoke all on function public.get_email_for_login(text) from service_role;
drop function if exists public.get_email_for_login(text);

-- 1. Restore handle_new_user() to its pre-username body (from
--    0002_buyer_profile_fields.sql).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, company_name, full_name, role, region_ava, address)
  values (
    new.id,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'buyer'::public.user_role),
    new.raw_user_meta_data->>'region_ava',
    new.raw_user_meta_data->>'address'
  );
  return new;
end;
$$;

-- 0. The one reserved_usernames row this migration added (the table itself
--    is dropped by 0003_rollback.sql).
delete from public.reserved_usernames where term = 'choose-username';
