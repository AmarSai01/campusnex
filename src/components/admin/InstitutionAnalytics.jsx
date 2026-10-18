import React from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import StatCard from '../common/StatCard';
import AttendanceRingChart from '../charts/AttendanceRingChart';
import TrendChart from '../charts/TrendChart';
import DistributionBarChart from '../charts/DistributionBarChart';
import Badge from '../common/Badge';

export default function InstitutionAnalytics({ onNavigateTab }) {
  const { users, courses, attendance, ia_marks, departments, assignments, submissions } = useData();

  const students = users.filter(u => u.role === 'student' && u.status === 'active');
  const faculty = users.filter(u => u.role === 'faculty' && u.status === 'active');

  // Overall Attendance Rate Calculation
  const totalAttendanceRecords = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const overallAttendanceRate = totalAttendanceRecords > 0
    ? Math.round(((presentCount + lateCount * 0.5) / totalAttendanceRecords) * 100)
    : 0;

  // At-risk students (< 75% attendance)
  const studentAttendanceStats = students.map(st => {
    const stRecords = attendance.filter(a => a.student_id === st.id);
    const stPresent = stRecords.filter(a => a.status === 'present').length;
    const stLate = stRecords.filter(a => a.status === 'late').length;
    const rate = stRecords.length > 0
      ? Math.round(((stPresent + stLate * 0.5) / stRecords.length) * 100)
      : 100;
    return { ...st, attendanceRate: rate, totalClasses: stRecords.length };
  });

  const atRiskStudents = studentAttendanceStats.filter(s => s.attendanceRate < 75);

  // IA Marks average
  const publishedMarks = ia_marks.filter(m => m.published);
  const totalMarksEarned = publishedMarks.reduce((acc, m) => acc + (m.score / m.max_score) * 100, 0);
  const avgIAMark = publishedMarks.length > 0 ? Math.round(totalMarksEarned / publishedMarks.length) : 0;

  // Grade Distribution
  const gradeDistributionData = [
    { range: '90-100% (O)', count: publishedMarks.filter(m => (m.score / m.max_score) >= 0.9).length, color: '#10b981' },
    { range: '80-89% (A+)', count: publishedMarks.filter(m => (m.score / m.max_score) >= 0.8 && (m.score / m.max_score) < 0.9).length, color: '#4f46e5' },
    { range: '70-79% (A)', count: publishedMarks.filter(m => (m.score / m.max_score) >= 0.7 && (m.score / m.max_score) < 0.8).length, color: '#0284c7' },
    { range: '60-69% (B)', count: publishedMarks.filter(m => (m.score / m.max_score) >= 0.6 && (m.score / m.max_score) < 0.7).length, color: '#f59e0b' },
    { range: '<60% (C/Fail)', count: publishedMarks.filter(m => (m.score / m.max_score) < 0.6).length, color: '#f43f5e' }
  ];

  // Course wise breakdown
  const courseSummaries = courses.map(course => {
    const courseFaculty = users.find(u => u.id === course.faculty_id);
    const courseAttendance = attendance.filter(a => a.course_id === course.id);
    const cPresent = courseAttendance.filter(a => a.status === 'present').length;
    const rate = courseAttendance.length > 0 ? Math.round((cPresent / courseAttendance.length) * 100) : 0;
    const courseMarks = ia_marks.filter(m => m.course_id === course.id && m.published);
    const avgScore = courseMarks.length > 0
      ? Math.round(courseMarks.reduce((acc, m) => acc + m.score, 0) / courseMarks.length)
      : 0;

    return {
      ...course,
      facultyName: courseFaculty ? courseFaculty.name : 'Unassigned',
      attendanceRate: rate,
      totalSessions: courseAttendance.length,
      avgScore
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            Executive Academic Dashboard
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Performance & Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Centralized monitoring for semester courses, faculty load distribution, student attendance compliance, and internal assessment metrics.
          </p>
        </div>

        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => onNavigateTab('users')}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-colors"
          >
            Manage Users
          </button>
          <button
            onClick={() => onNavigateTab('timetable')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Timetable Builder
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={students.length}
          subtitle="Across 2 Sections"
          icon={GraduationCap}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Appointed Faculty"
          value={faculty.length}
          subtitle="Full-Time Professors"
          icon={Briefcase}
          iconBg="bg-brand-50 text-brand-600 border-brand-100"
          badgeText="100% Active"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Average Attendance"
          value={`${overallAttendanceRate}%`}
          subtitle="Institution-wide average"
          icon={CheckSquare}
          iconBg="bg-sky-50 text-sky-600 border-sky-100"
        />

        <StatCard
          title="Avg IA Score"
          value={`${avgIAMark}%`}
          subtitle="Published IA assessments"
          icon={Award}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Internal Assessment Score Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Student performance across all published test cycles (IA-1 & IA-2)
              </p>
            </div>
            <Badge variant="primary">Published marks</Badge>
          </div>
          <DistributionBarChart data={gradeDistributionData} height={240} />
        </div>

        {/* Attendance Compliance Ring & At-Risk Alert */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Attendance Health
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Students meeting 75% minimum eligibility
            </p>
            <div className="py-2">
              <AttendanceRingChart
                percentage={overallAttendanceRate}
                size={140}
                strokeWidth={12}
                sublabel="Campus Avg"
                label="Overall Compliance"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                At-Risk Students (&lt;75%):
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold">
                {atRiskStudents.length} Students
              </span>
            </div>
            {atRiskStudents.length > 0 ? (
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {atRiskStudents.map(st => (
                  <div key={st.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-50/60 border border-rose-100">
                    <span className="font-semibold text-slate-800">{st.name} ({st.roll_no})</span>
                    <span className="font-extrabold text-rose-600">{st.attendanceRate}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All students currently meet attendance threshold!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Courses Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Department Courses & Faculty Allocation
            </h3>
            <p className="text-xs text-slate-500">
              Active curriculum tracks and assigned instructors
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('courses')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Edit Assignments →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Course Code & Name</th>
                <th className="px-6 py-3">Assigned Faculty</th>
                <th className="px-6 py-3">Sem / Sec</th>
                <th className="px-6 py-3">Attendance Rate</th>
                <th className="px-6 py-3">Avg IA Score</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {courseSummaries.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: course.color || '#4f46e5' }}
                      />
                      <div>
                        <span className="font-bold text-slate-900">{course.code}</span>
                        <p className="text-slate-500 text-[11px] line-clamp-1">{course.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {course.facultyName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                      Sem {course.semester} • Sec {course.section}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            course.attendanceRate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${course.attendanceRate}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-slate-800">{course.attendanceRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-extrabold text-brand-700">
                    {course.avgScore > 0 ? `${course.avgScore}/50` : 'Pending'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onNavigateTab('courses')}
                      className="px-3 py-1 text-xs font-semibold rounded-lg text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                    >
                      Reassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
