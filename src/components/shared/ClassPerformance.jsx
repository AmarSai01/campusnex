import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Award, CheckSquare, ChartColumn, TriangleAlert, Users } from 'lucide-react';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { RISK_LABELS, RISK_ORDER, RISK_RULES, attendanceStats, marksStats } from '../../utils/risk';
import { attendanceCounts, fmtMarks, marksSummary, orderTests } from '../../utils/analytics';
import { AttendanceDonut, IAMarksBars } from './analyticsCharts';
import { useAnalyticsScope } from './useAnalyticsScope';

const LEVEL_BADGE = { high: 'danger', warning: 'warning', ok: 'success', na: 'neutral' };
const BAND_BAR = '#2a78d6';

const fmtPct = (v) => (v === null || v === undefined ? '—' : `${v}%`);
const worst = (a, b) => (RISK_ORDER[a] <= RISK_ORDER[b] ? a : b);

// Students in a class grouped by their attendance in it.
const BANDS = [
  { label: 'Below 75%', test: (p) => p < 75 },
  { label: `75–${RISK_RULES.attendance.shortage - 1}%`, test: (p) => p >= 75 && p < RISK_RULES.attendance.shortage },
  { label: `${RISK_RULES.attendance.shortage}–${RISK_RULES.attendance.warning - 1}%`, test: (p) => p >= RISK_RULES.attendance.shortage && p < RISK_RULES.attendance.warning },
  { label: `${RISK_RULES.attendance.warning}% and above`, test: (p) => p >= RISK_RULES.attendance.warning }
];

// Whole-class attendance and IA marks for one course at a time.
export default function ClassPerformance({ scope = 'teaching' }) {
  const { courses, users, enrollments, attendance, marks, departmentCodes } = useAnalyticsScope(scope);
  const [courseId, setCourseId] = useState('');

  const sortedCourses = useMemo(
    () =>
      [...courses].sort(
        (a, b) => a.code.localeCompare(b.code) || String(a.section || '').localeCompare(String(b.section || ''))
      ),
    [courses]
  );
  const course = sortedCourses.find((c) => c.id === courseId) || sortedCourses[0] || null;

  const board = useMemo(() => {
    if (!course) return null;
    const records = attendance.filter((a) => a.course_id === course.id);
    const courseMarks = marks.filter((m) => m.course_id === course.id);
    const enrolled = new Set(enrollments.filter((e) => e.course_id === course.id).map((e) => e.student_id));
    const students = users.filter((u) => u.role === 'student' && u.status !== 'inactive' && enrolled.has(u.id));
    const tests = orderTests(courseMarks);
    const max = marksSummary(courseMarks).max;

    const rows = students
      .map((student) => {
        const ownRecords = records.filter((a) => a.student_id === student.id);
        const att = attendanceStats(ownRecords);
        const counts = attendanceCounts(ownRecords);
        const own = courseMarks.filter((m) => m.student_id === student.id);
        const ia = marksSummary(own);
        const scores = Object.fromEntries(
          tests.map((t) => [t, own.find((m) => m.ia_name === t && m.score !== null && m.score !== undefined)])
        );
        return { student, att, counts, ia, scores, level: worst(att.level, marksStats(own).level) };
      })
      .sort(
        (a, b) =>
          RISK_ORDER[a.level] - RISK_ORDER[b.level] ||
          String(a.student.usn || a.student.name).localeCompare(String(b.student.usn || b.student.name))
      );

    // Class average for each test, in marks out of the test maximum.
    const testBars = tests
      .map((name) => {
        const taken = courseMarks.filter(
          (m) => m.ia_name === name && m.max_score > 0 && m.score !== null && m.score !== undefined
        );
        if (!taken.length) return null;
        const s = marksSummary(taken);
        return { name, score: s.avg, max: s.max, published: taken.every((m) => m.published), taken: taken.length };
      })
      .filter(Boolean);

    const withMarks = rows.filter((r) => r.ia.avg !== null);
    const classIA = withMarks.length
      ? withMarks.reduce((sum, r) => sum + r.ia.avg / r.ia.max, 0) / withMarks.length * max
      : null;

    const judged = rows.filter((r) => r.att.pct !== null);
    const bands = BANDS.map((b) => ({ label: b.label, count: judged.filter((r) => b.test(r.att.pct)).length }));

    return {
      rows,
      tests,
      max,
      testBars,
      classAtt: attendanceStats(records),
      counts: attendanceCounts(records),
      classIA,
      bands,
      sessions: new Set(records.map((a) => a.session_id || a.date)).size,
      atRisk: rows.filter((r) => r.level === 'high').length,
      warning: rows.filter((r) => r.level === 'warning').length
    };
  }, [course, attendance, marks, enrollments, users]);

  if (!course) {
    return (
      <EmptyState
        icon={ChartColumn}
        title="No classes to analyse yet"
        description={
          scope === 'department'
            ? 'Courses added to your department will appear here.'
            : 'Courses assigned to you will appear here.'
        }
      />
    );
  }

  const teacher = users.find((u) => u.id === course.faculty_id)?.name || '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <ChartColumn className="h-5 w-5 text-brand-600" />
            Class Analytics
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Attendance and IA marks for a whole class
            {scope === 'department' ? `, any class in the ${departmentCodes} department.` : ', for the classes you teach.'}{' '}
            Unpublished IA marks are included.
          </p>
        </div>
        <label className="block md:w-80">
          <span className="sr-only">Choose a class</span>
          <select
            value={course.id}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-400"
          >
            {sortedCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · Sec {c.section || '—'} · {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <p className="text-sm font-bold text-slate-900">
          {course.code} · {course.name}
        </p>
        <p className="text-xs text-slate-500">
          Sem {course.semester || '—'} · Sec {course.section || '—'}
          {scope === 'department' ? ` · Taught by ${teacher}` : ''} · {board.sessions}{' '}
          {board.sessions === 1 ? 'class' : 'classes'} held
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Students"
          value={board.rows.length}
          subtitle="Enrolled in this class"
          icon={Users}
          iconBg="bg-brand-50 text-brand-600 border-brand-100"
        />
        <StatCard
          title="Class Attendance"
          value={fmtPct(board.classAtt.pct)}
          subtitle={`Across ${board.sessions} ${board.sessions === 1 ? 'class' : 'classes'}`}
          icon={CheckSquare}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <StatCard
          title="Average IA Marks"
          value={board.classIA === null ? '—' : `${fmtMarks(board.classIA)}/${board.max}`}
          subtitle={`${board.tests.length} IA ${board.tests.length === 1 ? 'test' : 'tests'}`}
          icon={Award}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
        />
        <StatCard
          title="At Risk"
          value={board.atRisk}
          subtitle={`${board.warning} more on warning`}
          icon={TriangleAlert}
          iconBg="bg-rose-50 text-rose-600 border-rose-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h4 className="text-base font-bold text-slate-900">Class attendance</h4>
          <p className="mb-4 text-xs text-slate-500">Every attendance entry in {course.code}, all students.</p>
          <AttendanceDonut
            counts={board.counts}
            pct={board.classAtt.pct}
            held={board.classAtt.held}
            attended={board.classAtt.attended}
            unit="entries"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h4 className="text-base font-bold text-slate-900">Average IA marks</h4>
          <p className="mb-2 text-xs text-slate-500">Class average in each IA test of {course.code}.</p>
          <IAMarksBars data={board.testBars} max={board.max} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h4 className="text-base font-bold text-slate-900">Students by attendance</h4>
        <p className="mb-4 text-xs text-slate-500">
          How many students fall in each attendance band. Below {RISK_RULES.attendance.shortage}% is a shortage.
        </p>
        {board.bands.some((b) => b.count) ? (
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={board.bands} margin={{ top: 22, right: 12, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl">
                        {payload[0].payload.label}:{' '}
                        <span className="font-extrabold">
                          {payload[0].value} {payload[0].value === 1 ? 'student' : 'students'}
                        </span>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="count" fill={BAND_BAR} maxBarSize={56} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#334155', fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-xs text-slate-500">No classes marked yet.</p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4">
          <h4 className="text-base font-bold text-slate-900">Students: attendance and IA marks</h4>
          <p className="text-xs text-slate-500">
            At-risk students first. Attendance is the share of {board.sessions}{' '}
            {board.sessions === 1 ? 'class' : 'classes'} attended (a late counts as half). IA marks out of{' '}
            {board.max || 50}.
          </p>
        </div>
        {board.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-3 py-3 text-right">Present</th>
                  <th className="px-3 py-3 text-right">Late</th>
                  <th className="px-3 py-3 text-right">Absent</th>
                  {board.tests.map((t) => (
                    <th key={t} className="px-4 py-3 text-right">
                      {t}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">IA average</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {board.rows.map((r) => (
                  <tr key={r.student.id}>
                    <td className="px-6 py-3">
                      <span className="block font-bold text-slate-900">{r.student.name}</span>
                      <span className="block text-slate-500">{r.student.usn || r.student.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">
                      <span className="font-bold">{fmtPct(r.att.pct)}</span>
                      <span className="block text-slate-500">
                        {fmtMarks(r.att.attended)} of {r.att.held}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-700 tabular-nums">{r.counts.present}</td>
                    <td className="px-3 py-3 text-right font-semibold text-amber-700 tabular-nums">{r.counts.late}</td>
                    <td className="px-3 py-3 text-right font-semibold text-rose-700 tabular-nums">{r.counts.absent}</td>
                    {board.tests.map((t) => {
                      const m = r.scores[t];
                      return (
                        <td key={t} className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">
                          {m ? fmtMarks(Number(m.score)) : '—'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                      {r.ia.avg === null ? '—' : fmtMarks(r.ia.avg)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={LEVEL_BADGE[r.level]} size="sm" dot>
                        {RISK_LABELS[r.level]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-xs text-slate-500">No students enrolled in this class.</p>
        )}
      </div>
    </div>
  );
}
