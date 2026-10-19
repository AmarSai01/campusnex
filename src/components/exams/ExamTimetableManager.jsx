import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Search,
  DoorOpen,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { formatTimeRange } from '../../utils/time';

export default function ExamTimetableManager() {
  const { currentUser } = useAuth();
  const {
    departments = [],
    users = [],
    courses = [],
    exam_rooms = [],
    exam_timetables = [],
    createExamTimetable,
    updateExamTimetable,
    deleteExamTimetable
  } = useData();

  const isAdmin = currentUser?.role === 'admin';
  const isFaculty = currentUser?.role === 'faculty';
  const facultyDeptId = currentUser?.department_id;

  const [selectedDept, setSelectedDept] = useState(
    isFaculty && facultyDeptId ? facultyDeptId : 'All'
  );
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState(null);

  const [formData, setFormData] = useState({
    subject: '',
    course_id: '',
    department_id: isFaculty && facultyDeptId ? facultyDeptId : (departments[0]?.id || 'dept_cse'),
    semester: 5,
    exam_date: '',
    start_time: '09:30',
    end_time: '12:30',
    exam_type: 'Mid-Semester Theory',
    room_ids: []
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filter exams
  const filteredExams = exam_timetables.filter(exam => {
    const matchesDept = selectedDept === 'All' || exam.department_id === selectedDept;
    const matchesSem = selectedSemester === 'All' || Number(exam.semester) === Number(selectedSemester);
    const matchesSearch =
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.exam_date && exam.exam_date.includes(searchQuery)) ||
      (exam.rooms && exam.rooms.some(r => r.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesDept && matchesSem && matchesSearch;
  });

  // Calculate stats
  const totalUpcoming = exam_timetables.length;
  const myDeptExams = isFaculty
    ? exam_timetables.filter(e => e.department_id === facultyDeptId).length
    : totalUpcoming;

  const handleOpenCreateModal = () => {
    setEditingExam(null);
    const deptId = isFaculty && facultyDeptId ? facultyDeptId : (departments[0]?.id || 'dept_cse');
    const deptCourses = courses.filter(c => c.department_id === deptId);

    setFormData({
      subject: deptCourses[0] ? `${deptCourses[0].code} - ${deptCourses[0].name}` : '',
      course_id: deptCourses[0]?.id || '',
      department_id: deptId,
      semester: 5,
      exam_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      start_time: '09:30',
      end_time: '12:30',
      exam_type: 'Mid-Semester Theory',
      room_ids: exam_rooms[0]?.id ? [exam_rooms[0].id] : []
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exam) => {
    // Check permission for Faculty
    if (isFaculty && exam.department_id !== facultyDeptId) {
      alert('Permission Denied: You can only edit examinations for your own department.');
      return;
    }

    setEditingExam(exam);
    setFormData({
      subject: exam.subject,
      course_id: exam.course_id || '',
      department_id: exam.department_id,
      semester: exam.semester || 5,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      exam_type: exam.exam_type || 'Mid-Semester Theory',
      room_ids: exam.room_ids || []
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleRoom = (roomId) => {
    setFormData(prev => {
      const exists = prev.room_ids.includes(roomId);
      const updated = exists
        ? prev.room_ids.filter(id => id !== roomId)
        : [...prev.room_ids, roomId];
      return { ...prev, room_ids: updated };
    });
  };

  const handleCourseSelect = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setFormData(prev => ({
        ...prev,
        course_id: course.id,
        subject: `${course.code} - ${course.name}`,
        department_id: course.department_id || prev.department_id,
        semester: course.semester || prev.semester
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!formData.subject.trim()) {
        throw new Error('Exam subject is required.');
      }
      if (!formData.exam_date) {
        throw new Error('Exam date is required.');
      }
      if (!formData.start_time || !formData.end_time) {
        throw new Error('Start and end times are required.');
      }
      if (formData.start_time >= formData.end_time) {
        throw new Error('End time must be later than start time.');
      }

      // Convert selected room_ids to room names
      const selectedRooms = exam_rooms.filter(r => formData.room_ids.includes(r.id));
      const payload = {
        ...formData,
        room_ids: formData.room_ids,
        rooms: selectedRooms.map(r => r.name)
      };

      if (editingExam) {
        updateExamTimetable(
          editingExam.id,
          payload,
          currentUser?.id,
          currentUser?.role,
          facultyDeptId
        );
        setSuccessToast(`Exam schedule for "${formData.subject}" updated.`);
      } else {
        createExamTimetable(
          payload,
          currentUser?.id,
          currentUser?.role,
          facultyDeptId
        );
        setSuccessToast(`Exam "${formData.subject}" scheduled successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmExam) return;
    try {
      deleteExamTimetable(deleteConfirmExam.id, currentUser?.role);
      setSuccessToast(`Exam schedule "${deleteConfirmExam.subject}" deleted.`);
      setDeleteConfirmExam(null);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Get department name
  const getDept = (deptId) => departments.find(d => d.id === deptId);

  // Calculate total seats of assigned rooms
  const getAssignedCapacity = (roomIds = []) => {
    return exam_rooms
      .filter(r => roomIds.includes(r.id))
      .reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role permission scope note for faculty */}
      {isFaculty && (
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-blue-900">
                Department Timetable Control: {getDept(facultyDeptId)?.name || 'My Department'} ({getDept(facultyDeptId)?.code})
              </p>
              <p className="text-blue-700">
                You have write access to schedule and update exams for your department. Deletions are restricted to the Institutional Administrator.
              </p>
            </div>
          </div>
          <Badge variant="primary" size="lg">
            {myDeptExams} Department Exams
          </Badge>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by subject, date (YYYY-MM-DD), hall..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sem:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="All">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Exam Schedule Button */}
        {(isAdmin || isFaculty) && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all duration-150 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Schedule Exam
          </button>
        )}
      </div>

      {/* Exam Timetable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => {
          const dept = getDept(exam.department_id);
          const totalAssignedSeats = getAssignedCapacity(exam.room_ids);
          const canManage = isAdmin || (isFaculty && exam.department_id === facultyDeptId);

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Header: Dept & Sem badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary" size="sm">
                      {dept?.code || 'DEPT'} • Sem {exam.semester}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                      {exam.exam_type || 'Theory'}
                    </span>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(exam)}
                        className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                        title="Edit Exam"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setFormError('');
                            setDeleteConfirmExam(exam);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject Title */}
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                  {exam.subject}
                </h4>

                {/* Date and Time Bar */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      {new Date(exam.exam_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTimeRange(exam.start_time, exam.end_time)}
                    </span>
                  </div>

                  {/* Rooms assigned */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                      Venues:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {exam.rooms && exam.rooms.length > 0 ? (
                        exam.rooms.map((rName, i) => (
                          <span
                            key={i}
                            className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md text-[11px]"
                          >
                            {rName}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">Hall TBD</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multi-room capacity summary */}
                {exam.room_ids && exam.room_ids.length > 1 && (
                  <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900 font-semibold">
                    <span>Multi-Hall Allocation:</span>
                    <span>{exam.room_ids.length} Rooms • {totalAssignedSeats} Total Seats</span>
                  </div>
                )}
              </div>

              {/* Footer with Audit info */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>By: {users.find(u => u.id === exam.created_by)?.name || 'Unknown'}</span>
                <span>Updated: {new Date(exam.updated_at || exam.created_at || '2026-09-01').toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}

        {filteredExams.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Exam Timetables Found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || selectedDept !== 'All' || selectedSemester !== 'All'
                ? 'Try adjusting your filters or search keywords.'
                : 'Click "Schedule Exam" to publish your first timetable slot.'}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExam ? `Edit Exam: ${editingExam.subject}` : 'Schedule New Examination'}
        subtitle="Specify subject, exam timing, department, semester, and designated hall(s)."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Quick pick from courses */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Enrolled Course (Auto-fills details)
            </label>
            <select
              onChange={(e) => handleCourseSelect(e.target.value)}
              value={formData.course_id}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Choose Course to Auto-Fill --</option>
              {courses
                .filter(c => !isFaculty || c.department_id === facultyDeptId)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name} (Sem {c.semester})
                  </option>
                ))}
            </select>
          </div>

          {/* Subject Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Exam Subject / Course Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. CS301 - Data Structures & Algorithms"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                disabled={isFaculty}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 disabled:opacity-75 disabled:bg-slate-100"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semester <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Session Type
              </label>
              <select
                value={formData.exam_type}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="Mid-Semester Theory">Mid-Semester Theory</option>
                <option value="End-Semester Theory">End-Semester Theory</option>
                <option value="Laboratory / Practical">Laboratory / Practical</option>
                <option value="Internal Assessment">Internal Assessment (IA)</option>
              </select>
            </div>
          </div>

          {/* Date and Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Exam Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                required
              />
            </div>
          </div>

          {/* Assigned Examination Halls (Multiple Rooms supported if students exceed 1 room) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Designated Exam Rooms / Halls (Support Multiple Rooms)
              </label>
              <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                Selected: {formData.room_ids.length} Room(s) • Total Capacity: {getAssignedCapacity(formData.room_ids)} Seats
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-44 overflow-y-auto">
              {exam_rooms.map(room => {
                const isSelected = formData.room_ids.includes(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleToggleRoom(room.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{room.name}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
                        Cap: {room.capacity} Seats
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Select multiple halls if the total candidate count exceeds a single room's capacity.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              {editingExam ? 'Save Schedule' : 'Publish Timetable'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmExam)}
        onClose={() => setDeleteConfirmExam(null)}
        title="Confirm Exam Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete exam schedule <strong className="text-slate-900">{deleteConfirmExam?.subject}</strong> on {deleteConfirmExam?.exam_date}?
            Associated seating arrangements will also be removed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setDeleteConfirmExam(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              Yes, Delete Exam
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
