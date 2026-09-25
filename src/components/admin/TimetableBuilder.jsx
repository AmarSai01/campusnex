import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  User,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { detectTimetableConflict } from '../../utils/conflictDetector';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function TimetableBuilder() {
  const { timetable, courses, users, saveTimetableSlot, deleteTimetableSlot } = useData();

  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDay, setSelectedDay] = useState('All'); // 'All' | 'Monday' | 'Tuesday' | ...

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const roomsList = ['LH-101', 'LH-102', 'Lab-CSE-2', 'Seminar-Hall-1'];

  const [formData, setFormData] = useState({
    course_id: courses[0]?.id || '',
    faculty_id: courses[0]?.faculty_id || '',
    section: 'A',
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    room: 'LH-101'
  });

  const [conflictWarning, setConflictWarning] = useState(null);

  const handleOpenAddModal = () => {
    setEditingSlot(null);
    const initialCourse = courses[0];
    setFormData({
      course_id: initialCourse?.id || '',
      faculty_id: initialCourse?.faculty_id || users.find(u => u.role === 'faculty')?.id || '',
      section: selectedSection,
      day_of_week: selectedDay !== 'All' ? selectedDay : 'Monday',
      start_time: '09:00',
      end_time: '10:00',
      room: 'LH-101'
    });
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    setFormData(prev => ({
      ...prev,
      course_id: courseId,
      faculty_id: course?.faculty_id || prev.faculty_id
    }));
  };

  // Test live conflict when form inputs change
  const handleCheckConflict = (candidateData) => {
    const conflictResult = detectTimetableConflict(candidateData, timetable, courses, users);
    if (conflictResult.hasConflict) {
      setConflictWarning(conflictResult.conflicts);
    } else {
      setConflictWarning(null);
    }
  };

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    handleCheckConflict(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const conflictResult = detectTimetableConflict(
      { ...formData, id: editingSlot?.id },
      timetable,
      courses,
      users
    );

    if (conflictResult.hasConflict) {
      setConflictWarning(conflictResult.conflicts);
      return;
    }

    saveTimetableSlot({
      ...formData,
      id: editingSlot?.id
    });
    setIsModalOpen(false);
  };

  // Filter slots
  const filteredSlots = timetable.filter(s => {
    if (selectedSection && s.section !== selectedSection) return false;
    if (selectedDay !== 'All' && s.day_of_week !== selectedDay) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            Timetable Builder & Conflict Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build weekly class grids with real-time faculty double-booking and room overlap prevention.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Class Slot</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Section Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Section:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedSection('A')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedSection === 'A' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Section A
            </button>
            <button
              onClick={() => setSelectedSection('B')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedSection === 'B' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Section B
            </button>
          </div>
        </div>

        {/* Day Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDay('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDay === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Week
          </button>
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDay === day
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Weekly Grid / List */}
      <div className="space-y-6">
        {(selectedDay === 'All' ? daysOfWeek : [selectedDay]).map((day) => {
          const daySlots = timetable
            .filter(s => s.day_of_week === day && s.section === selectedSection)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">{day}</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {daySlots.length} Sessions Scheduled
                </span>
              </div>

              <div className="p-4 sm:p-6">
                {daySlots.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No classes scheduled for {day} in Section {selectedSection}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {daySlots.map((slot) => {
                      const course = courses.find(c => c.id === slot.course_id);
                      const faculty = users.find(u => u.id === slot.faculty_id);

                      return (
                        <div
                          key={slot.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-300 hover:shadow-card transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                                <Clock className="w-3 h-3" />
                                {slot.start_time} - {slot.end_time}
                              </span>
                              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                Room {slot.room}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: course?.color || '#4f46e5' }}
                              />
                              <h4 className="font-bold text-xs text-slate-900 truncate">
                                {course ? `${course.code}: ${course.name}` : 'Unknown Course'}
                              </h4>
                            </div>

                            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold text-slate-700">{faculty?.name || 'Unassigned'}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-end">
                            <button
                              onClick={() => deleteTimetableSlot(slot.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Timetable Slot"
        subtitle="Live conflict checking prevents double-booking faculty and classrooms."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conflict Alert Banner */}
          {conflictWarning && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Scheduling Conflict Detected!</span>
              </div>
              <ul className="text-xs text-rose-600 list-disc list-inside space-y-1 pl-1">
                {conflictWarning.map((c, idx) => (
                  <li key={idx} className="font-medium">{c.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course *
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name} (Sec {c.section})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faculty Instructor *
              </label>
              <select
                value={formData.faculty_id}
                onChange={(e) => handleInputChange('faculty_id', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {users.filter(u => u.role === 'faculty').map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Day of Week *
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {daysOfWeek.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Classroom / Lab Room *
              </label>
              <select
                value={formData.room}
                onChange={(e) => handleInputChange('room', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {roomsList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {conflictWarning ? '⚠️ Conflict must be resolved' : '✓ No schedule conflicts'}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(conflictWarning)}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Save Schedule Slot
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
