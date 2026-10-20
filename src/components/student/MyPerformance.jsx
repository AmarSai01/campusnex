import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Award,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Minus,
  Star,
  TrendingDown,
  TrendingUp,
  TriangleAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { AttendanceDonut } from '../shared/analyticsCharts';
import { RISK_LABELS, RISK_RULES, attendanceStats, buildStudentRiskRows, marksStats } from '../../utils/risk';
import { attendanceCounts, fmtMarks, orderTests } from '../../utils/analytics';
import { cn } from '@/lib/utils';

const LEVEL_BADGE = { high: 'danger', warning: 'warning', ok: 'success', na: 'neutral' };
const YOU = '#2a78d6';
const CLASS = '#94a3b8';

const fmtPct = (v) => (v === null || v === undefined ? '—' : `${Math.round(v)}%`);

// Class averages arrive as rows from the my_class_averages() server function.
function indexAverages(rows) {
  const attendance = new Map();
  const tests = new Map();
  for (const r of rows) {
    if (r.kind === 'attendance') attendance.set(r.course_id, Number(r.avg_pct));
    else tests.set(`${r.course_id}|${r.ia_name}`, Number(r.avg_pct));
  }
  const iaAverage = (courseId, testNames) => {
    const vals = testNames.map((t) => tests.get(`${courseId}|${t}`)).filter((v) => v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  return { attendance, tests, iaAverage };
}

// Difference between your last two IA tests, in percentage points.
function trendOf(marks) {
  const order = orderTests(marks);
  const pcts = order
    .map((name) => marks.find((m) => m.ia_name === name))
    .filter((m) => m && m.max_score > 0 && m.score !== null && m.score !== undefined)
    .map((m) => (m.score * 100) / m.max_score);
  if (pcts.length < 2) return null;
  return Math.round(pcts[pcts.length - 1] - pcts[pcts.length - 2]);
}

function Trend({ value }) {
  if (value === null) return <span className="text-slate-400">—</span>;
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
        <Minus className="w-3.5 h-3.5" /> Same
      </span>
    );
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-1 font-bold', up ? 'text-emerald-600' : 'text-rose-600')}>
      <Icon className="w-3.5 h-3.5" />
      {up ? '+' : ''}
      {value} pts
    </span>
  );
}

function YouVsClass({ you, cls }) {
  return (
    <span className="tabular-nums">
      <span className="font-bold text-slate-900">{fmtPct(you)}</span>
      <span className="text-slate-400"> / {fmtPct(cls)}</span>
    </span>
  );
}

// The signed-in student's own attendance and IA marks per subject, with the class average
// beside them and the same risk flags teachers and HODs see.
export default function MyPerformance({ onNavigateTab }) {
  const { currentUser } = useAuth();
  const { courses, enrollments, attendance, ia_marks, fetchClassAverages } = useData();

  const [averages, setAverages] = useState({ status: 'loading', rows: [] });

  useEffect(() => {
    let active = true;
    fetchClassAverages()
      .then((rows) => active && setAverages({ status: 'ready', rows }))
      .catch(() => active && setAverages({ status: 'unavailable', rows: [] }));
    return () => {
      active = false;
    };
    // Loaded once per visit; the numbers change only when teachers mark or publish.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myAttendance = useMemo(
    () => attendance.filter((a) => a.student_id === currentUser?.id),
    [attendance, currentUser?.id]
  );
  // Students only ever receive published marks; filter anyway so drafts never show here.
  const myMarks = useMemo(
    () => ia_marks.filter((m) => m.student_id === currentUser?.id && m.published),
    [ia_marks, currentUser?.id]
  );

  const risk = useMemo(() => {
    if (!currentUser) return null;
    return buildStudentRiskRows({
      students: [currentUser],
      courses,
      enrollments,
      attendance: myAttendance,
      ia_marks: myMarks
    })[0];
  }, [currentUser, courses, enrollments, myAttendance, myMarks]);

  const avg = useMemo(() => indexAverages(averages.rows), [averages.rows]);

  const subjects = useMemo(
    () =>
      (risk?.subjects || [])
        .map((s) => {
          const marks = myMarks.filter((m) => m.course_id === s.course.id);
          const tests = orderTests(marks);
          return {
            ...s,
            marksList: marks,
            tests,
            trend: trendOf(marks),
            classAtt: avg.attendance.get(s.course.id) ?? null,
            classIA: avg.iaAverage(s.course.id, tests)
          };
        })
        .sort((a, b) => a.course.code.localeCompare(b.course.code)),
    [risk, myMarks, avg]
  );

  const [courseId, setCourseId] = useState('');
  const selected = subjects.find((s) => s.course.id === courseId) || subjects[0];

  if (!currentUser) return null;

  if (!subjects.length) {
    return (
      <EmptyState
        icon={Award}
        title="No subjects yet"
        description="Your performance board fills in once you are enrolled in courses for this semester."
      />
    );
  }

  const overallAtt = attendanceStats(myAttendance);
  const overallIA = marksStats(myMarks);
  const flagged = subjects.filter((s) => s.level === 'high' || s.level === 'warning');
  const strongest = subjects
    .filter((s) => s.marks.pct !== null)
    .sort((a, b) => b.marks.pct - a.marks.pct)[0];

  const chartData = selected
    ? selected.tests.map((name) => {
        const mark = selected.marksList.find((m) => m.ia_name === name);
        const max = Number(mark?.max_score) || 0;
        const classPct = avg.tests.get(`${selected.course.id}|${name}`);
        return {
          name,
          max,
          you: mark && mark.score !== null && mark.score !== undefined ? Number(mark.score) : null,
          class: classPct === undefined || !max ? null : Math.round(classPct * max) / 100
        };
      })
    : [];
  const chartMax = Math.max(0, ...chartData.map((d) => d.max));
  const minMark = Math.round((chartMax * RISK_RULES.marks.fail) / 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-600" />
          My Performance
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Your attendance and published IA marks in each subject, next to your class average.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance"
          value={fmtPct(overallAtt.pct)}
          subtitle={`${overallAtt.held} classes held`}
          icon={CheckSquare}
          onClick={() => onNavigateTab?.('attendance')}
        />
        <StatCard
          title="IA average"
          value={fmtPct(overallIA.pct)}
          subtitle={`${overallIA.tests} published test${overallIA.tests === 1 ? '' : 's'}`}
          icon={Award}
          onClick={() => onNavigateTab?.('iamarks')}
        />
        <StatCard
          title="Needs attention"
          value={flagged.length}
          subtitle={flagged.length ? 'subjects below the safe mark' : 'every subject on track'}
          icon={TriangleAlert}
          iconBg={
            flagged.length
              ? 'bg-rose-50 text-rose-600 border-rose-100'
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }
        />
        <StatCard
          title="Strongest subject"
          value={strongest ? strongest.course.code : '—'}
          subtitle={strongest ? `IA average ${strongest.marks.pct}%` : 'No IA marks published yet'}
          icon={Star}
        />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">What needs attention</h3>
        <p className="text-xs text-slate-500 mb-4">
          Flagged when attendance is under {RISK_RULES.attendance.warning}% (shortage under{' '}
          {RISK_RULES.attendance.shortage}%) or the IA average is under {RISK_RULES.marks.warning}% (at risk under{' '}
          {RISK_RULES.marks.fail}%).
        </p>
        {risk.reasons.length === 0 ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> You're on track in every subject.
          </p>
        ) : (
          <ul className="space-y-2">
            {risk.reasons.map((r) => {
              const isAttendance = r.text.includes('attendance');
              return (
                <li key={r.text}>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.(isAttendance ? 'attendance' : 'iamarks')}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-brand-300 hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-3 text-xs font-semibold text-slate-800">
                      <Badge variant={LEVEL_BADGE[r.level]} size="sm">
                        {RISK_LABELS[r.level]}
                      </Badge>
                      {r.text}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-brand-600 shrink-0">
                      {isAttendance ? 'Plan attendance' : 'See marks'} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="text-base font-bold text-slate-900">Subject by subject</h3>
          <p className="text-xs text-slate-500">
            You / class average.
            {averages.status === 'unavailable' && ' Class averages are not available right now.'}
            {averages.status === 'ready' && ' A class average shows once at least 3 students have marks.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200">
              <tr>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Attendance</th>
                <th className="px-6 py-3">IA average</th>
                <th className="px-6 py-3">Last test change</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {subjects.map((s) => (
                <tr
                  key={s.course.id}
                  onClick={() => setCourseId(s.course.id)}
                  className={cn(
                    'cursor-pointer hover:bg-slate-50/60 transition-colors',
                    selected?.course.id === s.course.id && 'bg-brand-50/40'
                  )}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.course.color || '#4f46e5' }} />
                      <span className="font-bold text-slate-900">{s.course.code}</span>
                      <span className="text-slate-500 text-[11px] hidden md:inline">{s.course.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <YouVsClass you={s.att.pct} cls={s.classAtt} />
                  </td>
                  <td className="px-6 py-3.5">
                    <YouVsClass you={s.marks.pct} cls={s.classIA} />
                  </td>
                  <td className="px-6 py-3.5">
                    <Trend value={s.trend} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Badge variant={LEVEL_BADGE[s.level]} size="sm">
                      {RISK_LABELS[s.level]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {selected.course.code} · {selected.course.name}
              </h3>
              <p className="text-xs text-slate-500">Your IA marks against the class average, test by test.</p>
            </div>
            <select
              value={selected.course.id}
              onChange={(e) => setCourseId(e.target.value)}
              aria-label="Subject"
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.course.id} value={s.course.id}>
                  {s.course.code}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              {chartData.length && chartMax ? (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 16, right: 12, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        domain={[0, chartMax]}
                        ticks={Array.from({ length: 6 }, (_, i) => Math.round((chartMax * i) / 5))}
                        tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(v, key, item) => [
                          v === null || v === undefined ? '—' : `${fmtMarks(v)} / ${item.payload.max}`,
                          key === 'you' ? 'You' : 'Class average'
                        ]}
                      />
                      <Legend
                        formatter={(key) => (key === 'you' ? 'You' : 'Class average')}
                        itemSorter={(item) => (item.dataKey === 'you' ? 0 : 1)}
                        wrapperStyle={{ fontSize: 11 }}
                      />
                      <ReferenceLine
                        y={minMark}
                        stroke="#f43f5e"
                        strokeDasharray="4 3"
                        label={{ value: `Min ${minMark}`, position: 'insideTopRight', fontSize: 10, fill: '#be123c' }}
                      />
                      <Bar dataKey="you" fill={YOU} maxBarSize={36} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="class" fill={CLASS} maxBarSize={36} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-10 text-center text-xs text-slate-500">No IA marks published for this subject yet.</p>
              )}
            </div>
            <div className="lg:col-span-2">
              <p className="text-xs font-bold text-slate-900 mb-3">Attendance</p>
              <AttendanceDonut
                counts={attendanceCounts(myAttendance.filter((a) => a.course_id === selected.course.id))}
                pct={selected.att.pct}
                held={selected.att.held}
                attended={selected.att.attended}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
