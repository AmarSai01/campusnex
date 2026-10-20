import React, { useState } from 'react';
import {
  Award,
  TrendingUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lock,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import TrendChart from '../charts/TrendChart';
import Badge from '../common/Badge';

export default function IAMarksView() {
  const { currentUser } = useAuth();
  const { courses, enrollments, ia_marks, users } = useData();

  const myEnrollments = enrollments.filter(e => e.student_id === currentUser?.id);
  const myCourseIds = myEnrollments.map(e => e.course_id);
  const myCourses = courses.filter(c => myCourseIds.includes(c.id));

  // Scoped strictly to published marks for current student
  const myPublishedMarks = ia_marks.filter(
    m => m.student_id === currentUser?.id && m.published
  );

  const [selectedCourseId, setSelectedCourseId] = useState(myCourses[0]?.id || '');

  // Calculate student overall IA average
  const totalEarned = myPublishedMarks.reduce((acc, m) => acc + (m.score / m.max_score) * 100, 0);
  const avgOverall = myPublishedMarks.length > 0 ? Math.round(totalEarned / myPublishedMarks.length) : null;

  const getGradeBracket = (percentage) => {
    if (percentage >= 90) return { grade: 'O', label: 'Outstanding', variant: 'success' };
    if (percentage >= 80) return { grade: 'A+', label: 'Excellent', variant: 'primary' };
    if (percentage >= 70) return { grade: 'A', label: 'Very Good', variant: 'info' };
    if (percentage >= 60) return { grade: 'B', label: 'Good', variant: 'warning' };
    return { grade: 'C', label: 'Needs Improvement', variant: 'danger' };
  };

  // Trend data for selected course
  const selectedCourseMarks = myPublishedMarks
    .filter(m => m.course_id === selectedCourseId)
    .map(m => ({
      name: m.ia_name.split(' ')[0], // 'IA-1', 'IA-2'
      score: m.score,
      max: m.max_score,
      pct: Math.round((m.score / m.max_score) * 100)
    }));

  const activeCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            Internal Assessment (IA) Academic Grades
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official published scores for continuous evaluation theory and practical laboratory assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="lg">
            {avgOverall === null ? 'No IA marks published yet' : `Cumulative IA Avg: ${avgOverall}%`}
          </Badge>
        </div>
      </div>

      {/* Course Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {myCourses.map((course) => {
          const faculty = users.find(u => u.id === course.faculty_id);
          const courseMarks = myPublishedMarks.filter(m => m.course_id === course.id);

          const totalPossible = courseMarks.reduce((acc, m) => acc + m.max_score, 0);
          const totalScored = courseMarks.reduce((acc, m) => acc + m.score, 0);
          const pct = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;
          const gradeInfo = getGradeBracket(pct);

          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-card transition-all cursor-pointer flex flex-col justify-between ${
                selectedCourseId === course.id
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-extrabold text-xs text-slate-900">
                    {course.code}
                  </span>
                  {courseMarks.length > 0 ? (
                    <Badge variant={gradeInfo.variant} size="sm">
                      Grade: {gradeInfo.grade}
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Pending
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">
                  {course.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instructor: {faculty?.name || 'Faculty'}
                </p>

                {/* Score Big Display */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {courseMarks.length ? totalScored : '—'}
                    </span>
                    {courseMarks.length > 0 && <span className="text-xs font-bold text-slate-400"> / {totalPossible}</span>}
                  </div>
                  <span className="text-sm font-extrabold text-brand-600">
                    {courseMarks.length ? `${pct}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Assessment Breakdown List */}
              <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                {courseMarks.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    No published marks yet for this subject.
                  </p>
                ) : (
                  courseMarks.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-700 truncate">{m.ia_name}</span>
                      <span className="font-extrabold text-slate-900 shrink-0">
                        {m.score}/{m.max_score}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Course Performance Trend & Breakdown */}
      {activeCourse && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                Performance Progression: {activeCourse.code} ({activeCourse.name})
              </h3>
              <p className="text-xs text-slate-500">
                Score tracking across consecutive test cycles
              </p>
            </div>
          </div>

          {selectedCourseMarks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
              No published test cycles available for trend analysis yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2">
                <TrendChart
                  data={selectedCourseMarks}
                  xKey="name"
                  yKey="score"
                  yMax={50}
                  unit="points"
                  height={220}
                />
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assessment Highlights
                </h4>
                {selectedCourseMarks.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{m.name}</span>
                    <span className="font-extrabold text-brand-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {m.score} / {m.max} ({m.pct}%)
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  ✓ Weightage is factored towards university final SGPA credit determination.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
