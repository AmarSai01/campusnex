-- Class sessions: one row per class actually held (or cancelled) on a date. A regular session
-- comes from a timetable slot; an extra session is a makeup class added by the teacher.
-- Attendance rows point at their session, so two periods of the same subject on one day count
-- as two classes, and a cancelled class counts for nobody.
--
-- Editing window: a teacher can mark or change attendance for classes up to 7 days old.
-- Older classes are locked until the HOD (or an admin) unlocks them for a short time.
-- Days follow the college's clock (India Standard Time).

-- ───────────────────────── Sessions ─────────────────────────

create table public.class_sessions (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  timetable_id text references public.timetable (id) on delete set null,
  date date not null,
  start_time text not null,
  end_time text not null,
  room text,
  kind text not null default 'regular' check (kind in ('regular', 'extra')),
  status text not null default 'held' check (status in ('held', 'cancelled')),
  cancel_reason text check (char_length(cancel_reason) <= 300),
  marked_by text references public.profiles (id) on delete set null,
  marked_at timestamptz,
  unlocked_until date,
  unlocked_by text references public.profiles (id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (status <> 'cancelled' or char_length(btrim(coalesce(cancel_reason, ''))) > 0),
  check (end_time > start_time),
  -- One session per timetable slot per day.
  unique (timetable_id, date)
);

create index on public.class_sessions (course_id, date);

alter table public.attendance
  add column session_id text references public.class_sessions (id) on delete cascade;

create index on public.attendance (session_id);

-- ───────────────────────── Editing window ─────────────────────────

create or replace function private.college_today() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Kolkata')::date
$$;

-- Attendance for a class on p_date can be written when the class is not in the future and is
-- at most 7 days old, or when its session has been unlocked.
create or replace function private.attendance_window_open(p_date date, p_session_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_date <= private.college_today() and (
    p_date >= private.college_today() - 7
    or exists (
      select 1 from public.class_sessions s
      where s.id = p_session_id and s.unlocked_until >= private.college_today()
    )
  )
$$;

grant execute on function private.college_today() to authenticated;
grant execute on function private.attendance_window_open(date, text) to authenticated;

-- ───────────────────────── Attendance writes ─────────────────────────

drop policy "teacher writes attendance" on public.attendance;

create policy "admin writes attendance" on public.attendance for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "teacher writes attendance in window" on public.attendance for all to authenticated
  using (private.teaches(course_id) and private.attendance_window_open(date, session_id))
  with check (private.teaches(course_id) and private.attendance_window_open(date, session_id));

-- ───────────────────────── Session access ─────────────────────────

alter table public.class_sessions enable row level security;

create policy "read class sessions" on public.class_sessions for select to authenticated using (true);

create policy "admin manages class sessions" on public.class_sessions for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Teachers can also plan ahead: add a makeup class or cancel a class on a future date.
create policy "teacher manages own class sessions in window" on public.class_sessions for all to authenticated
  using (
    private.teaches(course_id)
    and (date > private.college_today() or private.attendance_window_open(date, id))
  )
  with check (
    private.teaches(course_id)
    and (date > private.college_today() or private.attendance_window_open(date, id))
  );

-- The HOD unlocks locked classes in their department (creating the session row when the class
-- was never marked).
create policy "hod creates department class sessions" on public.class_sessions for insert to authenticated
  with check (private.heads_course(course_id));

create policy "hod updates department class sessions" on public.class_sessions for update to authenticated
  using (private.heads_course(course_id)) with check (private.heads_course(course_id));

-- Only the HOD or an admin may set or change an unlock.
create or replace function private.guard_class_session() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (tg_op = 'INSERT' and new.unlocked_until is not null)
     or (tg_op = 'UPDATE' and (new.unlocked_until is distinct from old.unlocked_until
                               or new.unlocked_by is distinct from old.unlocked_by)) then
    if not (private.is_admin() or private.heads_course(new.course_id)) then
      raise exception 'Only the HOD or an admin can unlock attendance.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger class_sessions_guard
  before insert or update on public.class_sessions
  for each row execute function private.guard_class_session();

revoke execute on function private.guard_class_session() from public, authenticated;
