-- Student records are managed by admins and by the HOD of the student's department.
-- Regular faculty can no longer add or edit students. Deleting stays admin-only.

drop policy "faculty inserts own-department students" on public.profiles;
drop policy "faculty updates own-department students" on public.profiles;

create policy "hod inserts department students" on public.profiles for insert to authenticated
  with check (
    role = 'student'
    and auth_id is null
    and private.heads_department(department_id)
  );

create policy "hod updates department students" on public.profiles for update to authenticated
  using (role = 'student' and private.heads_department(department_id))
  with check (role = 'student' and private.heads_department(department_id));

-- Enrolments are added by admins (existing policy) or by the HOD when adding or editing
-- a student in their department.
drop policy "staff inserts enrollments" on public.enrollments;

create policy "hod enrols department students" on public.enrollments for insert to authenticated
  with check (private.heads_student(student_id));
