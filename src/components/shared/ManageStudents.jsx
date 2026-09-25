import React, { useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Lock,
  Sparkles,
  Layers,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function ManageStudents() {
  const { currentUser } = useAuth();
  const { users, departments, createStudent, updateStudent, deleteStudent } = useData();

  const isAdmin = currentUser?.role === 'admin';
  const isFaculty = currentUser?.role === 'faculty';

  // Determine scoped department for faculty
  const facultyDeptId = currentUser?.department_id || 'dept_cse';
  const facultyDept = departments.find(d => d.id === facultyDeptId);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(isAdmin ? 'all' : facultyDeptId);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    email: '',
    department_id: isAdmin ? (departments[0]?.id || 'dept_cse') : facultyDeptId,
    semester: 5,
    section: 'A',
    phone: '',
    status: 'active'
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // USN Regex Validator: 1XX00XX000
  const USN_REGEX = /^1[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;

  // Base list of students
  const allStudents = users.filter(u => u.role === 'student');

  // Scoped list
  const scopedStudents = allStudents.filter(st => {
    // Faculty can only view students in their own department
    if (isFaculty && st.department_id !== facultyDeptId) {
      return false;
    }
    // Admin department filter
    if (isAdmin && selectedDeptFilter !== 'all' && st.department_id !== selectedDeptFilter) {
      return false;
    }
    // Section filter
    if (selectedSectionFilter !== 'all' && st.section !== selectedSectionFilter) {
      return false;
    }
    // Semester filter
    if (selectedSemesterFilter !== 'all' && String(st.semester) !== String(selectedSemesterFilter)) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const stUSN = (st.usn || st.roll_no || '').toLowerCase();
      const stName = (st.name || '').toLowerCase();
      const stEmail = (st.email || '').toLowerCase();
      return stName.includes(q) || stUSN.includes(q) || stEmail.includes(q);
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      usn: '',
      email: '',
      department_id: isAdmin ? (departments[0]?.id || 'dept_cse') : facultyDeptId,
      semester: 5,
      section: 'A',
      phone: '+1 (555) 014-0000',
      status: 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      usn: student.usn || student.roll_no || '',
      email: student.email,
      department_id: student.department_id || (isAdmin ? 'dept_cse' : facultyDeptId),
      semester: student.semester || 5,
      section: student.section || 'A',
      phone: student.phone || '',
      status: student.status || 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleUSNChange = (e) => {
    // Auto-uppercase USN as user inputs
    const upperValue = e.target.value.toUpperCase().replace(/\s+/g, '');
    setFormData(prev => ({ ...prev, usn: upperValue }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const formattedUSN = formData.usn.trim().toUpperCase();

    // 1. Validate USN Regex
    if (!USN_REGEX.test(formattedUSN)) {
      setFormError('USN must follow format 1XX00XX000 (1 digit + 2 letters + 2 digits + 2 letters + 3 digits, e.g. 1MJ23CD006).');
      return;
    }

    // 2. Validate Duplicate USN
    const duplicate = allStudents.find(
      s => s.id !== editingStudent?.id &&
      ((s.usn && s.usn.toUpperCase() === formattedUSN) || (s.roll_no && s.roll_no.toUpperCase() === formattedUSN))
    );
    if (duplicate) {
      setFormError(`Duplicate USN: "${formattedUSN}" is already registered to ${duplicate.name}.`);
      return;
    }

    // 3. Validate Email
    const duplicateEmail = users.find(
      u => u.id !== editingStudent?.id && u.email.toLowerCase() === formData.email.trim().toLowerCase()
    );
    if (duplicateEmail) {
      setFormError(`Email "${formData.email}" is already used by another account.`);
      return;
    }

    try {
      if (editingStudent) {
        updateStudent(editingStudent.id, {
          ...formData,
          usn: formattedUSN,
          roll_no: formattedUSN
        }, currentUser?.id);
        setSuccessToast(`Student record for ${formData.name} updated successfully.`);
      } else {
        createStudent({
          ...formData,
          usn: formattedUSN,
          roll_no: formattedUSN
        }, currentUser?.id);
        setSuccessToast(`Student ${formData.name} (${formattedUSN}) enrolled successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmStudent) return;
    if (!isAdmin) {
      alert('Only Administrators have permission to delete student records.');
      return;
    }

    try {
      deleteStudent(deleteConfirmStudent.id, currentUser?.role);
      setSuccessToast(`Student ${deleteConfirmStudent.name} was removed from the roster.`);
      setDeleteConfirmStudent(null);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      alert(err.message || 'Delete operation failed.');
    }
  };

  const getCreatorName = (authorId) => {
    if (!authorId) return 'Registrar Admin';
    const creator = users.find(u => u.id === authorId);
    return creator ? creator.name : authorId;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              Student Directory & USN Roster
            </h2>
            {isFaculty && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-brand-600" />
                {facultyDept?.code || 'CSE'} Department Scoped
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Institutional access: View, provision, edit, and delete student credentials across all university departments.'
              : `Faculty access: View, provision, and edit students within ${facultyDept?.name || 'your department'}.`}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, USN (1XX00XX000), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Department Filter (Admin only) */}
          {isAdmin && (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          )}

          {/* Section Filter */}
          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          {/* Semester Filter */}
          <select
            value={selectedSemesterFilter}
            onChange={(e) => setSelectedSemesterFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Student Profile</th>
                <th className="px-6 py-3.5">Verified USN</th>
                <th className="px-6 py-3.5">Department & Track</th>
                <th className="px-6 py-3.5">Class / Section</th>
                <th className="px-6 py-3.5">Audit Trail</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {scopedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    No student records match the active criteria or department scope.
                  </td>
                </tr>
              ) : (
                scopedStudents.map((student) => {
                  const dept = departments.find(d => d.id === student.department_id);
                  const displayUSN = student.usn || student.roll_no || '1MS22CS100';
                  const updatedDate = student.updated_at
                    ? new Date(student.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Initial';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                            <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* USN Badge */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white tracking-wider shadow-2xs">
                          {displayUSN}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{dept?.code || 'CSE'}</p>
                        <p className="text-slate-500 text-[11px] line-clamp-1">{dept?.name || 'Engineering'}</p>
                      </td>

                      {/* Semester / Section */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 font-bold text-xs border border-brand-200">
                          Sem {student.semester || 5} • Sec {student.section || 'A'}
                        </span>
                      </td>

                      {/* Audit Trail Info */}
                      <td className="px-6 py-4">
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p>
                            <span className="text-slate-400 font-medium">Created:</span>{' '}
                            <strong className="text-slate-700">{getCreatorName(student.created_by)}</strong>
                          </p>
                          <p>
                            <span className="text-slate-400 font-medium">Updated:</span>{' '}
                            <strong className="text-slate-700">{getCreatorName(student.updated_by)}</strong> ({updatedDate})
                          </p>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit Student Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {isAdmin ? (
                            <button
                              onClick={() => setDeleteConfirmStudent(student)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Student Record (Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                              title="Delete restricted to Administrators"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Enroll New Student'}
        subtitle="Manage student academic credentials, university registration number (USN), and class assignment."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alice Smith"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* USN with validation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>University Seat No. (USN) *</span>
                <span className="text-[10px] text-slate-400 font-mono">1XX00XX000</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.usn}
                onChange={handleUSNChange}
                placeholder="e.g. 1MJ23CD006"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Format: 1 digit + 2 letters + 2 digits + 2 letters + 3 digits
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. asmith@campusnex.edu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Department *
              </label>
              {isAdmin ? (
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{facultyDept?.name || 'Computer Science & Engineering'} ({facultyDept?.code || 'CSE'})</span>
                  <span className="text-[10px] text-slate-400 font-semibold">(Your Dept)</span>
                </div>
              )}
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semester (Term) *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Class Section *
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
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Audit metadata recorded automatically
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
                className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
              >
                {editingStudent ? 'Save Changes' : 'Register Student'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Admin Only) */}
      <Modal
        isOpen={Boolean(deleteConfirmStudent)}
        onClose={() => setDeleteConfirmStudent(null)}
        title="Confirm Student Deletion"
        subtitle="This action permanently removes the student account and associated enrollment records."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <p className="font-bold text-rose-900">Are you sure you want to delete this record?</p>
            <p><strong>Student:</strong> {deleteConfirmStudent?.name}</p>
            <p><strong>USN:</strong> {deleteConfirmStudent?.usn || deleteConfirmStudent?.roll_no}</p>
            <p><strong>Email:</strong> {deleteConfirmStudent?.email}</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmStudent(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm Permanent Delete</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
