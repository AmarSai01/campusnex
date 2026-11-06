-- Pilot requests come from colleges asking to try Campusnex, so they belong to the
-- Campusnex owner, not to a college's admins. Remove admin access; new requests are
-- sent to the owner by email instead.

drop policy if exists "Admins read pilot requests" on public.pilot_requests;
drop policy if exists "Admins update pilot requests" on public.pilot_requests;
drop policy if exists "Admins delete pilot requests" on public.pilot_requests;
