-- Semester calendars: the full-semester schedule a college's Controller of Examinations
-- publishes as one circular (CIE tests, SEE, ERP deadlines, results). Kept apart from
-- calendar_events, which holds one-off holidays and events.
-- Admins create and publish them. Everyone signed in can read published ones.

create table public.semester_calendars (
  id text primary key,
  title text not null,
  ref_no text,
  semesters int[] not null default '{}' check (semesters <@ array[1, 2, 3, 4, 5, 6, 7, 8]),
  department_id text references public.departments (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.semester_calendar_items (
  id text primary key,
  calendar_id text not null references public.semester_calendars (id) on delete cascade,
  activity text not null,
  start_date date not null,
  end_date date,
  type text not null default 'milestone'
    check (type in ('milestone', 'registration', 'cie', 'see', 'classes', 'deadline', 'results', 'holiday')),
  sort_order int not null default 0,
  check (end_date is null or end_date >= start_date)
);

create index on public.semester_calendar_items (calendar_id);

alter table public.semester_calendars enable row level security;
alter table public.semester_calendar_items enable row level security;

create policy "read semester calendars" on public.semester_calendars for select to authenticated
  using (private.is_admin() or status = 'published');

create policy "admin manages semester calendars" on public.semester_calendars for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "read semester calendar items" on public.semester_calendar_items for select to authenticated
  using (
    private.is_admin()
    or exists (
      select 1 from public.semester_calendars c
      where c.id = calendar_id and c.status = 'published'
    )
  );

create policy "admin manages semester calendar items" on public.semester_calendar_items for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
