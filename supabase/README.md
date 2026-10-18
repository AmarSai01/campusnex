# Supabase backend

Campusnex stores all data in Supabase (PostgreSQL) and uses Supabase Auth for sign-in.

## Layout

- `migrations/` — schema, row-level security policies and the auth-linking trigger, in order.
- `seed-auth.sql` — creates demo logins for every profile that has none (demo/staging only).
- `../scripts/seed-supabase.mjs` — loads `src/data/seedData.js` into the database (`npm run db:seed`).

## How accounts work

- Every person has a row in `public.profiles` with their role (`admin`, `faculty`, `student`).
- Admins (and faculty, for students in their own department) create profiles in the app.
- The person then chooses **Activate your account** on the login screen and signs up with the
  same email. A trigger links the new auth account to the profile. Sign-up is refused for
  emails without a profile, so there is no public registration.
- Row-level security decides what each role can read and change; the browser never has more
  access than the signed-in user.

## Setting up a new project

1. Create a Supabase project and run the files in `migrations/` in order (SQL editor or `supabase db push`).
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
3. For a demo dataset:
   1. In the SQL editor, create the first admin profile:
      ```sql
      insert into public.departments (id, name, code) values ('dept_cse', 'Computer Science & Engineering', 'CSE');
      insert into public.profiles (id, name, email, role, department_id)
      values ('admin_1', 'Dr. Sarah Connor', 'admin@campusnex.edu', 'admin', 'dept_cse');
      ```
   2. Run `seed-auth.sql` to give it a login, set `VITE_DEMO_PASSWORD` in `.env.local`, then run `npm run db:seed`.
   3. Run `seed-auth.sql` again to create logins for the remaining seeded profiles.
4. For production, skip the demo seed, leave `VITE_DEMO_PASSWORD` unset, and enable email
   confirmation in Authentication settings.
