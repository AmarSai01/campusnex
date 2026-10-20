import React, { useEffect, useMemo, useState } from 'react';
import { EyeOff, MessageSquareHeart, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import EmptyState from '../common/EmptyState';
import { FEEDBACK_QUESTIONS, MIN_FEEDBACK_RESPONSES } from '../../utils/feedback';

// Course feedback results. Teachers see their own courses, HODs their department's, admins every
// course. Answers stay anonymous; below 3 responses only the count is shown.
export default function FeedbackResults() {
  const { currentUser, hodDepartments = [] } = useAuth();
  const { courses, users, departments, fetchCourseFeedbackSummary } = useData();

  const myCourses = useMemo(() => {
    const hodDeptIds = new Set(hodDepartments.map((d) => d.id));
    return courses
      .filter(
        (c) => currentUser?.role === 'admin' || c.faculty_id === currentUser?.id || hodDeptIds.has(c.department_id)
      )
      .sort((a, b) => a.code.localeCompare(b.code) || String(a.section).localeCompare(String(b.section)));
  }, [courses, currentUser, hodDepartments]);

  const [courseId, setCourseId] = useState('');
  const selected = myCourses.find((c) => c.id === courseId) || myCourses[0];
  const [result, setResult] = useState({ status: 'idle' });

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setResult({ status: 'loading' });
    fetchCourseFeedbackSummary(selected.id)
      .then((summary) => active && setResult({ status: 'ready', summary }))
      .catch((e) => active && setResult({ status: 'error', message: e.message }));
    return () => {
      active = false;
    };
    // Reload only when the course changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  if (!myCourses.length) {
    return (
      <EmptyState
        icon={MessageSquareHeart}
        title="No courses yet"
        description="Feedback results appear here for the courses you teach."
      />
    );
  }

  const teacher = users.find((u) => u.id === selected.faculty_id);
  const dept = departments.find((d) => d.id === selected.department_id);
  const summary = result.status === 'ready' ? result.summary : null;
  const hidden = summary && summary.responses < MIN_FEEDBACK_RESPONSES;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-brand-600" />
            Course Feedback Results
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" />
            Anonymous student feedback, each question rated 1 to 5.
          </p>
        </div>
        <select
          value={selected.id}
          onChange={(e) => setCourseId(e.target.value)}
          aria-label="Course"
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none max-w-full"
        >
          {myCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · {c.name} (Sec {c.section || '—'})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <h3 className="text-base font-bold text-slate-900">
            {selected.code} · {selected.name}
          </h3>
          <p className="text-xs text-slate-500">
            {teacher?.name || 'No teacher assigned'}
            {dept ? ` · ${dept.code}` : ''}
          </p>
        </div>

        {result.status === 'loading' && <p className="text-xs text-slate-400">Loading…</p>}
        {result.status === 'error' && (
          <p role="alert" className="text-xs font-semibold text-rose-600">
            Couldn't load feedback: {result.message}
          </p>
        )}

        {summary && (
          <>
            <p className="text-sm text-slate-700 mb-5">
              <strong className="text-slate-900">{summary.responses}</strong> of {summary.enrolled} students answered
              {summary.enrolled > 0 && ` (${Math.round((summary.responses * 100) / summary.enrolled)}%)`}.
            </p>

            {hidden ? (
              <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Results show once at least {MIN_FEEDBACK_RESPONSES} students have answered, so no single student's
                answers can be picked out.
              </p>
            ) : (
              <>
                <ul className="space-y-3">
                  {FEEDBACK_QUESTIONS.map((q, i) => {
                    const avg = Number(summary.averages?.[i] ?? 0);
                    return (
                      <li key={q}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-semibold text-slate-700">{q}</span>
                          <span className="inline-flex items-center gap-1 font-extrabold text-slate-900 tabular-nums shrink-0">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {avg.toFixed(1)}
                            <span className="text-slate-400 font-semibold">/ 5</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${avg >= 4 ? 'bg-emerald-500' : avg >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${(avg / 5) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <h4 className="text-sm font-bold text-slate-900 mt-7 mb-3">Comments</h4>
                {summary.comments?.length ? (
                  <ul className="space-y-2">
                    {summary.comments.map((c, i) => (
                      <li key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-line">
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No written comments.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
