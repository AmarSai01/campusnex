import { parseCsv } from './studentImport';

export const FACULTY_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Professor & Head of Department',
  'Lecturer',
  'Lab Instructor'
];

export const CLASS_ROLES = {
  class_teacher: { label: 'Class Teacher', short: 'Class Teacher' },
  class_coordinator: { label: 'Class Coordinator (CC)', short: 'CC' }
};

export const classRoleText = (role, departments) => {
  const code = departments.find(d => d.id === role.department_id)?.code || '—';
  return `${CLASS_ROLES[role.role]?.short || role.role} · ${code} Sem ${role.semester} ${role.section}`;
};

// Names of a class's Class Teacher and CC, e.g. "Class Teacher: Victoria · CC: Kushal A".
export function classContactsText(classRoles, users, { department_id, semester, section }) {
  const nameFor = (role) => {
    const r = classRoles.find(x =>
      x.role === role && x.department_id === department_id && Number(x.semester) === Number(semester) && x.section === section);
    return r ? users.find(u => u.id === r.faculty_id)?.name : null;
  };
  return [
    nameFor('class_teacher') && `Class Teacher: ${nameFor('class_teacher')}`,
    nameFor('class_coordinator') && `CC: ${nameFor('class_coordinator')}`
  ].filter(Boolean).join(' · ');
}

// Hours a week a teacher is timetabled for.
export function weeklyHours(facultyId, timetable) {
  const minutes = timetable
    .filter(s => s.faculty_id === facultyId)
    .reduce((sum, s) => {
      const [sh, sm] = String(s.start_time).split(':').map(Number);
      const [eh, em] = String(s.end_time).split(':').map(Number);
      return sum + Math.max(0, eh * 60 + em - (sh * 60 + sm));
    }, 0);
  return Math.round(minutes / 6) / 10;
}

export const FACULTY_IMPORT_COLUMNS = ['NAME', 'EMAIL', 'DEPARTMENT', 'DESIGNATION'];
export const facultyTemplateCsv = () =>
  `${FACULTY_IMPORT_COLUMNS.join(',')}\r\nKavya R,kavya.r@college.edu,CD,Assistant Professor\r\n`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADERS = {
  name: ['NAME', 'FULLNAME', 'FACULTYNAME', 'TEACHER'],
  email: ['EMAIL', 'EMAILID', 'MAIL'],
  department: ['DEPARTMENT', 'DEPT', 'DEPTCODE', 'DEPARTMENTCODE'],
  designation: ['DESIGNATION', 'TITLE', 'POSITION']
};
const FIELDS = ['name', 'email', 'department', 'designation'];
const norm = (h) => h.toUpperCase().replace(/[\s_.-]/g, '');

// Checks a faculty CSV. Rows whose email belongs to an existing teacher update that teacher.
export function validateFacultyImport(text, { users, departments }) {
  const rows = parseCsv(text);
  if (!rows.length) return { error: 'The file is empty.' };

  const header = rows[0].map(norm);
  const hasHeader = header.some(h => Object.values(HEADERS).flat().includes(h));
  const indexes = {};
  if (hasHeader) {
    for (const f of FIELDS) {
      const i = header.findIndex(h => HEADERS[f].includes(h));
      if (i >= 0) indexes[f] = i;
    }
    const missing = ['name', 'email', 'department'].filter(f => indexes[f] === undefined);
    if (missing.length) {
      return { error: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.map(m => m.toUpperCase()).join(', ')}. Expected: ${FACULTY_IMPORT_COLUMNS.join(', ')}.` };
    }
  } else {
    FIELDS.forEach((f, i) => { indexes[f] = i; });
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const firstLine = hasHeader ? 2 : 1;
  const seen = new Set();
  const valid = [];
  const errors = [];

  dataRows.forEach((r, i) => {
    const line = firstLine + i;
    const get = (f) => (indexes[f] === undefined ? '' : String(r[indexes[f]] ?? '').trim());
    const name = get('name');
    const email = get('email').toLowerCase();
    const deptValue = get('department').toUpperCase();
    const designation = get('designation') || 'Assistant Professor';
    const dept = departments.find(d => d.code.toUpperCase() === deptValue || d.name.toUpperCase() === deptValue);
    const existing = users.find(u => (u.email || '').toLowerCase() === email);

    const problems = [];
    if (!name) problems.push('name is missing');
    if (!EMAIL_REGEX.test(email)) problems.push('email is not valid');
    if (!dept) problems.push(`department "${get('department') || '—'}" not found`);
    if (seen.has(email)) problems.push('email appears twice in the file');
    if (existing && existing.role !== 'faculty') problems.push(`email belongs to a ${existing.role}`);
    seen.add(email);

    if (problems.length) errors.push({ line, message: problems.join(', ') });
    else valid.push({ name, email, department_id: dept.id, designation, existingId: existing?.id || null });
  });

  return { rows: valid, errors };
}
