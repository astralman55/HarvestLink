-- Removes everything migration 0011 added. Destroys all wanted requests, responses and messages.
drop table if exists public.wanted_alert_optouts;
drop table if exists public.wanted_notifications;
drop table if exists public.wanted_messages;
drop table if exists public.wanted_responses;
drop table if exists public.wanted_requests;
drop function if exists public.enforce_wanted_request_limit();
drop function if exists public.set_wanted_request_updated_at();
