-- Who an announcement is for.
--   scope    global | department | class | course
--   audience all | students | faculty (global and department notices; class and course
--            notices are for students)
--   class    department_id + semester + section, for a Class CC's notice to their class
-- Admins post anything. HODs post to their own department, for students, faculty or both.
-- A Class CC posts to their own class. Teachers post to a subject they teach (unchanged).
-- Each notice is readable only by the people it is for, its author, the HOD or CC who
-- oversees it, and admins.

alter table public.announcements
  add column audience text not null default 'all' check (audience in ('all', 'students', 'faculty')),
  add column semester integer,
  add column section text;

alter table public.announcements
  add constraint announcements_scope_check check (scope in ('global', 'department', 'class', 'course')),
  add constraint announcements_class_check check (
    scope <> 'class' or (department_id is not null and semester is not null and section is not null)
  );

-- The signed-in student is in this class.
create or replace function private.in_class(p_department_id text, p_semester integer, p_section text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where auth_id = (select auth.uid()) and status <> 'inactive' and role = 'student'
      and department_id = p_department_id and semester = p_semester and section = p_section
  )
$$;

-- The signed-in teacher is the Class CC of this class.
create or replace function private.coordinates_class(p_department_id text, p_semester integer, p_section text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.class_roles
    where faculty_id = private.current_profile_id() and role = 'class_coordinator'
      and department_id = p_department_id and semester = p_semester and section = p_section
  )
$$;

-- The notice's audience includes the signed-in user's role.
create or replace function private.audience_includes_me(p_audience text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case p_audience
    when 'students' then private.current_role() = 'student'
    when 'faculty' then private.current_role() = 'faculty'
    else private.current_role() in ('student', 'faculty')
  end
$$;

drop policy "read announcements" on public.announcements;
create policy "read announcements" on public.announcements for select to authenticated
  using (
    private.is_admin()
    or author_id = private.current_profile_id()
    or (scope = 'global' and private.audience_includes_me(audience))
    or (scope = 'department' and (
      private.heads_department(department_id)
      or (department_id = private.current_department() and private.audience_includes_me(audience))
    ))
    or (scope = 'class' and (
      private.in_class(department_id, semester, section)
      or private.coordinates_class(department_id, semester, section)
      or private.heads_department(department_id)
    ))
    or (scope = 'course' and (
      private.enrolled_in_course(course_id) or private.teaches(course_id) or private.heads_course(course_id)
    ))
  );

drop policy "faculty posts course announcements" on public.announcements;
create policy "faculty posts course announcements" on public.announcements for insert to authenticated
  with check (
    scope = 'course'
    and audience = 'students'
    and private.current_role() = 'faculty'
    and author_id = private.current_profile_id()
    and private.teaches(course_id)
  );

-- Unchanged apart from now also choosing students, faculty or both.
drop policy "hod posts department announcements" on public.announcements;
create policy "hod posts department announcements" on public.announcements for insert to authenticated
  with check (
    scope = 'department'
    and author_id = private.current_profile_id()
    and private.heads_department(department_id)
  );

create policy "cc posts class announcements" on public.announcements for insert to authenticated
  with check (
    scope = 'class'
    and audience = 'students'
    and author_id = private.current_profile_id()
    and private.coordinates_class(department_id, semester, section)
  );
