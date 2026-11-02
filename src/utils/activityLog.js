import { formatTime, formatTimeRange } from './time';
import { CLASS_ROLES } from './faculty';

// Turns admin_activity rows (20261102000100_admin_activity.sql) into readable lines.

export const ACTIVITY_CATEGORIES = {
  users: 'Users',
  results: 'Results',
  courses: 'Courses',
  departments: 'Departments',
  timetable: 'Timetable',
  calendars: 'Calendars',
  class_roles: 'Class roles',
  exams: 'Exams',
  broadcasts: 'Broadcasts'
};

const VERBS = {
  added: 'Added',
  removed: 'Removed',
  edited: 'Edited',
  published: 'Published',
  unpublished: 'Unpublished',
  deactivated: 'Deactivated',
  reactivated: 'Reactivated'
};

const NOUNS = {
  profiles: ['user', 'users'],
  courses: ['course', 'courses'],
  departments: ['department', 'departments'],
  results: ['result', 'results'],
  timetable: ['class', 'classes'],
  semester_calendars: ['semester calendar', 'semester calendars'],
  calendar_events: ['calendar event', 'calendar events'],
  class_roles: ['class role', 'class roles'],
  exam_timetables: ['exam', 'exams'],
  announcements: ['broadcast', 'broadcasts']
};

const ROLE_NOUNS = { student: ['student', 'students'], faculty: ['teacher', 'teachers'], admin: ['admin', 'admins'] };

const FIELD_LABELS = {
  name: 'Name', email: 'Email', role: 'Role', department_id: 'Department', designation: 'Designation',
  usn: 'USN', roll_no: 'Roll no', semester: 'Semester', section: 'Section', batch: 'Batch', status: 'Status',
  code: 'Code', faculty_id: 'Teacher', credits: 'Credits', head_faculty_id: 'HOD', office_room: 'Office',
  published: 'Published', cie: 'CIE', see: 'SEE', total: 'Total', grade: 'Grade', grade_point: 'Grade point',
  course_id: 'Course', day_of_week: 'Day', start_time: 'Starts', end_time: 'Ends', room: 'Room',
  title: 'Title', ref_no: 'Reference', semesters: 'Semesters', attachment_url: 'Official copy',
  date: 'Date', end_date: 'End date', type: 'Type', affects_department_id: 'Department',
  affects_semester: 'Semester', affects_section: 'Section', subject: 'Subject', exam_date: 'Exam date',
  room_ids: 'Rooms', exam_type: 'Exam type'
};

// Columns that change on every save and say nothing on their own.
const HIDDEN_FIELDS = new Set(['updated_at']);

export function makeLookup({ users = [], departments = [], courses = [] }) {
  const userName = (id) => users.find(u => u.id === id)?.name;
  const deptCode = (id) => departments.find(d => d.id === id)?.code;
  const course = (id) => courses.find(c => c.id === id);
  return { userName, deptCode, course };
}

export function formatValue(field, value, lookup) {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'faculty_id' || field === 'head_faculty_id') return lookup.userName(value) || 'Unknown teacher';
  if (field === 'department_id' || field === 'affects_department_id') return lookup.deptCode(value) || value;
  if (field === 'course_id') return lookup.course(value)?.code || value;
  if (field === 'start_time' || field === 'end_time') return formatTime(value);
  if (field === 'attachment_url') return 'Attached';
  if (field === 'published') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ') || '—';
  return String(value);
}

// What the entry is about, in a few words, from the row snapshot.
function subject(entry, lookup) {
  const r = entry.record || {};
  switch (entry.entity_table) {
    case 'profiles':
      return `${r.name || 'a user'}${r.role ? ` (${r.role === 'faculty' ? 'teacher' : r.role}${r.usn ? `, ${r.usn}` : ''})` : ''}`;
    case 'courses':
      return `${r.code || ''} ${r.name || ''}`.trim();
    case 'departments':
      return r.code ? `${r.code} department` : r.name || 'a department';
    case 'results': {
      const student = lookup.userName(r.student_id) || 'a student';
      return `${student}'s result in ${r.course_code || 'a course'}`;
    }
    case 'timetable': {
      const code = lookup.course(r.course_id)?.code || 'a class';
      return `${code} on ${r.day_of_week?.slice(0, 3) || ''} ${formatTimeRange(r.start_time, r.end_time)}${r.section ? `, Sec ${r.section}` : ''}`;
    }
    case 'semester_calendars':
      return `semester calendar "${r.title}"`;
    case 'calendar_events':
      return `"${r.title}" on the Academic Calendar`;
    case 'exam_timetables':
      return `exam "${r.subject}"${r.exam_date ? ` on ${r.exam_date}` : ''}`;
    case 'announcements':
      return `broadcast "${r.title}"`;
    default:
      return entry.entity_id || '';
  }
}

export function describeEntry(entry, lookup) {
  const r = entry.record || {};
  const changes = entry.changes || {};
  const changed = Object.keys(changes).filter(k => !HIDDEN_FIELDS.has(k));
  let text;

  if (entry.entity_table === 'class_roles') {
    const teacher = lookup.userName(r.faculty_id) || 'A teacher';
    const role = CLASS_ROLES[r.role]?.label || r.role;
    const cls = `${lookup.deptCode(r.department_id) || ''} Sem ${r.semester} ${r.section}`.trim();
    text = entry.action === 'added' ? `Made ${teacher} ${role} of ${cls}` : `Removed ${teacher} as ${role} of ${cls}`;
  } else if (entry.entity_table === 'courses' && entry.action === 'edited' && changed.length === 1 && changed[0] === 'faculty_id') {
    text = `Changed teacher for ${subject(entry, lookup)}`;
  } else if (entry.entity_table === 'departments' && entry.action === 'edited' && changed.length === 1 && changed[0] === 'head_faculty_id') {
    text = `Changed HOD of ${subject(entry, lookup)}`;
  } else if (entry.entity_table === 'semester_calendars' && entry.action === 'added') {
    text = `${r.status === 'published' ? 'Published' : 'Saved a draft of'} ${subject(entry, lookup)}`;
  } else if (entry.entity_table === 'announcements' && entry.action === 'added') {
    text = `Sent ${subject(entry, lookup)}`;
  } else if (entry.entity_table === 'exam_timetables' && entry.action === 'added') {
    text = `Scheduled ${subject(entry, lookup)}`;
  } else {
    const verb = entry.entity_table === 'courses' && entry.action === 'removed' ? 'Deleted' : VERBS[entry.action] || entry.action;
    text = `${verb} ${subject(entry, lookup)}`;
  }

  const details = changed.map(k => [
    FIELD_LABELS[k] || k,
    `${formatValue(k, changes[k][0], lookup)} → ${formatValue(k, changes[k][1], lookup)}`
  ]);
  return { text, details };
}

const BURST_MS = 2 * 60 * 1000;

// Bulk actions (a CSV import, publishing a whole class's results) write one row per record.
// Rows from the same admin, doing the same thing to the same table within two minutes of each
// other, become one group. Expects rows newest first.
export function groupEntries(entries) {
  const groups = [];
  for (const e of entries) {
    const last = groups[groups.length - 1];
    const prev = last?.entries[last.entries.length - 1];
    if (
      prev && prev.actor_id === e.actor_id && prev.entity_table === e.entity_table && prev.action === e.action &&
      new Date(prev.created_at) - new Date(e.created_at) <= BURST_MS
    ) {
      last.entries.push(e);
    } else {
      groups.push({ id: e.id, entries: [e] });
    }
  }
  return groups;
}

export function groupText(group, lookup) {
  const [first] = group.entries;
  if (group.entries.length === 1) return describeEntry(first, lookup).text;
  let nouns = NOUNS[first.entity_table] || ['item', 'items'];
  if (first.entity_table === 'profiles') {
    const roles = new Set(group.entries.map(e => e.record?.role));
    if (roles.size === 1) nouns = ROLE_NOUNS[[...roles][0]] || nouns;
  }
  const verb = first.entity_table === 'courses' && first.action === 'removed' ? 'Deleted' : VERBS[first.action] || first.action;
  return `${verb} ${group.entries.length} ${nouns[1]}`;
}

const csvCell = (v) => (/[",\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

export function activityCsv(entries, lookup) {
  const lines = [['Date', 'Time', 'Admin', 'Category', 'What happened', 'Changes']];
  for (const e of entries) {
    const at = new Date(e.created_at);
    const { text, details } = describeEntry(e, lookup);
    lines.push([
      at.toLocaleDateString('en-IN'),
      at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      lookup.userName(e.actor_id) || 'Unknown admin',
      ACTIVITY_CATEGORIES[e.category] || e.category,
      text,
      details.map(([label, value]) => `${label}: ${value}`).join('; ')
    ]);
  }
  return lines.map(row => row.map(csvCell).join(',')).join('\r\n');
}
