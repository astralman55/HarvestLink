-- Sign-in activity: when someone signed in, roughly from where, on what kind of device.
-- Run this once in the Supabase SQL Editor, after 0009.
--
-- Written only by the Next.js server (service role) after a successful sign-in.
-- The location comes from Vercel's request headers (derived from the IP address),
-- so it is only ever country / region / city, and only a SHORTENED IP network
-- (IPv4 /24, IPv6 /48) is kept, never the full address. Members can read their
-- own rows (the "Security" page); nobody can write or edit through the public API.
-- The daily cron job deletes rows older than 180 days.

create table public.login_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  method text not null check (method in ('password', 'signup_code', 'email_link', 'password_reset')),
  country text check (char_length(country) <= 8),
  region text check (char_length(region) <= 80),
  city text check (char_length(city) <= 120),
  ip_network text check (char_length(ip_network) <= 64),
  device text check (char_length(device) <= 120)
);

create index login_events_user_created_idx on public.login_events (user_id, created_at desc);
create index login_events_created_idx on public.login_events (created_at);

alter table public.login_events enable row level security;

create policy "Members can view their own sign-in activity." on public.login_events
  for select using (auth.uid() = user_id);

-- No insert/update/delete policies exist and the grants below are read-only,
-- so the browser-facing roles can never forge or erase a sign-in record.
revoke all on public.login_events from anon, authenticated;
grant select on public.login_events to authenticated;
