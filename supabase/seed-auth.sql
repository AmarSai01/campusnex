-- Creates confirmed Supabase Auth accounts for every active profile that has none,
-- all using the demo password. The on_auth_user_created trigger links each to its profile.
-- Demo/staging only: never run this against production data.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  lower(p.email), extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
from public.profiles p
where p.auth_id is null and p.status <> 'inactive'
  and not exists (select 1 from auth.users u where lower(u.email) = lower(p.email));

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where not exists (select 1 from auth.identities i where i.user_id = u.id);

-- Re-link profiles that were re-created for an email that already has a login.
update public.profiles p set auth_id = u.id
from auth.users u
where lower(u.email) = lower(p.email) and p.auth_id is null;
