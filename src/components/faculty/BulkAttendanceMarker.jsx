import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Save,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';

export default function BulkAttendanceMarker() {
  const { currentUser } = useAuth();
  const { courses, enrollments, users, attendance, markBulkAttendance } = useData();

  // Scoped strictly to courses assigned to this faculty
  const myCourses = courses.filter(c => c.faculty_id === currentUser?.id);

  const [selectedCourseId, setSelectedCourseId] = useState(myCourses[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState('2026-08-29');
  const [roster, setRoster] = useState([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Update selected course if list changes
  useEffect(() => {
    if (!selectedCourseId && myCourses.length > 0) {
      setSelectedCourseId(myCourses[0].id);
    }
  }, [myCourses, selectedCourseId]);

  // Load enrolled students & existing attendance for selected course and date
  useEffect(() => {
    if (!selectedCourseId) return;

    const enrolledStudents = enrollments
      .filter(e => e.course_id === selectedCourseId)
      .map(e => users.find(u => u.id === e.student_id))
      .filter(Boolean);

    const existingAttendance = attendance.filter(
      a => a.course_id === selectedCourseId && a.date === selectedDate
    );

    const initialRoster = enrolledStudents.map(student => {
      const existing = existingAttendance.find(a => a.student_id === student.id);
      return {
        student_id: student.id,
        name: student.name,
        roll_no: student.roll_no || 'N/A',
        section: student.section || 'A',
        photo_url: student.photo_url,
        status: existing ? existing.status : 'present' // default to present
      };
    });

    setRoster(initialRoster);
    setSavedSuccess(false);
  }, [selectedCourseId, selectedDate, enrollments, users, attendance]);

  const handleStatusChange = (studentId, status) => {
    setRoster(prev => prev.map(item => 
      item.student_id === studentId ? { ...item, status } : item
    ));
    setSavedSuccess(false);
  };

  const handleMarkAll = (status) => {
    setRoster(prev => prev.map(item => ({ ...item, status })));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    if (!selectedCourseId || roster.length === 0) return;

    markBulkAttendance(selectedCourseId, selectedDate, roster);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const counts = {
    present: roster.filter(r => r.status === 'present').length,
    absent: roster.filter(r => r.status === 'absent').length,
    late: roster.filter(r => r.status === 'late').length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-600" />
            Session Attendance Marker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Conduct daily roll call. Students marked absent receive real-time automated alerts.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={roster.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Session Attendance</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Attendance recorded successfully! Absent notifications dispatched to students.</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Course *
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name} (Sec {c.section})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Session Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Quick Batch Actions */}
        <div className="sm:col-span-2 flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleMarkAll('present')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('absent')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex items-center gap-3 text-xs font-bold">
        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Present: {counts.present}
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          Absent: {counts.absent}
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Late: {counts.late}
        </span>
      </div>

      {/* Roster List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {roster.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students enrolled in this course section.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {roster.map((item, idx) => (
              <div
                key={item.student_id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-bold text-slate-400 w-5">
                    {idx + 1}.
                  </span>
                  <img
                    src={item.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400 font-semibold">
                      Roll: {item.roll_no} • Section {item.section}
                    </p>
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center bg-slate-100/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.student_id, 'present')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.student_id, 'late')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'late'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Late
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.student_id, 'absent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.status === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
