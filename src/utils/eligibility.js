import { RISK_RULES, attendanceStats } from './risk';

// SEE eligibility: a student needs the minimum attendance in a subject to sit its
// end-semester papers (theory and practical). Mid-semester and IA tests are not gated.

export const isSeeExam = (exam) => /end-semester|practical|laboratory|\bsee\b/i.test(exam?.exam_type || '');

// The course an exam paper belongs to: its course_id, or a course code named in the subject.
export function courseForExam(exam, courses) {
  if (exam.course_id) return courses.find((c) => c.id === exam.course_id) || null;
  const subject = String(exam.subject || '').toUpperCase();
  return courses.find((c) => c.code && subject.includes(String(c.code).toUpperCase())) || null;
}

// { gated, eligible, course, pct } for one paper. Unknown course or too few classes held: eligible.
export function examEligibility(exam, courses, attendance) {
  const gated = isSeeExam(exam);
  const course = courseForExam(exam, courses);
  if (!gated || !course) return { gated, eligible: true, course, pct: null };
  const stats = attendanceStats(attendance.filter((a) => a.course_id === course.id));
  return { gated, eligible: stats.level !== 'high', course, pct: stats.pct };
}

export const MIN_ATTENDANCE = RISK_RULES.attendance.shortage;
