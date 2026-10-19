-- Calendar events can target a department and/or semester, as well as a section.
-- All three empty means the event applies to the whole institution.

alter table public.calendar_events
  add column affects_department_id text references public.departments (id) on delete set null,
  add column affects_semester int check (affects_semester is null or affects_semester between 1 and 8);

create index on public.calendar_events (affects_department_id);
