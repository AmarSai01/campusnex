import { parseCsv } from './studentImport';

// Turns rows pasted from a semester calendar circular (PDF or Excel) into calendar items.

export const SEMESTER_CALENDAR_TYPES = {
  milestone: 'Milestone',
  registration: 'Registration',
  cie: 'CIE test',
  see: 'SEE exam',
  classes: 'Classes and meetings',
  deadline: 'ERP deadline',
  results: 'Results',
  holiday: 'Holiday'
};

// Tailwind classes for each type's chip.
export const SEMESTER_CALENDAR_TYPE_STYLES = {
  milestone: 'bg-slate-100 text-slate-700 border-slate-200',
  registration: 'bg-sky-50 text-sky-700 border-sky-200',
  cie: 'bg-amber-50 text-amber-800 border-amber-200',
  see: 'bg-rose-50 text-rose-700 border-rose-200',
  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  deadline: 'bg-violet-50 text-violet-700 border-violet-200',
  results: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  holiday: 'bg-red-50 text-red-700 border-red-200'
};

export function guessItemType(activity) {
  const a = activity.toLowerCase();
  // Checked in order: "Registration for Make-Up Examinations" is a registration, not an exam.
  if (/commencement|last working day/.test(a)) return 'milestone';
  if (/holiday|vacation/.test(a)) return 'holiday';
  if (/registration/.test(a)) return 'registration';
  if (/result|pvp/.test(a)) return 'results';
  if (/\bsee\b|make-?up exam|semester end exam/.test(a)) return 'see';
  if (/\bcie\b.*test|retest|internal test/.test(a)) return 'cie';
  if (/remedial|parent|meeting|classes/.test(a)) return 'classes';
  if (/submission|dispatch|review|display|erp/.test(a)) return 'deadline';
  return 'milestone';
}

const DATE = String.raw`(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})`;

// "17.02.2025", "17/2/25" or "2025-02-17" -> "2025-02-17"; null when it isn't a real date.
export function parseDate(text) {
  const value = String(text).trim();
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const m = iso ? [null, iso[3], iso[2], iso[1]] : value.match(new RegExp(`^${DATE}$`));
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Each line: activity, then a date or a range ("24.03.2025 to 27.03.2025", "24.03.2025 - 27.03.2025",
// or two Excel columns). Lines without a date, such as table headers, are reported as skipped.
export function parseSemesterCalendar(text) {
  const items = [];
  const skipped = [];
  const lineRe = new RegExp(`^(.*?)[\\t ]+${DATE}(?:\\s*(?:to|-|–|—|\\t)\\s*${DATE})?\\s*$`, 'i');

  String(text).split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const m = line.match(lineRe);
    const activity = m ? m[1].replace(/[\t ]+$/, '').trim() : '';
    if (!m || !activity) {
      skipped.push(line);
      return;
    }
    const start = parseDate(`${m[2]}.${m[3]}.${m[4]}`);
    const end = m[5] ? parseDate(`${m[5]}.${m[6]}.${m[7]}`) : null;
    if (!start || (m[5] && !end) || (end && end < start)) {
      skipped.push(line);
      return;
    }
    items.push({
      activity,
      start_date: start,
      end_date: end && end !== start ? end : null,
      type: guessItemType(activity)
    });
  });

  return { items, skipped };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateRange(start, end) {
  const [sy, sm, sd] = start.split('-').map(Number);
  if (!end) return `${sd} ${MONTHS[sm - 1]} ${sy}`;
  const [ey, em, ed] = end.split('-').map(Number);
  if (sy === ey && sm === em) return `${sd}–${ed} ${MONTHS[sm - 1]} ${sy}`;
  if (sy === ey) return `${sd} ${MONTHS[sm - 1]} – ${ed} ${MONTHS[em - 1]} ${sy}`;
  return `${sd} ${MONTHS[sm - 1]} ${sy} – ${ed} ${MONTHS[em - 1]} ${ey}`;
}

// Who a semester calendar reaches: students in its semesters (and department, if set);
// faculty in its department, or all faculty.
export function calendarAppliesTo(calendar, user) {
  if (!user || user.status === 'inactive') return false;
  if (user.role === 'admin') return true;
  if (calendar.department_id && user.department_id !== calendar.department_id) return false;
  if (user.role === 'student') return (calendar.semesters || []).includes(Number(user.semester));
  return user.role === 'faculty';
}

// ── CSV import: Activity, Start date, End date (optional), Type (optional) ──

export const SEMESTER_CALENDAR_CSV_COLUMNS = ['ACTIVITY', 'START DATE', 'END DATE', 'TYPE'];
export const semesterCalendarTemplateCsv = () => [
  'ACTIVITY,START DATE,END DATE,TYPE',
  'Commencement of Even Semester,17.02.2025,,Milestone',
  'First CIE Test,24.03.2025,27.03.2025,CIE test',
  'SEE Theory Examination,19.06.2025,19.07.2025,SEE exam',
  ''
].join('\r\n');

const CSV_HEADERS = {
  activity: ['ACTIVITY', 'ACTIVITIES', 'EVENT', 'DESCRIPTION', 'PARTICULARS'],
  start: ['START', 'STARTDATE', 'FROM', 'DATE', 'FROMDATE'],
  end: ['END', 'ENDDATE', 'TO', 'TODATE'],
  type: ['TYPE', 'CATEGORY', 'KIND']
};
const normHeader = (h) => h.toUpperCase().replace(/[\s_.-]/g, '');
const typeFromLabel = (label, activity) => {
  const v = String(label || '').trim().toLowerCase();
  if (!v) return guessItemType(activity);
  const found = Object.entries(SEMESTER_CALENDAR_TYPES).find(([key, text]) => key === v || text.toLowerCase() === v);
  return found ? found[0] : guessItemType(activity);
};

// Rows from a CSV file. A row's single "Date" cell may also hold a range ("24.03.2025 to 27.03.2025").
export function parseSemesterCalendarCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { items: [], skipped: [], error: 'The file is empty.' };
  const header = rows[0].map(normHeader);
  const hasHeader = header.some(h => Object.values(CSV_HEADERS).flat().includes(h));
  const idx = { activity: 0, start: 1, end: 2, type: 3 };
  if (hasHeader) {
    for (const key of Object.keys(idx)) {
      const i = header.findIndex(h => CSV_HEADERS[key].includes(h));
      idx[key] = i;
    }
    if (idx.activity < 0 || idx.start < 0) {
      return { items: [], skipped: [], error: 'The file needs ACTIVITY and START DATE columns. Download the template to see the layout.' };
    }
  }

  const items = [];
  const skipped = [];
  (hasHeader ? rows.slice(1) : rows).forEach(r => {
    const cell = (i) => (i >= 0 ? String(r[i] ?? '').trim() : '');
    const activity = cell(idx.activity);
    let startText = cell(idx.start);
    let endText = cell(idx.end);
    // "24.03.2025 to 27.03.2025" or "24.03.2025 - 27.03.2025"; a dash needs spaces so an
    // ISO date like 2025-05-23 isn't split.
    const range = startText.match(/^(.+?)(?:\s*\bto\b\s*|\s+[-–—]\s+)(\d.+)$/i);
    if (range && !endText) {
      startText = range[1];
      endText = range[2];
    }
    const start = parseDate(startText);
    const end = endText ? parseDate(endText) : null;
    if (!activity || !start || (endText && !end) || (end && end < start)) {
      skipped.push(r.join(', '));
      return;
    }
    items.push({
      activity,
      start_date: start,
      end_date: end && end !== start ? end : null,
      type: typeFromLabel(cell(idx.type), activity)
    });
  });
  return { items, skipped };
}

// ── What changed between two versions of a published calendar ──

// Returns { count, summary } for moved, added and removed dates, or null if no date changed.
export function describeDateChanges(oldRows, newRows) {
  const oldById = new Map(oldRows.map(r => [r.id, r]));
  const newIds = new Set(newRows.map(r => r.id));
  const lines = [];
  for (const row of newRows) {
    const old = oldById.get(row.id);
    if (!old) lines.push(`Added: ${row.activity}, ${formatDateRange(row.start_date, row.end_date)}`);
    else if (old.start_date !== row.start_date || (old.end_date || null) !== (row.end_date || null)) {
      lines.push(`${row.activity} moved to ${formatDateRange(row.start_date, row.end_date)} (was ${formatDateRange(old.start_date, old.end_date)})`);
    }
  }
  for (const old of oldRows) {
    if (!newIds.has(old.id)) lines.push(`Removed: ${old.activity}`);
  }
  if (!lines.length) return null;
  const shown = lines.slice(0, 3).join('. ');
  return {
    count: lines.length,
    summary: lines.length > 3 ? `${shown}. And ${lines.length - 3} more.` : `${shown}.`
  };
}
