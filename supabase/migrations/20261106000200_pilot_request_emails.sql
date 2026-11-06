-- Email the Campusnex owner when a college sends a pilot request.
--
-- After each new pilot_requests row, pg_net calls the notify-pilot-request Edge Function with
-- the row's id. The function reads the row itself and emails it through Resend, then stamps
-- notified_at so a request is never emailed twice. The call is asynchronous: saving the
-- request never waits for, or fails because of, the email.
--
-- Needs the RESEND_API_KEY secret in Supabase (Edge Functions > Secrets).

create extension if not exists pg_net;

alter table public.pilot_requests add column if not exists notified_at timestamptz;

create or replace function private.notify_pilot_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(
    url := 'https://whrcjlxarjulexgwkpox.supabase.co/functions/v1/notify-pilot-request',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  return null;
end;
$$;

revoke execute on function private.notify_pilot_request() from public, anon, authenticated;

drop trigger if exists pilot_requests_notify on public.pilot_requests;
create trigger pilot_requests_notify
  after insert on public.pilot_requests
  for each row execute function private.notify_pilot_request();
