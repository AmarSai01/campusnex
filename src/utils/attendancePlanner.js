import { RISK_RULES } from './risk';

// Attendance planner for a student. Uses the same rounded percentage as every other screen,
// so "eligible" here always matches the badges elsewhere. A late counts as half a class.

const MIN = RISK_RULES.attendance.shortage;
const LIMIT = 1000;

export const roundedPct = (held, attended) => (held > 0 ? Math.round((attended * 100) / held) : null);

// Whether the student is eligible now and, when short, how many classes they must attend
// in a row to get back to the minimum.
export function planAttendance(held, attended, min = MIN) {
  if (!held) return { status: 'none' };
  if (roundedPct(held, attended) >= min) return { status: 'eligible' };
  let mustAttend = 0;
  while (mustAttend < LIMIT && roundedPct(held + mustAttend, attended + mustAttend) < min) mustAttend += 1;
  return { status: 'short', mustAttend };
}

// Percentage after attending the next few classes.
export const projectAttendance = (held, attended, attendNext) => roundedPct(held + attendNext, attended + attendNext);

// Rough number of weeks a run of classes takes, from the weekly timetable slots.
export const weeksFor = (classes, perWeek) => (perWeek > 0 && classes > 0 ? Math.ceil(classes / perWeek) : null);
