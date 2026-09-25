import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  Users,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function DepartmentManagement() {
  const { currentUser } = useAuth();
  const {
    departments,
    users,
    courses,
    createDepartment,
    updateDepartment,
    deleteDepartment
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteConfirmDept, setDeleteConfirmDept] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    head_faculty_id: '',
    description: ''
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const facultyList = users.filter(u => u.role === 'faculty' && u.status === 'active');

  const filteredDepartments = departments.filter(d => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormData({
      code: '',
      name: '',
      head_faculty_id: '',
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      head_faculty_id: dept.head_faculty_id || '',
      description: dept.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCodeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      code: e.target.value.toUpperCase().replace(/\s+/g, '')
    }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Department code is required (e.g. CSE, CD, ECE).');
      return;
    }

    try {
      if (editingDept) {
        updateDepartment(editingDept.id, {
          ...formData,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          head_faculty_id: formData.head_faculty_id || null
        });
        setSuccessToast(`Department ${formData.code} updated successfully.`);
      } else {
        createDepartment({
          ...formData,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          head_faculty_id: formData.head_faculty_id || null
        });
        setSuccessToast(`Department ${formData.code} created successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmDept) return;

    try {
      deleteDepartment(deleteConfirmDept.id, currentUser?.role);
      setSuccessToast(`Department ${deleteConfirmDept.code} was removed.`);
      setDeleteConfirmDept(null);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      alert(err.message || 'Delete operation failed.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            Academic Departments Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional departments, program codes, and faculty leadership assignments.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Department</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          {filteredDepartments.length} Departments Registered
        </span>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepartments.map((dept) => {
          const hod = users.find(u => u.id === dept.head_faculty_id);
          const deptFacultyCount = users.filter(u => u.department_id === dept.id && u.role === 'faculty').length;
          const deptStudentCount = users.filter(u => u.department_id === dept.id && u.role === 'student').length;
          const deptCoursesCount = courses.filter(c => c.department_id === dept.id).length;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs">
                    {dept.code}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {deptCoursesCount} Courses
                  </Badge>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3 line-clamp-1">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {dept.description || 'Undergraduate and postgraduate engineering degree programs.'}
                </p>

                {/* HOD Box */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                  <img
                    src={hod?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${hod?.name || dept.name}`}
                    alt={hod?.name || 'HOD'}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Head of Department (HOD)
                    </p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {hod ? hod.name : 'Not Appointed'}
                    </p>
                  </div>
                </div>

                {/* Stats summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong>{deptFacultyCount}</strong> Faculty</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong>{deptStudentCount}</strong> Students</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEditModal(dept)}
                  className="p-2 text-xs font-bold text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmDept(dept)}
                  className="p-2 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.code}` : 'Add New Academic Department'}
        subtitle="Specify official department name, unique degree code, and appointed leadership."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Artificial Intelligence & Machine Learning"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.code}
                onChange={handleCodeChange}
                placeholder="e.g. AIML"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase tracking-wider focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Head of Department (HOD)
              </label>
              <select
                value={formData.head_faculty_id}
                onChange={(e) => setFormData({ ...formData, head_faculty_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">-- Unassigned --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Program Description & Scope
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Core focus areas, laboratories, degree tracks..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
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
              {editingDept ? 'Save Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmDept)}
        onClose={() => setDeleteConfirmDept(null)}
        title={`Delete Department: ${deleteConfirmDept?.code}`}
        subtitle="This action is restricted to Administrators."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <p className="font-bold text-rose-900">Confirm Deletion</p>
            <p><strong>Department:</strong> {deleteConfirmDept?.name} ({deleteConfirmDept?.code})</p>
            <p className="text-slate-500 mt-2">
              Note: A department cannot be deleted if active students, faculty, or courses are currently linked to it.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmDept(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm Delete</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
