import React, { useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  CheckSquare,
  ChevronDown,
  Download,
  Eye,
  Printer,
  Search,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { RISK_LABELS, RISK_ORDER, RISK_RULES, buildStudentRiskRows } from '../../utils/risk';
import { downloadCsv, printReport } from '../../utils/exportReport';

const LEVEL_BADGE = { high: 'danger', warning: 'warning', ok: 'success', na: 'neutral' };
const LEVEL_TEXT = {
  high: 'text-rose-700 bg-rose-50 border-rose-200',
  warning: 'text-amber-800 bg-amber-50 border-amber-200',
  ok: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  na: 'text-slate-600 bg-slate-50 border-slate-200'
};

const fmtPct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

export default function HodDepartmentOverview() {
  const { hodDepartments } = useAuth();
  const { users, courses, enrollments, attendance, ia_marks } = useData();

  const [deptId, setDeptId] = useState(hodDepartments[0]?.id || '');
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('all');
  const [section, setSection] = useState('all');
  const [subjectCode, setSubjectCode] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [exportError, setExportError] = useState('');

  const department = hodDepartments.find((d) => d.id === deptId) || hodDepartments[0];
  const facultyById = useMemo(
    () => new Map(users.filter((u) => u.role === 'faculty').map((u) => [u.id, u])),
    [users]
  );

  const deptStudents = useMemo(
    () =>
      users.filter(
        (u) => u.role === 'student' && u.department_id === department?.id && u.status !== 'inactive'
      ),
    [users, department]
  );

  const allRows = useMemo(
    () => buildStudentRiskRows({ students: deptStudents, courses, enrollments, attendance, ia_marks }),
    [deptStudents, courses, enrollments, attendance, ia_marks]
  );

  const semesters = [...new Set(deptStudents.map((s) => s.semester).filter(Boolean))].sort((a, b) => a - b);
  const sections = [...new Set(deptStudents.map((s) => s.section).filter(Boolean))].sort();
  const subjectCodes = [
    ...new Set(allRows.flatMap((r) => r.subjects.map((s) => s.course.code)))
  ].sort();

  // Apply filters. With a subject selected, risk is judged on that subject alone.
  const rows = allRows
    .map((row) => {
      if (subjectCode === 'all') return row;
      const subjects = row.subjects.filter((s) => s.course.code === subjectCode);
      const level = subjects.reduce(
        (acc, s) => (RISK_ORDER[s.level] < RISK_ORDER[acc] ? s.level : acc),
        'na'
      );
      const reasons = row.reasons.filter((r) => r.text.startsWith(`${subjectCode} `));
      return { ...row, subjects, reasons, level };
    })
    .filter((row) => {
      const s = row.student;
      if (subjectCode !== 'all' && row.subjects.length === 0) return false;
      if (semester !== 'all' && String(s.semester) !== semester) return false;
      if (section !== 'all' && s.section !== section) return false;
      if (riskFilter !== 'all' && row.level !== riskFilter) return false;
      const q = search.trim().toLowerCase();
      if (q && !s.name.toLowerCase().includes(q) && !(s.usn || '').toLowerCase().includes(q)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        RISK_ORDER[a.level] - RISK_ORDER[b.level] ||
        (a.student.usn || a.student.name).localeCompare(b.student.usn || b.student.name)
    );

  const counts = rows.reduce((acc, r) => ({ ...acc, [r.level]: (acc[r.level] || 0) + 1 }), {});
  const allSubjects = rows.flatMap((r) => r.subjects);
  const avgOf = (values) =>
    values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const avgAttendance = avgOf(allSubjects.map((s) => s.att.pct).filter((v) => v !== null));
  const avgMarks = avgOf(allSubjects.map((s) => s.marks.pct).filter((v) => v !== null));

  const reportRows = () =>
    rows.flatMap((r) =>
      r.subjects.map((s) => [
        r.student.usn || '',
        r.student.name,
        r.student.semester ?? '',
        r.student.section ?? '',
        s.course.code,
        s.course.name,
        facultyById.get(s.course.faculty_id)?.name || '',
        s.att.held,
        fmtPct(s.att.pct),
        RISK_LABELS[s.att.level],
        s.marks.tests,
        fmtPct(s.marks.pct),
        s.marks.unpublished,
        RISK_LABELS[s.marks.level],
        RISK_LABELS[s.level]
      ])
    );

  const REPORT_HEADERS = [
    'USN', 'Student', 'Semester', 'Section', 'Subject code', 'Subject', 'Teacher',
    'Classes held', 'Attendance', 'Attendance status', 'IA tests', 'IA average',
    'Unpublished IA', 'Marks status', 'Overall status'
  ];

  const handleCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${department.code}-student-risk-${stamp}.csv`, REPORT_HEADERS, reportRows());
  };

  const handlePrint = () => {
    setExportError('');
    try {
      printReport({
        title: `${department.name} — Student Attendance & Marks Report`,
        subtitle: `Generated ${new Date().toLocaleString()} · Attendance minimum ${RISK_RULES.attendance.shortage}% · IA minimum ${RISK_RULES.marks.fail}%`,
        sections: [
          {
            heading: 'Students needing attention',
            headers: ['USN', 'Student', 'Sem / Sec', 'Status', 'Reasons'],
            rows: rows
              .filter((r) => r.level === 'high' || r.level === 'warning')
              .map((r) => [
                r.student.usn || '',
                r.student.name,
                `${r.student.semester ?? ''} / ${r.student.section ?? ''}`,
                RISK_LABELS[r.level],
                r.reasons.map((x) => x.text).join('; ')
              ])
          },
          {
            heading: 'Subject-wise report',
            headers: ['USN', 'Student', 'Subject', 'Classes', 'Attendance', 'IA avg', 'Status'],
            rows: reportRows().map((r) => [r[0], r[1], r[4], r[7], r[8], r[11], r[14]])
          }
        ]
      });
    } catch (e) {
      setExportError(e.message);
    }
  };

  if (!department) return null;

  const selectClass =
    'px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:outline-none cursor-pointer';

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-500/30 text-xs font-bold mb-3">
              <Eye className="w-3.5 h-3.5" />
              HOD · View only
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{department.name}</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Subject-wise attendance and IA marks for every student in the department. Students are
              flagged below {RISK_RULES.attendance.shortage}% attendance or a {RISK_RULES.marks.fail}% IA
              average. Unpublished marks are included.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {hodDepartments.length > 1 && (
              <select
                value={department.id}
                onChange={(e) => setDeptId(e.target.value)}
                aria-label="Department"
                className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold cursor-pointer"
              >
                {hodDepartments.map((d) => (
                  <option key={d.id} value={d.id} className="text-slate-900">
                    {d.code}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
          </div>
        </div>

        {exportError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {exportError}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Students"
            value={rows.length}
            subtitle={`of ${deptStudents.length} in ${department.code}`}
            icon={Users}
            iconBg="bg-brand-50 text-brand-600 border-brand-100"
          />
          <StatCard
            title="At Risk"
            value={counts.high || 0}
            subtitle={`${counts.warning || 0} more on warning`}
            icon={ShieldAlert}
            iconBg="bg-rose-50 text-rose-600 border-rose-100"
            onClick={() => setRiskFilter('high')}
          />
          <StatCard
            title="Avg Attendance"
            value={fmtPct(avgAttendance)}
            subtitle="Across filtered subjects"
            icon={CheckSquare}
            iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
          />
          <StatCard
            title="Avg IA Score"
            value={fmtPct(avgMarks)}
            subtitle="Including unpublished"
            icon={Award}
            iconBg="bg-purple-50 text-purple-600 border-purple-100"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or USN"
                aria-label="Search students"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <select value={semester} onChange={(e) => setSemester(e.target.value)} aria-label="Semester" className={selectClass}>
                <option value="all">All semesters</option>
                {semesters.map((s) => (
                  <option key={s} value={String(s)}>Semester {s}</option>
                ))}
              </select>
              <select value={section} onChange={(e) => setSection(e.target.value)} aria-label="Section" className={selectClass}>
                <option value="all">All sections</option>
                {sections.map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
              <select value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} aria-label="Subject" className={selectClass}>
                <option value="all">All subjects</option>
                {subjectCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} aria-label="Risk level" className={selectClass}>
                <option value="all">All students</option>
                <option value="high">At risk</option>
                <option value="warning">Warning</option>
                <option value="ok">On track</option>
                <option value="na">No data yet</option>
              </select>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No students match"
                description="Try clearing the filters or search."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => {
                const s = row.student;
                const open = expandedId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : s.id)}
                      aria-expanded={open}
                      className="flex w-full flex-col gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 cursor-pointer sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 sm:w-56 sm:shrink-0">
                        <p className="truncate text-sm font-bold text-slate-900">{s.name}</p>
                        <p className="text-xs font-medium text-slate-500">
                          {s.usn || '—'} · Sem {s.semester ?? '—'} · Sec {s.section ?? '—'}
                        </p>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                        {row.subjects.length === 0 && (
                          <span className="text-xs text-slate-500">Not enrolled in any subject</span>
                        )}
                        {row.subjects.map((sub) => (
                          <span
                            key={sub.course.id}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${LEVEL_TEXT[sub.level]}`}
                          >
                            <span className="font-bold">{sub.course.code}</span>
                            <span>Att {fmtPct(sub.att.pct)}</span>
                            <span aria-hidden="true">·</span>
                            <span>IA {fmtPct(sub.marks.pct)}</span>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 sm:shrink-0">
                        <Badge variant={LEVEL_BADGE[row.level]} size="sm" dot>
                          {RISK_LABELS[row.level]}
                        </Badge>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 bg-slate-50/70 px-4 pb-4 pt-1">
                            {row.reasons.length > 0 && (
                              <ul className="space-y-1">
                                {row.reasons.map((r) => (
                                  <li
                                    key={r.text}
                                    className={`flex items-center gap-2 text-xs font-semibold ${r.level === 'high' ? 'text-rose-700' : 'text-amber-800'}`}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    {r.text}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="grid gap-2 md:grid-cols-2">
                              {row.subjects.map((sub) => {
                                const tests = ia_marks
                                  .filter((m) => m.student_id === s.id && m.course_id === sub.course.id)
                                  .sort((a, b) => String(a.date).localeCompare(String(b.date)));
                                return (
                                  <div key={sub.course.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-slate-900">
                                          {sub.course.code} · {sub.course.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                          {facultyById.get(sub.course.faculty_id)?.name || 'No teacher assigned'}
                                        </p>
                                      </div>
                                      <Badge variant={LEVEL_BADGE[sub.level]} size="sm">
                                        {RISK_LABELS[sub.level]}
                                      </Badge>
                                    </div>
                                    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <dt className="text-slate-500">Attendance</dt>
                                        <dd className="font-bold text-slate-900">
                                          {fmtPct(sub.att.pct)}{' '}
                                          <span className="font-medium text-slate-500">
                                            ({sub.att.attended}/{sub.att.held} classes)
                                          </span>
                                        </dd>
                                        {sub.att.held > 0 && sub.att.held < RISK_RULES.minSessions && (
                                          <dd className="text-[11px] text-slate-500">
                                            Judged after {RISK_RULES.minSessions} classes
                                          </dd>
                                        )}
                                      </div>
                                      <div>
                                        <dt className="text-slate-500">IA average</dt>
                                        <dd className="font-bold text-slate-900">{fmtPct(sub.marks.pct)}</dd>
                                      </div>
                                    </dl>
                                    {tests.length > 0 && (
                                      <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                                        {tests.map((t) => (
                                          <li key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
                                            <span className="truncate text-slate-600">{t.ia_name}</span>
                                            <span className="shrink-0 font-semibold text-slate-900">
                                              {t.score}/{t.max_score}
                                              {!t.published && (
                                                <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-600">
                                                  Unpublished
                                                </span>
                                              )}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
