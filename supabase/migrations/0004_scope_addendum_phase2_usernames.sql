-- Scope Addendum Phase 2: Usernames.
-- Run this once in the Supabase SQL Editor, after 0003.

-- 0. One more route-colliding reserved name added by this phase's own
--    build (USR-4's list is stored in the DB precisely so it can grow
--    without a code deploy).
insert into public.reserved_usernames (term) values ('choose-username')
  on conflict (term) do nothing;

-- 1. Populate username at signup time, alongside the other profile fields
--    already set from auth metadata. Re-created (not altered) because
--    Postgres has no "add insert column" syntax for a function body.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, company_name, full_name, role, region_ava, address, username)
  values (
    new.id,
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'buyer'::public.user_role),
    new.raw_user_meta_data->>'region_ava',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$;

-- 2. USR-6: login accepts email OR username. Supabase Auth's
--    signInWithPassword only takes an email, so the login Server Action
--    resolves a username to its account's email first, then signs in
--    normally (preserving GoTrue's own password verification, rate
--    limiting, and session issuance -- this function only does the lookup).
--
--    This function is intentionally NOT reachable by the anon/authenticated
--    PostgREST roles, only by service_role (see src/lib/supabase/admin.ts).
--    That keeps USR-9's "email is never exposed through a username lookup"
--    true even against a caller hitting Supabase's REST API directly,
--    bypassing this app's own UI entirely.
create or replace function public.get_email_for_login(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.username_normalized = lower(p_identifier)
  limit 1;
  return v_email;
end;
$$;

revoke all on function public.get_email_for_login(text) from public, anon, authenticated;
grant execute on function public.get_email_for_login(text) to service_role;
