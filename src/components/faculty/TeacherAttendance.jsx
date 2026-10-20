import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  CalendarPlus,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  MapPin,
  RotateCcw,
  Users,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { formatTimeRange } from '../../utils/time';
import {
  EDIT_WINDOW_DAYS,
  addDays,
  classStatus,
  classesOn,
  dayName,
  enrolledStudents,
  holidayFor,
  nowHHMM,
  parseISODate,
  sessionRows,
  todayISO,
  unmarkedClasses,
  weekOf
} from '../../utils/classSessions';
import { cn } from '@/lib/utils';

const STATUS = {
  now: { label: 'Now', variant: 'primary' },
  upcoming: { label: 'Upcoming', variant: 'neutral' },
  marked: { label: 'Marked', variant: 'success' },
  pending: { label: 'Not marked', variant: 'warning' },
  locked: { label: 'Locked', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  holiday: { label: 'Holiday', variant: 'info' }
};

const MARKS = [
  { id: 'present', label: 'Present', on: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { id: 'late', label: 'Late', on: 'bg-amber-50 text-amber-800 border-amber-300' },
  { id: 'absent', label: 'Absent', on: 'bg-rose-50 text-rose-700 border-rose-300' }
];

// How far back the "needs attendance" list looks, including locked classes.
const LOOKBACK_DAYS = 30;

const prettyDate = (iso) => format(parseISODate(iso), 'EEE, d MMM yyyy');

// Mark attendance from the teacher's timetable: pick a day, open a class, mark its students.
export default function TeacherAttendance() {
  const { currentUser } = useAuth();
  const data = useData();
  const {
    attendance,
    markClassSession,
    cancelClassSession,
    restoreClassSession,
    addExtraClassSession,
    requestAttendanceUnlock
  } = data;

  // The clock drives Now / Upcoming / Not marked, so refresh it every minute.
  const [now, setNow] = useState(() => ({ date: todayISO(), time: nowHHMM() }));
  useEffect(() => {
    const timer = setInterval(() => setNow({ date: todayISO(), time: nowHHMM() }), 60_000);
    return () => clearInterval(timer);
  }, []);

  const [selectedDate, setSelectedDate] = useState(now.date);
  const [openKey, setOpenKey] = useState(null);
  const [showExtra, setShowExtra] = useState(false);
  const [flash, setFlash] = useState('');
  const [requested, setRequested] = useState(() => new Set());

  const myCourses = useMemo(
    () => data.courses.filter((c) => c.faculty_id === currentUser?.id),
    [data.courses, currentUser]
  );
  const classes = classesOn(selectedDate, currentUser?.id, data);
  // Locked classes are listed too, so the teacher can ask the HOD to unlock them.
  const unmarked = unmarkedClasses(currentUser?.id, data, now, LOOKBACK_DAYS);
  const openItem = classes.find((c) => c.key === openKey) || null;

  const showFlash = (text) => {
    setFlash(text);
    setTimeout(() => setFlash(''), 4000);
  };

  const pickDate = (date) => {
    setSelectedDate(date);
    setOpenKey(null);
  };

  if (!myCourses.length) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No classes assigned yet"
        description="Your classes appear here once an admin assigns you courses and adds them to the timetable."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <CheckSquare className="h-5 w-5 text-brand-600" />
            Mark Attendance
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Your classes come from the timetable. Open a class to mark its students. You can change attendance for
            up to {EDIT_WINDOW_DAYS} days; after that, ask your HOD to unlock it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowExtra((v) => !v)}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <CalendarPlus className="h-4 w-4" />
          Add extra class
        </button>
      </div>

      {flash && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          {flash}
        </div>
      )}

      {unmarked.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="font-bold">
            {unmarked.length} {unmarked.length === 1 ? 'class needs' : 'classes need'} attendance
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {unmarked.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(c.date);
                    setOpenKey(c.key);
                  }}
                  className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-semibold hover:bg-amber-100"
                >
                  {c.course.code} Sec {c.course.section} · {format(parseISODate(c.date), 'EEE d MMM')}{' '}
                  {formatTimeRange(c.start_time, c.end_time).split(' – ')[0]}
                  {c.status === 'locked' ? ' · locked' : ''}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showExtra && (
        <ExtraClassForm
          courses={myCourses}
          date={selectedDate}
          minDate={addDays(now.date, -EDIT_WINDOW_DAYS)}
          onCancel={() => setShowExtra(false)}
          onAdd={(fields) => {
            addExtraClassSession(fields);
            setShowExtra(false);
            pickDate(fields.date);
            showFlash(`Extra class added for ${fields.course.code} on ${prettyDate(fields.date)}.`);
          }}
        />
      )}

      <WeekStrip selectedDate={selectedDate} today={now.date} onPick={pickDate} />

      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-900">
          {prettyDate(selectedDate)}
          {selectedDate === now.date ? ' · Today' : ''}
        </p>
        {classes.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={dayName(selectedDate) === 'Sunday' ? 'Sunday, no classes' : 'No classes on this day'}
            description="Nothing in your timetable for this day. Use Add extra class for a makeup class."
          />
        ) : (
          classes.map((item) => {
            const status = classStatus(item, data, now);
            const isOpen = openKey === item.key;
            return (
              <div key={item.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <ClassCard
                  item={item}
                  status={status}
                  data={data}
                  attendance={attendance}
                  isOpen={isOpen}
                  onToggle={() => setOpenKey(isOpen ? null : item.key)}
                />
                {isOpen && openItem && (
                  <ClassPanel
                    item={openItem}
                    status={status}
                    data={data}
                    now={now}
                    requested={requested.has(item.key)}
                    onSave={(statuses) => {
                      markClassSession(item, statuses);
                      setOpenKey(null);
                      const absent = Object.values(statuses).filter((s) => s === 'absent').length;
                      showFlash(
                        `Attendance saved for ${item.course.code} Sec ${item.course.section}.${absent ? ` ${absent} absent ${absent === 1 ? 'student was' : 'students were'} notified.` : ''}`
                      );
                    }}
                    onCancelClass={(reason) => {
                      cancelClassSession(item, reason);
                      setOpenKey(null);
                      showFlash(`${item.course.code} Sec ${item.course.section} cancelled. Students were told.`);
                    }}
                    onRestore={() => restoreClassSession(item)}
                    onRequestUnlock={() => {
                      requestAttendanceUnlock(item);
                      setRequested((prev) => new Set(prev).add(item.key));
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function WeekStrip({ selectedDate, today, onPick }) {
  const days = weekOf(selectedDate);
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
      <button
        type="button"
        aria-label="Previous week"
        onClick={() => onPick(addDays(days[0], -7))}
        className="rounded-xl p-2 text-slate-600 hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="grid flex-1 grid-cols-3 gap-1 sm:grid-cols-6">
        {days.map((d) => {
          const isSelected = d === selectedDate;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onPick(d)}
              className={cn(
                'rounded-xl px-2 py-2 text-center text-xs transition-colors',
                isSelected ? 'bg-brand-500 font-bold text-white' : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className="block font-bold">{format(parseISODate(d), 'EEE')}</span>
              <span className={cn('block', isSelected ? 'text-white/90' : 'text-slate-500')}>
                {format(parseISODate(d), 'd MMM')}
                {d === today ? ' · today' : ''}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Next week"
        onClick={() => onPick(addDays(days[0], 7))}
        className="rounded-xl p-2 text-slate-600 hover:bg-slate-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ClassCard({ item, status, data, attendance, isOpen, onToggle }) {
  const students = enrolledStudents(item.course, data, item.batch).length;
  const rows = sessionRows(item, attendance);
  const present = rows.filter((a) => a.status !== 'absent').length;
  const holiday = status === 'holiday' ? holidayFor(item.date, item.course, data) : null;

  let detail = '';
  if (status === 'marked') detail = `${present} of ${rows.length} present`;
  if (status === 'cancelled') detail = item.session.cancel_reason;
  if (status === 'holiday') detail = holiday;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full flex-col gap-3 px-5 py-4 text-left hover:bg-slate-50/60 sm:flex-row sm:items-center"
    >
      <span className="min-w-36 text-xs font-bold text-slate-600 tabular-nums">
        {formatTimeRange(item.start_time, item.end_time)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-slate-900">
          {item.course.code} · Sem {item.course.semester} · Sec {item.course.section}
          {item.batch ? ` · Batch ${item.batch}` : ''}
          {item.kind === 'extra' && (
            <span className="ml-2 rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">Extra class</span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span>{item.course.name}</span>
          {item.room && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.room}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {students} students
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        <Badge variant={STATUS[status].variant} size="sm" dot>
          {status === 'locked' && <Lock className="mr-1 inline h-3 w-3" />}
          {STATUS[status].label}
        </Badge>
        {detail && <span className="max-w-56 truncate text-[11px] text-slate-500">{detail}</span>}
      </span>
    </button>
  );
}

function ClassPanel({ item, status, data, now, requested, onSave, onCancelClass, onRestore, onRequestUnlock }) {
  const students = enrolledStudents(item.course, data, item.batch);
  const saved = Object.fromEntries(sessionRows(item, data.attendance).map((a) => [a.student_id, a.status]));
  // Everyone starts Present; a class marked before opens with what was saved.
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(students.map((s) => [s.id, saved[s.id] || 'present']))
  );
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [forceOpen, setForceOpen] = useState(false);

  const counts = MARKS.map((m) => Object.values(statuses).filter((s) => s === m.id).length);

  if (status === 'cancelled') {
    return (
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-600">
          Cancelled: <span className="font-semibold text-slate-800">{item.session.cancel_reason}</span>. It does not
          count toward anyone's attendance.
        </p>
        <button
          type="button"
          onClick={onRestore}
          className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Class was held after all
        </button>
      </div>
    );
  }

  if (status === 'locked') {
    return (
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-600">
          This class is more than {EDIT_WINDOW_DAYS} days old, so attendance is locked. Your HOD can unlock it for you.
        </p>
        <button
          type="button"
          onClick={onRequestUnlock}
          disabled={requested}
          className="self-start rounded-xl bg-brand-500 px-3 py-2 font-bold text-white hover:bg-brand-600 disabled:bg-slate-300"
        >
          {requested ? 'Request sent to HOD' : 'Ask HOD to unlock'}
        </button>
      </div>
    );
  }

  const isFuture = item.date > now.date;
  const blockedByHoliday = status === 'holiday' && !forceOpen;

  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
      {isFuture && (
        <p className="text-xs text-slate-600">
          This class hasn't happened yet. You can mark attendance from the day of the class, or cancel it now.
        </p>
      )}

      {blockedByHoliday && !isFuture && (
        <div className="flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>It's a holiday ({holidayFor(item.date, item.course, data)}), so this class isn't expected.</p>
          <button
            type="button"
            onClick={() => setForceOpen(true)}
            className="self-start rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50"
          >
            Class was held, mark it
          </button>
        </div>
      )}

      {!isFuture && !blockedByHoliday && (
        <>
          {students.length === 0 ? (
            <p className="text-xs text-slate-500">No students are enrolled in this class yet.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-600">
                  {item.batch ? `Batch ${item.batch}` : `Sec ${item.course.section}`} students only · {counts[0]} present · {counts[1]} late · {counts[2]} absent
                </p>
                <button
                  type="button"
                  onClick={() => setStatuses(Object.fromEntries(students.map((s) => [s.id, 'present'])))}
                  className="text-xs font-bold text-brand-700 hover:underline"
                >
                  Mark all present
                </button>
              </div>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {students.map((s) => (
                  <li key={s.id} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-slate-900">{s.name}</span>
                      <span className="block text-[11px] text-slate-500">{s.usn || s.roll_no || s.id}</span>
                    </span>
                    <span className="flex gap-1.5" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
                      {MARKS.map((m) => {
                        const on = statuses[s.id] === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: m.id }))}
                            className={cn(
                              'rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors',
                              on ? m.on : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            )}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {cancelling ? (
          <form
            className="flex flex-1 flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim()) onCancelClass(reason);
            }}
          >
            <label className="flex-1">
              <span className="sr-only">Reason for cancelling</span>
              <input
                autoFocus
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason, for example: teacher on leave"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400"
              />
            </label>
            <span className="flex gap-2">
              <button
                type="submit"
                disabled={!reason.trim()}
                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:bg-slate-300"
              >
                Cancel class
              </button>
              <button
                type="button"
                onClick={() => setCancelling(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
              >
                Keep it
              </button>
            </span>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCancelling(true)}
            className="flex items-center gap-1.5 self-start text-xs font-bold text-rose-700 hover:underline"
          >
            <XCircle className="h-3.5 w-3.5" />
            Class didn't happen? Cancel it
          </button>
        )}

        {!isFuture && !blockedByHoliday && students.length > 0 && !cancelling && (
          <button
            type="button"
            onClick={() => onSave(statuses)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            {status === 'marked' ? 'Save changes' : 'Save attendance'}
          </button>
        )}
      </div>
    </div>
  );
}

function ExtraClassForm({ courses, date, minDate, onAdd, onCancel }) {
  const sorted = [...courses].sort((a, b) => a.code.localeCompare(b.code) || String(a.section).localeCompare(String(b.section)));
  const [courseId, setCourseId] = useState(sorted[0]?.id || '');
  const [day, setDay] = useState(date < minDate ? minDate : date);
  const [start, setStart] = useState('15:00');
  const [end, setEnd] = useState('16:00');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-400';

  return (
    <form
      className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (end <= start) return setError('End time must be after the start time.');
        if (day < minDate) return setError(`Pick a date within the last ${EDIT_WINDOW_DAYS} days or later.`);
        onAdd({ course: courses.find((c) => c.id === courseId), date: day, start_time: start, end_time: end, room: room.trim() });
      }}
    >
      <label className="lg:col-span-2">
        <span className="mb-1 block text-xs font-bold text-slate-700">Class</span>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={field}>
          {sorted.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} · Sem {c.semester} · Sec {c.section} · {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-slate-700">Date</span>
        <input type="date" value={day} min={minDate} onChange={(e) => { setDay(e.target.value); setError(''); }} className={field} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-slate-700">Starts</span>
        <input type="time" value={start} onChange={(e) => { setStart(e.target.value); setError(''); }} className={field} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-slate-700">Ends</span>
        <input type="time" value={end} onChange={(e) => { setEnd(e.target.value); setError(''); }} className={field} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-slate-700">Room</span>
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="LH-101" className={field} />
      </label>
      {error && <p className="text-xs font-semibold text-rose-700 sm:col-span-2 lg:col-span-6">{error}</p>}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
        <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600">
          Add extra class
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
          Close
        </button>
      </div>
    </form>
  );
}
