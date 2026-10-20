import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Award,
  CalendarCheck,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert,
  TriangleAlert,
  UserRoundSearch,
  UserX
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { RISK_LABELS, attendanceStats, buildStudentRiskRows } from '../../utils/risk';
import { AttendanceDonut, IAMarksBars } from './analyticsCharts';
import { attendanceCounts, fmtMarks, marksSummary, orderTests } from '../../utils/analytics';
import { useAnalyticsScope } from './useAnalyticsScope';
import { cn } from '@/lib/utils';

const LEVEL_BADGE = { high: 'danger', warning: 'warning', ok: 'success', na: 'neutral' };
const LEVEL_DOT = { high: 'bg-rose-500', warning: 'bg-amber-500', ok: 'bg-emerald-500', na: 'bg-slate-300' };
const STATUS_BADGE = { present: 'success', late: 'warning', absent: 'danger' };

const fmtPct = (v) => (v === null || v === undefined ? '—' : `${v}%`);
const fmtOutOf = (s) => (s.avg === null ? '—' : `${fmtMarks(s.avg)}/${s.max}`);

// Per-student attendance and IA board, one subject at a time.
export default function StudentAnalytics({ scope = 'teaching' }) {
  const { courses, students, users, enrollments, attendance, marks, departmentCodes } = useAnalyticsScope(scope);

  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  // Kept when switching students, so a teacher can compare everyone in one subject.
  const [courseId, setCourseId] = useState('');

  const rows = useMemo(() => {
    const riskRows = buildStudentRiskRows({ students, courses, enrollments, attendance, ia_marks: marks });
    return riskRows
      .map((r) => ({
        ...r,
        overallAtt: attendanceStats(attendance.filter((a) => a.student_id === r.student.id)),
        overallIA: marksSummary(marks.filter((m) => m.student_id === r.student.id))
      }))
      .sort((a, b) =>
        String(a.student.usn || a.student.name).localeCompare(String(b.student.usn || b.student.name))
      );
  }, [students, courses, enrollments, attendance, marks]);

  // Teachers filter by the class they teach; HODs by semester and section.
  const groups = useMemo(() => {
    if (scope === 'department') {
      const keys = new Set(students.map((s) => `${s.semester || ''}|${s.section || ''}`));
      return [...keys].sort().map((key) => {
        const [sem, sec] = key.split('|');
        return { id: key, label: `Sem ${sem || '—'} · Sec ${sec || '—'}` };
      });
    }
    return [...courses]
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((c) => ({ id: c.id, label: `${c.code} · Sec ${c.section || '—'}` }));
  }, [scope, students, courses]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (group !== 'all') {
        if (scope === 'department') {
          if (`${r.student.semester || ''}|${r.student.section || ''}` !== group) return false;
        } else if (!r.subjects.some((s) => s.course.id === group)) {
          return false;
        }
      }
      if (!q) return true;
      return r.student.name?.toLowerCase().includes(q) || String(r.student.usn || '').toLowerCase().includes(q);
    });
  }, [rows, search, group, scope]);

  // The board follows the selection; if the selected student is filtered out, show the first match.
  const selectedIndex = Math.max(0, visibleRows.findIndex((r) => r.student.id === selectedId));
  const selected = visibleRows[selectedIndex] || null;

  const goTo = (offset) => {
    const next = visibleRows[selectedIndex + offset];
    if (next) setSelectedId(next.student.id);
  };

  if (!rows.length) {
    return (
      <EmptyState
        icon={UserRoundSearch}
        title="No students to analyse yet"
        description={
          scope === 'department'
            ? 'Students added to your department will appear here.'
            : 'Students enrolled in the courses you teach will appear here.'
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <UserRoundSearch className="h-5 w-5 text-brand-600" />
            Student Analytics
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {scope === 'department'
              ? `Every subject in the ${departmentCodes} department.`
              : 'The subjects you teach.'}{' '}
            Pick a student, then a subject. Unpublished IA marks are included.
          </p>
        </div>
        <Badge variant="primary" size="lg">
          {rows.length} {rows.length === 1 ? 'student' : 'students'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
          <div className="space-y-2 border-b border-slate-100 p-3">
            <label className="relative block">
              <span className="sr-only">Search students</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or USN"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs outline-none focus:border-brand-400 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by class</span>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand-400"
              >
                <option value="all">All classes</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ul className="max-h-72 flex-1 overflow-y-auto p-2 lg:max-h-none" aria-label="Students">
            {visibleRows.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-slate-500">No students match.</li>
            )}
            {visibleRows.map((r) => {
              const isActive = selected?.student.id === r.student.id;
              return (
                <li key={r.student.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.student.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'
                    )}
                  >
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', LEVEL_DOT[r.level])} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-slate-900">{r.student.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {r.student.usn || r.student.id} · {RISK_LABELS[r.level]}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] leading-tight text-slate-600 tabular-nums">
                      <span className="block">Att {fmtPct(r.overallAtt.pct)}</span>
                      <span className="block">IA {fmtOutOf(r.overallIA)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {selected ? (
          <StudentBoard
            row={selected}
            attendance={attendance}
            marks={marks}
            users={users}
            scope={scope}
            courseId={courseId}
            onSelectCourse={setCourseId}
            position={`${selectedIndex + 1} of ${visibleRows.length}`}
            onPrev={selectedIndex > 0 ? () => goTo(-1) : null}
            onNext={selectedIndex < visibleRows.length - 1 ? () => goTo(1) : null}
          />
        ) : (
          <EmptyState icon={Search} title="No student selected" description="Change the search or class filter." />
        )}
      </div>
    </div>
  );
}

function StudentBoard({ row, attendance, marks, users, scope, courseId, onSelectCourse, position, onPrev, onNext }) {
  const { student, subjects, level, reasons } = row;

  const subjectList = useMemo(
    () => [...subjects].sort((a, b) => a.course.code.localeCompare(b.course.code)),
    [subjects]
  );
  // Stay on the chosen subject when the student takes it; otherwise show their first subject.
  const subject = subjectList.find((s) => s.course.id === courseId) || subjectList[0] || null;

  const subjectAttendance = useMemo(
    () => (subject ? attendance.filter((a) => a.student_id === student.id && a.course_id === subject.course.id) : []),
    [attendance, student.id, subject]
  );
  const subjectMarks = useMemo(
    () => (subject ? marks.filter((m) => m.student_id === student.id && m.course_id === subject.course.id) : []),
    [marks, student.id, subject]
  );

  const counts = attendanceCounts(subjectAttendance);
  const ia = marksSummary(subjectMarks);
  const iaBars = orderTests(subjectMarks)
    .map((name) => subjectMarks.find((m) => m.ia_name === name))
    .filter((m) => m && m.max_score > 0 && m.score !== null && m.score !== undefined)
    .map((m) => ({ name: m.ia_name, score: Number(m.score), max: Number(m.max_score), published: m.published }));

  const recentClasses = [...subjectAttendance].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8);
  const facultyName = (id) => users.find((u) => u.id === id)?.name || '—';

  return (
    <section className="min-w-0 space-y-6" aria-label={`${student.name} analytics`}>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={student.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full bg-slate-100 ring-1 ring-slate-200"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-extrabold text-slate-900">{student.name}</h3>
              <Badge variant={LEVEL_BADGE[level]} size="sm" dot>
                {RISK_LABELS[level]}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {student.usn || student.id} · Sem {student.semester || '—'} · Sec {student.section || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-500 tabular-nums">{position}</span>
          <button
            type="button"
            onClick={onPrev || undefined}
            disabled={!onPrev}
            aria-label="Previous student"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext || undefined}
            disabled={!onNext}
            aria-label="Next student"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {reasons.length > 0 && (
        <div role="note" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Needs attention</p>
            <p className="mt-0.5">{reasons.map((r) => r.text).join(' · ')}</p>
          </div>
        </div>
      )}

      {!subject ? (
        <EmptyState title="Not enrolled in any subject" description="Subjects appear here once the student is enrolled." />
      ) : (
        <>
          <div role="tablist" aria-label="Subjects" className="flex flex-wrap gap-2">
            {subjectList.map((s) => {
              const isActive = s.course.id === subject.course.id;
              return (
                <button
                  key={s.course.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectCourse(s.course.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors',
                    isActive
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', LEVEL_DOT[s.level])} aria-hidden="true" />
                  {s.course.code}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
            <p className="text-sm font-bold text-slate-900">
              {subject.course.code} · {subject.course.name}
            </p>
            <p className="text-xs text-slate-500">
              {scope === 'department' ? `Taught by ${facultyName(subject.course.faculty_id)} · ` : ''}
              Sec {subject.course.section || '—'} · {RISK_LABELS[subject.level]}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Attendance"
              value={fmtPct(subject.att.pct)}
              subtitle={`${fmtMarks(subject.att.attended)} of ${subject.att.held} classes`}
              icon={CheckSquare}
              iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
            />
            <StatCard
              title="Absences"
              value={counts.absent}
              subtitle={`${counts.late} late`}
              icon={UserX}
              iconBg="bg-rose-50 text-rose-600 border-rose-100"
            />
            <StatCard
              title="IA Average"
              value={fmtOutOf(ia)}
              subtitle={`${ia.tests} ${ia.tests === 1 ? 'test' : 'tests'}${ia.unpublished ? ` · ${ia.unpublished} unpublished` : ''}`}
              icon={Award}
              iconBg="bg-purple-50 text-purple-600 border-purple-100"
            />
            <StatCard
              title="Status"
              value={RISK_LABELS[subject.level]}
              subtitle="Attendance and IA together"
              icon={ShieldAlert}
              iconBg="bg-amber-50 text-amber-600 border-amber-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h4 className="text-base font-bold text-slate-900">Attendance</h4>
              <p className="mb-4 text-xs text-slate-500">Present, late and absent in {subject.course.code}.</p>
              <AttendanceDonut counts={counts} pct={subject.att.pct} held={subject.att.held} attended={subject.att.attended} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h4 className="text-base font-bold text-slate-900">IA marks</h4>
              <p className="mb-2 text-xs text-slate-500">Marks in each IA test of {subject.course.code}.</p>
              <IAMarksBars data={iaBars} max={ia.max} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CalendarCheck className="h-4 w-4 text-slate-400" />
              Recent classes
            </h4>
            <p className="mb-3 text-xs text-slate-500">Latest attendance entries in {subject.course.code}.</p>
            {recentClasses.length ? (
              <ul className="grid grid-cols-1 gap-x-6 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                {recentClasses.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-xs sm:border-b sm:border-slate-100">
                    <span className="text-slate-600">{a.date ? format(parseISO(a.date), 'EEE, d MMM yyyy') : '—'}</span>
                    <Badge variant={STATUS_BADGE[a.status] || 'neutral'} size="sm">
                      {a.status ? a.status[0].toUpperCase() + a.status.slice(1) : '—'}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">No classes marked yet.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
