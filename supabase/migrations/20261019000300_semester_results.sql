-- Semester results (university end-exam results), entered by admins and published per semester.
-- Students see only their own published results; the HOD of the student's department can view;
-- only admins can add, change, publish or delete.

create table public.results (
  id text primary key,
  student_id text not null references public.profiles (id) on delete cascade,
  semester int not null check (semester between 1 and 8),
  course_code text not null,
  course_name text,
  credits numeric not null check (credits > 0),
  cie numeric,
  see numeric,
  total numeric check (total is null or total between 0 and 100),
  grade text not null check (grade in ('O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F')),
  grade_point int not null check (grade_point between 0 and 10),
  published boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (student_id, semester, course_code)
);

create index on public.results (student_id);
create index on public.results (semester);

alter table public.results enable row level security;

create policy "read results" on public.results for select to authenticated using (
  private.is_admin()
  or private.heads_student(student_id)
  or (student_id = private.current_profile_id() and published)
);

create policy "admin manages results" on public.results for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
