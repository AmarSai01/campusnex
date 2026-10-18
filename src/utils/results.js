// Semester results: 10-point grading (VTU style), SGPA/CGPA and CSV import checks.
import { USN_REGEX } from './studentImport.js';

export const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, P: 4, F: 0 };

// Marks out of 100 → grade.
const BANDS = [
  [90, 'O'], [80, 'A+'], [70, 'A'], [60, 'B+'], [55, 'B'], [50, 'C'], [40, 'P'], [0, 'F'],
];
export const gradeFromTotal = (total) => BANDS.find(([min]) => total >= min)[1];

const round2 = (n) => Math.round(n * 100) / 100;

// Credit-weighted grade point average. Failed subjects count with 0 points.
export const gpa = (rows) => {
  const credits = rows.reduce((s, r) => s + Number(r.credits), 0);
  if (!credits) return null;
  return round2(rows.reduce((s, r) => s + Number(r.credits) * r.grade_point, 0) / credits);
};

// One summary per semester, oldest first.
export const semesterSummaries = (results) => {
  const bySem = new Map();
  for (const r of results) {
    if (!bySem.has(r.semester)) bySem.set(r.semester, []);
    bySem.get(r.semester).push(r);
  }
  return [...bySem.entries()]
    .sort(([a], [b]) => a - b)
    .map(([semester, rows]) => ({
      semester,
      sgpa: gpa(rows),
      credits: rows.reduce((s, r) => s + Number(r.credits), 0),
      earnedCredits: rows.filter((r) => r.grade !== 'F').reduce((s, r) => s + Number(r.credits), 0),
      subjects: rows.length,
    }));
};

export const cgpa = (results) => gpa(results);

// ───────────── CSV import ─────────────

export const RESULT_COLUMNS = ['USN', 'SEMESTER', 'COURSE CODE', 'COURSE NAME', 'CREDITS', 'CIE', 'SEE', 'TOTAL', 'GRADE'];

const ALIASES = {
  usn: ['USN', 'ROLLNO', 'SEATNO'],
  semester: ['SEMESTER', 'SEM'],
  code: ['COURSECODE', 'SUBJECTCODE', 'CODE'],
  name: ['COURSENAME', 'SUBJECTNAME', 'SUBJECT', 'COURSE'],
  credits: ['CREDITS', 'CREDIT'],
  cie: ['CIE', 'INTERNAL', 'INTERNALS', 'IA'],
  see: ['SEE', 'EXTERNAL', 'EXTERNALS'],
  total: ['TOTAL', 'MARKS'],
  grade: ['GRADE', 'LETTERGRADE'],
};
const REQUIRED = ['usn', 'semester', 'code', 'credits'];
const norm = (h) => h.toUpperCase().replace(/[\s_.-]/g, '');

const num = (v) => (v === '' ? null : Number(v));

// rows: parsed CSV (first row = header). users: all profiles. existing: current results.
export function validateResultImport({ rows, users, existing }) {
  if (!rows.length) return { error: 'The file is empty.', rows: [] };
  const header = rows[0].map(norm);
  const idx = {};
  for (const [field, names] of Object.entries(ALIASES)) {
    const i = header.findIndex((h) => names.includes(h));
    if (i >= 0) idx[field] = i;
  }
  const missing = REQUIRED.filter((f) => idx[f] === undefined);
  if (missing.length) {
    return { error: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.map((m) => (m === 'code' ? 'COURSE CODE' : m.toUpperCase())).join(', ')}.`, rows: [] };
  }
  if (idx.grade === undefined && idx.total === undefined) {
    return { error: 'Add a GRADE or TOTAL column so grades can be worked out.', rows: [] };
  }

  const studentsByUsn = new Map(
    users.filter((u) => u.role === 'student').map((u) => [(u.usn || u.roll_no || '').toUpperCase(), u])
  );
  const existingKeys = new Set(existing.map((r) => `${r.student_id}|${r.semester}|${r.course_code}`));
  const seen = new Map();

  const result = rows.slice(1).map((cells, i) => {
    const line = i + 2;
    const cell = (f) => (idx[f] === undefined ? '' : (cells[idx[f]] ?? '').trim());
    const values = {
      usn: cell('usn').toUpperCase().replace(/\s+/g, ''),
      semester: cell('semester'),
      code: cell('code').toUpperCase().replace(/\s+/g, ''),
      name: cell('name'),
      credits: cell('credits'),
      cie: cell('cie'),
      see: cell('see'),
      total: cell('total'),
      grade: cell('grade').toUpperCase(),
    };
    const errors = [];

    const student = studentsByUsn.get(values.usn);
    if (!values.usn) errors.push('USN is missing');
    else if (!USN_REGEX.test(values.usn)) errors.push(`USN "${values.usn}" must look like 1XX00XX000`);
    else if (!student) errors.push('No student with this USN');

    const semester = Number(values.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) errors.push('Semester must be 1–8');

    if (!values.code) errors.push('Course code is missing');

    const credits = Number(values.credits);
    if (!values.credits || !(credits > 0) || credits > 30) errors.push('Credits must be a number above 0');

    for (const f of ['cie', 'see']) {
      if (values[f] !== '' && !(Number(values[f]) >= 0)) errors.push(`${f.toUpperCase()} must be a number`);
    }

    const total = num(values.total);
    if (values.total !== '' && !(total >= 0 && total <= 100)) errors.push('Total must be 0–100');

    let grade = values.grade;
    if (grade && !(grade in GRADE_POINTS)) errors.push(`Grade "${grade}" must be one of O, A+, A, B+, B, C, P, F`);
    if (!grade && values.total === '') errors.push('Give a grade or a total');
    if (!grade && total !== null && total >= 0 && total <= 100) grade = gradeFromTotal(total);

    const key = student ? `${student.id}|${semester}|${values.code}` : null;
    if (key && seen.has(key)) errors.push(`Repeated (also on row ${seen.get(key)})`);
    if (key && !seen.has(key)) seen.set(key, line);

    return {
      line,
      values,
      errors,
      updates: !errors.length && existingKeys.has(key),
      result: errors.length
        ? null
        : {
            student_id: student.id,
            semester,
            course_code: values.code,
            course_name: values.name || null,
            credits,
            cie: num(values.cie),
            see: num(values.see),
            total,
            grade,
            grade_point: GRADE_POINTS[grade],
          },
    };
  });

  return { rows: result };
}
