-- Class responsibilities: each class (department + semester + section) can have one
-- Class Teacher and one Class Coordinator (CC). Information only; no extra permissions.

create table public.class_roles (
  id text primary key,
  department_id text not null references public.departments (id) on delete cascade,
  semester int not null check (semester between 1 and 8),
  section text not null,
  role text not null check (role in ('class_teacher', 'class_coordinator')),
  faculty_id text not null references public.profiles (id) on delete cascade,
  created_by text,
  created_at timestamptz default now(),
  unique (department_id, semester, section, role)
);

create index on public.class_roles (faculty_id);

alter table public.class_roles enable row level security;

create policy "read class roles" on public.class_roles for select to authenticated using (true);

create policy "admin manages class roles" on public.class_roles for all to authenticated
  using (private.is_admin()) with check (private.is_admin());
