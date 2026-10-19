import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  AlertCircle,
  Tag
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { describeScope, eventAppliesTo } from '../../utils/calendarScope';

// Parse 'YYYY-MM-DD' as a local date; new Date('YYYY-MM-DD') is UTC and can show the previous day.
const parseLocalDate = (value) => {
  const [y, m, d] = String(value).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function CalendarManager() {
  const { calendar_events, users, courses, departments, createCalendarEvent, deleteCalendarEvent } = useData();
  const [confirmRequest, setConfirmRequest] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: todayISO(),
    type: 'holiday', // 'holiday' | 'exam' | 'working_day'
    title: '',
    description: '',
    affects_department_id: '',
    affects_semester: '',
    affects_section: ''
  });

  const [formError, setFormError] = useState('');

  const handleOpenAddModal = () => {
    setFormData({
      date: todayISO(),
      type: 'holiday',
      title: '',
      description: '',
      affects_department_id: '',
      affects_semester: '',
      affects_section: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Please provide an event title.');
      return;
    }
    if (!formData.date) {
      setFormError('Please select a valid date.');
      return;
    }

    createCalendarEvent({
      ...formData,
      affects_department_id: formData.affects_department_id || null,
      affects_semester: formData.affects_semester ? Number(formData.affects_semester) : null,
      affects_section: formData.affects_section || null
    });
    setIsModalOpen(false);
  };

  // Classes that exist, from students and courses, so the pickers only offer real options.
  const classRows = [
    ...users.filter(u => u.role === 'student' && u.status !== 'inactive'),
    ...courses
  ].filter(r => r.department_id && r.semester);
  const scopeDept = formData.affects_department_id;
  const scopeSem = formData.affects_semester;
  const semesterOptions = scopeDept
    ? [...new Set(classRows.filter(r => r.department_id === scopeDept).map(r => Number(r.semester)))].sort((a, b) => a - b)
    : [1, 2, 3, 4, 5, 6, 7, 8];
  const sectionOptions = scopeDept && scopeSem
    ? [...new Set(classRows
        .filter(r => r.department_id === scopeDept && Number(r.semester) === Number(scopeSem) && r.section)
        .map(r => r.section))].sort()
    : [];

  const setScope = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // A narrower choice that may not exist under the new department or semester is cleared.
      if (field === 'affects_department_id') { next.affects_semester = ''; next.affects_section = ''; }
      if (field === 'affects_semester') next.affects_section = '';
      return next;
    });
  };

  const draftScope = {
    affects_department_id: formData.affects_department_id || null,
    affects_semester: formData.affects_semester ? Number(formData.affects_semester) : null,
    affects_section: formData.affects_section || null
  };
  const scopeLabel = describeScope(draftScope, departments);
  const reachedStudents = users.filter(u => u.role === 'student' && u.status !== 'inactive' && eventAppliesTo(draftScope, u)).length;

  const sortedEvents = [...calendar_events].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const getTypeBadge = (type) => {
    switch (type) {
      case 'holiday':
        return <Badge variant="danger" dot>Holiday</Badge>;
      case 'exam':
        return <Badge variant="purple" dot>Examination</Badge>;
      case 'working_day':
        return <Badge variant="info" dot>Working / Event</Badge>;
      default:
        return <Badge variant="neutral">Academic</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-600" />
            Institutional Academic Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain term dates, holiday declarations, examination cycles, and compensatory working days.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Calendar Event</span>
        </button>
      </div>

      {sortedEvents.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No calendar events yet"
          description="Add holidays, exam weeks and working days. Students and faculty are notified when you add one."
          actionLabel="Add Calendar Event"
          onAction={handleOpenAddModal}
        />
      )}

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedEvents.map((evt) => {
          const dateObj = parseLocalDate(evt.date);
          const formattedDate = dateObj.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div
              key={evt.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs">
                      {dateObj.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{formattedDate}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{evt.date}</p>
                    </div>
                  </div>
                  {getTypeBadge(evt.type)}
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {evt.description || 'No additional description provided.'}
                </p>

                {describeScope(evt, departments) !== 'Whole institution' && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    <Tag className="w-3 h-3" />
                    {describeScope(evt, departments)}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">
                  {describeScope(evt, departments) === 'Whole institution' ? 'Campus-wide' : 'Selected classes only'}
                </span>
                <button
                  onClick={() => setConfirmRequest({
                    title: `Delete "${evt.title}"?`,
                    message: `This removes the ${formattedDate} entry from everyone's academic calendar.`,
                    confirmLabel: 'Delete event',
                    onConfirm: () => deleteCalendarEvent(evt.id)
                  })}
                  aria-label={`Delete ${evt.title}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Academic Calendar Entry"
        subtitle="Adds a date to the calendar and notifies the people it applies to."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="holiday">Official Holiday (Campus Closed)</option>
                <option value="exam">Examination / Mid-Term Cycle</option>
                <option value="working_day">Compensatory Working Day / Symposium</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Mid-Term Theory Examination: CS301"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <fieldset className="sm:col-span-2 rounded-xl border border-brand-200 bg-brand-50/30 p-3.5">
              <legend className="px-1 text-xs font-bold text-brand-700">Who it applies to</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-xs font-bold text-slate-700">
                  Department
                  <select
                    value={formData.affects_department_id}
                    onChange={(e) => setScope('affects_department_id', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="">All departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} · {d.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Semester
                  <select
                    value={formData.affects_semester}
                    onChange={(e) => setScope('affects_semester', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="">All semesters</option>
                    {semesterOptions.map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Section
                  <select
                    value={formData.affects_section}
                    onChange={(e) => setScope('affects_section', e.target.value)}
                    disabled={sectionOptions.length === 0}
                    title={sectionOptions.length === 0 ? 'Pick a department and semester to choose one section' : undefined}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">All sections</option>
                    {sectionOptions.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500" aria-live="polite">
                Applies to
                <span className="rounded-md bg-brand-100 px-2 py-0.5 font-bold text-brand-800">{scopeLabel}</span>
                <span>
                  {reachedStudents} {reachedStudents === 1 ? 'student' : 'students'} and their teachers get notified
                </span>
              </p>
            </fieldset>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Timetable Note
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details regarding schedule adjustments, hall tickets, or holiday observance..."
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
              Publish Calendar Event
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}
