import React from 'react';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import EmptyState from '../common/EmptyState';
import {
  SEMESTER_CALENDAR_TYPES,
  calendarAppliesTo,
  formatDateRange
} from '../../utils/semesterCalendar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MS = 24 * 60 * 60 * 1000;
// Calendars shorter than this get no semester bar; a week-long bar says nothing.
const MIN_BAR_DAYS = 28;

// One colour per type, shared by the list dots, the bar and its legend.
const TYPE_DOT = {
  milestone: 'bg-slate-400',
  registration: 'bg-sky-500',
  cie: 'bg-amber-400',
  see: 'bg-rose-500',
  classes: 'bg-emerald-400',
  deadline: 'bg-violet-500',
  results: 'bg-indigo-500',
  holiday: 'bg-red-500'
};

// Ranges drawn on the bar, in drawing order so exams sit on top of class weeks.
const BAR_TYPES = ['classes', 'cie', 'see'];

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parts = (iso) => iso.split('-').map(Number);

// Whole days since the epoch for a "YYYY-MM-DD" date.
const dayNumber = (iso) => {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d) / DAY_MS;
};

const weekday = (iso) => {
  const [y, m, d] = parts(iso);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
};

const endOf = (item) => item.end_date || item.start_date;
const isOngoing = (item, today) => item.start_date < today && endOf(item) >= today;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function TypeLabel({ type }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-slate-500">
      <span className={`h-2 w-2 rounded-full ${TYPE_DOT[type] || TYPE_DOT.milestone}`} />
      {SEMESTER_CALENDAR_TYPES[type] || type}
    </span>
  );
}

function countdown(item, today) {
  const toStart = dayNumber(item.start_date) - dayNumber(today);
  if (toStart > 1) return { big: toStart, small: 'days to go' };
  if (toStart === 1) return { big: 1, small: 'day to go' };
  if (toStart === 0) return { big: 'Today', small: item.end_date ? 'starts' : '' };
  const left = dayNumber(endOf(item)) - dayNumber(today);
  return { big: 'On now', small: left === 0 ? 'ends today' : `${plural(left, 'day')} left` };
}

// The single most useful date on the page: the next exam or milestone, skipping ERP deadlines
// and class weeks that are already under way.
function pickNextUp(entries, today) {
  const candidates = entries
    .flatMap(({ calendar, items }) => items.map(item => ({ item, calendar })))
    .filter(({ item }) => endOf(item) >= today && item.type !== 'deadline')
    .sort((a, b) => a.item.start_date.localeCompare(b.item.start_date));
  return candidates.find(({ item }) => item.type !== 'classes' || item.start_date >= today) || candidates[0];
}

function NextUpCard({ next, today, showSource }) {
  const { item, calendar } = next;
  const { big, small } = countdown(item, today);
  return (
    <section className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs" aria-label="Next up">
      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-600 text-center text-white shadow-md shadow-brand-600/20">
        <span className="text-2xl font-extrabold leading-none tabular-nums">{big}</span>
        {small && <span className="mt-1 px-1 text-[10px] font-semibold leading-tight text-white/85">{small}</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">Next up</p>
        <h3 className="mt-0.5 text-base font-bold text-slate-900">{item.activity}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="font-semibold tabular-nums">{formatDateRange(item.start_date, item.end_date)}</span>
          <TypeLabel type={item.type} />
          {showSource && <span className="text-slate-400">{calendar.title}</span>}
        </div>
      </div>
    </section>
  );
}

function SemesterBar({ items, first, last, today }) {
  const start = dayNumber(first);
  const span = dayNumber(last) - start + 1;
  const pos = (iso) => ((dayNumber(iso) - start) / span) * 100;

  const segments = BAR_TYPES.flatMap(type =>
    items.filter(i => i.type === type).map(i => ({
      id: i.id,
      type,
      left: pos(i.start_date),
      width: Math.max(((dayNumber(endOf(i)) - dayNumber(i.start_date) + 1) / span) * 100, 0.8),
      title: `${i.activity}: ${formatDateRange(i.start_date, i.end_date)}`
    }))
  );

  // A tick and label at the start of each month inside the range.
  const months = [];
  const [fy, fm] = parts(first);
  for (let y = fy, m = fm + 1; ; m += 1) {
    if (m > 12) { m = 1; y += 1; }
    const iso = `${y}-${String(m).padStart(2, '0')}-01`;
    if (iso > last) break;
    months.push({ iso, label: MONTHS[m - 1], left: pos(iso) });
  }

  const showToday = today >= first && today <= last;
  const legend = BAR_TYPES.filter(type => items.some(i => i.type === type));

  return (
    <div className="px-5 pt-4 pb-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Semester at a glance</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map(type => <TypeLabel key={type} type={type} />)}
        </div>
      </div>
      <div className="relative pt-5">
        {showToday && (
          <span
            className="absolute top-0 -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white"
            style={{ left: `${pos(today)}%` }}
          >
            Today
          </span>
        )}
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`Semester from ${formatDateRange(first)} to ${formatDateRange(last)}`}>
          {months.map(m => (
            <span key={m.iso} className="absolute inset-y-0 w-px bg-white" style={{ left: `${m.left}%` }} />
          ))}
          {segments.map(s => (
            <span
              key={s.id}
              title={s.title}
              className={`absolute inset-y-0 ${TYPE_DOT[s.type]}`}
              style={{ left: `${s.left}%`, width: `${s.width}%` }}
            />
          ))}
        </div>
        {showToday && (
          <span className="absolute top-4 bottom-[-4px] w-0.5 -translate-x-1/2 bg-slate-900" style={{ left: `${pos(today)}%` }} />
        )}
      </div>
      <div className="relative mt-2 h-4 text-[10px] font-semibold text-slate-400">
        <span className="absolute left-0">{MONTHS[fm - 1]}</span>
        {months.map(m => (
          <span key={m.iso} className="absolute -translate-x-1/2" style={{ left: `${m.left}%` }}>{m.label}</span>
        ))}
      </div>
    </div>
  );
}

function DateTile({ item, muted }) {
  const [, sm, sd] = parts(item.start_date);
  const [, em, ed] = parts(endOf(item));
  const days = item.end_date ? (sm === em ? `${sd}–${ed}` : `${sd} ${MONTHS[sm - 1]}–`) : String(sd);
  const sub = item.end_date
    ? (sm === em ? MONTHS[sm - 1] : `${ed} ${MONTHS[em - 1]}`)
    : `${MONTHS[sm - 1]} · ${weekday(item.start_date)}`;
  return (
    <div className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl border py-1.5 text-center ${
      muted ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-900'
    }`}>
      <span className="whitespace-nowrap text-sm font-extrabold leading-tight tabular-nums">{days}</span>
      <span className="whitespace-nowrap text-[10px] font-semibold text-slate-400">{sub}</span>
    </div>
  );
}

function ItemRow({ item, today, muted }) {
  const ongoing = isOngoing(item, today);
  const startsToday = item.start_date === today;
  return (
    <li className="flex items-center gap-4 px-5 py-2.5">
      <DateTile item={item} muted={muted} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${muted ? 'text-slate-400' : 'font-semibold text-slate-800'}`}>{item.activity}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <TypeLabel type={item.type} />
          {(ongoing || startsToday) && !muted && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
              {startsToday ? 'Starts today' : 'On now'}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

// Upcoming items under a heading per month, so a long semester reads in chunks.
function MonthGroups({ items, today, muted }) {
  const groups = [];
  for (const item of items) {
    const [y, m] = parts(isOngoing(item, today) ? today : item.start_date);
    const key = `${y}-${m}`;
    if (groups[groups.length - 1]?.key !== key) groups.push({ key, label: `${FULL_MONTHS[m - 1]} ${y}`, items: [] });
    groups[groups.length - 1].items.push(item);
  }
  return groups.map(group => (
    <div key={group.key}>
      <h5 className="bg-slate-50/70 px-5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{group.label}</h5>
      <ul className="divide-y divide-slate-100">
        {group.items.map(item => <ItemRow key={item.id} item={item} today={today} muted={muted} />)}
      </ul>
    </div>
  ));
}

function CalendarSection({ calendar, items, department, today }) {
  const first = items[0]?.start_date;
  const last = items.reduce((max, i) => (endOf(i) > max ? endOf(i) : max), first || '');
  const hasBar = items.length > 0 && dayNumber(last) - dayNumber(first) + 1 >= MIN_BAR_DAYS;
  // Ongoing items sort to today so they sit at the top of the current month.
  const upcoming = items
    .filter(i => endOf(i) >= today)
    .sort((a, b) => (isOngoing(a, today) ? today : a.start_date).localeCompare(isOngoing(b, today) ? today : b.start_date));
  const earlier = items.filter(i => endOf(i) < today).reverse();

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{calendar.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {[
              `Sem ${(calendar.semesters || []).join(', ')}`,
              department ? department.code : 'All departments',
              calendar.ref_no && `Ref ${calendar.ref_no}`
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
        {first && (
          <span className="text-xs font-semibold text-slate-500 tabular-nums">{formatDateRange(first, last === first ? null : last)}</span>
        )}
      </header>

      {items.length === 0 ? (
        <p className="px-5 py-6 text-xs text-slate-500">This calendar has no dates yet.</p>
      ) : (
        <>
          {hasBar && (
            <div className="border-b border-slate-100">
              <SemesterBar items={items} first={first} last={last} today={today} />
            </div>
          )}

          {upcoming.length === 0 ? (
            <p className="px-5 py-5 text-xs text-slate-500">Every date on this calendar has passed.</p>
          ) : (
            <MonthGroups items={upcoming} today={today} />
          )}

          {earlier.length > 0 && (
            <details className="group border-t border-slate-100">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 px-5 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                {plural(earlier.length, 'earlier date')}
              </summary>
              <MonthGroups items={earlier} today={today} muted />
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

  const entries = semester_calendars
    .filter(c => c.status === 'published' && calendarAppliesTo(c, currentUser))
    .sort((a, b) => String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)))
    .map(calendar => ({
      calendar,
      items: semester_calendar_items
        .filter(i => i.calendar_id === calendar.id)
        .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.sort_order - b.sort_order)
    }));

  const next = pickNextUp(entries, today);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-brand-600" />
          Semester Calendar
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          CIE tests, SEE exams, deadlines and results from the Controller of Examinations.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No semester calendar yet"
          description="When the Controller of Examinations publishes the calendar for your semester, its dates will show here."
        />
      ) : (
        <>
          {next && <NextUpCard next={next} today={today} showSource={entries.length > 1} />}
          {entries.map(({ calendar, items }) => (
            <CalendarSection
              key={calendar.id}
              calendar={calendar}
              items={items}
              department={departments.find(d => d.id === calendar.department_id)}
              today={today}
            />
          ))}
        </>
      )}
    </div>
  );
}
