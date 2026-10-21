-- Assignment submissions: a student can only submit to assignments of classes they are enrolled
-- in, and the server records the submission time, so work handed in after the due date is
-- always tagged Late (the browser's clock can't be used to backdate it).

drop policy "student submits" on public.submissions;

create policy "student submits" on public.submissions for insert to authenticated
  with check (
    student_id = private.current_profile_id()
    and graded = false
    and marks is null
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and private.enrolled_in_course(a.course_id)
    )
  );

create or replace function private.stamp_submission_time() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if private.current_role() = 'student' then
    new.submitted_at := now();
  end if;
  return new;
end;
$$;

create trigger submissions_stamp_time
  before insert on public.submissions
  for each row execute function private.stamp_submission_time();

revoke execute on function private.stamp_submission_time() from public, authenticated;
