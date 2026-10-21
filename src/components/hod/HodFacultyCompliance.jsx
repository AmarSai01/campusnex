import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Lock,
  Printer,
  Unlock,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { downloadCsv, printReport } from '../../utils/exportReport';
import { formatTimeRange } from '../../utils/time';
import { nowHHMM, todayISO, unmarkedClasses } from '../../utils/classSessions';

// How far back to look for timetable classes that were never marked.
const LOOKBACK_DAYS = 30;

export default function HodFacultyCompliance() {
  const { currentUser, hodDepartments } = useAuth();
  const data = useData();
  const {
    users, courses, enrollments, attendance, ia_marks, assignments, submissions, timetable, notifications,
    unlockClassSession
  } = data;

  const [deptId, setDeptId] = useState(hodDepartments[0]?.id || '');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [exportError, setExportError] = useState('');
  const department = hodDepartments.find((d) => d.id === deptId) || hodDepartments[0];
  const today = todayISO();

  // Timetable classes in this department from the last 30 days that nobody marked.
  const unmarked = useMemo(() => {
    if (!department) return [];
    const now = { date: today, time: nowHHMM() };
    const teacherIds = new Set(
      courses.filter((c) => c.department_id === department.id && c.faculty_id).map((c) => c.faculty_id)
    );
    return [...teacherIds]
      .flatMap((id) => unmarkedClasses(id, data, now, LOOKBACK_DAYS))
      .filter((c) => c.course.department_id === department.id)
      .sort((a, b) => b.date.localeCompare(a.date) || a.start_time.localeCompare(b.start_time));
  }, [department, courses, data, today]);
  const locked = unmarked.filter((c) => c.status === 'locked');
  const requestedKeys = new Set(
    notifications
      .filter((n) => n.type === 'attendance_unlock_request' && n.user_id === currentUser?.id)
      .map((n) => n.reference_id)
  );

  const courseRows = useMemo(() => {
    if (!department) return [];
    return courses
      .filter((c) => c.department_id === department.id)
      .map((course) => {
        const att = attendance.filter((a) => a.course_id === course.id);
        const lastDate = att.reduce((max, a) => (a.date > max ? a.date : max), '');
        // One per class session; rows from before sessions existed count once per day.
        const sessions = new Set(att.map((a) => a.session_id || a.date)).size;
        const missed = unmarked.filter((c) => c.course.id === course.id);
        const missedLocked = missed.filter((c) => c.status === 'locked').length;
        const missedOpen = missed.length - missedLocked;
        const inTimetable = timetable.some((t) => t.course_id === course.id);
        const marks = ia_marks.filter((m) => m.course_id === course.id);
        const unpublished = marks.filter((m) => !m.published).length;
        const courseAssignments = assignments.filter((a) => a.course_id === course.id);
        const assignmentIds = new Set(courseAssignments.map((a) => a.id));
        const ungraded = submissions.filter((s) => assignmentIds.has(s.assignment_id) && !s.graded).length;
        const enrolled = enrollments.filter((e) => e.course_id === course.id).length;

        const issues = [];
        if (missedOpen > 0) issues.push(`${missedOpen} class${missedOpen === 1 ? '' : 'es'} not marked`);
        if (missedLocked > 0) {
          issues.push(`${missedLocked} locked class${missedLocked === 1 ? '' : 'es'} not marked`);
        }
        if (!inTimetable) issues.push('Not in the timetable');
        if (unpublished > 0) issues.push(`${unpublished} IA mark${unpublished === 1 ? '' : 's'} unpublished`);
        if (ungraded > 0) issues.push(`${ungraded} submission${ungraded === 1 ? '' : 's'} to grade`);

        return { course, enrolled, lastDate, sessions, missed: missed.length, marks: marks.length, unpublished, assignments: courseAssignments.length, ungraded, issues };
      });
  }, [department, courses, attendance, ia_marks, assignments, submissions, enrollments, unmarked, timetable]);

  // Group by teacher; include department faculty who teach nothing here.
  const groups = useMemo(() => {
    if (!department) return [];
    const faculty = users.filter((u) => u.role === 'faculty');
    const teacherIds = new Set([
      ...courseRows.map((r) => r.course.faculty_id).filter(Boolean),
      ...faculty.filter((f) => f.department_id === department.id && f.status !== 'inactive').map((f) => f.id)
    ]);
    const list = [...teacherIds].map((id) => {
      const teacher = faculty.find((f) => f.id === id);
      const rows = courseRows.filter((r) => r.course.faculty_id === id);
      return { teacher, rows, issueCount: rows.reduce((n, r) => n + r.issues.length, 0) };
    });
    const unassigned = courseRows.filter((r) => !r.course.faculty_id);
    if (unassigned.length) {
      list.push({ teacher: null, rows: unassigned, issueCount: unassigned.length });
    }
    return list
      .filter((g) => !onlyIssues || g.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount || (a.teacher?.name || '').localeCompare(b.teacher?.name || ''));
  }, [courseRows, users, department, onlyIssues]);

  const totals = {
    needing: courseRows.filter((r) => r.issues.length > 0).length,
    unpublished: courseRows.reduce((n, r) => n + r.unpublished, 0),
    ungraded: courseRows.reduce((n, r) => n + r.ungraded, 0)
  };

  const HEADERS = ['Teacher', 'Course code', 'Course', 'Section', 'Students', 'Sessions marked', 'Classes not marked', 'Last attendance', 'IA entries', 'Unpublished IA', 'Assignments', 'Ungraded submissions', 'Issues'];
  const exportRows = () =>
    groups.flatMap((g) =>
      g.rows.map((r) => [
        g.teacher?.name || 'Unassigned',
        r.course.code,
        r.course.name,
        r.course.section || '',
        r.enrolled,
        r.sessions,
        r.missed,
        r.lastDate || 'Never',
        r.marks,
        r.unpublished,
        r.assignments,
        r.ungraded,
        r.issues.join('; ') || 'Up to date'
      ])
    );

  const handleCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${department.code}-faculty-compliance-${stamp}.csv`, HEADERS, exportRows());
  };

  const handlePrint = () => {
    setExportError('');
    try {
      printReport({
        title: `${department.name} — Faculty Compliance`,
        subtitle: `Generated ${new Date().toLocaleString()} · Timetable classes from the last ${LOOKBACK_DAYS} days that were not marked`,
        sections: [{ heading: 'Courses', headers: HEADERS, rows: exportRows() }]
      });
    } catch (e) {
      setExportError(e.message);
    }
  };

  if (!department) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Faculty Compliance · {department.code}</h2>
          <p className="text-xs text-slate-500">
            Attendance, IA publishing and grading status for every course in {department.name}. Unlock locked attendance here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hodDepartments.length > 1 && (
            <select
              value={department.id}
              onChange={(e) => setDeptId(e.target.value)}
              aria-label="Department"
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              {hodDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={onlyIssues}
              onChange={(e) => setOnlyIssues(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-600"
            />
            Only show issues
          </label>
          <button
            type="button"
            onClick={handleCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-500 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {exportError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {exportError}
        </div>
      )}

      {locked.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Lock className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Locked classes not marked
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            These are older than 7 days, so the teacher can no longer mark them. Unlock one to give the teacher 2 days.
          </p>
          <ul className="divide-y divide-slate-100">
            {locked.map((c) => {
              const teacher = users.find((u) => u.id === c.course.faculty_id);
              return (
                <li key={c.key} className="flex flex-col gap-2 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-900">
                      {c.course.code} · Sem {c.course.semester} · Sec {c.course.section} · {c.date},{' '}
                      {formatTimeRange(c.start_time, c.end_time)}
                    </span>
                    <span className="block text-slate-500">
                      {teacher?.name || 'Unassigned'}
                      {requestedKeys.has(c.key) ? ' · asked you to unlock' : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => unlockClassSession(c, today)}
                    className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-800 hover:bg-slate-50"
                  >
                    <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                    Unlock for 2 days
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Courses" value={courseRows.length} subtitle={`${totals.needing} need attention`} icon={BookOpen} iconBg="bg-brand-50 text-brand-600 border-brand-100" />
        <StatCard title="Faculty" value={groups.filter((g) => g.teacher).length} subtitle="Teaching in department" icon={Users} iconBg="bg-sky-50 text-sky-600 border-sky-100" />
        <StatCard title="Unpublished IA" value={totals.unpublished} subtitle="Marks students can't see" icon={Award} iconBg="bg-purple-50 text-purple-600 border-purple-100" />
        <StatCard title="To Grade" value={totals.ungraded} subtitle="Submissions pending" icon={FileText} iconBg="bg-amber-50 text-amber-600 border-amber-100" />
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nothing to review" description="Every course in this department is up to date." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <section key={g.teacher?.id || 'unassigned'} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900">{g.teacher?.name || 'Unassigned courses'}</h3>
                  <p className="truncate text-xs text-slate-500">
                    {g.teacher?.designation || (g.teacher ? 'Faculty' : 'Assign a teacher in Curriculum & Courses')}
                  </p>
                </div>
                {g.issueCount > 0 ? (
                  <Badge variant="warning" size="sm" dot>{g.issueCount} to follow up</Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>Up to date</Badge>
                )}
              </header>

              {g.rows.length === 0 ? (
                <p className="text-xs text-slate-500">No courses assigned in {department.code}.</p>
              ) : (
                <ul className="space-y-2">
                  {g.rows.map((r) => (
                    <li key={r.course.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {r.course.code} · {r.course.name}
                          {r.course.section && !/\bsec\b/i.test(r.course.name) ? ` (Sec ${r.course.section})` : ''}
                        </p>
                        <span className="shrink-0 text-[11px] font-medium text-slate-500">{r.enrolled} students</span>
                      </div>
                      <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <dt className="flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" aria-hidden="true" />Last attendance</dt>
                          <dd className="font-semibold text-slate-900">{r.lastDate || 'Never'}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">IA unpublished</dt>
                          <dd className="font-semibold text-slate-900">{r.unpublished} / {r.marks}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">To grade</dt>
                          <dd className="font-semibold text-slate-900">{r.ungraded}</dd>
                        </div>
                      </dl>
                      {r.issues.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {r.issues.map((issue) => (
                            <li key={issue} className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                              {issue}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Up to date
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
