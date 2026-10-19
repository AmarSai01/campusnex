-- Assignment submission files. Private bucket; files live at
--   <assignment_id>/<student profile id>/<timestamp>-<file name>
-- A student uploads only into their own folder, and only for an assignment in a course they
-- are enrolled in. The student, the subject teacher, the HOD and admins can read the file.

insert into storage.buckets (id, name, public, file_size_limit)
values ('submissions', 'submissions', false, 10485760)
on conflict (id) do nothing;

create or replace function private.enrolled_in_assignment(p_assignment_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments a
    join public.enrollments e on e.course_id = a.course_id
    where a.id = p_assignment_id and e.student_id = private.current_profile_id()
  )
$$;

grant execute on function private.enrolled_in_assignment(text) to authenticated;

create policy "student uploads own submission file" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[2] = private.current_profile_id()
    and private.enrolled_in_assignment((storage.foldername(name))[1])
  );

create policy "read submission files" on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and (
      (storage.foldername(name))[2] = private.current_profile_id()
      or private.is_admin()
      or private.teaches_assignment((storage.foldername(name))[1])
      or private.heads_assignment((storage.foldername(name))[1])
    )
  );

create policy "student deletes own submission file" on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[2] = private.current_profile_id());
