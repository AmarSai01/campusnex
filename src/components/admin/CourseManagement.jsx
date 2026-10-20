import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Users,
  Briefcase,
  Layers,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Search,
  UserPlus
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { studentMatchesCourse } from '../../utils/enrollment';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const FILTER_KEY = 'campusnex.curriculum.filter';

// Remember the last department and semester while the admin moves between tabs.
const readFilter = () => {
  try {
    return JSON.parse(sessionStorage.getItem(FILTER_KEY)) || {};
  } catch {
    return {};
  }
};
const writeFilter = (value) => {
  try {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode); the filter just isn't remembered.
  }
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function CourseManagement() {
  const { courses, users, departments, enrollments, createCourse, updateCourse, assignFacultyToCourse, setCourseEnrollments } = useData();

  const facultyList = users.filter(u => u.role === 'faculty' && u.status === 'active');

  const inDept = (course, deptId) => deptId === 'all' || course.department_id === deptId;
  const countFor = (deptId, sem) =>
    courses.filter(c => inDept(c, deptId) && (sem === 'all' || Number(c.semester) === Number(sem))).length;
  const semestersWithCourses = (deptId) =>
    [...new Set(courses.filter(c => inDept(c, deptId)).map(c => Number(c.semester)))].sort((a, b) => a - b);

  const [filter, setFilter] = useState(readFilter);
  const fallbackDept = departments.find(d => countFor(d.id, 'all') > 0)?.id || departments[0]?.id || '';
  const deptFilter = filter.dept === 'all' || departments.some(d => d.id === filter.dept) ? filter.dept : fallbackDept;
  const deptCodeOf = (id) => departments.find(d => d.id === id)?.code || '—';
  const semFilter = filter.sem === 'all' || SEMESTERS.includes(Number(filter.sem))
    ? (filter.sem === 'all' ? 'all' : Number(filter.sem))
    : (semestersWithCourses(deptFilter)[0] || 1);

  const updateFilter = (next) => {
    setFilter(next);
    writeFilter(next);
  };
  const handleDeptChange = (deptId) => {
    updateFilter({ dept: deptId, sem: semestersWithCourses(deptId)[0] || 1 });
  };

  const visibleCourses = courses
    .filter(c => inDept(c, deptFilter) && (semFilter === 'all' || Number(c.semester) === semFilter))
    .sort((a, b) =>
      deptCodeOf(a.department_id).localeCompare(deptCodeOf(b.department_id)) ||
      Number(a.semester) - Number(b.semester) ||
      String(a.section).localeCompare(String(b.section)) ||
      String(a.code).localeCompare(String(b.code))
    );
  const courseGroups = visibleCourses.reduce((groups, course) => {
    const parts = [];
    if (deptFilter === 'all') parts.push(deptCodeOf(course.department_id));
    if (semFilter === 'all') parts.push(`Semester ${course.semester}`);
    parts.push(`Section ${course.section || '—'}`);
    const key = parts.join(' · ');
    (groups[key] = groups[key] || []).push(course);
    return groups;
  }, {});
  const unassignedCount = visibleCourses.filter(c => !users.some(u => u.id === c.faculty_id)).length;
  const selectedDept = departments.find(d => d.id === deptFilter);
  const deptLabel = deptFilter === 'all' ? 'All departments' : selectedDept?.code || 'this department';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department_id: departments[0]?.id || '',
    faculty_id: '',
    semester: 1,
    section: 'A',
    credits: 4,
    color: '#4f46e5',
    description: ''
  });

  const [formError, setFormError] = useState('');
  const [reassignModalCourse, setReassignModalCourse] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      department_id: deptFilter === 'all' ? departments[0]?.id || '' : deptFilter,
      faculty_id: '',
      semester: semFilter === 'all' ? (semestersWithCourses(deptFilter)[0] || 1) : semFilter,
      section: 'A',
      credits: 4,
      color: '#4f46e5',
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      department_id: course.department_id,
      faculty_id: course.faculty_id || '',
      semester: course.semester,
      section: course.section,
      credits: course.credits ?? '',
      color: course.color || '#4f46e5',
      description: course.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = formData.code.trim().toUpperCase();
    if (!code || !formData.name.trim()) {
      setFormError('Course code and title are required.');
      return;
    }
    if (!formData.department_id) {
      setFormError('Choose a department. Add one in Manage Departments first if the list is empty.');
      return;
    }
    const credits = Number(formData.credits);
    if (formData.credits === '' || !Number.isInteger(credits) || credits < 0 || credits > 10) {
      setFormError('Credits must be a whole number from 0 to 10. Use 0 for non-credit courses like PE or NSS.');
      return;
    }
    const duplicate = courses.find(c =>
      c.id !== editingCourse?.id &&
      (c.code || '').toUpperCase() === code &&
      c.department_id === formData.department_id &&
      Number(c.semester) === Number(formData.semester) &&
      c.section === formData.section
    );
    if (duplicate) {
      setFormError(`${code} already exists for Sem ${formData.semester} Sec ${formData.section} in this department.`);
      return;
    }
    const payload = { ...formData, code, name: formData.name.trim(), credits };
    if (editingCourse) {
      updateCourse(editingCourse.id, payload);
    } else {
      createCourse(payload);
    }
    setIsModalOpen(false);
  };

  const [enrolCourse, setEnrolCourse] = useState(null);
  const [enrolSelection, setEnrolSelection] = useState(new Set());
  const [enrolSearch, setEnrolSearch] = useState('');
  const [enrolAllDepartments, setEnrolAllDepartments] = useState(false);

  const handleOpenEnrolModal = (course) => {
    setEnrolCourse(course);
    setEnrolSelection(new Set(enrollments.filter(e => e.course_id === course.id).map(e => e.student_id)));
    setEnrolSearch('');
    setEnrolAllDepartments(false);
  };

  const toggleEnrolStudent = (studentId) => {
    setEnrolSelection(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleSaveEnrolments = () => {
    setCourseEnrollments(enrolCourse.id, [...enrolSelection]);
    setEnrolCourse(null);
  };

  const enrolCandidates = enrolCourse
    ? users
        .filter(u => u.role === 'student' && u.status !== 'inactive')
        .filter(u => enrolAllDepartments || u.department_id === enrolCourse.department_id || enrolSelection.has(u.id))
        .filter(u => {
          const q = enrolSearch.trim().toLowerCase();
          return !q || u.name.toLowerCase().includes(q) || (u.usn || '').toLowerCase().includes(q);
        })
        .sort((a, b) =>
          Number(studentMatchesCourse(b, enrolCourse)) - Number(studentMatchesCourse(a, enrolCourse)) ||
          (a.usn || a.name).localeCompare(b.usn || b.name)
        )
    : [];
  const matchingIds = enrolCourse
    ? users.filter(u => studentMatchesCourse(u, enrolCourse)).map(u => u.id)
    : [];

  const handleOpenReassignModal = (course) => {
    setReassignModalCourse(course);
    setSelectedFacultyId(course.faculty_id || facultyList[0]?.id || '');
  };

  const handleConfirmReassign = () => {
    if (reassignModalCourse && selectedFacultyId) {
      assignFacultyToCourse(reassignModalCourse.id, selectedFacultyId);
      setReassignModalCourse(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            Curriculum & Faculty Course Mapping
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pick a department and semester to see and add its subjects.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>
      </div>

      {departments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Add a department first"
          description="Courses belong to a department and semester. Create departments in Manage Departments, then add their subjects here."
        />
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              1 · Department
              <select
                value={deptFilter}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All departments — {plural(courses.length, 'course')}</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.code} · {d.name} — {plural(countFor(d.id, 'all'), 'course')}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              2 · Semester
              <select
                value={semFilter}
                onChange={(e) => updateFilter({ dept: deptFilter, sem: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All semesters — {plural(countFor(deptFilter, 'all'), 'course')}</option>
                {SEMESTERS.map(sem => {
                  const n = countFor(deptFilter, sem);
                  return (
                    <option key={sem} value={sem}>
                      Semester {sem} — {n ? plural(n, 'course') : 'no courses'}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
          {visibleCourses.length > 0 && (
            <p className="mt-3 text-xs text-slate-500" aria-live="polite">
              <span className="font-bold text-slate-800">
                {semFilter === 'all' ? 'All semesters' : `Sem ${semFilter}`} · {deptLabel}:
              </span>{' '}
              {plural(visibleCourses.length, 'course')}, {visibleCourses.length - unassignedCount} with a teacher
              {unassignedCount > 0 && <span className="font-semibold text-amber-700">, {unassignedCount} unassigned</span>}
            </p>
          )}
        </div>
      )}

      {departments.length > 0 && visibleCourses.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={`No courses for ${deptLabel}${semFilter === 'all' ? '' : ` Sem ${semFilter}`} yet`}
          description="Add the subjects this class takes. Matching students are enrolled automatically."
          actionLabel="Add Course"
          onAction={handleOpenCreateModal}
        />
      )}

      {Object.entries(courseGroups).map(([groupLabel, groupCourses]) => (
      <section key={groupLabel} aria-label={groupLabel} className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {groupLabel} · {plural(groupCourses.length, 'course')}
        </h3>
      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groupCourses.map((course) => {
          const faculty = users.find(u => u.id === course.faculty_id);
          const dept = departments.find(d => d.id === course.department_id);
          const enrolledCount = enrollments.filter(e => e.course_id === course.id).length;

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                      style={{ backgroundColor: course.color || '#4f46e5' }}
                    />
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                      {course.code}
                    </span>
                  </div>
                  <Badge variant="primary" size="sm">
                    Sec {course.section} • Sem {course.semester}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-1">
                  {course.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {course.description || 'Core engineering syllabus module.'}
                </p>

                {/* Course Details Info */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Department:</span>
                    <span className="font-bold text-slate-700">{dept?.code || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Enrolled Students:</span>
                    <span className="font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50">
                      {enrolledCount} Active
                    </span>
                  </div>
                </div>

                {/* Assigned Faculty Box */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={faculty?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${faculty?.name || 'Faculty'}`}
                      alt={faculty?.name || 'Faculty'}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                    />
                    <div className="truncate">
                      {faculty ? (
                        <p className="text-xs font-bold text-slate-900 truncate">{faculty.name}</p>
                      ) : (
                        <span className="inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                          No teacher yet
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400 truncate">
                        {faculty?.designation || 'Instructor'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenReassignModal(course)}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-center cursor-pointer"
                >
                  Change Instructor
                </button>
                <button
                  onClick={() => handleOpenEnrolModal(course)}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-center cursor-pointer"
                >
                  Enrol Students
                </button>
                <button
                  onClick={() => handleOpenEditModal(course)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Edit Course Details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </section>
      ))}

      {/* Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.code}` : 'Add New Academic Course'}
        subtitle="Specify curriculum details, department ownership, and initial instructor."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS304"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Computer Networks"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                disabled={!editingCourse && deptFilter !== 'all'}
                title={!editingCourse && deptFilter !== 'all' ? 'Set by the department picked above' : undefined}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign Instructor
              </label>
              <select
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">-- Unassigned --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name}{f.designation ? ` (${f.designation})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  disabled={!editingCourse && semFilter !== 'all'}
                  title={!editingCourse && semFilter !== 'all' ? 'Set by the semester picked above' : undefined}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {SEMESTERS.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label htmlFor="course-credits" className="block text-xs font-bold text-slate-700 mb-1">
                  Credits for this subject *
                </label>
                <input
                  id="course-credits"
                  type="number"
                  required
                  min={0}
                  max={10}
                  step={1}
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value === '' ? '' : Number(e.target.value) })}
                  aria-describedby="course-credits-hint"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <p id="course-credits-hint" className="sm:col-span-2 -mt-2 text-[11px] text-slate-500">
              {!editingCourse && deptFilter !== 'all' && semFilter !== 'all'
                ? `Adding to ${selectedDept?.code} Semester ${semFilter}. Use 0 credits for non-credit courses like PE, NSS or Yoga.`
                : 'Use 0 credits for non-credit courses like PE, NSS or Yoga.'}
            </p>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Course Scope
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Key topics, syllabus outline, lab requirements..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign Faculty Modal */}
      <Modal
        isOpen={Boolean(reassignModalCourse)}
        onClose={() => setReassignModalCourse(null)}
        title={`Reassign Instructor: ${reassignModalCourse?.code}`}
        subtitle="Assign a new faculty member to this subject. Security rules and grading access will update automatically."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p><strong className="text-slate-800">Course:</strong> {reassignModalCourse?.name} (Sec {reassignModalCourse?.section})</p>
            <p><strong className="text-slate-800">Current Faculty:</strong> {users.find(u => u.id === reassignModalCourse?.faculty_id)?.name || 'Unassigned'}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select New Faculty Member *
            </label>
            <div className="space-y-2">
              {facultyList.map((f) => (
                <label
                  key={f.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFacultyId === f.id
                      ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="reassignFaculty"
                      value={f.id}
                      checked={selectedFacultyId === f.id}
                      onChange={() => setSelectedFacultyId(f.id)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{f.name}</p>
                      <p className="text-[11px] text-slate-500">{f.designation} • {f.office}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={() => setReassignModalCourse(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReassign}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Confirm Reassignment
            </button>
          </div>
        </div>
      </Modal>

      {/* Enrol Students Modal */}
      <Modal
        isOpen={Boolean(enrolCourse)}
        onClose={() => setEnrolCourse(null)}
        title={`Enrol Students: ${enrolCourse?.code || ''}`}
        subtitle="Tick the students who take this course. Unticking removes the enrolment; past attendance and marks are kept."
        maxWidth="max-w-lg"
      >
        {enrolCourse && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <span>
                <strong className="text-slate-800">{enrolCourse.name}</strong> · Sem {enrolCourse.semester} · Sec {enrolCourse.section}
              </span>
              <span className="font-bold text-emerald-700">{enrolSelection.size} selected</span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={enrolSearch}
                  onChange={(e) => setEnrolSearch(e.target.value)}
                  placeholder="Search name or USN"
                  aria-label="Search students"
                  className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setEnrolSelection(prev => new Set([...prev, ...matchingIds]))}
                disabled={matchingIds.length === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Select matching ({matchingIds.length})
              </button>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={enrolAllDepartments}
                onChange={(e) => setEnrolAllDepartments(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand-600"
              />
              Show students from all departments
            </label>

            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {enrolCandidates.length === 0 && (
                <li className="p-4 text-center text-xs text-slate-500">
                  No students found. Add students in Manage Students first.
                </li>
              )}
              {enrolCandidates.map((st) => (
                <li key={st.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={enrolSelection.has(st.id)}
                      onChange={() => toggleEnrolStudent(st.id)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-slate-900">{st.name}</span>
                      <span className="block text-[11px] text-slate-500">
                        {st.usn || '—'} · Sem {st.semester ?? '—'} · Sec {st.section ?? '—'}
                        {st.department_id !== enrolCourse.department_id &&
                          ` · ${departments.find(d => d.id === st.department_id)?.code || 'Other dept'}`}
                      </span>
                    </span>
                    {studentMatchesCourse(st, enrolCourse) && (
                      <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        Matches
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setEnrolCourse(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEnrolments}
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Enrolments
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
