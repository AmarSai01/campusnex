-- Pilot requests from the landing page form.
-- Anyone (signed in or not) can send a request; only admins can read, update or delete them.

create table public.pilot_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  plan text not null check (plan in ('pilot', 'institution')),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  role text not null check (role in ('Principal', 'Director', 'HOD', 'College office or admin', 'Faculty', 'Other')),
  college text not null check (char_length(btrim(college)) between 1 and 200),
  city text not null check (char_length(btrim(city)) between 1 and 100),
  departments integer check (departments between 1 and 50),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email text check (email is null or (char_length(email) <= 200 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

create index pilot_requests_created_at_idx on public.pilot_requests (created_at desc);

alter table public.pilot_requests enable row level security;

-- Visitors can only add a new request; they can never read requests back.
create policy "Anyone can send a pilot request"
  on public.pilot_requests for insert
  to anon, authenticated
  with check (status = 'new');

create policy "Admins read pilot requests"
  on public.pilot_requests for select
  to authenticated
  using (private.is_admin());

create policy "Admins update pilot requests"
  on public.pilot_requests for update
  to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "Admins delete pilot requests"
  on public.pilot_requests for delete
  to authenticated
  using (private.is_admin());

-- Basic spam guard: the same mobile number can send one request every 10 minutes,
-- and at most 30 requests are accepted per hour in total.
create or replace function private.pilot_request_throttle() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.pilot_requests
    where phone = new.phone and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'A request from this number was just received. Please wait a few minutes.'
      using errcode = 'P0001';
  end if;
  if (select count(*) from public.pilot_requests where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many requests right now. Please try again later.'
      using errcode = 'P0001';
  end if;
  new.status := 'new';
  new.created_at := now();
  return new;
end;
$$;

create trigger pilot_requests_throttle
  before insert on public.pilot_requests
  for each row execute function private.pilot_request_throttle();
