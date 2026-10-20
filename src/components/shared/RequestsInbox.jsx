import React, { useMemo, useState } from 'react';
import { Inbox, LifeBuoy, Send } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { Button } from '@/components/ui/button';
import { REQUEST_STATUS, REQUEST_TYPES, formatRequestDate } from '../../utils/requests';
import { cn } from '@/lib/utils';

const FILTERS = { active: 'Needs a reply', all: 'All', resolved: 'Resolved', rejected: 'Not approved' };

// Student requests the signed-in staff member may answer. Row-level security decides which:
// teachers get attendance and marks requests for their subjects, HODs their department, admins all.
export default function RequestsInbox() {
  const { courses, users, student_requests = [], answerStudentRequest } = useData();
  const [filter, setFilter] = useState('active');
  const [openId, setOpenId] = useState('');
  const [status, setStatus] = useState('in_review');
  const [reply, setReply] = useState('');

  const rows = useMemo(
    () =>
      student_requests
        .filter((r) =>
          filter === 'all' ? true : filter === 'active' ? r.status === 'open' || r.status === 'in_review' : r.status === filter
        )
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))),
    [student_requests, filter]
  );
  const waiting = student_requests.filter((r) => r.status === 'open').length;

  const startReply = (r) => {
    setOpenId(openId === r.id ? '' : r.id);
    setStatus(r.status === 'open' ? 'in_review' : r.status);
    setReply(r.response || '');
  };

  const send = (e, id) => {
    e.preventDefault();
    answerStudentRequest(id, { status, response: reply });
    setOpenId('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-brand-600" />
            Student Requests
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bonafide certificates, attendance and marks corrections, and grievances. The student is notified when you reply.
          </p>
        </div>
        <Badge variant={waiting ? 'warning' : 'success'} size="lg">
          {waiting ? `${waiting} new` : 'Nothing new'}
        </Badge>
      </div>

      <div role="group" aria-label="Show" className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
        {Object.entries(FILTERS).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-bold',
              filter === id ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Inbox className="w-8 h-8 text-slate-300" />
            No requests here.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const student = users.find((u) => u.id === r.student_id);
              const course = courses.find((c) => c.id === r.course_id);
              const st = REQUEST_STATUS[r.status] || REQUEST_STATUS.open;
              const isOpen = openId === r.id;
              return (
                <li key={r.id} className="px-6 py-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={st.variant} size="sm">
                      {st.label}
                    </Badge>
                    <span className="text-[11px] font-bold text-slate-500">
                      {REQUEST_TYPES[r.type]?.label}
                      {course ? ` · ${course.code} (Sec ${course.section || '—'})` : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">{formatRequestDate(r.created_at)}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{r.subject}</p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {student?.name || 'Student'} · {student?.usn || '—'} · Sem {student?.semester || '—'}, Sec{' '}
                    {student?.section || '—'}
                  </p>
                  <p className="text-xs text-slate-600 whitespace-pre-line">{r.details}</p>
                  {r.response && !isOpen && (
                    <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line">
                      <span className="font-bold text-slate-900">Your reply: </span>
                      {r.response}
                    </p>
                  )}

                  {isOpen ? (
                    <form onSubmit={(e) => send(e, r.id)} className="pt-2 space-y-3">
                      <label className="text-xs font-bold text-slate-700 flex flex-col gap-1 max-w-xs">
                        Status
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        >
                          <option value="in_review">In review</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Not approved</option>
                        </select>
                      </label>
                      <label className="text-xs font-bold text-slate-700 flex flex-col gap-1">
                        Reply to the student
                        <textarea
                          rows={3}
                          maxLength={2000}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="What you did, or what they should do next."
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="rounded-xl">
                          <Send className="w-3.5 h-3.5" /> Send reply
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={() => setOpenId('')}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startReply(r)}
                      className="text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      {r.response ? 'Update reply' : 'Reply'}
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
