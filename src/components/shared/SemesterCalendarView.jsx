import React, { useMemo, useState } from 'react';
import { CalendarRange, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import EmptyState from '../common/EmptyState';
import {
  SEMESTER_CALENDAR_TYPES,
  SEMESTER_CALENDAR_TYPE_STYLES,
  calendarAppliesTo,
  formatDateRange
} from '../../utils/semesterCalendar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 24 * 60 * 60 * 1000;
const UPCOMING_LIMIT = 6;

// Ranges drawn on the semester bar, in drawing order so exams sit on top of class weeks.
const BAR_TYPES = [
  { type: 'classes', color: 'bg-emerald-400' },
  { type: 'cie', color: 'bg-amber-400' },
  { type: 'see', color: 'bg-rose-500' }
];

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Whole days between two "YYYY-MM-DD" dates.
const dayNumber = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
};

const endOf = (item) => item.end_date || item.start_date;

function TypeChip({ type }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-bold ${SEMESTER_CALENDAR_TYPE_STYLES[type] || SEMESTER_CALENDAR_TYPE_STYLES.milestone}`}>
      {SEMESTER_CALENDAR_TYPES[type] || type}
    </span>
  );
}

function countdown(item, today) {
  const toStart = dayNumber(item.start_date) - dayNumber(today);
  if (toStart > 1) return { value: toStart, label: 'days to go' };
  if (toStart === 1) return { value: 1, label: 'day to go' };
  if (toStart === 0) return { value: 'Today', label: item.end_date ? 'starts' : '' };
  const left = dayNumber(endOf(item)) - dayNumber(today);
  return { value: 'Now', label: left === 0 ? 'ends today' : `${left} ${left === 1 ? 'day' : 'days'} left` };
}

function NextUp({ item, today }) {
  if (!item) return null;
  const { value, label } = countdown(item, today);
  return (
    <div className="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-center shadow-xs">
        <span className="text-xl font-extrabold leading-none text-brand-700 tabular-nums">{value}</span>
        {label && <span className="mt-1 px-1 text-[9px] font-bold uppercase leading-tight text-slate-500">{label}</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Next up</p>
        <p className="mt-0.5 text-sm font-bold text-slate-900">{item.activity}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="tabular-nums">{formatDateRange(item.start_date, item.end_date)}</span>
          <TypeChip type={item.type} />
        </div>
      </div>
    </div>
  );
}

function SemesterBar({ items, today }) {
  const first = items[0].start_date;
  const last = items.reduce((max, i) => (endOf(i) > max ? endOf(i) : max), first);
  const start = dayNumber(first);
  const span = dayNumber(last) - start + 1;
  if (span < 2) return null;

  const pos = (iso) => ((dayNumber(iso) - start) / span) * 100;
  const segments = BAR_TYPES.flatMap(({ type, color }) =>
    items.filter(i => i.type === type).map(i => ({
      id: i.id,
      color,
      left: pos(i.start_date),
      width: Math.max(((dayNumber(endOf(i)) - dayNumber(i.start_date) + 1) / span) * 100, 0.8),
      title: `${i.activity}: ${formatDateRange(i.start_date, i.end_date)}`
    }))
  );

  // A label at each month boundary inside the range.
  const months = [];
  const [fy, fm] = first.split('-').map(Number);
  for (let y = fy, m = fm; ; m += 1) {
    if (m > 12) { m = 1; y += 1; }
    const iso = `${y}-${String(m).padStart(2, '0')}-01`;
    if (iso > last) break;
    months.push({ iso, label: MONTHS[m - 1], left: Math.max(pos(iso), 0) });
  }

  const showToday = today >= first && today <= last;

  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-slate-100" role="img" aria-label={`Semester from ${formatDateRange(first)} to ${formatDateRange(last)}`}>
        {segments.map(s => (
          <span
            key={s.id}
            title={s.title}
            className={`absolute inset-y-0 rounded-full ${s.color}`}
            style={{ left: `${s.left}%`, width: `${s.width}%` }}
          />
        ))}
        {showToday && (
          <span className="absolute -top-1.5 -bottom-1.5 w-0.5 -translate-x-1/2 rounded-full bg-slate-900" style={{ left: `${pos(today)}%` }}>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase text-slate-900">Today</span>
          </span>
        )}
      </div>
      <div className="relative mt-1.5 h-3.5 text-[10px] font-semibold text-slate-400">
        {months.map(m => (
          <span key={m.iso} className="absolute" style={{ left: `${m.left}%` }}>{m.label}</span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        {BAR_TYPES.filter(({ type }) => items.some(i => i.type === type)).map(({ type, color }) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {SEMESTER_CALENDAR_TYPES[type]}
          </span>
        ))}
      </div>
    </div>
  );
}

function ItemRow({ item, muted }) {
  return (
    <li className={`flex items-center justify-between gap-3 px-5 py-2.5 ${muted ? 'text-slate-400' : ''}`}>
      <div className="min-w-0 sm:flex sm:items-baseline sm:gap-3">
        <span className={`block text-xs font-semibold tabular-nums sm:w-40 sm:shrink-0 ${muted ? '' : 'text-slate-600'}`}>
          {formatDateRange(item.start_date, item.end_date)}
        </span>
        <span className={`block text-xs ${muted ? '' : 'font-semibold text-slate-800'}`}>{item.activity}</span>
      </div>
      <span className="shrink-0"><TypeChip type={item.type} /></span>
    </li>
  );
}

function CalendarSection({ calendar, items, department, today }) {
  const [showAll, setShowAll] = useState(false);
  const upcoming = items.filter(i => endOf(i) >= today);
  const earlier = items.filter(i => endOf(i) < today);
  // Skip ERP deadlines, and class weeks already under way, so an exam starting soon wins.
  const nextUp = upcoming.find(i => i.type !== 'deadline' && (i.type !== 'classes' || i.start_date >= today))
    || upcoming.find(i => i.type !== 'deadline');
  const visible = showAll ? upcoming : upcoming.slice(0, UPCOMING_LIMIT);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-xs">
      <header className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">{calendar.title}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {[
            calendar.ref_no && `Ref ${calendar.ref_no}`,
            `Sem ${(calendar.semesters || []).join(', ')}`,
            department ? department.code : 'All departments'
          ].filter(Boolean).join(' · ')}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="px-5 py-6 text-xs text-slate-500">This calendar has no dates yet.</p>
      ) : (
        <>
          <div className="space-y-5 px-5 pt-5 pb-4">
            <NextUp item={nextUp} today={today} />
            <div className="pt-3">
              <SemesterBar items={items} today={today} />
            </div>
          </div>

          <div className="border-t border-slate-100">
            <h4 className="flex items-center gap-1.5 px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Clock className="h-3.5 w-3.5" /> Coming up
            </h4>
            {upcoming.length === 0 ? (
              <p className="px-5 pb-4 text-xs text-slate-500">Every date on this calendar has passed.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visible.map(item => <ItemRow key={item.id} item={item} />)}
              </ul>
            )}
            {upcoming.length > UPCOMING_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAll(v => !v)}
                aria-expanded={showAll}
                className="mx-5 mb-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50 cursor-pointer"
              >
                {showAll ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showAll ? 'Show fewer' : `Show ${upcoming.length - UPCOMING_LIMIT} more`}
              </button>
            )}
          </div>

          {earlier.length > 0 && (
            <details className="group border-t border-slate-100">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-700">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                Earlier ({earlier.length})
              </summary>
              <ul className="divide-y divide-slate-100 pb-2">
                {[...earlier].reverse().map(item => <ItemRow key={item.id} item={item} muted />)}
              </ul>
            </details>
          )}
        </>
      )}
    </article>
  );
}

// Students and faculty: the published COE semester calendars that apply to them, read-only.
export default function SemesterCalendarView() {
  const { currentUser } = useAuth();
  const { semester_calendars = [], semester_calendar_items = [], departments = [] } = useData();
  const today = localToday();

  const calendars = useMemo(() => {
    const applicable = semester_calendars
      .filter(c => c.status === 'published' && calendarAppliesTo(c, currentUser))
      .sort((a, b) => String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)));
    return applicable.map(calendar => ({
      calendar,
      items: semester_calendar_items
        .filter(i => i.calendar_id === calendar.id)
        .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.sort_order - b.sort_order)
    }));
  }, [semester_calendars, semester_calendar_items, currentUser]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-brand-600" />
          Semester Calendar
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          CIE tests, SEE exams, deadlines and results from the Controller of Examinations.
        </p>
      </div>

      {calendars.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No semester calendar yet"
          description="When the Controller of Examinations publishes the calendar for your semester, its dates will show here."
        />
      ) : (
        <div className="space-y-5">
          {calendars.map(({ calendar, items }) => (
            <CalendarSection
              key={calendar.id}
              calendar={calendar}
              items={items}
              department={departments.find(d => d.id === calendar.department_id)}
              today={today}
            />
          ))}
        </div>
      )}
    </div>
  );
}
