-- Lab batches and teacher timetable edits.
--
-- A class (department + semester + section) can be split into batches for labs: half the class
-- in one lab while the other half is in another. A slot with no batch is for the whole class.
-- Teachers may add, move and remove slots for the subjects they teach; HODs for their department.
-- Every timetable change is written to timetable_changes by a trigger, so it can't be skipped,
-- and admins can review and undo them.

alter table public.timetable add column batch text
  check (batch is null or batch in ('B1', 'B2', 'B3', 'B4'));
alter table public.profiles add column batch text
  check (batch is null or batch in ('B1', 'B2', 'B3', 'B4'));

-- Teachers edit their own subjects' slots; HODs any slot in their department.
create policy "faculty adds own timetable slots" on public.timetable for insert to authenticated
  with check (private.teaches(course_id) or private.heads_course(course_id));
create policy "faculty edits own timetable slots" on public.timetable for update to authenticated
  using (private.teaches(course_id) or private.heads_course(course_id))
  with check (private.teaches(course_id) or private.heads_course(course_id));
create policy "faculty removes own timetable slots" on public.timetable for delete to authenticated
  using (private.teaches(course_id) or private.heads_course(course_id));

create table public.timetable_changes (
  id text primary key default gen_random_uuid()::text,
  slot_id text not null,
  course_id text,
  action text not null check (action in ('added', 'changed', 'removed')),
  before jsonb,
  after jsonb,
  changed_by text,
  changed_by_role text,
  created_at timestamptz not null default now(),
  undone_at timestamptz,
  undone_by text
);

create index on public.timetable_changes (created_at desc);

alter table public.timetable_changes enable row level security;

create policy "read timetable changes" on public.timetable_changes for select to authenticated
  using (private.is_admin() or changed_by = private.current_profile_id());

create policy "admin marks timetable changes undone" on public.timetable_changes for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

create or replace function private.log_timetable_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.timetable_changes (slot_id, course_id, action, before, after, changed_by, changed_by_role)
  values (
    coalesce(new.id, old.id),
    coalesce(new.course_id, old.course_id),
    case tg_op when 'INSERT' then 'added' when 'UPDATE' then 'changed' else 'removed' end,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    private.current_profile_id(),
    private.current_role()
  );
  return null;
end;
$$;

create trigger log_timetable_change
  after insert or update or delete on public.timetable
  for each row execute function private.log_timetable_change();
