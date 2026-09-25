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

export default function CalendarManager() {
  const { calendar_events, createCalendarEvent, deleteCalendarEvent } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '2026-09-25',
    type: 'holiday', // 'holiday' | 'exam' | 'working_day'
    title: '',
    description: '',
    affects_section: '' // '' for All, 'A', 'B'
  });

  const [formError, setFormError] = useState('');

  const handleOpenAddModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'holiday',
      title: 'University Founders Day',
      description: 'Campus holiday honoring institutional founding.',
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
      affects_section: formData.affects_section || null
    });
    setIsModalOpen(false);
  };

  const sortedEvents = [...calendar_events].sort((a, b) => new Date(a.date) - new Date(b.date));

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

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedEvents.map((evt) => {
          const dateObj = new Date(evt.date);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
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
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
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

                {evt.affects_section && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    <Tag className="w-3 h-3" />
                    Section {evt.affects_section} Only
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">
                  {evt.affects_section ? `Applies to Sec ${evt.affects_section}` : 'Campus-wide'}
                </span>
                <button
                  onClick={() => deleteCalendarEvent(evt.id)}
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
        subtitle="Adds an official date to the institutional calendar and notifies students & faculty."
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Section Scope (Optional)
              </label>
              <select
                value={formData.affects_section}
                onChange={(e) => setFormData({ ...formData, affects_section: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">All Sections (Institution-Wide)</option>
                <option value="A">Section A Only</option>
                <option value="B">Section B Only</option>
              </select>
            </div>

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
    </div>
  );
}
