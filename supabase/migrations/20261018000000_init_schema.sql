-- Campusnex core schema
-- IDs are text so existing record IDs (e.g. 'student_1', 'course_cs301') carry over unchanged.

create schema if not exists private;

-- ───────────────────────── Tables ─────────────────────────

create table public.departments (
  id text primary key,
  name text not null,
  code text,
  head_faculty_id text,
  description text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.profiles (
  id text primary key,
  auth_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'faculty', 'student')),
  department_id text references public.departments (id) on delete set null,
  designation text,
  office text,
  phone text,
  photo_url text,
  usn text,
  roll_no text,
  semester int,
  section text,
  status text not null default 'active',
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index profiles_email_lower_idx on public.profiles (lower(email));
create unique index profiles_usn_idx on public.profiles (upper(usn)) where usn is not null and usn <> '';

create table public.courses (
  id text primary key,
  name text not null,
  code text,
  department_id text references public.departments (id) on delete cascade,
  faculty_id text references public.profiles (id) on delete set null,
  semester int,
  section text,
  credits int,
  color text,
  description text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.enrollments (
  id text primary key,
  student_id text not null references public.profiles (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  enrolled_at date default current_date
);

create table public.attendance (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  student_id text not null references public.profiles (id) on delete cascade,
  date date not null,
  status text not null,
  marked_by text,
  created_at timestamptz default now()
);

create table public.ia_marks (
  id text primary key,
  student_id text not null references public.profiles (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  ia_name text not null,
  score numeric,
  max_score numeric,
  published boolean not null default false,
  date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.assignments (
  id text primary key,
  course_id text not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  attachment_url text,
  attachment_name text,
  max_marks numeric,
  created_by text,
  created_at timestamptz default now()
);

create table public.submissions (
  id text primary key,
  assignment_id text not null references public.assignments (id) on delete cascade,
  student_id text not null references public.profiles (id) on delete cascade,
  file_url text,
  file_name text,
  comments text,
  submitted_at timestamptz default now(),
  marks numeric,
  max_marks numeric,
  feedback text,
  graded boolean not null default false,
  graded_at timestamptz,
  graded_by text
);

create table public.timetable (
  id text primary key,
  course_id text references public.courses (id) on delete cascade,
  section text,
  day_of_week text,
  start_time text,
  end_time text,
  room text,
  faculty_id text,
  created_at timestamptz default now()
);

create table public.announcements (
  id text primary key,
  author_id text,
  author_name text,
  author_role text,
  scope text,
  course_id text references public.courses (id) on delete cascade,
  department_id text,
  title text not null,
  body text,
  priority text,
  created_at timestamptz default now()
);

create table public.calendar_events (
  id text primary key,
  date date not null,
  end_date date,
  type text,
  title text not null,
  description text,
  affects_section text,
  created_by text,
  created_at timestamptz default now()
);

create table public.notifications (
  id text primary key,
  user_id text not null references public.profiles (id) on delete cascade,
  type text,
  reference_id text,
  title text,
  message text,
  read boolean not null default false,
  created_at timestamptz default now()
);

create table public.exam_rooms (
  id text primary key,
  name text not null,
  room_number text,
  capacity int,
  building text,
  floor text,
  status text default 'active',
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.exam_timetables (
  id text primary key,
  subject text,
  course_id text references public.courses (id) on delete cascade,
  department_id text,
  semester int,
  exam_date date,
  start_time text,
  end_time text,
  rooms text[] default '{}',
  room_ids text[] default '{}',
  exam_type text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.exam_seating_plans (
  id text primary key,
  exam_id text references public.exam_timetables (id) on delete cascade,
  exam_name text,
  room_id text,
  room_name text,
  capacity int,
  department_id text,
  department_ids text[] default '{}',
  group1 jsonb,
  group2 jsonb,
  seats jsonb default '[]',
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- student_id intentionally has no FK: seating plans can hold placeholder candidates.
create table public.exam_seatings (
  id text primary key,
  student_id text,
  student_name text,
  usn text,
  exam_id text references public.exam_timetables (id) on delete cascade,
  subject text,
  room_id text,
  room_name text,
  seat_number text,
  bench_row int,
  bench_col int,
  department_id text,
  branch text,
  section text,
  semester int,
  exam_date date,
  start_time text,
  end_time text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on public.profiles (auth_id);
create index on public.courses (faculty_id);
create index on public.enrollments (student_id);
create index on public.enrollments (course_id);
create index on public.attendance (course_id, date);
create index on public.attendance (student_id);
create index on public.ia_marks (course_id);
create index on public.ia_marks (student_id);
create index on public.assignments (course_id);
create index on public.submissions (assignment_id);
create index on public.submissions (student_id);
create index on public.timetable (course_id);
create index on public.announcements (course_id);
create index on public.notifications (user_id);
create index on public.exam_timetables (course_id);
create index on public.exam_seating_plans (exam_id);
create index on public.exam_seatings (exam_id);
create index on public.exam_seatings (student_id);

-- ───────────────────────── Auth helpers ─────────────────────────
-- security definer so policies can read the caller's profile without recursing into RLS.

create or replace function private.current_profile_id() returns text
language sql stable security definer set search_path = '' as $$
  select id from public.profiles where auth_id = (select auth.uid()) and status <> 'inactive'
$$;

create or replace function private.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where auth_id = (select auth.uid()) and status <> 'inactive'
$$;

create or replace function private.current_department() returns text
language sql stable security definer set search_path = '' as $$
  select department_id from public.profiles where auth_id = (select auth.uid())
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_role() = 'admin', false)
$$;

create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.current_role() in ('admin', 'faculty'), false)
$$;

create or replace function private.teaches(p_course_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.courses
    where id = p_course_id and faculty_id = private.current_profile_id()
  )
$$;

create or replace function private.teaches_assignment(p_assignment_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments a
    join public.courses c on c.id = a.course_id
    where a.id = p_assignment_id and c.faculty_id = private.current_profile_id()
  )
$$;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

-- Link a new auth account to the profile an admin created for that email.
-- Sign-up is refused for emails with no active profile (no public self-registration).
create or replace function private.link_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
     set auth_id = new.id, updated_at = now()
   where lower(email) = lower(new.email)
     and auth_id is null
     and status <> 'inactive';
  if not found then
    raise exception 'No Campusnex account is registered for %. Contact your administrator.', new.email;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.link_auth_user();

-- ───────────────────────── Row level security ─────────────────────────

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.ia_marks enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.timetable enable row level security;
alter table public.announcements enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notifications enable row level security;
alter table public.exam_rooms enable row level security;
alter table public.exam_timetables enable row level security;
alter table public.exam_seating_plans enable row level security;
alter table public.exam_seatings enable row level security;

-- Shared reference data: readable by any signed-in user, writable by admins.
create policy "read departments" on public.departments for select to authenticated using (true);
create policy "admin writes departments" on public.departments for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "read courses" on public.courses for select to authenticated using (true);
create policy "admin writes courses" on public.courses for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "read timetable" on public.timetable for select to authenticated using (true);
create policy "admin writes timetable" on public.timetable for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "read calendar" on public.calendar_events for select to authenticated using (true);
create policy "admin writes calendar" on public.calendar_events for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "read exam rooms" on public.exam_rooms for select to authenticated using (true);
create policy "admin writes exam rooms" on public.exam_rooms for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "read exam timetables" on public.exam_timetables for select to authenticated using (true);
create policy "admin writes exam timetables" on public.exam_timetables for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Profiles: staff see everyone; students see themselves and staff.
create policy "read profiles" on public.profiles for select to authenticated using (
  private.is_staff()
  or id = private.current_profile_id()
  or role in ('admin', 'faculty')
);
create policy "admin inserts profiles" on public.profiles for insert to authenticated
  with check (private.is_admin());
create policy "faculty inserts own-department students" on public.profiles for insert to authenticated
  with check (
    private.current_role() = 'faculty'
    and role = 'student'
    and department_id = private.current_department()
    and auth_id is null
  );
create policy "admin updates profiles" on public.profiles for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "faculty updates own-department students" on public.profiles for update to authenticated
  using (
    private.current_role() = 'faculty'
    and role = 'student'
    and department_id = private.current_department()
  )
  with check (
    role = 'student'
    and department_id = private.current_department()
  );
create policy "admin deletes profiles" on public.profiles for delete to authenticated
  using (private.is_admin());

-- Enrollments
create policy "read enrollments" on public.enrollments for select to authenticated using (
  private.is_staff() or student_id = private.current_profile_id()
);
create policy "staff inserts enrollments" on public.enrollments for insert to authenticated
  with check (private.is_staff());
create policy "admin manages enrollments" on public.enrollments for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Attendance
create policy "read attendance" on public.attendance for select to authenticated using (
  private.is_admin() or private.teaches(course_id) or student_id = private.current_profile_id()
);
create policy "teacher writes attendance" on public.attendance for all to authenticated
  using (private.is_admin() or private.teaches(course_id))
  with check (private.is_admin() or private.teaches(course_id));

-- IA marks: students only ever see published marks.
create policy "read ia marks" on public.ia_marks for select to authenticated using (
  private.is_admin()
  or private.teaches(course_id)
  or (student_id = private.current_profile_id() and published)
);
create policy "teacher writes ia marks" on public.ia_marks for all to authenticated
  using (private.is_admin() or private.teaches(course_id))
  with check (private.is_admin() or private.teaches(course_id));

-- Assignments
create policy "read assignments" on public.assignments for select to authenticated using (true);
create policy "teacher writes assignments" on public.assignments for all to authenticated
  using (private.is_admin() or private.teaches(course_id))
  with check (private.is_admin() or private.teaches(course_id));

-- Submissions: students submit/resubmit their own ungraded work; teachers grade.
create policy "read submissions" on public.submissions for select to authenticated using (
  private.is_admin()
  or private.teaches_assignment(assignment_id)
  or student_id = private.current_profile_id()
);
create policy "student submits" on public.submissions for insert to authenticated
  with check (
    student_id = private.current_profile_id()
    and graded = false and marks is null
  );
create policy "student withdraws ungraded" on public.submissions for delete to authenticated
  using (student_id = private.current_profile_id() and graded = false);
create policy "teacher grades" on public.submissions for update to authenticated
  using (private.is_admin() or private.teaches_assignment(assignment_id))
  with check (private.is_admin() or private.teaches_assignment(assignment_id));
create policy "admin deletes submissions" on public.submissions for delete to authenticated
  using (private.is_admin());

-- Announcements
create policy "read announcements" on public.announcements for select to authenticated using (true);
create policy "admin writes announcements" on public.announcements for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "faculty posts course announcements" on public.announcements for insert to authenticated
  with check (
    private.current_role() = 'faculty'
    and author_id = private.current_profile_id()
    and private.teaches(course_id)
  );

-- Notifications: users read and mark their own; staff notify anyone;
-- students may only raise submission alerts.
create policy "read own notifications" on public.notifications for select to authenticated
  using (user_id = private.current_profile_id());
create policy "send notifications" on public.notifications for insert to authenticated
  with check (private.is_staff() or type = 'assignment_submitted');
create policy "update own notifications" on public.notifications for update to authenticated
  using (user_id = private.current_profile_id())
  with check (user_id = private.current_profile_id());
create policy "delete own notifications" on public.notifications for delete to authenticated
  using (user_id = private.current_profile_id() or private.is_admin());

-- Exam seating
create policy "read seating plans" on public.exam_seating_plans for select to authenticated
  using (private.is_staff());
create policy "admin writes seating plans" on public.exam_seating_plans for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "read seatings" on public.exam_seatings for select to authenticated
  using (private.is_staff() or student_id = private.current_profile_id());
create policy "admin writes seatings" on public.exam_seatings for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
