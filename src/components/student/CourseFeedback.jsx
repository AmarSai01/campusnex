import React, { useEffect, useState } from 'react';
import { CheckCircle2, EyeOff, MessageSquareHeart, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { Button } from '@/components/ui/button';
import { FEEDBACK_QUESTIONS, RATING_LABELS } from '../../utils/feedback';
import { cn } from '@/lib/utils';

function RatingRow({ question, index, value, onChange }) {
  const name = `q${index}`;
  return (
    <fieldset className="py-3 border-b border-slate-100 last:border-0">
      <legend className="text-xs font-semibold text-slate-800 mb-2">
        {index + 1}. {question}
      </legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup">
        {RATING_LABELS.map((label, i) => {
          const rating = i + 1;
          const checked = value === rating;
          return (
            <label
              key={label}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors',
                'focus-within:ring-2 focus-within:ring-brand-500',
                checked
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
              )}
            >
              <input
                type="radio"
                name={name}
                value={rating}
                checked={checked}
                onChange={() => onChange(rating)}
                className="sr-only"
              />
              <Star className={cn('w-3 h-3', checked ? 'fill-white' : '')} />
              {rating} · {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// End-of-semester feedback, one form per enrolled course. Answers are anonymous: the server
// keeps who answered apart from what they answered.
export default function CourseFeedback() {
  const { currentUser } = useAuth();
  const { courses, enrollments, users, fetchMyFeedbackCourses, submitCourseFeedback } = useData();

  const [done, setDone] = useState(null); // Set of course ids, null while loading
  const [loadError, setLoadError] = useState('');
  const [openId, setOpenId] = useState('');
  const [ratings, setRatings] = useState(Array(FEEDBACK_QUESTIONS.length).fill(0));
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchMyFeedbackCourses()
      .then((ids) => active && setDone(new Set(ids)))
      .catch((e) => {
        if (!active) return;
        setDone(new Set());
        setLoadError(e.message);
      });
    return () => {
      active = false;
    };
    // Loaded once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myCourseIds = new Set(enrollments.filter((e) => e.student_id === currentUser?.id).map((e) => e.course_id));
  const myCourses = courses.filter((c) => myCourseIds.has(c.id)).sort((a, b) => a.code.localeCompare(b.code));

  if (!myCourses.length) {
    return (
      <EmptyState
        icon={MessageSquareHeart}
        title="No courses to review"
        description="Feedback forms appear here for each course you're enrolled in."
      />
    );
  }

  const pending = done ? myCourses.filter((c) => !done.has(c.id)).length : null;

  const startForm = (id) => {
    setOpenId(id === openId ? '' : id);
    setRatings(Array(FEEDBACK_QUESTIONS.length).fill(0));
    setComment('');
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (ratings.some((r) => !r)) {
      setError('Please rate every question.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await submitCourseFeedback(openId, ratings, comment.trim());
      setDone((prev) => new Set([...prev, openId]));
      setOpenId('');
    } catch (err) {
      setError(err.message || 'Could not send your feedback.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-brand-600" />
            Course Feedback
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" />
            Anonymous. Teachers see only averages and comments once at least 3 classmates have answered.
          </p>
        </div>
        {pending !== null && (
          <Badge variant={pending ? 'warning' : 'success'} size="lg">
            {pending ? `${pending} of ${myCourses.length} still to do` : 'All done'}
          </Badge>
        )}
      </div>

      {loadError && (
        <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          Couldn't check which forms you've sent: {loadError}
        </p>
      )}

      <ul className="space-y-3">
        {myCourses.map((course) => {
          const teacher = users.find((u) => u.id === course.faculty_id);
          const isDone = done?.has(course.id);
          const isOpen = openId === course.id;
          return (
            <li key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: course.color || '#4f46e5' }} />
                  <span className="font-bold text-sm text-slate-900">{course.code}</span>
                  <span className="text-xs text-slate-600 truncate">{course.name}</span>
                  <span className="text-[11px] text-slate-400 truncate hidden md:inline">· {teacher?.name || 'Teacher'}</span>
                </div>
                {done === null ? (
                  <span className="text-[11px] text-slate-400">Checking…</span>
                ) : isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Feedback sent
                  </span>
                ) : (
                  <Button size="sm" variant={isOpen ? 'outline' : 'default'} className="rounded-xl" onClick={() => startForm(course.id)}>
                    {isOpen ? 'Cancel' : 'Give feedback'}
                  </Button>
                )}
              </div>

              {isOpen && !isDone && (
                <form onSubmit={submit} className="px-4 sm:px-6 pb-5 border-t border-slate-100 bg-slate-50/40">
                  {FEEDBACK_QUESTIONS.map((q, i) => (
                    <RatingRow
                      key={q}
                      question={q}
                      index={i}
                      value={ratings[i]}
                      onChange={(r) => setRatings((prev) => prev.map((v, j) => (j === i ? r : v)))}
                    />
                  ))}
                  <label htmlFor="feedback-comment" className="block text-xs font-semibold text-slate-800 mt-3 mb-1">
                    Anything else? (optional)
                  </label>
                  <textarea
                    id="feedback-comment"
                    rows={3}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What worked well, and what could be better?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Don't include your name or USN if you want to stay anonymous.</p>
                  {error && (
                    <p role="alert" className="mt-3 text-xs font-semibold text-rose-600">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="mt-4 rounded-xl" disabled={saving}>
                    {saving ? 'Sending…' : 'Send feedback'}
                  </Button>
                  <p className="text-[11px] text-slate-400 mt-2">You can send feedback once per course, and can't change it afterwards.</p>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
