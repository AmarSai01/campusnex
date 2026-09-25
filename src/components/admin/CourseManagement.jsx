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
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function CourseManagement() {
  const { courses, users, departments, enrollments, createCourse, updateCourse, assignFacultyToCourse } = useData();

  const facultyList = users.filter(u => u.role === 'faculty' && u.status === 'active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department_id: 'dept_cse',
    faculty_id: facultyList[0]?.id || '',
    semester: 5,
    section: 'A',
    credits: 4,
    color: '#4f46e5',
    description: ''
  });

  const [reassignModalCourse, setReassignModalCourse] = useState(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      code: 'CS304',
      name: 'Computer Networks & Security',
      department_id: 'dept_cse',
      faculty_id: facultyList[0]?.id || '',
      semester: 5,
      section: 'A',
      credits: 4,
      color: '#0284c7',
      description: 'TCP/IP architecture, socket programming, routing algorithms, cryptographic primitives.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      department_id: course.department_id,
      faculty_id: course.faculty_id,
      semester: course.semester,
      section: course.section,
      credits: course.credits || 4,
      color: course.color || '#4f46e5',
      description: course.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCourse) {
      updateCourse(editingCourse.id, formData);
    } else {
      createCourse(formData);
    }
    setIsModalOpen(false);
  };

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
            Configure academic courses, credit weightings, and assign faculty instructor permissions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => {
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
                    <span className="font-bold text-slate-700">{dept?.code || 'CSE'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Credits:</span>
                    <span className="font-bold text-slate-700">{course.credits || 4} Credits</span>
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
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {faculty?.name || 'Unassigned'}
                      </p>
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
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-center"
                >
                  Change Instructor
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

      {/* Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.code}` : 'Add New Academic Course'}
        subtitle="Specify curriculum details, department ownership, and initial instructor."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign Instructor *
              </label>
              <select
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Semester
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

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
    </div>
  );
}
