import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  Plus,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import SubmissionFileLink from '../shared/SubmissionFileLink';
import {
  assignmentRoster,
  classAssignmentSummary,
  isPastDue,
  rosterCounts
} from '../../utils/assignments';
import { cn } from '@/lib/utils';

const classLabel = (c) => `${c.code} · Sem ${c.semester} · Sec ${c.section}`;
const fmtDue = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
};

// One week from now at 11:59 PM, as the local "YYYY-MM-DDTHH:MM" a date-time box expects.
const inAWeekLocal = () => {
  const d = new Date(Date.now() + 7 * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
};

const STATUS = {
  missing: { label: 'Not submitted', variant: 'danger' },
  submitted: { label: 'Submitted', variant: 'success' },
  late: { label: 'Late', variant: 'warning' },
  graded: { label: 'Graded', variant: 'primary' }
};
const FILTERS = [
  ['all', 'All'],
  ['missing', 'Not submitted'],
  ['submitted', 'Submitted'],
  ['late', 'Late'],
  ['graded', 'Graded']
];

// Assignments for a teacher with several classes: pick a class, open an assignment, see every
// student in that class, grade in place and remind the ones who haven't submitted.
export default function AssignmentManager() {
  const { currentUser } = useAuth();
  const data = useData();
  const { courses, assignments, createAssignment, uploadAssignmentFile } = data;

  const myCourses = useMemo(
    () =>
      courses
        .filter((c) => c.faculty_id === currentUser?.id)
        .sort((a, b) => a.code.localeCompare(b.code) || Number(a.semester) - Number(b.semester) || String(a.section).localeCompare(String(b.section))),
    [courses, currentUser]
  );

  const [courseId, setCourseId] = useState('');
  const [openId, setOpenId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [flash, setFlash] = useState('');

  const course = myCourses.find((c) => c.id === courseId) || myCourses[0] || null;
  const openAssignment = assignments.find((a) => a.id === openId && a.course_id === course?.id) || null;

  const showFlash = (text) => {
    setFlash(text);
    setTimeout(() => setFlash(''), 5000);
  };

  if (!course) {
    return (
      <EmptyState
        icon={FileText}
        title="No classes assigned yet"
        description="Your classes appear here once an admin assigns you courses."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <FileText className="h-5 w-5 text-brand-600" />
            Assignments
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Pick a class, open an assignment to see every student in it, and grade in place. Work handed in after
            the due date is accepted and tagged Late.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New assignment
        </button>
      </div>

      {flash && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {flash}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Class">
        {myCourses.map((c) => {
          const s = classAssignmentSummary(c, data);
          const isSelected = c.id === course.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                setCourseId(c.id);
                setOpenId(null);
              }}
              className={cn(
                'rounded-2xl border p-4 text-left transition-colors',
                isSelected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <span className="block text-sm font-extrabold text-slate-900">{classLabel(c)}</span>
              <span className="block truncate text-xs text-slate-500">{c.name}</span>
              <span className="mt-2 block text-[11px] font-semibold text-slate-600">
                {s.assignments} {s.assignments === 1 ? 'assignment' : 'assignments'} · {s.toGrade} to grade
              </span>
              <span className="block text-[11px] text-slate-500">
                Submitted {s.submissionRate === null ? '—' : `${s.submissionRate}%`} · Average{' '}
                {s.averagePct === null ? '—' : `${s.averagePct}%`}
              </span>
            </button>
          );
        })}
      </div>

      {openAssignment ? (
        <AssignmentRoster
          assignment={openAssignment}
          course={course}
          data={data}
          gradedBy={currentUser?.id}
          onBack={() => setOpenId(null)}
          onFlash={showFlash}
        />
      ) : (
        <AssignmentList course={course} data={data} onOpen={setOpenId} />
      )}

      {createOpen && (
        <CreateAssignmentModal
          courses={myCourses}
          defaultCourseId={course.id}
          onClose={() => setCreateOpen(false)}
          onPost={async (fields, courseIds, file) => {
            // Each class gets its own copy (own submissions and grading), with the file stored in
            // that class's folder so its students can open it.
            for (const id of courseIds) {
              const attachment = file
                ? await uploadAssignmentFile(id, file)
                : { attachment_url: null, attachment_name: null };
              createAssignment({ ...fields, ...attachment, course_id: id });
            }
            setCreateOpen(false);
            setCourseId(courseIds[0]);
            setOpenId(null);
            const names = courseIds.map((id) => classLabel(myCourses.find((c) => c.id === id))).join(', ');
            showFlash(`Posted to ${courseIds.length} ${courseIds.length === 1 ? 'class' : 'classes'}: ${names}. Students were notified.`);
          }}
        />
      )}
    </div>
  );
}

function AssignmentList({ course, data, onOpen }) {
  const list = data.assignments
    .filter((a) => a.course_id === course.id)
    .sort((a, b) => String(b.due_date).localeCompare(String(a.due_date)));

  if (!list.length) {
    return (
      <EmptyState
        icon={FileText}
        title={`No assignments for ${classLabel(course)} yet`}
        description="Use New assignment to post one. You can send it to several classes at once."
      />
    );
  }

  return (
    <div className="space-y-3">
      {list.map((a) => {
        const counts = rosterCounts(assignmentRoster(a, data));
        const handedIn = counts.submitted + counts.late + counts.graded;
        const toGrade = counts.submitted + counts.late;
        const pastDue = isPastDue(a);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onOpen(a.id)}
            className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-xs hover:bg-slate-50/60 sm:flex-row sm:items-center"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-slate-900">{a.title}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due {fmtDue(a.due_date)}
                </span>
                <span>Max {a.max_marks}</span>
                {a.attachment_url && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    File attached
                  </span>
                )}
              </span>
            </span>
            <span className="flex shrink-0 flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {handedIn} of {counts.all} handed in
              </span>
              {counts.late > 0 && <Badge variant="warning" size="sm">{counts.late} late</Badge>}
              {toGrade > 0 ? (
                <Badge variant="primary" size="sm">{toGrade} to grade</Badge>
              ) : (
                handedIn > 0 && <Badge variant="success" size="sm">All graded</Badge>
              )}
              <Badge variant={pastDue ? 'neutral' : 'info'} size="sm">{pastDue ? 'Past due' : 'Open'}</Badge>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AssignmentRoster({ assignment, course, data, gradedBy, onBack, onFlash }) {
  const [filter, setFilter] = useState('all');
  const [reminded, setReminded] = useState(false);
  const roster = assignmentRoster(assignment, data);
  const counts = rosterCounts(roster);
  const missing = roster.filter((r) => r.status === 'missing');
  const rows = roster.filter((r) => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {classLabel(course)} assignments
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-base font-extrabold text-slate-900">{assignment.title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Due {fmtDue(assignment.due_date)} · Max {assignment.max_marks} marks · only {classLabel(course)} students
        </p>
        {assignment.description && <p className="mt-2 text-xs leading-relaxed text-slate-600">{assignment.description}</p>}
        {assignment.attachment_url && (
          <SubmissionFileLink url={assignment.attachment_url} name={assignment.attachment_name} className="mt-2 text-xs" />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show students">
          {FILTERS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[11px] font-bold',
                filter === id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {label} {counts[id]}
            </button>
          ))}
        </div>
        {missing.length > 0 && (
          <button
            type="button"
            disabled={reminded}
            onClick={() => {
              data.remindAssignment(assignment, missing.map((r) => r.student.id));
              setReminded(true);
              onFlash(`Reminder sent to ${missing.length} ${missing.length === 1 ? 'student' : 'students'} who haven't submitted.`);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
          >
            <BellRing className="h-3.5 w-3.5" />
            {reminded ? 'Reminder sent' : `Remind ${missing.length} who haven't submitted`}
          </button>
        )}
      </div>

      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs">
        {rows.length === 0 && <li className="px-5 py-6 text-center text-xs text-slate-500">No students in this group.</li>}
        {rows.map((r) => (
          <GradeRow
            key={r.student.id}
            row={r}
            assignment={assignment}
            onSave={(marks, feedback) => {
              data.gradeSubmission(r.submission.id, marks, feedback, gradedBy);
              onFlash(`${r.student.name}: ${marks}/${assignment.max_marks} saved. They were notified.`);
            }}
          />
        ))}
      </ul>
    </div>
  );
}

function GradeRow({ row, assignment, onSave }) {
  const { student, submission, status, late } = row;
  const [marks, setMarks] = useState(submission?.graded ? String(submission.marks) : '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [error, setError] = useState('');
  const max = Number(assignment.max_marks);

  const save = () => {
    const value = Number(marks);
    if (marks.trim() === '' || Number.isNaN(value) || value < 0 || value > max) {
      setError(`Enter marks from 0 to ${max}.`);
      return;
    }
    setError('');
    onSave(value, feedback.trim());
  };

  return (
    <li className="flex flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center">
      <span className="min-w-0 lg:w-56">
        <span className="block truncate text-xs font-bold text-slate-900">{student.name}</span>
        <span className="block text-[11px] text-slate-500">{student.usn || student.roll_no || student.id}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2 lg:w-64">
        <Badge variant={STATUS[status].variant} size="sm" dot>
          {STATUS[status].label}
          {status === 'graded' ? ` · ${submission.marks}/${max}` : ''}
        </Badge>
        {status === 'graded' && late && <Badge variant="warning" size="sm">Late</Badge>}
        <span className="text-[11px] text-slate-500">
          {submission
            ? new Date(submission.submitted_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
            : ''}
        </span>
      </span>
      {submission ? (
        <span className="flex flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <SubmissionFileLink submission={submission} className="max-w-40 text-xs" />
            <label className="flex items-center gap-1 text-xs text-slate-500">
              <span className="sr-only">Marks for {student.name}</span>
              <input
                type="number"
                min={0}
                max={max}
                step="0.5"
                value={marks}
                placeholder="—"
                onChange={(e) => {
                  setMarks(e.target.value);
                  setError('');
                }}
                className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-brand-400"
              />
              / {max}
            </label>
            <label className="min-w-32 flex-1">
              <span className="sr-only">Feedback for {student.name}</span>
              <input
                value={feedback}
                maxLength={500}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback (optional)"
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-400"
              />
            </label>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-bold text-white hover:bg-brand-600"
            >
              {submission.graded ? 'Update' : 'Save'}
            </button>
          </span>
          {error && <span className="text-[11px] font-semibold text-rose-700">{error}</span>}
        </span>
      ) : (
        <span className="flex-1 text-xs text-slate-400">
          {isPastDue(assignment) ? 'Not submitted. It will be tagged Late if they hand it in now.' : 'Not submitted yet.'}
        </span>
      )}
    </li>
  );
}

function CreateAssignmentModal({ courses, defaultCourseId, onClose, onPost }) {
  const [form, setForm] = useState(() => ({
    title: '',
    description: '',
    due_date: inAWeekLocal(),
    max_marks: 20
  }));
  const [selected, setSelected] = useState(() => new Set([defaultCourseId]));
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async (e) => {
    e.preventDefault();
    const max = Number(form.max_marks);
    if (!form.title.trim()) return setError('Enter an assignment title.');
    if (!selected.size) return setError('Tick at least one class.');
    if (!Number.isFinite(max) || max < 1 || max > 100) return setError('Max marks must be from 1 to 100.');
    if (!form.due_date) return setError('Pick a due date.');
    setPosting(true);
    setError('');
    try {
      await onPost(
        { title: form.title.trim(), description: form.description.trim(), due_date: form.due_date, max_marks: max },
        courses.filter((c) => selected.has(c.id)).map((c) => c.id),
        file
      );
    } catch (err) {
      setError(err.message || 'Could not post the assignment.');
    } finally {
      setPosting(false);
    }
  };

  const field = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <Modal isOpen onClose={onClose} title="New assignment" subtitle="Students in each class you tick are notified.">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">Title *</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Stacks and queues worksheet"
            className={field}
          />
        </label>

        <fieldset>
          <legend className="mb-1 text-xs font-bold text-slate-700">Send to these classes *</legend>
          <p className="mb-2 text-[11px] text-slate-500">Each class gets its own copy, with its own submissions and grading.</p>
          <div className="space-y-1.5 rounded-xl border border-slate-200 p-3">
            {courses.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => {
                    toggle(c.id);
                    setError('');
                  }}
                  className="h-3.5 w-3.5 accent-brand-600"
                />
                <span className="font-bold">{classLabel(c)}</span>
                <span className="truncate text-slate-500">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">Due date and time *</span>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className={field}
            />
            <span className="mt-1 block text-[11px] text-slate-500">Same for every ticked class. Late work is accepted and tagged Late.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">Max marks *</span>
            <input
              type="number"
              min={1}
              max={100}
              value={form.max_marks}
              onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
              className={field}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-700">Instructions</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What to hand in and how it will be marked"
            className={field}
          />
        </label>

        <div>
          <span className="mb-1 block text-xs font-bold text-slate-700">Attachment (optional)</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-brand-500">
              <Paperclip className="h-3.5 w-3.5" />
              {file ? 'Change file' : 'Choose file'}
              <input
                type="file"
                className="sr-only"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  e.target.value = '';
                  if (!picked) return;
                  if (picked.size > 20 * 1024 * 1024) return setError('The attachment must be 20 MB or smaller.');
                  setError('');
                  setFile(picked);
                }}
              />
            </label>
            {file ? (
              <>
                <span className="break-all text-xs font-semibold text-slate-700">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
                <button type="button" onClick={() => setFile(null)} className="text-[11px] font-bold text-rose-600 hover:underline">
                  Remove
                </button>
              </>
            ) : (
              <span className="text-[11px] text-slate-400">Problem statement, spec or dataset. Up to 20 MB.</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={posting}
            className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
          >
            {posting
              ? 'Posting…'
              : `Post to ${selected.size} ${selected.size === 1 ? 'class' : 'classes'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
