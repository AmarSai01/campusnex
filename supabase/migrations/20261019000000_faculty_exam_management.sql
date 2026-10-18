-- Faculty manage exams and seating for their own department.
-- Deleting an exam stays admin-only; faculty may replace seating when they regenerate it.

create or replace function private.exam_in_my_department(p_exam_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.exam_timetables
    where id = p_exam_id
      and department_id = private.current_department()
      and private.current_role() = 'faculty'
  )
$$;

grant execute on function private.exam_in_my_department(text) to authenticated;

create policy "faculty schedules own-department exams" on public.exam_timetables
  for insert to authenticated
  with check (private.current_role() = 'faculty' and department_id = private.current_department());

create policy "faculty edits own-department exams" on public.exam_timetables
  for update to authenticated
  using (private.current_role() = 'faculty' and department_id = private.current_department())
  with check (department_id = private.current_department());

create policy "faculty manages own-department seating plans" on public.exam_seating_plans
  for all to authenticated
  using (private.exam_in_my_department(exam_id))
  with check (private.exam_in_my_department(exam_id));

create policy "faculty manages own-department seatings" on public.exam_seatings
  for all to authenticated
  using (private.exam_in_my_department(exam_id))
  with check (private.exam_in_my_department(exam_id));
