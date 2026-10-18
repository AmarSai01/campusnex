-- Head of Department (HOD)
-- A faculty member becomes HOD of a department when an admin sets departments.head_faculty_id.
-- HODs keep their faculty permissions and gain read-only access to their department's
-- attendance, IA marks (including unpublished) and submissions, and can post department notices.
-- Risk alerts are raised server-side whenever attendance or IA marks change.
--
-- Risk thresholds must match src/utils/risk.js:
--   attendance below 75%  (only once at least 4 classes are held)
--   published IA average below 40%

-- ───────────────────────── HOD helpers ─────────────────────────

create or replace function private.heads_department(p_department_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.current_role() = 'faculty' and exists (
    select 1 from public.departments
    where id = p_department_id and head_faculty_id = private.current_profile_id()
  )
$$;

create or replace function private.heads_course(p_course_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id and private.heads_department(c.department_id)
  )
$$;

create or replace function private.heads_student(p_student_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_student_id and p.role = 'student' and private.heads_department(p.department_id)
  )
$$;

create or replace function private.heads_assignment(p_assignment_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments a
    where a.id = p_assignment_id and private.heads_course(a.course_id)
  )
$$;

grant execute on all functions in schema private to authenticated;

-- ───────────────────────── HOD read access ─────────────────────────

create policy "hod reads department attendance" on public.attendance for select to authenticated
  using (private.heads_course(course_id) or private.heads_student(student_id));

create policy "hod reads department ia marks" on public.ia_marks for select to authenticated
  using (private.heads_course(course_id) or private.heads_student(student_id));

create policy "hod reads department submissions" on public.submissions for select to authenticated
  using (private.heads_assignment(assignment_id) or private.heads_student(student_id));

-- ───────────────────────── HOD department notices ─────────────────────────

create policy "hod posts department announcements" on public.announcements for insert to authenticated
  with check (
    scope = 'department'
    and author_id = private.current_profile_id()
    and private.heads_department(department_id)
  );

-- ───────────────────────── Risk alerts ─────────────────────────

-- One open alert per student, subject and kind. Cleared when the student recovers,
-- so a later drop alerts again.
create table private.risk_alerts (
  student_id text not null references public.profiles (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  kind text not null check (kind in ('attendance', 'marks')),
  created_at timestamptz not null default now(),
  primary key (student_id, course_id, kind)
);

create or replace function private.notify_risk(
  p_student_id text, p_course_id text, p_kind text, p_pct int
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_student record;
  v_course record;
  v_hod_id text;
  v_type text := case p_kind when 'attendance' then 'attendance_risk' else 'marks_risk' end;
  v_detail text;
  v_recipient text;
begin
  insert into private.risk_alerts (student_id, course_id, kind)
  values (p_student_id, p_course_id, p_kind)
  on conflict do nothing;
  if not found then
    return; -- already alerted for this drop
  end if;

  select id, name, usn, department_id into v_student from public.profiles where id = p_student_id;
  select id, code, name, faculty_id into v_course from public.courses where id = p_course_id;
  select head_faculty_id into v_hod_id from public.departments where id = v_student.department_id;

  v_detail := case p_kind
    when 'attendance' then format('Attendance in %s is %s%% (minimum 75%%).', v_course.code, p_pct)
    else format('IA average in %s is %s%% (minimum 40%%).', v_course.code, p_pct)
  end;

  insert into public.notifications (id, user_id, type, reference_id, title, message)
  values (
    'risk_' || replace(gen_random_uuid()::text, '-', ''),
    v_student.id, v_type, p_course_id,
    case p_kind when 'attendance' then format('Attendance shortage in %s', v_course.code)
                else format('Low IA marks in %s', v_course.code) end,
    v_detail || case p_kind when 'attendance' then ' Attend upcoming classes to stay eligible.'
                            else ' Talk to your subject teacher about improving.' end
  );

  for v_recipient in
    select distinct r from unnest(array[v_course.faculty_id, v_hod_id]) as r
    where r is not null and r <> v_student.id
      and exists (select 1 from public.profiles where id = r)
  loop
    insert into public.notifications (id, user_id, type, reference_id, title, message)
    values (
      'risk_' || replace(gen_random_uuid()::text, '-', ''),
      v_recipient, v_type, p_student_id,
      format('At-risk student: %s (%s)', v_student.name, coalesce(v_student.usn, v_student.id)),
      v_detail
    );
  end loop;
end;
$$;

create or replace function private.evaluate_student_risk(p_student_id text, p_course_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_held int;
  v_attended numeric;
  v_att_pct int;
  v_tests int;
  v_marks_pct int;
begin
  if not exists (select 1 from public.profiles where id = p_student_id and role = 'student')
     or not exists (select 1 from public.courses where id = p_course_id) then
    return;
  end if;

  select count(*),
         coalesce(sum(case status when 'present' then 1 when 'late' then 0.5 else 0 end), 0)
    into v_held, v_attended
    from public.attendance
   where student_id = p_student_id and course_id = p_course_id;

  if v_held >= 4 then
    v_att_pct := round(v_attended * 100 / v_held);
    if v_att_pct < 75 then
      perform private.notify_risk(p_student_id, p_course_id, 'attendance', v_att_pct);
    else
      delete from private.risk_alerts
       where student_id = p_student_id and course_id = p_course_id and kind = 'attendance';
    end if;
  end if;

  select count(*), round(avg(score * 100.0 / max_score))
    into v_tests, v_marks_pct
    from public.ia_marks
   where student_id = p_student_id and course_id = p_course_id
     and published and max_score > 0 and score is not null;

  if v_tests > 0 then
    if v_marks_pct < 40 then
      perform private.notify_risk(p_student_id, p_course_id, 'marks', v_marks_pct);
    else
      delete from private.risk_alerts
       where student_id = p_student_id and course_id = p_course_id and kind = 'marks';
    end if;
  end if;
end;
$$;

create or replace function private.on_risk_source_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform private.evaluate_student_risk(new.student_id, new.course_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and (old.student_id, old.course_id) is distinct from (new.student_id, new.course_id)) then
    perform private.evaluate_student_risk(old.student_id, old.course_id);
  end if;
  return null;
end;
$$;

create trigger attendance_risk_check
  after insert or update or delete on public.attendance
  for each row execute function private.on_risk_source_change();

create trigger ia_marks_risk_check
  after insert or update or delete on public.ia_marks
  for each row execute function private.on_risk_source_change();

-- Alert functions are internal: only the triggers call them.
revoke execute on function private.notify_risk(text, text, text, int) from public, authenticated;
revoke execute on function private.evaluate_student_risk(text, text) from public, authenticated;
revoke execute on function private.on_risk_source_change() from public, authenticated;

-- Evaluate existing data once so current at-risk students are alerted.
select private.evaluate_student_risk(student_id, course_id)
from (
  select student_id, course_id from public.attendance
  union
  select student_id, course_id from public.ia_marks
) pairs;
