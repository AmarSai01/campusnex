-- Admins can backfill submissions and manage every user's notifications.
create policy "admin inserts submissions" on public.submissions for insert to authenticated
  with check (private.is_admin());

create policy "admin manages notifications" on public.notifications for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Exams may be scheduled for subjects that are not in the course catalogue.
alter table public.exam_timetables drop constraint exam_timetables_course_id_fkey;
