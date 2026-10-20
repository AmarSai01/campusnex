import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  Edit2,
  BookOpen
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import LabBatchesPanel from './LabBatchesPanel';
import BatchTag from '../common/BatchTag';
import TimetableChangeLog from './TimetableChangeLog';
import { BATCHES, batchLabel } from '../../utils/batches';
import { classGroupKey, detectTimetableConflict } from '../../utils/conflictDetector';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { formatTimeRange } from '../../utils/time';

const DEFAULT_ROOMS = ['LH-101', 'LH-102', 'Lab-CSE-2', 'Seminar-Hall-1'];
const CLASS_KEY = 'campusnex.timetable.class';

// Remember the last class picked while the admin moves between tabs.
const readSelection = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CLASS_KEY)) || {};
  } catch {
    return {};
  }
};
const writeSelection = (value) => {
  try {
    sessionStorage.setItem(CLASS_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode); the class just isn't remembered.
  }
};

const countLabel = (n, word, plural = `${word}es`) => `${n} ${n === 1 ? word : plural}`;

// mode 'admin': every class. mode 'faculty': teachers edit slots of subjects they teach,
// HODs any slot in their department; admins are alerted of every change.
export default function TimetableBuilder({ onNavigateTab, mode = 'admin' }) {
  const { timetable, courses: allCourses, users, departments: allDepartments, exam_rooms = [], saveTimetableSlot, deleteTimetableSlot } = useData();
  const { currentUser, hodDepartments = [] } = useAuth();
  const isAdminMode = mode === 'admin';
  const hodDeptIds = new Set(hodDepartments.map(d => d.id));
  const canEditCourse = (course) =>
    Boolean(course) && (
      isAdminMode ||
      course.faculty_id === currentUser?.id ||
      hodDeptIds.has(course.department_id)
    );
  // Teachers pick from the classes they can edit; the grid still shows the whole class.
  const courses = isAdminMode ? allCourses : allCourses.filter(canEditCourse);
  const departments = isAdminMode
    ? allDepartments
    : allDepartments.filter(d => courses.some(c => c.department_id === d.id));
  const [logRefresh, setLogRefresh] = useState(0);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const deptCode = (id) => departments.find(d => d.id === id)?.code || 'No dept';
  const classLabel = (c) => `${deptCode(c.department_id)} · Sem ${c.semester ?? '—'} · Sec ${c.section || '—'}`;

  // A class is one department + semester + section; each gets its own weekly grid.
  // Picked in three steps: department, then the semesters it has courses in, then their sections.
  const courseClassKey = new Map(courses.map(c => [c.id, classGroupKey(c)]));
  const slotsMatching = (deptId, sem, section) => timetable.filter(slot => {
    const course = allCourses.find(c => c.id === slot.course_id);
    return course &&
      course.department_id === deptId &&
      (sem == null || Number(course.semester) === Number(sem)) &&
      (section == null || course.section === section);
  }).length;
  const semestersOf = (deptId) =>
    [...new Set(courses.filter(c => c.department_id === deptId && c.semester != null).map(c => Number(c.semester)))]
      .sort((a, b) => a - b);
  const sectionsOf = (deptId, sem) =>
    [...new Set(courses
      .filter(c => c.department_id === deptId && Number(c.semester) === Number(sem) && c.section)
      .map(c => c.section))].sort();

  const [selection, setSelection] = useState(readSelection);
  const fallbackDept = departments.find(d => semestersOf(d.id).length > 0)?.id || departments[0]?.id || '';
  const deptId = departments.some(d => d.id === selection.dept) ? selection.dept : fallbackDept;
  const semOptions = semestersOf(deptId);
  const semester = semOptions.includes(Number(selection.sem)) ? Number(selection.sem) : semOptions[0] ?? null;
  const sectionOptions = semester == null ? [] : sectionsOf(deptId, semester);
  const section = sectionOptions.includes(selection.sec) ? selection.sec : sectionOptions[0] ?? null;
  const activeGroup = section ? classGroupKey({ department_id: deptId, semester, section }) : '';
  const activeGroupLabel = section ? `${deptCode(deptId)} · Sem ${semester} · Sec ${section}` : '';

  const updateSelection = (next) => {
    setSelection(next);
    writeSelection(next);
  };
  const [selectedDay, setSelectedDay] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [confirmRequest, setConfirmRequest] = useState(null);

  const roomsList = [...new Set([
    ...DEFAULT_ROOMS,
    ...exam_rooms.map(r => r.room_number || r.name).filter(Boolean),
    ...timetable.map(s => s.room).filter(Boolean)
  ])];

  const facultyList = users.filter(u => u.role === 'faculty' && u.status !== 'inactive');
  const groupCourses = courses.filter(c => classGroupKey(c) === activeGroup);
  const classCourses = allCourses.filter(c => classGroupKey(c) === activeGroup);
  const [modalGroup, setModalGroup] = useState('');
  const modalCourses = courses.filter(c => classGroupKey(c) === modalGroup);

  const [formData, setFormData] = useState({
    course_id: '',
    faculty_id: '',
    batch: '',
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    room: DEFAULT_ROOMS[0]
  });

  const [conflictWarning, setConflictWarning] = useState(null);
  const [formError, setFormError] = useState('');

  const courseById = (id) => allCourses.find(c => c.id === id);

  // Section always follows the course, so a slot can't land in the wrong class grid.
  const withSection = (data) => ({
    ...data,
    section: courseById(data.course_id)?.section || null,
    batch: data.batch || null
  });

  const checkConflict = (candidate, slotId) => {
    const result = detectTimetableConflict({ ...withSection(candidate), id: slotId }, timetable, allCourses, users);
    setConflictWarning(result.hasConflict ? result.conflicts : null);
    return result.hasConflict;
  };

  const openModal = (slot) => {
    const initialCourse = slot ? courseById(slot.course_id) : groupCourses[0];
    if (!initialCourse) return;
    // The form only offers the subjects of the class being scheduled.
    setModalGroup(courseClassKey.get(initialCourse.id) || activeGroup);
    const next = slot
      ? {
          course_id: slot.course_id,
          faculty_id: slot.faculty_id || '',
          batch: slot.batch || '',
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          room: slot.room
        }
      : {
          course_id: initialCourse?.id || '',
          faculty_id: initialCourse?.faculty_id || '',
          batch: '',
          day_of_week: selectedDay !== 'All' ? selectedDay : 'Monday',
          start_time: '09:00',
          end_time: '10:00',
          room: DEFAULT_ROOMS[0]
        };
    setEditingSlot(slot || null);
    setFormData(next);
    setFormError('');
    checkConflict(next, slot?.id);
    setIsModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    if (field === 'course_id') {
      updated.faculty_id = courseById(value)?.faculty_id || (isAdminMode ? formData.faculty_id : '');
    }
    setFormData(updated);
    setFormError('');
    checkConflict(updated, editingSlot?.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.course_id) {
      setFormError('Choose a course.');
      return;
    }
    if (formData.end_time <= formData.start_time) {
      setFormError('End time must be after the start time.');
      return;
    }
    if (checkConflict(formData, editingSlot?.id)) return;

    saveTimetableSlot({ ...withSection(formData), id: editingSlot?.id });
    const course = courseById(formData.course_id);
    if (course) updateSelection({ dept: course.department_id, sem: Number(course.semester), sec: course.section });
    setIsModalOpen(false);
    setLogRefresh(n => n + 1);
  };

  const handleDelete = (slot, course) => {
    setConfirmRequest({
      title: 'Remove this class?',
      message: `${course ? `${course.code}: ${course.name}` : 'This class'} on ${slot.day_of_week}, ${formatTimeRange(slot.start_time, slot.end_time)}, will be removed from the timetable.`,
      confirmLabel: 'Remove class',
      onConfirm: () => {
        deleteTimetableSlot(slot.id);
        setLogRefresh(n => n + 1);
      }
    });
  };

  const groupSlots = timetable.filter(s => {
    const course = courseById(s.course_id);
    return course && classGroupKey(course) === activeGroup;
  });
  const teacherlessCount = classCourses.filter(c => !users.some(u => u.id === c.faculty_id)).length;
  const modalClassLabel = modalCourses[0] ? classLabel(modalCourses[0]) : '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            {isAdminMode ? 'Timetable Builder & Conflict Engine' : 'Edit Class Timetables'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdminMode
              ? 'Build weekly class grids with real-time faculty double-booking and room overlap prevention.'
              : hodDepartments.length > 0
                ? 'Change slots for your subjects and your department. Admins are notified of every change.'
                : 'Change slots for the subjects you teach. Admins are notified of every change.'}
          </p>
        </div>

        <button
          onClick={() => openModal(null)}
          disabled={groupCourses.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Class Slot</span>
        </button>
      </div>

      {courses.length === 0 ? (
        isAdminMode ? (
          <EmptyState
            icon={BookOpen}
            title="Add courses first"
            description="Timetable slots are built from courses. Create a course with its department, semester and section, then schedule it here."
            actionLabel={onNavigateTab ? 'Go to Curriculum & Courses' : undefined}
            onAction={onNavigateTab ? () => onNavigateTab('courses') : undefined}
          />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No subjects assigned to you yet"
            description="Once an admin assigns you a subject, you can change its timetable slots here."
          />
        )
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block text-xs font-bold text-slate-700">
                1 · Department
                <select
                  value={deptId}
                  onChange={(e) => updateSelection({ dept: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                >
                  {departments.map(d => {
                    const hasCourses = semestersOf(d.id).length > 0;
                    const n = slotsMatching(d.id);
                    return (
                      <option key={d.id} value={d.id}>
                        {d.code} · {d.name} — {hasCourses ? `${countLabel(n, 'class')} a week` : 'no courses'}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700">
                2 · Semester
                <select
                  value={semester ?? ''}
                  onChange={(e) => updateSelection({ dept: deptId, sem: Number(e.target.value) })}
                  disabled={semOptions.length === 0}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {semOptions.length === 0 && <option value="">No semesters with courses</option>}
                  {semOptions.map(sem => (
                    <option key={sem} value={sem}>
                      Semester {sem} — {countLabel(slotsMatching(deptId, sem), 'class')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700">
                3 · Section
                <select
                  value={section ?? ''}
                  onChange={(e) => updateSelection({ dept: deptId, sem: semester, sec: e.target.value })}
                  disabled={sectionOptions.length === 0}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {sectionOptions.length === 0 && <option value="">—</option>}
                  {sectionOptions.map(sec => (
                    <option key={sec} value={sec}>
                      Section {sec} — {countLabel(slotsMatching(deptId, semester, sec), 'class')}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeGroup && (
              <p className="text-xs text-slate-500" aria-live="polite">
                <span className="font-bold text-slate-800">{activeGroupLabel}:</span>{' '}
                {countLabel(groupSlots.length, 'class')} a week, {countLabel(classCourses.length, 'subject', 'subjects')}
                {teacherlessCount > 0 && (
                  <span className="font-semibold text-amber-700">, {teacherlessCount} without a teacher</span>
                )}
              </p>
            )}

            {isAdminMode && activeGroup && (
              <LabBatchesPanel deptId={deptId} semester={semester} section={section} classLabel={activeGroupLabel} />
            )}

            {/* Day Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', ...daysOfWeek].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  aria-pressed={selectedDay === day}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedDay === day
                      ? day === 'All' ? 'bg-slate-900 text-white' : 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day === 'All' ? 'All Week' : day}
                </button>
              ))}
            </div>
          </div>

          {!activeGroup && (
            <EmptyState
              icon={BookOpen}
              title={`No courses in ${deptCode(deptId)} yet`}
              description="Add this department's subjects with their semester and section, then schedule them here."
              actionLabel={onNavigateTab ? 'Go to Curriculum & Courses' : undefined}
              onAction={onNavigateTab ? () => onNavigateTab('courses') : undefined}
            />
          )}

          {activeGroup && groupSlots.length === 0 && (
            <EmptyState
              icon={Calendar}
              title={`No classes scheduled for ${activeGroupLabel} yet`}
              description={`This class has ${countLabel(classCourses.length, 'subject', 'subjects')} ready to schedule.`}
              actionLabel="Schedule Class Slot"
              onAction={() => openModal(null)}
            />
          )}

          {/* Timetable Weekly Grid / List */}
          {groupSlots.length > 0 && (
          <div className="space-y-6">
            {(selectedDay === 'All' ? daysOfWeek : [selectedDay]).map((day) => {
              const daySlots = groupSlots
                .filter(s => s.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              if (selectedDay === 'All' && day === 'Saturday' && daySlots.length === 0) return null;

              return (
                <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-600" />
                      <h3 className="font-extrabold text-sm text-slate-900">{day}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  <div className="p-4 sm:p-6">
                    {daySlots.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs font-medium">
                        No classes scheduled for {day} in {activeGroupLabel}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {daySlots.map((slot) => {
                          const course = courseById(slot.course_id);
                          const faculty = users.find(u => u.id === slot.faculty_id);

                          return (
                            <div
                              key={slot.id}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-300 hover:shadow-card transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 whitespace-nowrap tabular-nums">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeRange(slot.start_time, slot.end_time)}
                                  </span>
                                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 whitespace-nowrap">
                                    Room {slot.room}
                                  </span>
                                  <BatchTag batch={slot.batch} />
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

                              {canEditCourse(course) && (
                              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openModal(slot)}
                                  className="text-slate-400 hover:text-brand-600 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="Edit class"
                                  aria-label={`Edit ${course?.code || 'class'} on ${day}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(slot, course)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="Remove class"
                                  aria-label={`Remove ${course?.code || 'class'} on ${day}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              )}
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
          )}
        </>
      )}

      {isAdminMode && <TimetableChangeLog refreshKey={logRefresh} />}

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlot ? 'Edit Timetable Slot' : 'Schedule Timetable Slot'}
        subtitle={`For ${modalClassLabel}. Live conflict checking prevents double-booking faculty, classrooms and classes.${isAdminMode ? '' : ' Admins are notified when you save.'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

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
                onChange={(e) => handleInputChange('course_id', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {modalCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faculty Instructor
              </label>
              <select
                value={formData.faculty_id}
                onChange={(e) => handleInputChange('faculty_id', e.target.value)}
                disabled={!isAdminMode}
                title={!isAdminMode ? 'The subject\'s teacher. An admin can change it.' : undefined}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">-- Unassigned --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name}{f.designation ? ` (${f.designation})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="slot-batch" className="block text-xs font-bold text-slate-700 mb-1">
                Who attends
              </label>
              <select
                id="slot-batch"
                value={formData.batch}
                onChange={(e) => handleInputChange('batch', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Whole class</option>
                {BATCHES.map(b => (
                  <option key={b} value={b}>{batchLabel(b)} only (lab)</option>
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              {conflictWarning ? 'Resolve the conflict to save' : 'No schedule conflicts'}
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
                {editingSlot ? 'Save Changes' : 'Save Schedule Slot'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}
