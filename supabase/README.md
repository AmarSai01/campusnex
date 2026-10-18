# Supabase backend

Campusnex stores all data in Supabase (PostgreSQL) and uses Supabase Auth for sign-in.

## Layout

- `migrations/` — schema, row-level security policies, the HOD role, risk alerts and the
  auth-linking trigger, in order.

## How accounts work

- Every person has a row in `public.profiles` with their role (`admin`, `faculty`, `student`).
- A faculty member becomes **HOD** when an admin selects them as head of a department.
- Admins (and faculty, for students in their own department) create profiles in the app.
- The person then chooses **Activate your account** on the login page and signs up with the
  same email. A trigger links the new login to the profile. Sign-up is refused for emails
  without a profile, so there is no public registration.
- **Forgot password?** on the login page emails a reset link.
- Row-level security decides what each role can read and change; the browser never has more
  access than the signed-in user.

## Setting up a new project

1. Create a Supabase project and run the files in `migrations/` in order (SQL editor or
   `supabase db push`).
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
3. In **Authentication → URL Configuration**, set **Site URL** to your website's address and add
   it (plus `http://localhost:5173` for local development) to **Redirect URLs**, so confirmation
   and password-reset emails link back to the site.
4. Create the first admin profile in the SQL editor:
   ```sql
   insert into public.profiles (id, name, email, role, status)
   values ('admin_' || substr(md5(random()::text), 1, 8), 'Your Name', 'you@yourcollege.edu', 'admin', 'active');
   ```
   Then open the website, choose **Activate your account**, and sign up with that email.
5. Sign in as admin and add departments, faculty, students and courses from the app.
