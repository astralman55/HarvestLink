-- Fixes "Database error saving new user" on sign-up, and reshapes profiles
-- for the buyer flow (Name + optional Company Name + Address, no AVA region).
--
-- Root cause of the sign-up error: the handle_new_user() trigger casts to
-- the `user_role` enum without a pinned search_path. SECURITY DEFINER
-- functions don't reliably inherit the caller's search_path, so the
-- unqualified `::user_role` cast can fail to resolve `public.user_role`,
-- which surfaces to the client as a generic "Database error saving new
-- user". Re-created below with `set search_path = public` and an
-- explicitly schema-qualified cast.
--
-- Run this once in the Supabase SQL Editor for a project that already ran
-- 0001_init.sql.

-- 1. Profiles: buyers may have no company, do have a name, and give an
--    address instead of an operational AVA region.
alter table public.profiles alter column company_name drop not null;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists address text;

-- 2. Re-create the trigger function with a pinned search_path and
--    schema-qualified enum cast; also stop forcing a fallback company name
--    (buyers legitimately have none) and populate the new fields.
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

-- 3. Defense in depth: the trigger runs as SECURITY DEFINER and should
--    bypass RLS on its own, but an explicit insert policy removes any
--    dependency on the function owner's privileges.
drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);
