-- Student self-service: class averages for the My Performance board, and editing one's own
-- phone number and profile photo from My Profile.
-- Students still cannot read classmates' rows: the averages function returns aggregates only,
-- for courses the caller is enrolled in, and only when at least 3 students are counted.

-- ───────────────────────── Class averages ─────────────────────────

-- One row per enrolled course for attendance (kind 'attendance', a late counts as half a class)
-- and one row per published IA test (kind 'ia'). avg_pct is the class average in percent.
create or replace function public.my_class_averages()
returns table (course_id text, kind text, ia_name text, avg_pct numeric, max_score numeric, students int)
language sql stable security definer set search_path = '' as $$
  with mine as (
    select e.course_id as cid from public.enrollments e
    where e.student_id = private.current_profile_id()
  ),
  att as (
    select a.course_id as cid, a.student_id as sid,
      sum(case a.status when 'present' then 1 when 'late' then 0.5 else 0 end) * 100.0 / count(*) as pct
    from public.attendance a
    join mine on mine.cid = a.course_id
    group by a.course_id, a.student_id
  ),
  ia as (
    select m.course_id as cid, m.ia_name as test, m.student_id as sid,
      m.score * 100.0 / m.max_score as pct, m.max_score as max_score
    from public.ia_marks m
    join mine on mine.cid = m.course_id
    where m.published and m.max_score > 0 and m.score is not null
  )
  select att.cid, 'attendance', null::text, round(avg(att.pct), 1), null::numeric, count(*)::int
  from att group by att.cid having count(*) >= 3
  union all
  select ia.cid, 'ia', ia.test, round(avg(ia.pct), 1), max(ia.max_score), count(*)::int
  from ia group by ia.cid, ia.test having count(*) >= 3
$$;

revoke execute on function public.my_class_averages() from public, anon;
grant execute on function public.my_class_averages() to authenticated;

-- ───────────────────────── Own contact details ─────────────────────────

-- Anyone signed in may change only their own phone and photo; every other profile field
-- stays with admins and HODs.
create or replace function public.update_my_contact(p_phone text, p_photo_url text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id text := private.current_profile_id();
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_photo text := nullif(btrim(coalesce(p_photo_url, '')), '');
begin
  if v_id is null then
    raise exception 'No active profile for this account.';
  end if;
  if v_phone is not null and v_phone !~ '^[0-9+() -]{7,20}$' then
    raise exception 'Enter a valid phone number (7 to 20 digits, spaces, +, - or brackets).';
  end if;
  if v_photo is not null and (v_photo !~ '^https://' or length(v_photo) > 500) then
    raise exception 'Photo must be an https link.';
  end if;

  update public.profiles
  set phone = v_phone, photo_url = v_photo, updated_by = v_id, updated_at = now()
  where id = v_id;
end;
$$;

revoke execute on function public.update_my_contact(text, text) from public, anon;
grant execute on function public.update_my_contact(text, text) to authenticated;

-- ───────────────────────── Profile photos ─────────────────────────

-- Public bucket: photos show in headers and directories. Each person writes only inside
-- a folder named after their profile id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "read own avatar files" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = private.current_profile_id());

create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = private.current_profile_id());

create policy "delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = private.current_profile_id());
