import React, { useState } from 'react';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';

export default function StudentCalendar() {
  const { currentUser } = useAuth();
  const { calendar_events } = useData();

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date('2026-08-01'));
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'month'

  // Filter events relevant to this student's section
  const relevantEvents = calendar_events.filter(e =>
    !e.affects_section || e.affects_section === currentUser?.section
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  const prevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'holiday':
        return <Badge variant="danger" dot>Holiday</Badge>;
      case 'exam':
        return <Badge variant="purple" dot>Examination</Badge>;
      case 'working_day':
        return <Badge variant="info" dot>Working Day / Event</Badge>;
      default:
        return <Badge variant="neutral">Academic</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-600" />
            Institutional Academic Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Term dates, examination windows, national holidays, and departmental symposiums.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Agenda View
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Month Grid
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Agenda List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relevantEvents.map((evt) => {
            const dateObj = new Date(evt.date);
            const formatted = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
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
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs">
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </div>
                    {getTypeBadge(evt.type)}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-3">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {evt.description || 'Institutional event.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{formatted}</span>
                  {evt.affects_section && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Sec {evt.affects_section}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Month View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900">{monthName}</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-08-${dayNum.toString().padStart(2, '0')}`;
              const dayEvt = relevantEvents.find(e => e.date === dateStr);

              return (
                <div
                  key={i}
                  className={`min-h-[70px] p-2 rounded-xl border flex flex-col justify-between text-left transition-all ${
                    dayEvt
                      ? dayEvt.type === 'holiday'
                        ? 'bg-rose-50/60 border-rose-200'
                        : dayEvt.type === 'exam'
                        ? 'bg-purple-50/60 border-purple-200'
                        : 'bg-sky-50/60 border-sky-200'
                      : 'bg-slate-50/30 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-700">{dayNum}</span>
                  {dayEvt && (
                    <span className="text-[10px] font-extrabold line-clamp-1 text-slate-900 mt-1">
                      {dayEvt.title}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
