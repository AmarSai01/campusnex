// Bulk student import: CSV parsing, header mapping and row validation.

export const IMPORT_COLUMNS = ['USN', 'NAME', 'SEMESTER', 'DEPARTMENT', 'SECTION', 'EMAIL'];
export const MAX_IMPORT_ROWS = 2000;

export const USN_REGEX = /^1[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECTION_REGEX = /^[A-Z]$/;

// Accepted header spellings for each column (compared upper-cased, spaces/underscores removed).
const HEADER_ALIASES = {
  usn: ['USN', 'ROLLNO', 'ROLLNUMBER', 'UNIVERSITYSEATNUMBER', 'SEATNO'],
  name: ['NAME', 'STUDENTNAME', 'FULLNAME'],
  semester: ['SEMESTER', 'SEM'],
  department: ['DEPARTMENT', 'DEPT', 'BRANCH'],
  section: ['SECTION', 'SEC'],
  email: ['EMAIL', 'EMAILID', 'EMAILADDRESS', 'MAIL']
};
const FIELD_ORDER = ['usn', 'name', 'semester', 'department', 'section', 'email'];

export const templateCsv = () => IMPORT_COLUMNS.join(',') + '\r\n';

// RFC 4180-style parser: quoted fields, escaped quotes, CRLF/LF, optional BOM.
// Detects comma, semicolon or tab delimiters from the first line.
export function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const normalizeHeader = (h) => h.toUpperCase().replace(/[\s_.-]/g, '');

// Map columns by header names; without a header row, assume the template order.
export function mapColumns(rows) {
  if (!rows.length) return { error: 'The file is empty.' };

  const header = rows[0].map(normalizeHeader);
  const looksLikeHeader = header.some((h) => Object.values(HEADER_ALIASES).flat().includes(h));
  if (!looksLikeHeader) {
    return { indexes: Object.fromEntries(FIELD_ORDER.map((f, i) => [f, i])), dataRows: rows, firstLine: 1 };
  }

  const indexes = {};
  for (const field of FIELD_ORDER) {
    const idx = header.findIndex((h) => HEADER_ALIASES[field].includes(h));
    if (idx >= 0) indexes[field] = idx;
  }
  const missing = FIELD_ORDER.filter((f) => indexes[f] === undefined);
  if (missing.length) {
    return {
      error: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.map((m) => m.toUpperCase()).join(', ')}. Expected: ${IMPORT_COLUMNS.join(', ')}.`
    };
  }
  return { indexes, dataRows: rows.slice(1), firstLine: 2 };
}

const findDepartment = (departments, value) => {
  const v = value.trim().toUpperCase();
  return departments.find((d) => d.code.toUpperCase() === v || d.name.toUpperCase() === v) || null;
};

// Validate rows against each other and against existing users.
// allowedDepartments limits where students may be added (all for admins, headed ones for HODs).
export function validateImport({ rows, users, allowedDepartments }) {
  const mapped = mapColumns(rows);
  if (mapped.error) return { error: mapped.error, rows: [] };
  if (mapped.dataRows.length > MAX_IMPORT_ROWS) {
    return { error: `Too many rows (${mapped.dataRows.length}). Import at most ${MAX_IMPORT_ROWS} students at a time.`, rows: [] };
  }

  const existingUsns = new Set(
    users.filter((u) => u.role === 'student').map((u) => (u.usn || u.roll_no || '').toUpperCase()).filter(Boolean)
  );
  const existingEmails = new Set(users.map((u) => (u.email || '').toLowerCase()));
  const usnLines = new Map();
  const emailLines = new Map();

  const result = mapped.dataRows.map((cells, i) => {
    const line = mapped.firstLine + i;
    const cell = (field) => (cells[mapped.indexes[field]] ?? '').trim();
    const values = {
      usn: cell('usn').toUpperCase().replace(/\s+/g, ''),
      name: cell('name').replace(/\s+/g, ' '),
      semester: cell('semester'),
      department: cell('department'),
      section: cell('section').toUpperCase(),
      email: cell('email').toLowerCase()
    };
    const errors = [];

    if (!values.usn) errors.push('USN is missing');
    else if (!USN_REGEX.test(values.usn)) errors.push(`USN "${values.usn}" must look like 1XX00XX000`);
    else if (existingUsns.has(values.usn)) errors.push('USN already exists');
    else if (usnLines.has(values.usn)) errors.push(`USN repeated (also on row ${usnLines.get(values.usn)})`);

    if (!values.name) errors.push('Name is missing');

    const semester = Number(values.semester);
    if (!values.semester) errors.push('Semester is missing');
    else if (!Number.isInteger(semester) || semester < 1 || semester > 8) errors.push('Semester must be 1–8');

    const dept = values.department ? findDepartment(allowedDepartments, values.department) : null;
    if (!values.department) errors.push('Department is missing');
    else if (!dept) errors.push(`Department "${values.department}" not found or not allowed`);

    if (!values.section) errors.push('Section is missing');
    else if (!SECTION_REGEX.test(values.section)) errors.push('Section must be a single letter (A–Z)');

    if (!values.email) errors.push('Email is missing');
    else if (!EMAIL_REGEX.test(values.email)) errors.push(`Email "${values.email}" is not valid`);
    else if (existingEmails.has(values.email)) errors.push('Email already used');
    else if (emailLines.has(values.email)) errors.push(`Email repeated (also on row ${emailLines.get(values.email)})`);

    if (values.usn && !usnLines.has(values.usn)) usnLines.set(values.usn, line);
    if (values.email && !emailLines.has(values.email)) emailLines.set(values.email, line);

    return {
      line,
      values,
      errors,
      student: errors.length
        ? null
        : { usn: values.usn, name: values.name, semester, department_id: dept.id, section: values.section, email: values.email }
    };
  });

  return { rows: result };
}
