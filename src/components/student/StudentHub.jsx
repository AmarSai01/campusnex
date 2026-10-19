import React from 'react';
import {
  GraduationCap,
  CheckSquare,
  Award,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  User,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../common/StatCard';
import AttendanceRingChart from '../charts/AttendanceRingChart';
import TrendChart from '../charts/TrendChart';
import Badge from '../common/Badge';
import { formatTime } from '../../utils/time';
import { RISK_RULES } from '../../utils/risk';

const MIN_ATTENDANCE = RISK_RULES.attendance.shortage;

export default function StudentHub({ onNavigateTab }) {
  const { currentUser } = useAuth();
  const { courses, enrollments, attendance, ia_marks, assignments, submissions, timetable, announcements, users } = useData();

  // Enrolled courses for this student
  const myEnrollments = enrollments.filter(e => e.student_id === currentUser?.id);
  const myCourseIds = myEnrollments.map(e => e.course_id);
  const myCourses = courses.filter(c => myCourseIds.includes(c.id));

  // Attendance stats for this student
  const myAttendance = attendance.filter(a => a.student_id === currentUser?.id);
  const presentCount = myAttendance.filter(a => a.status === 'present').length;
  const lateCount = myAttendance.filter(a => a.status === 'late').length;
  const overallAttendanceRate = myAttendance.length > 0
    ? Math.round(((presentCount + lateCount * 0.5) / myAttendance.length) * 100)
    : 100;

  // Published IA Marks only (Strict student permission scoping)
  const myPublishedMarks = ia_marks.filter(
    m => m.student_id === currentUser?.id && m.published
  );

  const totalEarned = myPublishedMarks.reduce((acc, m) => acc + (m.score / m.max_score) * 100, 0);
  const avgIAMark = myPublishedMarks.length > 0
    ? Math.round(totalEarned / myPublishedMarks.length)
    : 0;

  // Assignments & Submissions
  const myAssignments = assignments.filter(a => myCourseIds.includes(a.course_id));
  const mySubmissions = submissions.filter(s => s.student_id === currentUser?.id);
  const submittedAsgIds = mySubmissions.map(s => s.assignment_id);
  const pendingAssignments = myAssignments.filter(a => !submittedAsgIds.includes(a.id));

  // Today's classes
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = timetable
    .filter(t => myCourseIds.includes(t.course_id) && (t.day_of_week === currentDayName || t.day_of_week === 'Monday'))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Recent announcements (Global / Dept / Enrolled courses)
  const relevantAnnouncements = announcements.filter(a =>
    a.scope === 'global' ||
    (a.scope === 'department' && a.department_id === currentUser?.department_id) ||
    (a.scope === 'course' && myCourseIds.includes(a.course_id))
  ).slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Student Academic Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {currentUser?.name || 'Student'}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
            Roll No: <span className="font-bold text-white">{currentUser?.roll_no || 'CS22B101'}</span> • Semester {currentUser?.semester || 5} (Section {currentUser?.section || 'A'}) • Department of Computer Science & Engineering
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('attendance')}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-colors"
          >
            Attendance Logs
          </button>
          <button
            onClick={() => onNavigateTab('assignments')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Submit Work
          </button>
        </div>
      </div>

      {/* Attendance shortage banner below the SEE minimum */}
      {overallAttendanceRate < MIN_ATTENDANCE && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-xs text-rose-900">
              Low Attendance Warning ({overallAttendanceRate}% Overall)
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Your overall attendance is currently below the mandatory {MIN_ATTENDANCE}% needed to sit the SEE. Please attend upcoming sessions to regain eligibility.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('attendance')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shrink-0"
          >
            Inspect Logs
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${overallAttendanceRate}%`}
          subtitle={overallAttendanceRate >= MIN_ATTENDANCE ? `Meets ${MIN_ATTENDANCE}% criteria` : 'Attendance shortage alert'}
          icon={CheckSquare}
          iconBg={overallAttendanceRate >= MIN_ATTENDANCE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}
          badgeText={overallAttendanceRate >= MIN_ATTENDANCE ? 'Eligible' : 'Shortage'}
          badgeVariant={overallAttendanceRate >= MIN_ATTENDANCE ? 'success' : 'danger'}
          onClick={() => onNavigateTab('attendance')}
        />

        <StatCard
          title="Average IA Score"
          value={`${avgIAMark}%`}
          subtitle={`${myPublishedMarks.length} tests published`}
          icon={Award}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
          onClick={() => onNavigateTab('iamarks')}
        />

        <StatCard
          title="Pending Work"
          value={pendingAssignments.length}
          subtitle="Assignments due soon"
          icon={FileText}
          iconBg="bg-amber-50 text-amber-600 border-amber-100"
          badgeText={pendingAssignments.length > 0 ? 'Action Required' : 'Done'}
          badgeVariant={pendingAssignments.length > 0 ? 'warning' : 'success'}
          onClick={() => onNavigateTab('assignments')}
        />

        <StatCard
          title="Enrolled Courses"
          value={myCourses.length}
          subtitle="Core semester subjects"
          icon={GraduationCap}
          iconBg="bg-brand-50 text-brand-600 border-brand-100"
          onClick={() => onNavigateTab('directory')}
        />
      </div>

      {/* Main Grid: Subject Attendance Rings + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-Wise Attendance Progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Subject-Wise Attendance Rings
              </h3>
              <p className="text-xs text-slate-500">
                Real-time compliance breakdown per enrolled course
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Detailed Log →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            {myCourses.map((c) => {
              const cAtt = attendance.filter(a => a.course_id === c.id && a.student_id === currentUser?.id);
              const cPres = cAtt.filter(a => a.status === 'present').length;
              const cLate = cAtt.filter(a => a.status === 'late').length;
              const pct = cAtt.length > 0 ? Math.round(((cPres + cLate * 0.5) / cAtt.length) * 100) : 100;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center text-center"
                >
                  <AttendanceRingChart
                    percentage={pct}
                    size={90}
                    strokeWidth={8}
                    label={c.code}
                    showThreshold={true}
                  />
                  <span className="text-[11px] font-semibold text-slate-500 line-clamp-1 mt-1">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {cPres}/{cAtt.length} sessions attended
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Classes Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  {currentDayName} timetable slots
                </p>
              </div>
              <Badge variant="primary" size="sm">
                Sec {currentUser?.section || 'A'}
              </Badge>
            </div>

            <div className="space-y-2.5 mt-4">
              {todayClasses.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No classes scheduled for today!
                </p>
              ) : (
                todayClasses.map((slot) => {
                  const course = courses.find(c => c.id === slot.course_id);
                  const faculty = users.find(u => u.id === slot.faculty_id);

                  return (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-[11px] shrink-0 border border-brand-100">
                          {formatTime(slot.start_time)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {course?.code}: {course?.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            {faculty?.name || 'Instructor'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 shrink-0">
                        {slot.room}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('timetable')}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Full Week Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Announcements & Upcoming Deadlines Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bulletins Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">
                Latest Bulletins & Circulars
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('announcements')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {relevantAnnouncements.map((ann) => (
              <div key={ann.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={ann.scope === 'global' ? 'purple' : 'primary'} size="sm">
                    {ann.scope}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 mt-1">{ann.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {ann.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Upcoming Task Deadlines
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('assignments')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Submit Work →
            </button>
          </div>

          <div className="space-y-3">
            {pendingAssignments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                🎉 No pending assignments! You're all caught up.
              </div>
            ) : (
              pendingAssignments.map((asg) => {
                const course = courses.find(c => c.id === asg.course_id);
                const dueDate = new Date(asg.due_date);

                return (
                  <div
                    key={asg.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700">
                        {course?.code}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                        {asg.title}
                      </h4>
                      <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Due {dueDate.toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigateTab('assignments')}
                      className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shrink-0"
                    >
                      Submit
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
