// Loads src/data/seedData.js into Supabase, signed in as the demo admin.
// Usage: npm run db:seed   (reads .env.local)
// The admin profile and its auth account must already exist (see supabase/README.md).
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import * as SEED from '../src/data/seedData.js';
import { TABLES, toRow } from '../src/lib/db-schema.js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const SEED_BY_KEY = {
  departments: SEED.SEED_DEPARTMENTS,
  users: SEED.SEED_USERS,
  courses: SEED.SEED_COURSES,
  enrollments: SEED.SEED_ENROLLMENTS,
  attendance: SEED.SEED_ATTENDANCE,
  ia_marks: SEED.SEED_IA_MARKS,
  assignments: SEED.SEED_ASSIGNMENTS,
  submissions: SEED.SEED_SUBMISSIONS,
  timetable: SEED.SEED_TIMETABLE,
  announcements: SEED.SEED_ANNOUNCEMENTS,
  calendar_events: SEED.SEED_CALENDAR_EVENTS,
  notifications: SEED.SEED_NOTIFICATIONS,
  exam_rooms: SEED.SEED_EXAM_ROOMS,
  exam_timetables: SEED.SEED_EXAM_TIMETABLE,
  exam_seating_plans: SEED.SEED_EXAM_SEATING_PLANS,
  exam_seatings: SEED.SEED_EXAM_SEATINGS
};

const { error: authError } = await supabase.auth.signInWithPassword({
  email: 'admin@campusnex.edu',
  password: env.VITE_DEMO_PASSWORD
});
if (authError) {
  console.error('Admin sign-in failed:', authError.message);
  process.exit(1);
}

for (const { key, table, columns } of TABLES) {
  const rows = (SEED_BY_KEY[key] || []).map((r) => toRow(columns, r));
  if (!rows.length) continue;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${table}: ${rows.length} rows`);
}

await supabase.auth.signOut();
console.log('Seed complete. Run supabase/seed-auth.sql to create logins for the new profiles.');
