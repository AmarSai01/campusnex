-- Anonymous end-of-semester course feedback (needed for NAAC / NBA).
-- Answers and "who has answered" live in separate tables with nothing linking them, so no one,
-- admins included, can tell which student gave which answer. Each student answers once per course.
-- Results are shown only once at least 3 students have answered.

create table public.course_feedback (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (id) on delete cascade,
  -- Five questions, each rated 1 to 5 (see FEEDBACK_QUESTIONS in src/utils/feedback.js).
  ratings smallint[] not null check (
    array_length(ratings, 1) = 5 and 1 <= all (ratings) and 5 >= all (ratings)
  ),
  comment text check (char_length(comment) <= 1000),
  -- A date only: an exact time could be matched against when a student was online.
  submitted_on date not null default current_date
);

create index on public.course_feedback (course_id);

-- No policies: nobody reads or writes the table directly, only through the functions below.
alter table public.course_feedback enable row level security;

create table private.course_feedback_receipts (
  student_id text not null references public.profiles (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  primary key (student_id, course_id)
);

create or replace function public.submit_course_feedback(p_course_id text, p_ratings int[], p_comment text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id text := private.current_profile_id();
begin
  if v_id is null or private.current_role() <> 'student' then
    raise exception 'Only students can give course feedback.';
  end if;
  if not exists (select 1 from public.enrollments where student_id = v_id and course_id = p_course_id) then
    raise exception 'You can only give feedback for your own courses.';
  end if;

  insert into private.course_feedback_receipts (student_id, course_id) values (v_id, p_course_id)
  on conflict do nothing;
  if not found then
    raise exception 'You have already given feedback for this course.';
  end if;

  insert into public.course_feedback (course_id, ratings, comment)
  values (p_course_id, p_ratings::smallint[], nullif(btrim(coalesce(p_comment, '')), ''));
end;
$$;

-- Courses the caller has already given feedback for.
create or replace function public.my_feedback_courses() returns setof text
language sql stable security definer set search_path = '' as $$
  select course_id from private.course_feedback_receipts where student_id = private.current_profile_id()
$$;

-- Averages and comments for one course: its teacher, the HOD and admins. Below 3 responses only
-- the count is returned, so a single student's answers can't be singled out.
create or replace function public.course_feedback_summary(p_course_id text) returns json
language plpgsql stable security definer set search_path = '' as $$
declare
  v_responses int;
  v_enrolled int;
begin
  if not (private.is_admin() or private.teaches(p_course_id) or private.heads_course(p_course_id)) then
    raise exception 'You can only see feedback for courses you teach or oversee.';
  end if;

  select count(*) into v_responses from public.course_feedback where course_id = p_course_id;
  select count(*) into v_enrolled from public.enrollments where course_id = p_course_id;

  if v_responses < 3 then
    return json_build_object('responses', v_responses, 'enrolled', v_enrolled, 'averages', null, 'comments', null);
  end if;

  return json_build_object(
    'responses', v_responses,
    'enrolled', v_enrolled,
    'averages', (
      select json_agg(t.avg_rating order by t.q)
      from (
        select q, round(avg(f.ratings[q])::numeric, 2) as avg_rating
        from generate_series(1, 5) q
        cross join public.course_feedback f
        where f.course_id = p_course_id
        group by q
      ) t
    ),
    'comments', (
      select coalesce(json_agg(comment order by random()), '[]'::json)
      from public.course_feedback
      where course_id = p_course_id and comment is not null
    )
  );
end;
$$;

revoke execute on function public.submit_course_feedback(text, int[], text) from public, anon;
revoke execute on function public.my_feedback_courses() from public, anon;
revoke execute on function public.course_feedback_summary(text) from public, anon;
grant execute on function public.submit_course_feedback(text, int[], text) to authenticated;
grant execute on function public.my_feedback_courses() to authenticated;
grant execute on function public.course_feedback_summary(text) to authenticated;
