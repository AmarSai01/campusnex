// Academic risk rules shared by the HOD views and exports.
// Keep in sync with the risk alert trigger in supabase/migrations/20261019000100_hod_role.sql.
export const RISK_RULES = {
  attendance: { shortage: 75, warning: 80 },
  marks: { fail: 40, warning: 50 },
  // Attendance is only judged once enough classes have been held.
  minSessions: 4
};

export const RISK_ORDER = { high: 0, warning: 1, ok: 2, na: 3 };

export const RISK_LABELS = {
  high: 'At risk',
  warning: 'Warning',
  ok: 'On track',
  na: 'No data'
};

// Same formula as the student and faculty screens: a late counts as half a class.
export function attendanceStats(records) {
  const held = records.length;
  const attended = records.reduce(
    (sum, r) => sum + (r.status === 'present' ? 1 : r.status === 'late' ? 0.5 : 0),
    0
  );
  const pct = held > 0 ? Math.round((attended * 100) / held) : null;
  let level = 'na';
  if (held >= RISK_RULES.minSessions) {
    if (pct < RISK_RULES.attendance.shortage) level = 'high';
    else if (pct < RISK_RULES.attendance.warning) level = 'warning';
    else level = 'ok';
  }
  return { held, attended, pct, level };
}

// Average of each test's percentage. HODs see unpublished marks too; they count toward risk.
export function marksStats(marks) {
  const scored = marks.filter((m) => m.max_score > 0 && m.score !== null && m.score !== undefined);
  const pct = scored.length
    ? Math.round(scored.reduce((sum, m) => sum + (m.score * 100) / m.max_score, 0) / scored.length)
    : null;
  let level = 'na';
  if (pct !== null) {
    if (pct < RISK_RULES.marks.fail) level = 'high';
    else if (pct < RISK_RULES.marks.warning) level = 'warning';
    else level = 'ok';
  }
  return {
    tests: scored.length,
    unpublished: scored.filter((m) => !m.published).length,
    pct,
    level
  };
}

const worst = (levels) =>
  levels.reduce((acc, l) => (RISK_ORDER[l] < RISK_ORDER[acc] ? l : acc), 'na');

// One row per student with per-subject attendance and IA stats and the reasons they are flagged.
export function buildStudentRiskRows({ students, courses, enrollments, attendance, ia_marks }) {
  const courseById = new Map(courses.map((c) => [c.id, c]));

  return students.map((student) => {
    const courseIds = enrollments
      .filter((e) => e.student_id === student.id)
      .map((e) => e.course_id)
      .filter((id) => courseById.has(id));

    const subjects = courseIds.map((courseId) => {
      const course = courseById.get(courseId);
      const att = attendanceStats(
        attendance.filter((a) => a.student_id === student.id && a.course_id === courseId)
      );
      const marks = marksStats(
        ia_marks.filter((m) => m.student_id === student.id && m.course_id === courseId)
      );
      return { course, att, marks, level: worst([att.level, marks.level]) };
    });

    const reasons = [];
    for (const s of subjects) {
      if (s.att.level === 'high' || s.att.level === 'warning') {
        reasons.push({
          level: s.att.level,
          text: `${s.course.code} attendance ${s.att.pct}% (min ${RISK_RULES.attendance.shortage}%)`
        });
      }
      if (s.marks.level === 'high' || s.marks.level === 'warning') {
        reasons.push({
          level: s.marks.level,
          text: `${s.course.code} IA average ${s.marks.pct}% (min ${RISK_RULES.marks.fail}%)`
        });
      }
    }
    reasons.sort((a, b) => RISK_ORDER[a.level] - RISK_ORDER[b.level]);

    return { student, subjects, reasons, level: worst(subjects.map((s) => s.level)) };
  });
}
