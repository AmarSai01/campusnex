-- Where each department's office is, e.g. "Block A, Room 204". Optional free text.

alter table public.departments add column office_room text;
