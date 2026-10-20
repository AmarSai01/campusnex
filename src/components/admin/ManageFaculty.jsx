import React, { useState } from 'react';
import { Briefcase, Plus, Upload, Search, Edit2, Power, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import FacultyImportModal from './FacultyImportModal';
import { CLASS_ROLES, FACULTY_DESIGNATIONS, classRoleText, weeklyHours } from '../../utils/faculty';

const OTHER = '__other__';
const HEAVY_LOAD_HOURS = 20;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const QUICK_FILTERS = {
  all: 'All',
  hod: 'HODs',
  class_teacher: 'Class teachers',
  class_coordinator: 'CCs',
  no_subjects: 'No subjects yet',
  no_account: 'Not signed in yet',
  inactive: 'Inactive'
};

const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none';
const selectClass = `${inputClass} font-semibold text-slate-700 bg-white`;

// Admin: every teacher with their subjects, weekly load, HOD and class responsibilities.
export default function ManageFaculty() {
  const {
    users, departments, courses, timetable, class_roles: classRoles = [],
    createUser, updateUser, assignClassRole, removeClassRole
  } = useData();
  const { currentUser } = useAuth();

  const [deptFilter, setDeptFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [quick, setQuick] = useState('all');
  const [notice, setNotice] = useState('');
  const [confirmRequest, setConfirmRequest] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [removedRoleIds, setRemovedRoleIds] = useState([]);
  const [newRole, setNewRole] = useState({ role: '', department_id: '', semester: '', section: '' });

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 5000);
  };

  const deptCode = (id) => departments.find(d => d.id === id)?.code || '—';
  const faculty = users.filter(u => u.role === 'faculty');
  const hodIds = new Set(departments.map(d => d.head_faculty_id).filter(Boolean));

  const subjectsOf = (id) => courses.filter(c => c.faculty_id === id);
  const rolesOf = (id) => classRoles.filter(r => r.faculty_id === id);

  const inDept = faculty.filter(f => deptFilter === 'all' || f.department_id === deptFilter);
  const rows = inDept
    .filter(f => {
      if (quick === 'inactive') return f.status === 'inactive';
      if (f.status === 'inactive') return false;
      if (quick === 'hod') return hodIds.has(f.id);
      if (quick === 'class_teacher' || quick === 'class_coordinator') return rolesOf(f.id).some(r => r.role === quick);
      if (quick === 'no_subjects') return subjectsOf(f.id).length === 0;
      if (quick === 'no_account') return !f.auth_id;
      return true;
    })
    .filter(f => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return f.name.toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q) ||
        subjectsOf(f.id).some(c => `${c.code} ${c.name}`.toLowerCase().includes(q));
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const activeInDept = inDept.filter(f => f.status !== 'inactive');
  const stats = [
    [activeInDept.length, 'Teachers'],
    [activeInDept.filter(f => hodIds.has(f.id)).length, 'HODs'],
    [activeInDept.filter(f => rolesOf(f.id).length > 0).length, 'Class teachers and CCs'],
    [activeInDept.filter(f => subjectsOf(f.id).length === 0).length, 'No subjects yet']
  ];

  // Classes that exist (from courses and students), for the responsibility pickers.
  const classRows = [
    ...courses,
    ...users.filter(u => u.role === 'student' && u.status !== 'inactive')
  ].filter(r => r.department_id && r.semester && r.section);
  const semestersFor = (deptId) =>
    [...new Set(classRows.filter(r => r.department_id === deptId).map(r => Number(r.semester)))].sort((a, b) => a - b);
  const sectionsFor = (deptId, sem) =>
    [...new Set(classRows.filter(r => r.department_id === deptId && Number(r.semester) === Number(sem)).map(r => r.section))].sort();

  const resetNewRole = (deptId) => {
    const sem = semestersFor(deptId)[0] ?? '';
    setNewRole({ role: '', department_id: deptId, semester: sem, section: sem === '' ? '' : sectionsFor(deptId, sem)[0] ?? '' });
  };

  const openForm = (teacher) => {
    const deptId = teacher?.department_id || (deptFilter !== 'all' ? deptFilter : departments[0]?.id || '');
    setEditing(teacher || null);
    setForm({
      name: teacher?.name || '',
      email: teacher?.email || '',
      department_id: deptId,
      designation: teacher?.designation || 'Assistant Professor',
      phone: teacher?.phone || '',
      office: teacher?.office || ''
    });
    setRemovedRoleIds([]);
    resetNewRole(deptId);
    setFormError('');
    setIsFormOpen(true);
  };

  const roleHolder = newRole.role && newRole.section
    ? classRoles.find(r =>
        r.role === newRole.role &&
        r.department_id === newRole.department_id &&
        Number(r.semester) === Number(newRole.semester) &&
        r.section === newRole.section &&
        !removedRoleIds.includes(r.id))
    : null;
  const holderIsSelf = roleHolder && editing && roleHolder.faculty_id === editing.id;
  const newRoleClass = newRole.section ? `${deptCode(newRole.department_id)} Sem ${newRole.semester} Sec ${newRole.section}` : '';

  const handleSave = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name) return setFormError('Enter the teacher\'s full name.');
    if (!EMAIL_REGEX.test(email)) return setFormError('Enter a valid email, like name@college.edu.');
    if (users.some(u => u.id !== editing?.id && (u.email || '').toLowerCase() === email)) {
      return setFormError('A user with this email already exists.');
    }
    if (!form.department_id) return setFormError('Choose a department.');
    if (newRole.role && !newRole.section) return setFormError('Pick the class for the responsibility, or choose None.');

    const fields = {
      name,
      email,
      role: 'faculty',
      department_id: form.department_id,
      designation: form.designation.trim() || null,
      phone: form.phone.trim(),
      office: form.office.trim()
    };

    let facultyId = editing?.id;
    if (editing) updateUser(editing.id, fields, currentUser?.id);
    else facultyId = createUser(fields, currentUser?.id).id;

    removedRoleIds.forEach(removeClassRole);
    if (newRole.role && !holderIsSelf) {
      assignClassRole({ ...newRole, faculty_id: facultyId });
    }

    setIsFormOpen(false);
    const roleNote = newRole.role && !holderIsSelf ? ` ${CLASS_ROLES[newRole.role].short} of ${newRoleClass}.` : '';
    showNotice(editing
      ? `${name} updated.${roleNote}`
      : `${name} added.${roleNote} They can sign in with ${email} once they set a password.`);
  };

  const askToggle = (teacher) => {
    const deactivating = teacher.status !== 'inactive';
    setConfirmRequest({
      title: deactivating ? `Deactivate ${teacher.name}?` : `Reactivate ${teacher.name}?`,
      message: deactivating
        ? 'They lose access to Campusnex until you reactivate them. Their subjects, timetable and records are kept.'
        : 'They will be able to sign in to Campusnex again.',
      confirmLabel: deactivating ? 'Deactivate' : 'Reactivate',
      tone: deactivating ? 'danger' : 'neutral',
      onConfirm: () => updateUser(teacher.id, { status: deactivating ? 'inactive' : 'active' }, currentUser?.id)
    });
  };

  const designationIsCustom = form.designation !== undefined && !FACULTY_DESIGNATIONS.includes(form.designation);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            Manage Faculty
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Teachers, what they teach, their weekly load and their class responsibilities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => openForm(null)}
            disabled={departments.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
            <p className="text-xl font-extrabold text-slate-900 tabular-nums">{value}</p>
            <p className="text-[11px] font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} aria-label="Department" className={selectClass}>
            <option value="all">All departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or subject"
              aria-label="Search faculty"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick filters">
          {Object.entries(QUICK_FILTERS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setQuick(key)}
              aria-pressed={quick === key}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                quick === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {faculty.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Add your first teacher"
          description="Add teachers one by one or import a CSV with their name, email, department and designation."
          actionLabel="Add Faculty"
          onAction={() => openForm(null)}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full min-w-[760px] text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">Subjects</th>
                <th className="px-5 py-3">Weekly load</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No teachers match these filters.</td></tr>
              )}
              {rows.map(f => {
                const subjects = subjectsOf(f.id);
                const hours = weeklyHours(f.id, timetable);
                const roles = rolesOf(f.id);
                const inactive = f.status === 'inactive';
                return (
                  <tr key={f.id} className={inactive ? 'opacity-60' : ''}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={f.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(f.name)}`}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full ring-2 ring-slate-100"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{f.name}</p>
                          <p className="text-[11px] text-slate-500">{deptCode(f.department_id)} · {f.designation || 'Faculty'}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {hodIds.has(f.id) && <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">HOD</span>}
                            {roles.map(r => (
                              <span
                                key={r.id}
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                  r.role === 'class_teacher' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                                }`}
                              >
                                {classRoleText(r, departments)}
                              </span>
                            ))}
                            {inactive && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">Inactive</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {subjects.length === 0 ? (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">No subjects yet</span>
                      ) : (
                        <span title={subjects.map(c => `${c.code} ${c.name}`).join('\n')}>
                          {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}: {subjects.slice(0, 3).map(c => c.code).join(', ')}
                          {subjects.length > 3 && ` +${subjects.length - 3}`}
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-3 font-bold tabular-nums ${hours >= HEAVY_LOAD_HOURS ? 'text-amber-700' : 'text-slate-800'}`}>
                      {hours} h/week
                    </td>
                    <td className="px-5 py-3">
                      {f.auth_id ? (
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">Active account</span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">Not signed in yet</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openForm(f)}
                          aria-label={`Edit ${f.name}`}
                          title="Edit"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600 cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => askToggle(f)}
                          aria-label={`${inactive ? 'Reactivate' : 'Deactivate'} ${f.name}`}
                          title={inactive ? 'Reactivate' : 'Deactivate'}
                          className={`rounded-lg p-1.5 cursor-pointer ${inactive ? 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add Faculty'}
        subtitle="Teacher details and any class they're responsible for."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{formError}</div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Full Name *
              <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kavya R" className={`mt-1 ${inputClass}`} />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Institutional Email *
              <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. kavya.r@college.edu" className={`mt-1 ${inputClass}`} />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Department *
              <select
                value={form.department_id || ''}
                onChange={(e) => { setForm({ ...form, department_id: e.target.value }); resetNewRole(e.target.value); }}
                className={`mt-1 ${selectClass}`}
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}
              </select>
            </label>
            <div className="block text-xs font-bold text-slate-700">
              <label htmlFor="fac-designation">Designation</label>
              <select
                id="fac-designation"
                value={designationIsCustom ? OTHER : form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value === OTHER ? '' : e.target.value })}
                className={`mt-1 ${selectClass}`}
              >
                {FACULTY_DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                <option value={OTHER}>Other (type below)</option>
              </select>
              {designationIsCustom && (
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Visiting Faculty"
                  aria-label="Custom designation"
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>
            <label className="block text-xs font-bold text-slate-700">
              Phone Number
              <input type="text" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98450 12345" className={`mt-1 ${inputClass}`} />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Office / Cabin
              <input type="text" value={form.office || ''} onChange={(e) => setForm({ ...form, office: e.target.value })} placeholder="e.g. CD Block, Room 210" className={`mt-1 ${inputClass}`} />
            </label>
          </div>

          <fieldset className="rounded-xl border border-brand-200 bg-brand-50/30 p-3.5 space-y-3">
            <legend className="px-1 text-xs font-bold text-brand-700">Class responsibility</legend>

            {editing && rolesOf(editing.id).filter(r => !removedRoleIds.includes(r.id)).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {rolesOf(editing.id).filter(r => !removedRoleIds.includes(r.id)).map(r => (
                  <span key={r.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700">
                    {classRoleText(r, departments)}
                    <button
                      type="button"
                      onClick={() => setRemovedRoleIds(ids => [...ids, r.id])}
                      aria-label={`Remove ${classRoleText(r, departments)}`}
                      className="rounded p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5" role="group" aria-label={editing ? 'Add a responsibility' : 'Responsibility'}>
              {[['', 'None'], ['class_teacher', 'Class Teacher'], ['class_coordinator', 'Class Coordinator (CC)']].map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setNewRole(r => ({ ...r, role: value }))}
                  aria-pressed={newRole.role === value}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    newRole.role === value ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {newRole.role && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Department
                    <select
                      value={newRole.department_id}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        const sem = semestersFor(deptId)[0] ?? '';
                        setNewRole(r => ({ ...r, department_id: deptId, semester: sem, section: sem === '' ? '' : sectionsFor(deptId, sem)[0] ?? '' }));
                      }}
                      className={`mt-1 ${selectClass}`}
                    >
                      {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Semester
                    <select
                      value={newRole.semester}
                      onChange={(e) => {
                        const sem = Number(e.target.value);
                        setNewRole(r => ({ ...r, semester: sem, section: sectionsFor(r.department_id, sem)[0] ?? '' }));
                      }}
                      disabled={semestersFor(newRole.department_id).length === 0}
                      className={`mt-1 ${selectClass} disabled:bg-slate-100`}
                    >
                      {semestersFor(newRole.department_id).length === 0 && <option value="">No classes yet</option>}
                      {semestersFor(newRole.department_id).map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Section
                    <select
                      value={newRole.section}
                      onChange={(e) => setNewRole(r => ({ ...r, section: e.target.value }))}
                      disabled={!newRole.semester}
                      className={`mt-1 ${selectClass} disabled:bg-slate-100`}
                    >
                      {sectionsFor(newRole.department_id, newRole.semester).map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </label>
                </div>
                {newRoleClass && (
                  roleHolder && !holderIsSelf ? (
                    <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {users.find(u => u.id === roleHolder.faculty_id)?.name || 'Someone'} is {CLASS_ROLES[newRole.role].label} of {newRoleClass} now. Saving moves it to this teacher.
                    </p>
                  ) : holderIsSelf ? (
                    <p className="text-xs font-semibold text-slate-500">Already {CLASS_ROLES[newRole.role].label} of {newRoleClass}.</p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> No {CLASS_ROLES[newRole.role].label} for {newRoleClass} yet.
                    </p>
                  )
                )}
              </>
            )}
          </fieldset>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md cursor-pointer">
              {editing ? 'Save Changes' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      <FacultyImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(result) => showNotice(`Faculty imported: ${result.added} added, ${result.updated} updated.`)}
      />
      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}
