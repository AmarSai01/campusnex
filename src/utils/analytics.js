// Attendance and IA helpers shared by the student and class analytics boards.

export const STATUS_COLORS = { present: '#0ca30c', late: '#fab219', absent: '#d03b3b' };
export const fmtMarks = (v) => (v === null || v === undefined ? '—' : String(Math.round(v * 10) / 10));

// Present / late / absent counts for a set of attendance records.
export function attendanceCounts(records) {
  const counts = { present: 0, late: 0, absent: 0 };
  for (const r of records) if (r.status in counts) counts[r.status] += 1;
  return counts;
}

// IA marks as raw marks: the average score out of the test maximum (50 for every IA test).
export function marksSummary(marks) {
  const scored = marks.filter((m) => m.max_score > 0 && m.score !== null && m.score !== undefined);
  if (!scored.length) return { avg: null, max: null, tests: 0, unpublished: 0 };
  const max = Math.max(...scored.map((m) => Number(m.max_score)));
  const avg = (scored.reduce((sum, m) => sum + m.score / m.max_score, 0) / scored.length) * max;
  return { avg, max, tests: scored.length, unpublished: scored.filter((m) => !m.published).length };
}

// IA test names in the order they were held.
export function orderTests(marks) {
  const tests = new Map();
  for (const m of marks) {
    const date = tests.get(m.ia_name);
    if (date === undefined || (m.date && (!date || m.date < date))) tests.set(m.ia_name, m.date || '');
  }
  return [...tests.entries()]
    .sort(([a, da], [b, db]) =>
      da && db && da !== db ? da.localeCompare(db) : a.localeCompare(b, undefined, { numeric: true })
    )
    .map(([name]) => name);
}
