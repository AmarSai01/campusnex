-- Faster IA marks access rules, with the same meaning.
--
-- The old policies called private.is_admin(), private.teaches(course_id) and the HOD checks
-- once per ia_marks row, and the teacher write policy (FOR ALL) was also evaluated on every
-- read. A student matches none of the teacher/HOD checks, so every check ran on every row:
-- about 4 seconds for ~3,000 rows, which hit the statement timeout during sign-in and sent
-- students back to the login screen.
--
-- Now, the same way as 20261103000100_attendance_rls_speed.sql:
--   * "who am I" checks run once per query, wrapped in (select ...)
--   * the courses a teacher teaches, and the courses and students an HOD covers, are worked
--     out once as a set and each row is compared against it
--
-- Who can see and change what is unchanged: checked against the live data for admin, HOD,
-- faculty and student before and after applying.

alter policy "hod reads department ia marks" on public.ia_marks
  using (
    course_id in (select private.my_hod_course_ids())
    or student_id in (select private.my_hod_student_ids())
  );

alter policy "read ia marks" on public.ia_marks
  using (
    (select private.is_admin())
    or course_id in (select private.my_course_ids())
    or (student_id = (select private.current_profile_id()) and published)
  );

alter policy "teacher writes ia marks" on public.ia_marks
  using (
    (select private.is_admin())
    or course_id in (select private.my_course_ids())
  )
  with check (
    (select private.is_admin())
    or course_id in (select private.my_course_ids())
  );
