-- Rolls back 0010_login_events.sql. Deletes all recorded sign-in activity.
drop table if exists public.login_events;
