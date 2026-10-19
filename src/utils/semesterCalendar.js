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

// "17.02.2025" or "17/2/25" -> "2025-02-17"; null when it isn't a real date.
export function parseDate(text) {
  const m = String(text).trim().match(new RegExp(`^${DATE}$`));
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
