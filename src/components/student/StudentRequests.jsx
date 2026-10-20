import React, { useState } from 'react';
import { Inbox, LifeBuoy, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { Button } from '@/components/ui/button';
import { REQUEST_STATUS, REQUEST_TYPES, formatRequestDate } from '../../utils/requests';

const INPUT =
  'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none';

// Students raise requests (bonafide, attendance or marks corrections) and grievances, and follow
// their status. The subject teacher, HOD or office answers them.
export default function StudentRequests() {
  const { currentUser } = useAuth();
  const { courses, enrollments, users, student_requests = [], createStudentRequest, withdrawStudentRequest } = useData();

  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState('bonafide');
  const [courseId, setCourseId] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const myCourseIds = new Set(enrollments.filter((e) => e.student_id === currentUser?.id).map((e) => e.course_id));
  const myCourses = courses.filter((c) => myCourseIds.has(c.id)).sort((a, b) => a.code.localeCompare(b.code));
  const mine = student_requests
    .filter((r) => r.student_id === currentUser?.id)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const needsCourse = REQUEST_TYPES[type].needsCourse;

  const resetForm = () => {
    setType('bonafide');
    setCourseId('');
    setSubject('');
    setDetails('');
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (needsCourse && !courseId) return setError('Choose the subject this is about.');
    if (subject.trim().length < 3) return setError('Add a short title (at least 3 characters).');
    if (details.trim().length < 10) return setError('Add a few more details (at least 10 characters).');
    createStudentRequest({ type, course_id: needsCourse ? courseId : null, subject, details });
    resetForm();
    setFormOpen(false);
    setSent(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-brand-600" />
            Requests & Grievances
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ask for a bonafide certificate, report wrong attendance or marks, or raise any other problem.
          </p>
        </div>
        {!formOpen && (
          <Button
            className="rounded-xl"
            onClick={() => {
              setFormOpen(true);
              setSent(false);
            }}
          >
            <Plus className="w-4 h-4" /> New request
          </Button>
        )}
      </div>

      {sent && (
        <p role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
          Request sent. You'll get a notification when it's answered.
        </p>
      )}

      {formOpen && (
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">New request</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
              What is it about?
              <select value={type} onChange={(e) => setType(e.target.value)} className={INPUT}>
                {Object.entries(REQUEST_TYPES).map(([id, t]) => (
                  <option key={id} value={id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            {needsCourse && (
              <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                Subject
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={INPUT}>
                  <option value="">Choose a subject…</option>
                  {myCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
            Title
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
              placeholder={type === 'bonafide' ? 'Bonafide certificate for education loan' : 'Short summary'}
              className={INPUT}
            />
          </label>
          <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
            Details
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              placeholder={REQUEST_TYPES[type].hint}
              className={INPUT}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="rounded-xl">
              Send request
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <h3 className="px-6 pt-6 pb-4 text-base font-bold text-slate-900">My requests</h3>
        {mine.length === 0 ? (
          <div className="px-6 pb-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Inbox className="w-8 h-8 text-slate-300" />
            You haven't raised any requests yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {mine.map((r) => {
              const course = courses.find((c) => c.id === r.course_id);
              const responder = users.find((u) => u.id === r.responded_by);
              const status = REQUEST_STATUS[r.status] || REQUEST_STATUS.open;
              return (
                <li key={r.id} className="px-6 py-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                    <span className="text-[11px] font-bold text-slate-500">
                      {REQUEST_TYPES[r.type]?.label}
                      {course ? ` · ${course.code}` : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatRequestDate(r.created_at)}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{r.subject}</p>
                  <p className="text-xs text-slate-600 whitespace-pre-line">{r.details}</p>
                  {r.response && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <p className="font-bold text-slate-900 mb-1">
                        Reply{responder ? ` from ${responder.name}` : ''}
                        {r.responded_at ? ` · ${formatRequestDate(r.responded_at)}` : ''}
                      </p>
                      <p className="whitespace-pre-line">{r.response}</p>
                    </div>
                  )}
                  {r.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => withdrawStudentRequest(r.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Withdraw
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
