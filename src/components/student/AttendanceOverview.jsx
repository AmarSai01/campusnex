import React, { useState } from 'react';
import {
  CheckSquare,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import AttendanceRingChart from '../charts/AttendanceRingChart';
import Badge from '../common/Badge';
import AttendancePlanner from './AttendancePlanner';
import { RISK_RULES } from '../../utils/risk';

const MIN = RISK_RULES.attendance.shortage;

export default function AttendanceOverview() {
  const { currentUser } = useAuth();
  const { courses, enrollments, attendance, users, timetable } = useData();

  const myEnrollments = enrollments.filter(e => e.student_id === currentUser?.id);
  const myCourseIds = myEnrollments.map(e => e.course_id);
  const myCourses = courses.filter(c => myCourseIds.includes(c.id));

  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Attendance records for this student only
  const myAttendance = attendance.filter(a => a.student_id === currentUser?.id);

  // Overall stats
  const totalClasses = myAttendance.length;
  const presentCount = myAttendance.filter(a => a.status === 'present').length;
  const lateCount = myAttendance.filter(a => a.status === 'late').length;
  const absentCount = myAttendance.filter(a => a.status === 'absent').length;

  // null until a class is marked, so an empty record never reads as 100%.
  const overallRate = totalClasses > 0
    ? Math.round(((presentCount + lateCount * 0.5) / totalClasses) * 100)
    : null;

  // Filtered log
  const filteredRecords = myAttendance
    .filter(a => {
      if (selectedCourseFilter !== 'all' && a.course_id !== selectedCourseFilter) return false;
      if (selectedStatusFilter !== 'all' && a.status !== selectedStatusFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-600" />
            My Attendance Records & Compliance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track daily classroom presence and subject-wise eligibility for the SEE (minimum {MIN}%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {overallRate === null ? (
            <Badge variant="neutral" size="lg" dot>
              No classes marked yet
            </Badge>
          ) : (
            <Badge variant={overallRate >= MIN ? 'success' : 'danger'} size="lg" dot>
              Overall: {overallRate}% {overallRate >= MIN ? 'Eligible' : 'Shortage'}
            </Badge>
          )}
        </div>
      </div>

      <AttendancePlanner courses={myCourses} attendance={myAttendance} timetable={timetable} />

      {/* Subject Rings Card Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Subject Compliance Breakdown
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Minimum {MIN}% attendance in each course is required to sit for the SEE.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {myCourses.map((course) => {
            const courseFaculty = users.find(u => u.id === course.faculty_id);
            const records = myAttendance.filter(a => a.course_id === course.id);
            const p = records.filter(a => a.status === 'present').length;
            const l = records.filter(a => a.status === 'late').length;
            const ab = records.filter(a => a.status === 'absent').length;
            const rate = records.length > 0
              ? Math.round(((p + l * 0.5) / records.length) * 100)
              : null;

            return (
              <div
                key={course.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-card transition-all flex flex-col items-center justify-between text-center"
              >
                <div className="w-full flex items-center justify-between mb-3">
                  <span className="font-extrabold text-xs text-slate-900">
                    {course.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                    Sec {course.section}
                  </span>
                </div>

                <AttendanceRingChart
                  percentage={rate}
                  size={105}
                  strokeWidth={10}
                  showThreshold={true}
                />

                <div className="mt-3 w-full">
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {course.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Faculty: {courseFaculty?.name || 'Instructor'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-1 text-[10px] font-bold">
                    <div className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                      P: {p}
                    </div>
                    <div className="p-1 rounded-lg bg-rose-50 text-rose-700">
                      Ab: {ab}
                    </div>
                    <div className="p-1 rounded-lg bg-amber-50 text-amber-700">
                      Late: {l}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Day-wise Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daily Attendance Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Verified session-by-session instructor sign-offs
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Course Filter */}
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {myCourses.map(c => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
              <option value="late">Late Only</option>
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Session Date</th>
                <th className="px-6 py-3.5">Course / Module</th>
                <th className="px-6 py-3.5">Assigned Instructor</th>
                <th className="px-6 py-3.5">Marked Status</th>
                <th className="px-6 py-3.5 text-right">Audit Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const course = courses.find(c => c.id === rec.course_id);
                  const faculty = users.find(u => u.id === course?.faculty_id);
                  const dateObj = new Date(rec.date);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {dateObj.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: course?.color || '#4f46e5' }}
                          />
                          <span className="font-bold text-slate-800">{course?.code}</span>
                          <span className="text-slate-500 text-[11px] hidden sm:inline">- {course?.name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {faculty?.name || 'Faculty Instructor'}
                      </td>

                      <td className="px-6 py-4">
                        {rec.status === 'present' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </span>
                        ) : rec.status === 'absent' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Absent (Shortage Penalty)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Late (0.5 Session Credit)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right text-emerald-600 font-bold text-[11px]">
                        ✓ Faculty Signed
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
