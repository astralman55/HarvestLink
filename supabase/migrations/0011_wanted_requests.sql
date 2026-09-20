-- "Wanted" requests: a buyer (or grower) posts what grapes or bulk wine they are
-- looking for, and sellers respond. Run this once in the Supabase SQL Editor,
-- after 0010. Then set NEXT_PUBLIC_FEATURE_WANTED=true in Vercel and redeploy.
--
-- Privacy model (same approach as migration 0008): the public API roles get NO
-- access to any of these tables. Every read and write goes through the server
-- with the service role, which checks who is asking, serializes the row and
-- hides an anonymous poster's identity. A poster's user id is never exposed,
-- because profiles_public would otherwise turn it back into a company name.

-- 1. wanted_requests ----------------------------------------------------------
create table public.wanted_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_type listing_type not null,
  variety text not null check (char_length(btrim(variety)) between 2 and 80),
  -- County names, as on listings. Empty means "any region".
  regions text[] not null default '{}' check (cardinality(regions) <= 5),
  -- Tons for grapes, gallons for bulk wine.
  quantity_min numeric not null check (quantity_min > 0),
  quantity_max numeric check (quantity_max is null or quantity_max >= quantity_min),
  -- Per ton (grapes) or per gallon (bulk wine). Only shown publicly when show_price is true.
  max_price numeric check (max_price is null or max_price > 0),
  show_price boolean not null default false,
  -- Harvest year (grapes) or vintage (bulk wine).
  year integer check (year is null or year between 2000 and 2100),
  farming_practice text check (farming_practice is null or farming_practice in ('conventional', 'sustainable', 'organic', 'biodynamic')),
  notes text not null default '' check (char_length(notes) <= 500),
  -- On by default: the poster's name and company are hidden from responders.
  is_anonymous boolean not null default true,
  status text not null default 'open' check (status in ('open', 'filled', 'closed')),
  expires_at timestamp with time zone not null default (now() + interval '60 days'),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  check (expires_at <= created_at + interval '120 days')
);

create index wanted_requests_user_id_idx on public.wanted_requests (user_id);
create index wanted_requests_open_idx on public.wanted_requests (created_at desc) where status = 'open';
create index wanted_requests_variety_idx on public.wanted_requests (variety);

alter table public.wanted_requests enable row level security;
revoke all on public.wanted_requests from anon, authenticated;
-- No policies on purpose: with RLS on and no policy, the API roles see nothing.

create or replace function public.set_wanted_request_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger wanted_requests_set_updated_at
  before update on public.wanted_requests
  for each row execute procedure public.set_wanted_request_updated_at();

-- Backstop for the app's own limit: at most 10 open requests per member.
create or replace function public.enforce_wanted_request_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'open' and (
    select count(*) from public.wanted_requests
    where user_id = new.user_id and status = 'open' and expires_at > now()
  ) >= 10 then
    raise exception 'You can have up to 10 open requests.';
  end if;
  return new;
end;
$$;

create trigger wanted_requests_enforce_limit
  before insert on public.wanted_requests
  for each row execute procedure public.enforce_wanted_request_limit();

-- 2. wanted_responses: one thread per responder per request --------------------
create table public.wanted_responses (
  id uuid default gen_random_uuid() primary key,
  request_id uuid not null references public.wanted_requests(id) on delete cascade,
  responder_id uuid not null references public.profiles(id) on delete cascade,
  -- Optional: one of the responder's own lots offered against the request.
  listing_id uuid references public.listings(id) on delete set null,
  -- When true the poster sees "Confidential Seller" instead of the responder's name.
  responder_anonymous boolean not null default false,
  created_at timestamp with time zone not null default now(),
  unique (request_id, responder_id)
);

create index wanted_responses_request_id_idx on public.wanted_responses (request_id);
create index wanted_responses_responder_id_idx on public.wanted_responses (responder_id);

alter table public.wanted_responses enable row level security;
revoke all on public.wanted_responses from anon, authenticated;

-- 3. wanted_messages ----------------------------------------------------------
create table public.wanted_messages (
  id uuid default gen_random_uuid() primary key,
  response_id uuid not null references public.wanted_responses(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamp with time zone not null default now()
);

create index wanted_messages_response_id_idx on public.wanted_messages (response_id);

alter table public.wanted_messages enable row level security;
revoke all on public.wanted_messages from anon, authenticated;

-- 4. Bookkeeping for the daily "sellers with a matching lot" email ---------------
-- One row per request once its matching sellers have been emailed, so a request
-- is announced at most once. Server-only.
create table public.wanted_notifications (
  request_id uuid primary key references public.wanted_requests(id) on delete cascade,
  notified_at timestamp with time zone not null default now()
);

alter table public.wanted_notifications enable row level security;
revoke all on public.wanted_notifications from anon, authenticated;

-- Members who used the unsubscribe link in one of those emails. Server-only.
create table public.wanted_alert_optouts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

alter table public.wanted_alert_optouts enable row level security;
revoke all on public.wanted_alert_optouts from anon, authenticated;
