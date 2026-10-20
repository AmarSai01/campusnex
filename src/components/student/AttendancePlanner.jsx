import React, { useMemo, useState } from 'react';
import { CalendarClock, ShieldCheck, TriangleAlert } from 'lucide-react';
import Badge from '../common/Badge';
import { RISK_RULES, attendanceStats } from '../../utils/risk';
import { planAttendance, projectAttendance, weeksFor } from '../../utils/attendancePlanner';

const MIN = RISK_RULES.attendance.shortage;
const MAX_WHAT_IF = 100;

const clampCount = (value) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_WHAT_IF) : 0;
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 'es'}`;
const weeksText = (w) => (w ? ` (about ${w} week${w === 1 ? '' : 's'})` : '');

// Per subject: whether the student is eligible for the SEE and, when short, how many classes they
// must attend in a row to get there. Plus a what-if for one subject.
export default function AttendancePlanner({ courses, attendance, timetable }) {
  const rows = useMemo(
    () =>
      courses
        .map((course) => {
          const stats = attendanceStats(attendance.filter((a) => a.course_id === course.id));
          const perWeek = timetable.filter((t) => t.course_id === course.id).length;
          return { course, stats, perWeek, plan: planAttendance(stats.held, stats.attended) };
        })
        // Short subjects first (furthest behind on top), then the lowest percentages.
        .sort((a, b) => {
          const rank = (r) =>
            r.plan.status === 'short' ? -1000 - r.plan.mustAttend : r.plan.status === 'eligible' ? r.stats.pct : 2000;
          return rank(a) - rank(b) || a.course.code.localeCompare(b.course.code);
        }),
    [courses, attendance, timetable]
  );

  const [courseId, setCourseId] = useState('');
  const [attendNext, setAttendNext] = useState(5);

  if (!courses.length) return null;

  const selected = rows.find((r) => r.course.id === courseId) || rows[0];
  const projected = projectAttendance(selected.stats.held, selected.stats.attended, attendNext);
  const projectedOk = projected !== null && projected >= MIN;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-brand-600" />
            Attendance Planner
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {MIN}% attendance in each subject is required to sit the SEE. If you're short, this shows how many classes you need to attend.
          </p>
        </div>
        <p className="text-[11px] text-slate-400">A late counts as half a class.</p>
      </div>

      <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
        {rows.map(({ course, stats, perWeek, plan }) => (
          <li key={course.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0 sm:w-64">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: course.color || '#4f46e5' }} />
              <span className="font-bold text-xs text-slate-900">{course.code}</span>
              <span className="text-[11px] text-slate-500 truncate">{course.name}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 tabular-nums sm:w-28">
              {stats.pct === null ? '—' : `${stats.pct}%`}
              <span className="font-medium text-slate-400"> · {stats.held} held</span>
            </span>
            <div className="flex-1 flex items-center gap-2 text-xs">
              {plan.status === 'none' && <span className="text-slate-400">No classes marked yet.</span>}
              {plan.status === 'eligible' && (
                <>
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="text-slate-700">Eligible for the SEE. Keep attending every class.</span>
                </>
              )}
              {plan.status === 'short' && (
                <>
                  <TriangleAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="text-slate-700">
                    Attend the next <strong>{plural(plan.mustAttend, 'class')}</strong> in a row
                    {weeksText(weeksFor(plan.mustAttend, perWeek))} to reach {MIN}%.
                  </span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
        <p className="text-xs font-bold text-slate-900 mb-3">What if…</p>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 sm:items-end">
          <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
            Subject
            <select
              value={selected.course.id}
              onChange={(e) => setCourseId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {rows.map(({ course }) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-slate-600 flex flex-col gap-1">
            If I attend the next
            <input
              type="number"
              min={0}
              max={MAX_WHAT_IF}
              inputMode="numeric"
              value={attendNext}
              onChange={(e) => setAttendNext(clampCount(e.target.value))}
              className="w-full sm:w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-2 sm:pb-0.5" aria-live="polite">
            <span className="text-[11px] font-semibold text-slate-600">classes, I'll be at</span>
            {projected === null ? (
              <span className="text-xs text-slate-400">—</span>
            ) : (
              <Badge variant={projectedOk ? 'success' : 'danger'} size="lg">
                {projected}% {projectedOk ? 'Eligible' : 'Shortage'}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Now {selected.stats.pct === null ? 'no classes marked' : `${selected.stats.pct}% of ${selected.stats.held} classes`}
          {selected.perWeek > 0 && ` · ${selected.perWeek} class${selected.perWeek === 1 ? '' : 'es'} a week in your timetable`}.
        </p>
      </div>
    </div>
  );
}
