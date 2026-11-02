-- The official copy (PDF or photo) of a semester calendar circular. Private bucket; files live at
--   <calendar_id>/<timestamp>-<file name>
-- Admins upload and remove them. Anyone signed in can read the file of a published calendar;
-- admins can read drafts too. The calendar row stores `storage://calendar-files/<path>`.

alter table public.semester_calendars
  add column attachment_url text,
  add column attachment_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('calendar-files', 'calendar-files', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin uploads calendar files" on storage.objects for insert to authenticated
  with check (bucket_id = 'calendar-files' and private.is_admin());

create policy "admin removes calendar files" on storage.objects for delete to authenticated
  using (bucket_id = 'calendar-files' and private.is_admin());

create policy "read calendar files" on storage.objects for select to authenticated
  using (
    bucket_id = 'calendar-files'
    and (
      private.is_admin()
      or exists (
        select 1 from public.semester_calendars c
        where c.id = (storage.foldername(name))[1] and c.status = 'published'
      )
    )
  );
