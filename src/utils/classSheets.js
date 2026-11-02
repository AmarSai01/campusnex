import { addDays, dayName, enrolledStudents, holidayFor, parseISODate } from './classSessions';
import { parseCsv } from './studentImport';
import { iaCycleForColumn } from './iaCycles';

// Class Sheets: spreadsheet templates filled with a subject's students, and reading the
// filled sheets teachers upload back. Uploaded data is stored apart from live records.

export const SHEET_KINDS = {
  students: 'Students only',
  ia: 'IA marks',
  attendance: 'Attendance',
  lab_marks: 'Lab marks',
  lab_attendance: 'Lab attendance'
};

export const UPLOAD_LABELS = {
  students: 'Uploaded student sheet',
  ia: 'Uploaded IA marks',
  attendance: 'Uploaded attendance',
  lab_marks: 'Uploaded lab marks',
  lab_attendance: 'Uploaded lab attendance'
};

export const BASE_COLUMNS = ['USN', 'Name', 'Dept', 'Sem', 'Sec'];
export const LAB_PARTS = ['Execution', 'Observation', 'Record', 'Viva'];
// Filled in by Excel formulas; ignored when a sheet comes back.
const DERIVED_COLUMNS = ['Total', 'Average', 'Present', 'Attendance %'];
const MAX_DATE_COLUMNS = 62;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dateColumn = (iso) => {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const DATE_COLUMN = /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;
const IA_COLUMN = /^IA\s*-?\s*\d+$/i;
const LAB_MARK_COLUMN = new RegExp(`^P\\d+ (${LAB_PARTS.join('|')})$`, 'i');

const usnOf = (u) => String(u.usn || u.roll_no || '').toUpperCase();

// ── Which subjects have labs, and their batches ──

export const courseBatches = (course, timetable) =>
  [...new Set(timetable.filter(s => s.course_id === course.id && s.batch).map(s => s.batch))].sort();

export const isLabCourse = (course, timetable) =>
  courseBatches(course, timetable).length > 0 || /\blab/i.test(course.name || '');

// Dates between from and to (inclusive) when the subject meets, from its timetable slots,
// skipping holidays. For a lab batch, only that batch's lab slots count, not theory classes.
export function classDates(course, data, from, to, batch = null) {
  const days = new Set(
    data.timetable
      .filter(s => s.course_id === course.id && (!batch || s.batch === batch))
      .map(s => s.day_of_week)
  );
  const dates = [];
  for (let d = from; d <= to && dates.length < MAX_DATE_COLUMNS; d = addDays(d, 1)) {
    if (days.has(dayName(d)) && !holidayFor(d, course, data)) dates.push(d);
  }
  return dates;
}

// ── Building a template ──

// options: { iaColumns, iaMax, from, to, programs, partMax: { Execution: 10, ... }, batches, own }
// Returns one sheet per lab batch, or a single sheet.
export function buildTemplate(kind, course, data, options) {
  const dept = data.departments.find(d => d.id === course.department_id);
  const teacher = data.users.find(u => u.id === course.faculty_id);
  const room = data.timetable.find(s => s.course_id === course.id && s.room)?.room;
  const own = options.own || [];
  const lab = kind === 'lab_marks' || kind === 'lab_attendance';
  const batches = lab && options.batches?.length ? options.batches : [null];

  const sheets = batches.map(batch => {
    const students = enrolledStudents(course, data, batch);
    let extra = [];
    let maxRow = null;

    if (kind === 'ia') {
      extra = [...options.iaColumns, 'Total', 'Average'];
      maxRow = [...options.iaColumns.map(() => options.iaMax), options.iaMax * options.iaColumns.length, options.iaMax];
    } else if (kind === 'attendance' || kind === 'lab_attendance') {
      extra = [...classDates(course, data, options.from, options.to, batch).map(dateColumn), 'Present', 'Attendance %'];
    } else if (kind === 'lab_marks') {
      const perProgram = LAB_PARTS.reduce((sum, part) => sum + options.partMax[part], 0);
      for (let p = 1; p <= options.programs; p++) LAB_PARTS.forEach(part => extra.push(`P${p} ${part}`));
      extra.push('Total');
      maxRow = [];
      for (let p = 1; p <= options.programs; p++) LAB_PARTS.forEach(part => maxRow.push(options.partMax[part]));
      maxRow.push(perProgram * options.programs);
    }

    const base = lab ? [...BASE_COLUMNS, 'Batch'] : BASE_COLUMNS;
    const columns = [...base, ...extra, ...own];
    return {
      name: batch ? `Batch ${batch.slice(1)}` : SHEET_KINDS[kind],
      batch,
      title: [
        `${course.code} ${course.name}`,
        `${dept?.code || ''} · Semester ${course.semester} · Section ${course.section}${room ? ` · Room ${room}` : ''}${batch ? ` · Batch ${batch.slice(1)}` : ''}`,
        `Teacher: ${teacher?.name || '—'} · ${students.length} students · ${kind === 'attendance' || kind === 'lab_attendance' ? 'Enter P for present, A for absent' : 'Do not change the USN column'}`
      ],
      columns,
      baseCount: base.length,
      maxRow: maxRow && [...maxRow, ...own.map(() => '')],
      rows: students.map(s => [
        usnOf(s), s.name, dept?.code || '', course.semester, course.section,
        ...(lab ? [s.batch || ''] : []),
        ...extra.map(() => ''), ...own.map(() => '')
      ])
    };
  });

  const slug = `${course.code}_${kind}`.replace(/[^\w-]+/g, '_');
  return { sheets, fileBase: slug };
}

// ── Writing files ──

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function sheetToCsv(sheet) {
  const lines = [sheet.columns];
  if (sheet.maxRow) lines.push(['Max marks', ...Array(sheet.baseCount - 1).fill(''), ...sheet.maxRow]);
  lines.push(...sheet.rows);
  return '﻿' + lines.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

const colLetter = (n) => {
  let s = '';
  for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};

export async function templateToXlsx(template, kind) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Campusnex';

  for (const sheet of template.sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31));
    sheet.title.forEach((line, i) => {
      const cell = ws.getCell(i + 1, 1);
      cell.value = line;
      cell.font = { bold: i === 0, size: i === 0 ? 13 : 10, color: { argb: i === 0 ? 'FF0F172A' : 'FF475569' } };
    });
    const headerRow = sheet.title.length + 2;
    const header = ws.getRow(headerRow);
    sheet.columns.forEach((c, i) => {
      const cell = header.getCell(i + 1);
      cell.value = c;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF94A3B8' } } };
    });

    let firstData = headerRow + 1;
    const maxByCol = {};
    if (sheet.maxRow) {
      const maxRow = ws.getRow(firstData);
      maxRow.getCell(1).value = 'Max marks';
      sheet.maxRow.forEach((v, i) => {
        const col = sheet.baseCount + i + 1;
        if (v !== '') {
          maxRow.getCell(col).value = Number(v);
          maxByCol[col] = Number(v);
        }
      });
      for (let c = 1; c <= sheet.columns.length; c++) {
        const cell = maxRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        cell.font = { italic: true, color: { argb: 'FF92400E' } };
      }
      firstData += 1;
    }

    const colIndex = (name) => sheet.columns.indexOf(name) + 1;
    const markCols = sheet.columns
      .map((c, i) => ({ c, i: i + 1 }))
      .filter(({ c }) => (kind === 'ia' ? IA_COLUMN.test(c) : LAB_MARK_COLUMN.test(c)));
    const dateCols = sheet.columns.map((c, i) => ({ c, i: i + 1 })).filter(({ c }) => DATE_COLUMN.test(c));

    sheet.rows.forEach((values, r) => {
      const row = ws.getRow(firstData + r);
      values.forEach((v, i) => {
        const cell = row.getCell(i + 1);
        if (v !== '') cell.value = v;
        if (i >= sheet.baseCount) cell.protection = { locked: false };
      });
      const n = firstData + r;
      const range = (cols) => cols.length ? `${colLetter(cols[0].i)}${n}:${colLetter(cols[cols.length - 1].i)}${n}` : null;
      if (colIndex('Total') && markCols.length) {
        row.getCell(colIndex('Total')).value = { formula: `IF(COUNT(${range(markCols)})=0,"",SUM(${range(markCols)}))` };
      }
      if (colIndex('Average') && markCols.length) {
        row.getCell(colIndex('Average')).value = { formula: `IF(COUNT(${range(markCols)})=0,"",ROUND(AVERAGE(${range(markCols)}),1))` };
      }
      if (colIndex('Present') && dateCols.length) {
        row.getCell(colIndex('Present')).value = { formula: `COUNTIF(${range(dateCols)},"P")` };
        row.getCell(colIndex('Attendance %')).value = {
          formula: `IF(COUNTA(${range(dateCols)})=0,"",ROUND(COUNTIF(${range(dateCols)},"P")/COUNTA(${range(dateCols)})*100,0))`
        };
      }
      // Drop-downs and limits so mistakes are caught while typing.
      dateCols.forEach(({ i }) => {
        row.getCell(i).dataValidation = {
          type: 'list', allowBlank: true, formulae: ['"P,A"'],
          showErrorMessage: true, errorTitle: 'P or A', error: 'Enter P for present or A for absent.'
        };
      });
      markCols.forEach(({ i }) => {
        if (maxByCol[i] === undefined) return;
        row.getCell(i).dataValidation = {
          type: 'decimal', operator: 'between', allowBlank: true, formulae: [0, maxByCol[i]],
          showErrorMessage: true, errorTitle: 'Mark out of range', error: `Enter a mark from 0 to ${maxByCol[i]}.`
        };
      });
      DERIVED_COLUMNS.forEach(name => {
        const c = colIndex(name);
        if (c) row.getCell(c).protection = { locked: true };
      });
    });

    // Spare columns stay editable so teachers can add their own after downloading.
    for (let c = sheet.columns.length + 1; c <= sheet.columns.length + 15; c++) {
      ws.getColumn(c).protection = { locked: false };
    }
    sheet.columns.forEach((c, i) => {
      ws.getColumn(i + 1).width = c === 'Name' ? 26 : c === 'USN' ? 14 : Math.max(7, Math.min(16, c.length + 3));
    });
    ws.views = [{ state: 'frozen', xSplit: 2, ySplit: firstData - 1 }];
    // No password: the lock only stops accidental edits to the student details.
    await ws.protect('', {
      selectLockedCells: true, selectUnlockedCells: true, formatColumns: true, formatCells: true,
      insertColumns: true, sort: true, autoFilter: true
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ── Reading an uploaded file ──

const cellText = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if ('result' in v) return cellText(v.result);
    if (Array.isArray(v.richText)) return v.richText.map(t => t.text).join('');
    if ('text' in v) return String(v.text);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
  }
  return String(v).trim();
};

// -> [{ name, rows: string[][] }]
export async function readSheetFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return [{ name: file.name, rows: parseCsv(await file.text()) }];
  }
  if (!name.endsWith('.xlsx')) throw new Error('Upload an Excel (.xlsx) or CSV file.');
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("This Excel file couldn't be read. Save it as .xlsx and try again.");
  }
  return wb.worksheets.map(ws => {
    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row, n) => {
      const values = [];
      for (let c = 1; c <= row.cellCount; c++) values.push(cellText(row.getCell(c).value));
      rows[n - 1] = values;
    });
    return { name: ws.name, rows: Array.from(rows, r => r || []) };
  });
}

// The table part of each sheet: its header row (the one with a USN column), max marks
// and student rows. Sheets without a USN column are ignored.
export function extractTable(sheets) {
  const columns = [];
  const maxMarks = {};
  const rows = [];
  let hasBatch = false;
  for (const sheet of sheets) {
    const h = sheet.rows.findIndex(r => r.some(c => String(c).trim().toUpperCase() === 'USN'));
    if (h < 0) continue;
    const header = sheet.rows[h].map(c => String(c).trim());
    const at = (name) => header.findIndex(c => c.toUpperCase() === name.toUpperCase());
    const usnAt = at('USN');
    const batchAt = at('Batch');
    if (batchAt >= 0) hasBatch = true;
    const skip = new Set([...BASE_COLUMNS, 'Batch', ...DERIVED_COLUMNS].map(c => c.toUpperCase()));
    const valueCols = header
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c && !skip.has(c.toUpperCase()));
    valueCols.forEach(({ c }) => { if (!columns.includes(c)) columns.push(c); });

    let start = h + 1;
    const maybeMax = sheet.rows[start] || [];
    if (/^max/i.test(String(maybeMax.find(v => String(v).trim()) || ''))) {
      valueCols.forEach(({ c, i }) => {
        const n = Number(maybeMax[i]);
        if (String(maybeMax[i]).trim() !== '' && Number.isFinite(n)) maxMarks[c] = n;
      });
      start += 1;
    }
    for (const r of sheet.rows.slice(start)) {
      const usn = String(r[usnAt] || '').trim().toUpperCase();
      if (!usn) continue;
      const values = {};
      valueCols.forEach(({ c, i }) => { values[c] = String(r[i] ?? '').trim(); });
      rows.push({ usn, batch: batchAt >= 0 ? String(r[batchAt] || '').trim() : '', values });
    }
  }
  if (!rows.length && !columns.length) {
    throw new Error('No USN column found. Use a template downloaded from Class Sheets.');
  }
  return { columns, maxMarks, rows, hasBatch };
}

export function guessKind({ columns, hasBatch }) {
  if (hasBatch || columns.some(c => LAB_MARK_COLUMN.test(c))) {
    return columns.some(c => LAB_MARK_COLUMN.test(c)) ? 'lab_marks' : 'lab_attendance';
  }
  if (columns.some(c => IA_COLUMN.test(c))) return 'ia';
  if (columns.some(c => DATE_COLUMN.test(c))) return 'attendance';
  return 'students';
}

const ATTENDANCE_VALUES = { P: 'P', PRESENT: 'P', 1: 'P', A: 'A', ABSENT: 'A', 0: 'A' };

// Matches rows to the subject's students and checks each value for the sheet's kind.
// Columns the teacher added themselves are kept as typed.
export function checkUpload(kind, table, course, data) {
  const roster = new Map(enrolledStudents(course, data).map(s => [usnOf(s), s]));
  const isMark = (c) => (kind === 'ia' ? IA_COLUMN.test(c) : kind === 'lab_marks' ? LAB_MARK_COLUMN.test(c) : false);
  const isDate = (c) => (kind === 'attendance' || kind === 'lab_attendance') && DATE_COLUMN.test(c);

  const seen = new Set();
  const unknown = [];
  const duplicates = [];
  const problems = [];
  const rows = [];
  for (const r of table.rows) {
    const student = roster.get(r.usn);
    if (!student) { unknown.push(r.usn); continue; }
    if (seen.has(r.usn)) { duplicates.push(r.usn); continue; }
    seen.add(r.usn);
    const values = {};
    const bad = [];
    for (const c of table.columns) {
      const raw = r.values[c] ?? '';
      if (raw === '') { values[c] = ''; continue; }
      if (isMark(c)) {
        const n = Number(raw);
        const max = table.maxMarks[c];
        values[c] = Number.isFinite(n) ? n : raw;
        if (!Number.isFinite(n) || n < 0 || (max !== undefined && n > max)) {
          bad.push(c);
          problems.push(`${r.usn}: ${c} = ${raw}${max !== undefined ? ` (max ${max})` : ''}`);
        }
      } else if (isDate(c)) {
        const v = ATTENDANCE_VALUES[raw.toUpperCase()];
        values[c] = v || raw;
        if (!v) {
          bad.push(c);
          problems.push(`${r.usn}: ${c} = "${raw}" (use P or A)`);
        }
      } else {
        values[c] = raw;
      }
    }
    rows.push({ student_id: student.id, usn: r.usn, name: student.name, batch: r.batch || student.batch || '', values, problems: bad });
  }
  return {
    columns: table.columns,
    maxMarks: table.maxMarks,
    rows,
    summary: { matched: rows.length, unknown, duplicates, problems, rosterSize: roster.size }
  };
}

// ── Copying uploaded IA marks into the app ──

// What a copy would do. Marks already in the app are "clashes"; the teacher decides whether
// to keep or replace them. Problem cells and columns without an app IA cycle are left out.
export function planIaCopy(upload, course, iaMarks) {
  const unmapped = [];
  const maxMismatch = [];
  const columns = [];
  for (const c of upload.columns) {
    if (!IA_COLUMN.test(c)) continue;
    const cycle = iaCycleForColumn(c);
    if (!cycle) { unmapped.push(c); continue; }
    const appMax = iaMarks.find(m => m.course_id === course.id && m.ia_name === cycle && m.max_score)?.max_score;
    const sheetMax = upload.max_marks?.[c];
    if (appMax && sheetMax && Number(appMax) !== Number(sheetMax)) {
      maxMismatch.push(`${c}: sheet max ${sheetMax}, app max ${appMax}`);
      continue;
    }
    columns.push({ column: c, cycle, max: Number(sheetMax || appMax || 30) });
  }

  const adds = [];
  const clashes = [];
  let problemCells = 0;
  for (const row of upload.rows) {
    for (const { column, cycle, max } of columns) {
      const v = row.values[column];
      if (v === '' || v === undefined) continue;
      if (row.problems.includes(column)) { problemCells += 1; continue; }
      const existing = iaMarks.find(m => m.course_id === course.id && m.student_id === row.student_id && m.ia_name === cycle);
      const mark = { course_id: course.id, student_id: row.student_id, ia_name: cycle, score: Number(v), max_score: max };
      if (existing && existing.score !== null && existing.score !== undefined && existing.score !== '') {
        clashes.push({ ...mark, id: existing.id, published: existing.published, same: Number(existing.score) === Number(v) });
      } else {
        adds.push({ ...mark, ...(existing ? { id: existing.id } : {}), published: existing ? existing.published : false });
      }
    }
  }
  return { adds, clashes, unmapped, maxMismatch, problemCells, columns };
}
