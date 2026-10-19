-- Files teachers attach to assignments (problem statements, specs). Private bucket; files live at
--   <course_id>/<timestamp>-<file name>
-- The subject teacher and admins upload; students enrolled in the course, the teacher, the HOD
-- and admins can read.

insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-files', 'assignment-files', false, 20971520)
on conflict (id) do nothing;

create or replace function private.enrolled_in_course(p_course_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments
    where course_id = p_course_id and student_id = private.current_profile_id()
  )
$$;

grant execute on function private.enrolled_in_course(text) to authenticated;

create policy "teacher uploads assignment files" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'assignment-files'
    and (private.is_admin() or private.teaches((storage.foldername(name))[1]))
  );

create policy "read assignment files" on storage.objects for select to authenticated
  using (
    bucket_id = 'assignment-files'
    and (
      private.is_admin()
      or private.teaches((storage.foldername(name))[1])
      or private.heads_course((storage.foldername(name))[1])
      or private.enrolled_in_course((storage.foldername(name))[1])
    )
  );

create policy "teacher deletes assignment files" on storage.objects for delete to authenticated
  using (
    bucket_id = 'assignment-files'
    and (private.is_admin() or private.teaches((storage.foldername(name))[1]))
  );
