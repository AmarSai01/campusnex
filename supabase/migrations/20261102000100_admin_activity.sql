-- Admin activity log: what each admin changed and when. Triggers write it, so it can't be
-- skipped, and nobody can edit or delete entries (there are no write policies).
-- Only changes made by a signed-in admin are logged; teachers' own edits are not.
--
-- record  = the row after the change (before, for a delete), so a deleted row stays readable.
-- changes = { column: [before, after] } for the watched columns that changed.

create table public.admin_activity (
  id text primary key default gen_random_uuid()::text,
  actor_id text,
  category text not null,
  action text not null,
  entity_table text not null,
  entity_id text,
  record jsonb,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index on public.admin_activity (created_at desc);

alter table public.admin_activity enable row level security;

create policy "admins read activity" on public.admin_activity for select to authenticated
  using (private.is_admin());

-- { column: [old, new] } for each watched column whose value changed.
create or replace function private.activity_changes(old_row jsonb, new_row jsonb, watched text[])
returns jsonb language sql immutable set search_path = '' as $$
  select coalesce(jsonb_object_agg(k, jsonb_build_array(old_row -> k, new_row -> k)), '{}'::jsonb)
  from unnest(watched) as k
  where (old_row -> k) is distinct from (new_row -> k);
$$;

create or replace function private.log_admin_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  category text := tg_argv[0];
  watched text[] := tg_argv[1]::text[];
  old_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  diff jsonb;
  act text;
begin
  if not private.is_admin() then
    return null;
  end if;

  if tg_op = 'INSERT' then
    act := 'added';
  elsif tg_op = 'DELETE' then
    act := 'removed';
  else
    diff := private.activity_changes(old_row, new_row, watched);
    if diff = '{}'::jsonb then
      return null;
    end if;
    act := 'edited';
    if diff ? 'status' and tg_table_name = 'profiles' then
      act := case when new_row ->> 'status' = 'inactive' then 'deactivated' else 'reactivated' end;
    elsif diff ? 'published' and tg_table_name = 'results' then
      act := case when (new_row ->> 'published')::boolean then 'published' else 'unpublished' end;
    elsif diff ? 'status' and tg_table_name = 'semester_calendars' and new_row ->> 'status' = 'published' then
      act := 'published';
    end if;
  end if;

  -- Draft results are working data; only publishing them and later edits are worth recording.
  if tg_table_name = 'results' and act in ('added', 'removed')
     and not coalesce((coalesce(new_row, old_row) ->> 'published')::boolean, false) then
    return null;
  end if;

  insert into public.admin_activity (actor_id, category, action, entity_table, entity_id, record, changes)
  values (
    private.current_profile_id(),
    category,
    act,
    tg_table_name,
    coalesce(new_row, old_row) ->> 'id',
    -- Broadcast bodies can be long; the title is enough here.
    coalesce(new_row, old_row) - 'body',
    diff
  );
  return null;
end;
$$;

create trigger log_admin_activity after insert or update or delete on public.profiles
  for each row execute function private.log_admin_activity(
    'users', '{name,email,role,department_id,designation,usn,roll_no,semester,section,batch,status}');

create trigger log_admin_activity after insert or update or delete on public.courses
  for each row execute function private.log_admin_activity(
    'courses', '{name,code,department_id,faculty_id,semester,section,credits}');

create trigger log_admin_activity after insert or update or delete on public.departments
  for each row execute function private.log_admin_activity(
    'departments', '{name,code,head_faculty_id,office_room}');

create trigger log_admin_activity after insert or update or delete on public.results
  for each row execute function private.log_admin_activity(
    'results', '{published,cie,see,total,grade,grade_point}');

create trigger log_admin_activity after insert or update or delete on public.timetable
  for each row execute function private.log_admin_activity(
    'timetable', '{course_id,section,batch,day_of_week,start_time,end_time,room,faculty_id}');

create trigger log_admin_activity after insert or update or delete on public.semester_calendars
  for each row execute function private.log_admin_activity(
    'calendars', '{title,ref_no,semesters,department_id,status,attachment_url,updated_at}');

create trigger log_admin_activity after insert or update or delete on public.calendar_events
  for each row execute function private.log_admin_activity(
    'calendars', '{date,end_date,type,title,affects_department_id,affects_semester,affects_section}');

create trigger log_admin_activity after insert or delete on public.class_roles
  for each row execute function private.log_admin_activity('class_roles', '{}');

create trigger log_admin_activity after insert or update or delete on public.exam_timetables
  for each row execute function private.log_admin_activity(
    'exams', '{subject,course_id,exam_date,start_time,end_time,room_ids,exam_type}');

create trigger log_admin_activity after insert or delete on public.announcements
  for each row execute function private.log_admin_activity('broadcasts', '{}');
