// Timetable-driven attendance. A class session is one class on one date: a timetable slot
// (regular) or a makeup class (extra). Attendance rows point at their session.
// Keep the 7-day editing window in sync with private.attendance_window_open in
// supabase/migrations/20261021000200_class_sessions.sql.

import { eventAppliesTo } from './calendarScope';

export const EDIT_WINDOW_DAYS = 7;
export const UNLOCK_DAYS = 2;
export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES = ['Sunday', ...WEEK_DAYS];

// Dates are "YYYY-MM-DD" strings in the college's local time.
export const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseISODate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (iso, n) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
export const dayName = (iso) => DAY_NAMES[parseISODate(iso).getDay()];
export const todayISO = (now = new Date()) => toISODate(now);
export const nowHHMM = (now = new Date()) =>
  `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

// Monday to Saturday of the week containing `iso`.
export function weekOf(iso) {
  const d = parseISODate(iso);
  const back = (d.getDay() + 6) % 7; // days since Monday
  const monday = addDays(iso, -back);
  return WEEK_DAYS.map((_, i) => addDays(monday, i));
}

export const regularSessionId = (timetableId, date) => `ses_${timetableId}_${date}`;
const newId = (prefix) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

// The holiday (if any) that cancels a course's classes on a date: an academic calendar holiday
// that reaches the course's students, or a holiday in a published semester calendar for them.
export function holidayFor(date, course, data) {
  const asStudent = {
    role: 'student',
    department_id: course.department_id,
    semester: course.semester,
    section: course.section
  };
  const event = (data.calendar_events || []).find(
    (e) =>
      e.type === 'holiday' &&
      e.date <= date &&
      (e.end_date || e.date) >= date &&
      eventAppliesTo(e, asStudent)
  );
  if (event) return event.title;

  const calendars = new Map(
    (data.semester_calendars || [])
      .filter(
        (c) =>
          c.status === 'published' &&
          (!c.department_id || c.department_id === course.department_id) &&
          (c.semesters || []).map(Number).includes(Number(course.semester))
      )
      .map((c) => [c.id, c])
  );
  const item = (data.semester_calendar_items || []).find(
    (i) => i.type === 'holiday' && calendars.has(i.calendar_id) && i.start_date <= date && (i.end_date || i.start_date) >= date
  );
  return item ? item.activity : null;
}

// Every class a teacher has on a date: their timetable slots for that weekday plus any extra
// classes they added, in time order. Each item carries its saved session, if there is one.
export function classesOn(date, facultyId, data) {
  const courseById = new Map(data.courses.filter((c) => c.faculty_id === facultyId).map((c) => [c.id, c]));
  const sessions = (data.class_sessions || []).filter((s) => s.date === date && courseById.has(s.course_id));
  const weekday = dayName(date);

  const regular = data.timetable
    .filter((slot) => slot.day_of_week === weekday && courseById.has(slot.course_id))
    .map((slot) => {
      const session = sessions.find((s) => s.timetable_id === slot.id) || null;
      return {
        key: regularSessionId(slot.id, date),
        date,
        course: courseById.get(slot.course_id),
        timetableId: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        room: slot.room || '',
        // A lab slot can be for one batch of the section (B1, B2...); null = the whole section.
        batch: slot.batch || null,
        kind: 'regular',
        session
      };
    });

  const extra = sessions
    .filter((s) => s.kind === 'extra')
    .map((s) => ({
      key: s.id,
      date,
      course: courseById.get(s.course_id),
      timetableId: null,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room || '',
      batch: null,
      kind: 'extra',
      session: s
    }));

  return [...regular, ...extra].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

// Attendance rows for a class: its session's rows, or for a regular class marked before sessions
// existed, that day's rows for the course.
export function sessionRows(item, attendance) {
  if (item.session) return attendance.filter((a) => a.session_id === item.session.id);
  if (item.kind !== 'regular') return [];
  return attendance.filter((a) => !a.session_id && a.course_id === item.course.id && a.date === item.date);
}

// Whether attendance for a class on `date` can be written today.
export function isLocked(date, session, today) {
  if (date > today) return false;
  if (date >= addDays(today, -EDIT_WINDOW_DAYS)) return false;
  return !(session?.unlocked_until && session.unlocked_until >= today);
}

// What a class card shows. `now` = { date, time } in the college's local time.
export function classStatus(item, data, now) {
  const { session } = item;
  if (session?.status === 'cancelled') return 'cancelled';
  if (session?.marked_at) return 'marked';
  if (!session && sessionRows(item, data.attendance).length) return 'marked';
  if (item.kind === 'regular' && holidayFor(item.date, item.course, data)) return 'holiday';
  if (item.date > now.date) return 'upcoming';
  if (item.date === now.date) {
    if (now.time < item.start_time) return 'upcoming';
    if (now.time < item.end_time) return 'now';
  }
  return isLocked(item.date, session, now.date) ? 'locked' : 'pending';
}

// The first date a regular class can be missed: when its timetable slot was added, and not before
// the course's first marked class (so classes before attendance began are not counted).
function countsFrom(item, data) {
  const added = data.timetable.find((t) => t.id === item.timetableId)?.created_at?.slice(0, 10) || '';
  const firstMarked = data.attendance.reduce(
    (min, a) => (a.course_id === item.course.id && (!min || a.date < min) ? a.date : min),
    ''
  );
  return firstMarked > added ? firstMarked : added;
}

// Classes from the last `days` days (today included) that were held but never marked.
export function unmarkedClasses(facultyId, data, now, days = EDIT_WINDOW_DAYS) {
  const out = [];
  for (let i = days; i >= 0; i -= 1) {
    const date = addDays(now.date, -i);
    for (const item of classesOn(date, facultyId, data)) {
      if (item.kind === 'regular' && !item.session && date < countsFrom(item, data)) continue;
      const status = classStatus(item, data, now);
      if (status === 'pending' || status === 'locked') out.push({ ...item, status });
    }
  }
  return out;
}

// Students taking a course; for a batch slot, only that batch.
export const enrolledStudents = (course, data, batch = null) => {
  const ids = new Set(data.enrollments.filter((e) => e.course_id === course.id).map((e) => e.student_id));
  return data.users
    .filter((u) => u.role === 'student' && u.status !== 'inactive' && ids.has(u.id) && (!batch || u.batch === batch))
    .sort((a, b) =>
      String(a.roll_no || a.usn || a.name).localeCompare(String(b.roll_no || b.usn || b.name), undefined, {
        numeric: true
      })
    );
};

// For a batch lab: enrolled students the admin hasn't put in any batch yet. They may be in this
// lab, so the teacher marks only the ones who came; the rest get no attendance row.
export const unbatchedStudents = (course, data, batch) =>
  batch ? enrolledStudents(course, data).filter((u) => !u.batch) : [];

const sessionFromItem = (item, fields) => ({
  id: item.session?.id || (item.kind === 'regular' ? regularSessionId(item.timetableId, item.date) : newId('ses')),
  course_id: item.course.id,
  timetable_id: item.timetableId,
  date: item.date,
  start_time: item.start_time,
  end_time: item.end_time,
  room: item.room || null,
  kind: item.kind,
  status: 'held',
  cancel_reason: null,
  marked_by: null,
  marked_at: null,
  unlocked_until: null,
  unlocked_by: null,
  ...item.session,
  ...fields
});

const upsert = (rows, row) => {
  const i = rows.findIndex((r) => r.id === row.id);
  if (i === -1) return [...rows, row];
  const next = [...rows];
  next[i] = row;
  return next;
};

const notification = (fields) => ({
  id: newId('notif'),
  read: false,
  created_at: new Date().toISOString(),
  reference_id: null,
  ...fields
});

const classLabel = (item) => `${item.course.code} (Sec ${item.course.section || '—'})`;

// ── State changes. Each takes the current data and returns the next data. ──

// Save attendance for one class. `statuses`: { [studentId]: 'present' | 'late' | 'absent' }.
export function markSession(prev, item, statuses, meId) {
  const session = sessionFromItem(item, {
    status: 'held',
    cancel_reason: null,
    marked_by: meId,
    marked_at: new Date().toISOString()
  });
  // Replace this session's rows. Older day-level rows for the same class and date (from before
  // sessions existed) are replaced too, so the day is not counted twice.
  const attendance = prev.attendance.filter(
    (a) =>
      a.session_id !== session.id &&
      !(a.session_id == null && a.course_id === session.course_id && a.date === session.date)
  );
  const rows = Object.entries(statuses).map(([student_id, status]) => ({
    id: newId('att'),
    course_id: session.course_id,
    student_id,
    date: session.date,
    status,
    marked_by: meId,
    session_id: session.id
  }));
  const absentees = rows.filter((r) => r.status === 'absent');
  return {
    ...prev,
    class_sessions: upsert(prev.class_sessions || [], session),
    attendance: [...attendance, ...rows],
    notifications: [
      ...absentees.map((r) =>
        notification({
          user_id: r.student_id,
          type: 'attendance_absent',
          reference_id: session.course_id,
          title: 'Attendance Alert: Marked Absent',
          message: `You were marked absent in ${item.course.name} on ${session.date} (${session.start_time}–${session.end_time}). Contact your teacher if this is a mistake.`
        })
      ),
      ...prev.notifications
    ]
  };
}

// Cancel a class: it no longer counts for anyone. Enrolled students are told.
export function cancelSession(prev, item, reason) {
  const session = sessionFromItem(item, { status: 'cancelled', cancel_reason: reason.trim(), marked_at: null });
  const students = [
    ...enrolledStudents(item.course, prev, item.batch),
    ...unbatchedStudents(item.course, prev, item.batch)
  ];
  return {
    ...prev,
    class_sessions: upsert(prev.class_sessions || [], session),
    attendance: prev.attendance.filter((a) => a.session_id !== session.id),
    notifications: [
      ...students.map((s) =>
        notification({
          user_id: s.id,
          type: 'class_cancelled',
          reference_id: item.course.id,
          title: `Class cancelled: ${item.course.code}`,
          message: `${item.course.name} on ${item.date} at ${item.start_time} is cancelled. Reason: ${reason.trim()}`
        })
      ),
      ...prev.notifications
    ]
  };
}

// Undo a cancellation.
export function restoreSession(prev, item) {
  return {
    ...prev,
    class_sessions: upsert(prev.class_sessions || [], sessionFromItem(item, { status: 'held', cancel_reason: null }))
  };
}

// A makeup class that is not in the timetable.
export function addExtraClass(prev, { course, date, start_time, end_time, room }) {
  const item = { kind: 'extra', course, date, start_time, end_time, room, timetableId: null, session: null };
  return { ...prev, class_sessions: [...(prev.class_sessions || []), sessionFromItem(item, {})] };
}

// Ask the HOD of the course's department to unlock a locked class.
export function requestUnlock(prev, item, me) {
  const hodId = prev.departments.find((d) => d.id === item.course.department_id)?.head_faculty_id;
  if (!hodId) return prev;
  return {
    ...prev,
    notifications: [
      notification({
        user_id: hodId,
        type: 'attendance_unlock_request',
        reference_id: item.key,
        title: `Unlock attendance: ${classLabel(item)}`,
        message: `${me.name} asks to mark attendance for ${item.course.name} on ${item.date} at ${item.start_time}, which is locked after ${EDIT_WINDOW_DAYS} days.`
      }),
      ...prev.notifications
    ]
  };
}

// HOD: open a locked class for marking for UNLOCK_DAYS days and tell the teacher.
export function unlockSession(prev, item, hodId, today) {
  const session = sessionFromItem(item, { unlocked_until: addDays(today, UNLOCK_DAYS), unlocked_by: hodId });
  return {
    ...prev,
    class_sessions: upsert(prev.class_sessions || [], session),
    notifications: [
      notification({
        user_id: item.course.faculty_id,
        type: 'attendance_unlocked',
        reference_id: item.key,
        title: `Attendance unlocked: ${classLabel(item)}`,
        message: `You can mark ${item.course.name} on ${item.date} at ${item.start_time} until ${session.unlocked_until}.`
      }),
      ...prev.notifications
    ]
  };
}
