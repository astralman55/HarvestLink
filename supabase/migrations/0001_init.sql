-- HarvestLink initial schema
-- Run this once in the Supabase SQL Editor for a connected project
-- (Supabase Dashboard -> SQL Editor -> paste -> Run).

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. Enums for structural domain restraints
create type user_role as enum ('grower', 'buyer', 'admin');
create type listing_status as enum ('available', 'pending', 'sold', 'archived');
create type crop_status as enum ('dormant', 'flowering', 'veraison', 'harvested');
create type farming_practice as enum ('conventional', 'sustainable', 'organic', 'biodynamic');

-- 2. Profiles table (linked to Supabase Auth)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    company_name text not null,
    contact_phone text,
    role user_role not null default 'buyer',
    region_ava text,
    is_verified boolean default false not null
);

-- 3. Grape classified listings table, extended with the vineyard-level
--    attributes buyers actually search on (farming practice, trellis, soil,
--    exposure, slope, harvest year).
create table public.listings (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    variety text not null,
    clone text,
    rootstock text,
    region_ava text not null,
    sub_ava text,
    estimated_tons numeric(10,2) not null,
    minimum_tons numeric(10,2) default 1.00 not null,
    price_per_ton numeric(10,2) not null,
    brix_target numeric(4,1),
    description text,
    status listing_status default 'available' not null,
    farming_practice farming_practice not null default 'conventional',
    trellis_system text,
    soil_type text,
    sun_exposure text,
    slope_percent numeric(5,2),
    harvest_year integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index listings_region_ava_idx on public.listings (region_ava);
create index listings_variety_idx on public.listings (variety);
create index listings_farming_practice_idx on public.listings (farming_practice);
create index listings_harvest_year_idx on public.listings (harvest_year);

-- 4. Forward crop planning & futures alignment table
create table public.crop_plans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    harvest_year integer not null,
    variety text not null,
    block_identifier text,
    projected_tons numeric(10,2) not null,
    current_status crop_status default 'dormant' not null,
    buyer_aligned_id uuid references public.profiles(id) on delete set null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Automate profile creation on Supabase Auth sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name, role, region_ava)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'company_name', 'Independent Vineyard/Winery'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer'::user_role),
    new.raw_user_meta_data->>'region_ava'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Row-Level Security (RLS) multi-tenant policies
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.crop_plans enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

-- Listings policies
create policy "Listings are viewable by anyone." on public.listings for select using (true);
create policy "Growers can insert their own listings." on public.listings for insert with check (auth.uid() = user_id);
create policy "Growers can update their own listings." on public.listings for update using (auth.uid() = user_id);
create policy "Growers can delete their own listings." on public.listings for delete using (auth.uid() = user_id);

-- Crop plans policies
create policy "Users can view their own crop plans." on public.crop_plans for select using (auth.uid() = user_id OR auth.uid() = buyer_aligned_id);
create policy "Growers can modify their own crop plans." on public.crop_plans for all using (auth.uid() = user_id);

-- 7. Realtime: broadcast inserts on listings so the marketplace can surface
--    "new yield" alerts to buyers browsing live (see useRealtimeListings).
alter publication supabase_realtime add table public.listings;
