# Supabase backend

Campusnex stores all data in Supabase (PostgreSQL) and uses Supabase Auth for sign-in.

## Layout

- `migrations/` — schema, row-level security policies, the HOD role, risk alerts and the
  auth-linking trigger, in order.

## How accounts work

- Every person has a row in `public.profiles` with their role (`admin`, `faculty`, `student`).
- A faculty member becomes **HOD** when an admin selects them as head of a department.
- Admins (and HODs, for students in their own department) create profiles in the app, with a
  date of birth (`profiles.dob`).
- When an **admin** adds someone (form or CSV import), the app calls the `admin-logins` Edge
  Function. It checks the caller is an active admin, creates the login with the starting
  password (students: USN + DOB as DDMMYYYY; staff: email name + DOB) and returns it once.
  The `on_auth_user_created` trigger links the new login to the profile by email.
- The same function resets a password (`reset`) and copies a corrected email onto a login
  (`sync_email`). There is no public sign-up.
- **Forgot password?** on the login page emails a reset link.
- Row-level security decides what each role can read and change; the browser never has more
  access than the signed-in user.

## Setting up a new project

1. Create a Supabase project and run the files in `migrations/` in order (SQL editor or
   `supabase db push`). Deploy the functions in `functions/` (`supabase functions deploy`).
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
3. In **Authentication → Sign In / Providers**, turn off **Allow new users to sign up** (logins
   are created only by the `admin-logins` function). In **Authentication → URL Configuration**, set **Site URL** to your website's address and add
   it (plus `http://localhost:5173` for local development) to **Redirect URLs**, so confirmation
   and password-reset emails link back to the site.
4. Create the first admin profile in the SQL editor:
   ```sql
   insert into public.profiles (id, name, email, role, status)
   values ('admin_' || substr(md5(random()::text), 1, 8), 'Your Name', 'you@yourcollege.edu', 'admin', 'active');
   ```
   Then, in **Authentication → Users → Add user**, create a user with the same email, a password
   and **Auto Confirm User** ticked. The trigger links it to the profile.
5. Sign in as admin and add departments, faculty, students and courses from the app.
