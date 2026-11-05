import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { parseISODate, toISODate } from '@/components/ui/date-picker';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { eventAppliesTo, describeScope } from '../../utils/calendarScope';

export default function StudentCalendar() {
  const { currentUser } = useAuth();
  const { calendar_events, departments } = useData();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'month'

  // Only events that apply to this student's department, semester and section
  const relevantEvents = calendar_events.filter(e => eventAppliesTo(e, currentUser)).sort((a, b) => new Date(a.date) - new Date(b.date));

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
            const formatted = dateObj.toLocaleDateString('en-IN', {
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
                      {dateObj.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
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
                  {describeScope(evt, departments) !== 'Whole institution' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {describeScope(evt, departments)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Month View */
        <MonthView events={relevantEvents} getTypeBadge={getTypeBadge} />
      )}
    </div>
  );
}

function MonthView({ events, getTypeBadge }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [day, setDay] = useState();

  const dots = events.map((e) => ({ date: parseISODate(e.date), label: e.title }));
  const monthKey = toISODate(month).slice(0, 7);
  const dayKey = day ? toISODate(day) : null;
  const shown = events.filter((e) => (dayKey ? e.date === dayKey : e.date.slice(0, 7) === monthKey));
  const heading = day
    ? day.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs md:flex-row">
      <Calendar
        className="shrink-0 self-start md:w-[300px]"
        month={month}
        onMonthChange={(m) => { setMonth(m); setDay(undefined); }}
        selected={day}
        onSelect={setDay}
        events={dots}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">{heading}</h3>
          {day && (
            <button type="button" onClick={() => setDay(undefined)} className="text-xs font-bold text-brand-600 hover:underline">
              Show whole month
            </button>
          )}
        </div>
        {shown.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">{day ? 'Nothing on this day.' : 'No events this month.'}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {shown.map((evt) => (
              <li key={evt.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500">
                    {parseISODate(evt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{evt.title}</p>
                  {evt.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{evt.description}</p>}
                </div>
                <div className="shrink-0">{getTypeBadge(evt.type)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
