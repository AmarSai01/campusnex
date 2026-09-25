import React from 'react';
import {
  BookOpen,
  Users,
  CheckSquare,
  Award,
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../common/StatCard';
import TrendChart from '../charts/TrendChart';
import DistributionBarChart from '../charts/DistributionBarChart';
import Badge from '../common/Badge';

export default function ClassAnalytics({ onNavigateTab }) {
  const { currentUser } = useAuth();
  const { courses, enrollments, attendance, ia_marks, assignments, submissions, users } = useData();

  // Scoped strictly to current faculty's assigned courses
  const myCourses = courses.filter(c => c.faculty_id === currentUser?.id);
  const myCourseIds = myCourses.map(c => c.id);

  // Enrolled students in my courses
  const myEnrollments = enrollments.filter(e => myCourseIds.includes(e.course_id));
  const uniqueStudentIds = [...new Set(myEnrollments.map(e => e.student_id))];

  // Attendance in my courses
  const myAttendance = attendance.filter(a => myCourseIds.includes(a.course_id));
  const presentCount = myAttendance.filter(a => a.status === 'present').length;
  const lateCount = myAttendance.filter(a => a.status === 'late').length;
  const attendanceRate = myAttendance.length > 0
    ? Math.round(((presentCount + lateCount * 0.5) / myAttendance.length) * 100)
    : 0;

  // IA Marks in my courses
  const myMarks = ia_marks.filter(m => myCourseIds.includes(m.course_id) && m.published);
  const avgScore = myMarks.length > 0
    ? Math.round(myMarks.reduce((acc, m) => acc + (m.score / m.max_score) * 100, 0) / myMarks.length)
    : 0;

  // Assignments & Submissions
  const myAssignments = assignments.filter(a => myCourseIds.includes(a.course_id));
  const myAssignmentIds = myAssignments.map(a => a.id);
  const mySubmissions = submissions.filter(s => myAssignmentIds.includes(s.assignment_id));
  const gradedCount = mySubmissions.filter(s => s.graded).length;
  const pendingGradingCount = mySubmissions.filter(s => !s.graded).length;

  // Score distribution for my courses
  const gradeDistribution = [
    { range: '90-100% (O)', count: myMarks.filter(m => (m.score / m.max_score) >= 0.9).length, color: '#10b981' },
    { range: '80-89% (A+)', count: myMarks.filter(m => (m.score / m.max_score) >= 0.8 && (m.score / m.max_score) < 0.9).length, color: '#4f46e5' },
    { range: '70-79% (A)', count: myMarks.filter(m => (m.score / m.max_score) >= 0.7 && (m.score / m.max_score) < 0.8).length, color: '#0284c7' },
    { range: '60-69% (B)', count: myMarks.filter(m => (m.score / m.max_score) >= 0.6 && (m.score / m.max_score) < 0.7).length, color: '#f59e0b' },
    { range: '<60% (C/Fail)', count: myMarks.filter(m => (m.score / m.max_score) < 0.6).length, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-200 border border-brand-500/30 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Instructor Workspace
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name || 'Professor'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            You are managing {myCourses.length} courses across {uniqueStudentIds.length} enrolled students in {currentUser?.department_id === 'dept_cse' ? 'Computer Science & Engineering' : 'Engineering'}.
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('attendance')}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-colors"
          >
            Mark Session Attendance
          </button>
          <button
            onClick={() => onNavigateTab('iamarks')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Publish IA Marks
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={myCourses.length}
          subtitle="Active curriculum units"
          icon={BookOpen}
          iconBg="bg-brand-50 text-brand-600 border-brand-100"
          onClick={() => onNavigateTab('attendance')}
        />

        <StatCard
          title="Class Attendance"
          value={`${attendanceRate}%`}
          subtitle="Average session presence"
          icon={CheckSquare}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
          trend="+2.4%"
          trendType="up"
          trendLabel="this month"
        />

        <StatCard
          title="Average IA Score"
          value={`${avgScore}%`}
          subtitle="Published IA tests"
          icon={Award}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
        />

        <StatCard
          title="Pending Grading"
          value={pendingGradingCount}
          subtitle={`${gradedCount} graded out of ${mySubmissions.length}`}
          icon={FileText}
          iconBg="bg-amber-50 text-amber-600 border-amber-100"
          badgeText={pendingGradingCount > 0 ? 'Needs Review' : 'All Graded'}
          onClick={() => onNavigateTab('assignments')}
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Class Grade & Marks Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Student bracket counts for your assigned courses
              </p>
            </div>
            <Badge variant="primary">Published Assessments</Badge>
          </div>
          <DistributionBarChart data={gradeDistribution} height={240} />
        </div>

        {/* Assigned Courses Roster */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Your Course Load
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enrolled students & quick access
            </p>

            <div className="space-y-3">
              {myCourses.map((c) => {
                const count = enrollments.filter(e => e.course_id === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">
                        {c.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700">
                        Sec {c.section}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold line-clamp-1">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {count} Enrolled Students • {c.credits} Credits
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('assignments')}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <span>Review Course Assignments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
