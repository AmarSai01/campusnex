-- Date of birth on every profile. Admins use it to create each person's starting login
-- password (students: USN + DOB, staff: email name + DOB; see the admin-logins function).
alter table public.profiles add column if not exists dob date;
