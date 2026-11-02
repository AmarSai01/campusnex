-- Class Sheets: filled templates a teacher uploads back. They are kept apart from live
-- attendance and IA marks; marks reach ia_marks only through an explicit "copy" in the app.
--
-- rows    = [{ student_id, usn, name, batch, values: { column: value }, problems: [column] }]
-- summary = { matched, unknown: [usn], duplicates: [usn], problems: [text] }
-- The original file lives in the private sheet-files bucket at <course_id>/<timestamp>-<name>.

create table public.uploaded_sheets (
  id text primary key default gen_random_uuid()::text,
  course_id text not null references public.courses (id) on delete cascade,
  kind text not null check (kind in ('students', 'ia', 'attendance', 'lab_marks', 'lab_attendance')),
  file_name text not null,
  file_url text not null,
  columns jsonb not null default '[]'::jsonb,
  max_marks jsonb not null default '{}'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  previous_versions jsonb not null default '[]'::jsonb,
  copied_at timestamptz,
  copy_summary text,
  uploaded_by text references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.uploaded_sheets (course_id, created_at desc);

alter table public.uploaded_sheets enable row level security;

-- The subject's teacher manages them; the HOD and admins can read them.
create policy "read uploaded sheets" on public.uploaded_sheets for select to authenticated
  using (private.is_admin() or private.teaches(course_id) or private.heads_course(course_id));

create policy "teacher uploads sheets" on public.uploaded_sheets for insert to authenticated
  with check (private.teaches(course_id) and uploaded_by = private.current_profile_id());

create policy "teacher updates sheets" on public.uploaded_sheets for update to authenticated
  using (private.teaches(course_id)) with check (private.teaches(course_id));

create policy "teacher or admin deletes sheets" on public.uploaded_sheets for delete to authenticated
  using (private.teaches(course_id) or private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sheet-files', 'sheet-files', false, 10485760, array[
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-excel',
  'text/plain'
])
on conflict (id) do nothing;

create policy "teacher uploads sheet files" on storage.objects for insert to authenticated
  with check (bucket_id = 'sheet-files' and private.teaches((storage.foldername(name))[1]));

create policy "read sheet files" on storage.objects for select to authenticated
  using (
    bucket_id = 'sheet-files'
    and (
      private.is_admin()
      or private.teaches((storage.foldername(name))[1])
      or private.heads_course((storage.foldername(name))[1])
    )
  );

create policy "teacher or admin removes sheet files" on storage.objects for delete to authenticated
  using (
    bucket_id = 'sheet-files'
    and (private.is_admin() or private.teaches((storage.foldername(name))[1]))
  );
