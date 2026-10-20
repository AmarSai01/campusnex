-- Student requests and grievances: bonafide certificates, attendance or marks corrections, and
-- anything else. Students raise them; the subject teacher (for attendance and marks), the HOD of
-- the student's department and admins see and answer them.

create table public.student_requests (
  id text primary key,
  student_id text not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('bonafide', 'attendance', 'marks', 'other')),
  course_id text references public.courses (id) on delete set null,
  subject text not null check (char_length(btrim(subject)) between 3 and 150),
  details text not null check (char_length(btrim(details)) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'rejected')),
  response text check (char_length(response) <= 2000),
  responded_by text references public.profiles (id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Attendance and marks requests are always about one subject.
  check (type not in ('attendance', 'marks') or course_id is not null)
);

create index on public.student_requests (student_id);
create index on public.student_requests (course_id);

alter table public.student_requests enable row level security;

create policy "read student requests" on public.student_requests for select to authenticated
  using (
    student_id = private.current_profile_id()
    or private.is_admin()
    or private.heads_student(student_id)
    or (course_id is not null and private.teaches(course_id))
  );

create policy "student raises request" on public.student_requests for insert to authenticated
  with check (
    student_id = private.current_profile_id()
    and private.current_role() = 'student'
    and status = 'open'
    and response is null
    and responded_by is null
    and (course_id is null or private.enrolled_in_course(course_id))
  );

-- Students can withdraw a request nobody has picked up yet.
create policy "student withdraws open request" on public.student_requests for delete to authenticated
  using (student_id = private.current_profile_id() and status = 'open');

create policy "staff answers request" on public.student_requests for update to authenticated
  using (
    private.is_admin()
    or private.heads_student(student_id)
    or (course_id is not null and private.teaches(course_id))
  )
  with check (
    private.is_admin()
    or private.heads_student(student_id)
    or (course_id is not null and private.teaches(course_id))
  );

-- What the student wrote can't be changed; answering stamps who and when.
create or replace function private.on_student_request_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.student_id <> old.student_id or new.type <> old.type
     or new.course_id is distinct from old.course_id
     or new.subject <> old.subject or new.details <> old.details
     or new.created_at <> old.created_at then
    raise exception 'The request itself cannot be edited.';
  end if;
  new.updated_at := now();
  if new.status <> old.status or new.response is distinct from old.response then
    new.responded_by := private.current_profile_id();
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger student_request_update before update on public.student_requests
  for each row execute function private.on_student_request_update();

-- Notifications: the people who handle a new request, and the student when it is answered.
create or replace function private.on_student_request_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_student record;
  v_recipient text;
  v_label text;
begin
  select id, name, usn, department_id into v_student from public.profiles where id = new.student_id;
  v_label := case new.type
    when 'bonafide' then 'Bonafide certificate'
    when 'attendance' then 'Attendance correction'
    when 'marks' then 'Marks correction'
    else 'Request' end;

  if tg_op = 'INSERT' then
    for v_recipient in
      select distinct r from (
        select c.faculty_id as r from public.courses c where c.id = new.course_id
        union all
        select d.head_faculty_id from public.departments d where d.id = v_student.department_id
      ) x
      where r is not null and r <> new.student_id
    loop
      insert into public.notifications (id, user_id, type, reference_id, title, message)
      values (
        'req_' || replace(gen_random_uuid()::text, '-', ''), v_recipient, 'request_created', new.id,
        format('%s from %s (%s)', v_label, v_student.name, coalesce(v_student.usn, v_student.id)),
        new.subject
      );
    end loop;
  elsif new.status <> old.status or new.response is distinct from old.response then
    insert into public.notifications (id, user_id, type, reference_id, title, message)
    values (
      'req_' || replace(gen_random_uuid()::text, '-', ''), new.student_id, 'request_updated', new.id,
      format('%s: %s', v_label, case new.status
        when 'in_review' then 'in review' when 'resolved' then 'resolved'
        when 'rejected' then 'not approved' else 'open' end),
      coalesce(new.response, new.subject)
    );
  end if;
  return null;
end;
$$;

create trigger student_request_notify after insert or update on public.student_requests
  for each row execute function private.on_student_request_notify();

revoke execute on function private.on_student_request_update() from public, authenticated;
revoke execute on function private.on_student_request_notify() from public, authenticated;
