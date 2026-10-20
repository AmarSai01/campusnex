-- Attendance minimum raised to 85%: students need 85% in each subject to sit the SEE.
-- Same functions as 20261019000100_hod_role.sql with the new threshold. Keep in sync with
-- RISK_RULES in src/utils/risk.js.

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
    when 'attendance' then format('Attendance in %s is %s%% (minimum 85%% to sit the SEE).', v_course.code, p_pct)
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
    if v_att_pct < 85 then
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

revoke execute on function private.notify_risk(text, text, text, int) from public, authenticated;
revoke execute on function private.evaluate_student_risk(text, text) from public, authenticated;
