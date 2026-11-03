-- Faster attendance access rules, with the same meaning.
--
-- The old policies called private.is_admin(), private.teaches(course_id) and the HOD checks
-- once per attendance row, and the teacher write policy (FOR ALL) was also evaluated on every
-- read. With tens of thousands of rows this made sign-in take minutes and HOD reads time out.
--
-- Now:
--   * "who am I" checks run once per query, wrapped in (select ...)
--   * the courses a teacher teaches, and the courses and students an HOD covers, are worked
--     out once as a set and each row is compared against it
--   * the teacher's 7-day / unlocked-session window applies only to insert, update and delete,
--     which is what it guards; reading is covered by "read attendance" as before
--
-- Who can see and change what is unchanged: checked against the live data for admin, HOD,
-- faculty and student before applying.

create or replace function private.my_course_ids() returns setof text
language sql stable security definer set search_path = '' as $$
  select id from public.courses where faculty_id = (select private.current_profile_id())
$$;

create or replace function private.my_hod_department_ids() returns setof text
language sql stable security definer set search_path = '' as $$
  select d.id from public.departments d
  where (select private.current_role()) = 'faculty'
    and d.head_faculty_id = (select private.current_profile_id())
$$;

create or replace function private.my_hod_course_ids() returns setof text
language sql stable security definer set search_path = '' as $$
  select c.id from public.courses c where c.department_id in (select private.my_hod_department_ids())
$$;

create or replace function private.my_hod_student_ids() returns setof text
language sql stable security definer set search_path = '' as $$
  select p.id from public.profiles p
  where p.role = 'student' and p.department_id in (select private.my_hod_department_ids())
$$;

grant execute on function
  private.my_course_ids(),
  private.my_hod_department_ids(),
  private.my_hod_course_ids(),
  private.my_hod_student_ids()
to authenticated;

alter policy "admin writes attendance" on public.attendance
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy "hod reads department attendance" on public.attendance
  using (
    course_id in (select private.my_hod_course_ids())
    or student_id in (select private.my_hod_student_ids())
  );

alter policy "read attendance" on public.attendance
  using (
    (select private.is_admin())
    or course_id in (select private.my_course_ids())
    or student_id = (select private.current_profile_id())
  );

drop policy "teacher writes attendance in window" on public.attendance;

create policy "teacher inserts attendance in window" on public.attendance
  for insert to authenticated
  with check (
    course_id in (select private.my_course_ids())
    and private.attendance_window_open(date, session_id)
  );

create policy "teacher updates attendance in window" on public.attendance
  for update to authenticated
  using (
    course_id in (select private.my_course_ids())
    and private.attendance_window_open(date, session_id)
  )
  with check (
    course_id in (select private.my_course_ids())
    and private.attendance_window_open(date, session_id)
  );

create policy "teacher deletes attendance in window" on public.attendance
  for delete to authenticated
  using (
    course_id in (select private.my_course_ids())
    and private.attendance_window_open(date, session_id)
  );
