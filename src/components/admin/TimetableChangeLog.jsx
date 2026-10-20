import React, { useCallback, useEffect, useRef, useState } from 'react';
import { History, Undo2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { detectTimetableConflict } from '../../utils/conflictDetector';
import { formatTimeRange } from '../../utils/time';
import { batchLabel } from '../../utils/batches';

const SLOT_FIELDS = ['course_id', 'section', 'batch', 'day_of_week', 'start_time', 'end_time', 'room', 'faculty_id'];
const sameSlot = (a, b) => Boolean(a && b) && SLOT_FIELDS.every(f => (a[f] ?? null) === (b[f] ?? null));

const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Admin: every timetable change (written by a database trigger), newest first, with Undo.
export default function TimetableChangeLog({ refreshKey = 0 }) {
  const { timetable, courses, users, saveTimetableSlot, deleteTimetableSlot, whenSynced } = useData();
  const { currentUser } = useAuth();
  const [changes, setChanges] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('timetable_changes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (loadError) setError(`Couldn't load recent changes: ${loadError.message}`);
    else {
      setError('');
      setChanges(data);
    }
  }, []);

  // whenSynced is a new function every render; keep the latest in a ref so the effect
  // only reruns when refreshKey changes.
  const whenSyncedRef = useRef(whenSynced);
  useEffect(() => {
    whenSyncedRef.current = whenSynced;
  });
  useEffect(() => {
    whenSyncedRef.current().then(load);
  }, [refreshKey, load]);

  const slotText = (slot) => {
    if (!slot) return '';
    const batch = slot.batch ? ` · ${batchLabel(slot.batch)}` : '';
    return `${slot.day_of_week?.slice(0, 3)} ${formatTimeRange(slot.start_time, slot.end_time)}, Room ${slot.room}${batch}`;
  };

  const describe = (change) => {
    const course = courses.find(c => c.id === change.course_id);
    const subject = course ? `${course.code} ${course.name}` : 'a class';
    const who = users.find(u => u.id === change.changed_by)?.name || 'Imported data';
    if (change.action === 'added') return { who, text: `added ${subject}`, detail: slotText(change.after) };
    if (change.action === 'removed') return { who, text: `removed ${subject}`, detail: slotText(change.before) };
    return { who, text: `changed ${subject}`, detail: `${slotText(change.before)} → ${slotText(change.after)}` };
  };

  // Undo only when the slot still looks exactly as this change left it.
  const undoState = (change) => {
    if (change.undone_at) return 'undone';
    const current = timetable.find(s => s.id === change.slot_id);
    if (change.action === 'removed') return current ? 'stale' : 'ready';
    return sameSlot(current, change.after) ? 'ready' : 'stale';
  };

  const undo = async (change) => {
    setError('');
    if (change.action !== 'added') {
      const restored = change.before;
      const clash = detectTimetableConflict(restored, timetable, courses, users);
      if (clash.hasConflict) {
        setError(`Can't undo: ${clash.conflicts[0].message}`);
        return;
      }
    }
    setBusyId(change.id);
    if (change.action === 'added') deleteTimetableSlot(change.slot_id);
    else saveTimetableSlot(change.before);

    const { error: markError } = await supabase
      .from('timetable_changes')
      .update({ undone_at: new Date().toISOString(), undone_by: currentUser?.id || null })
      .eq('id', change.id);
    if (markError) setError(`Undone, but couldn't mark it in the log: ${markError.message}`);
    await whenSynced();
    await load();
    setBusyId(null);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs" aria-labelledby="tt-log-title">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h3 id="tt-log-title" className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <History className="h-4 w-4 text-brand-600" aria-hidden="true" /> Recent timetable changes
        </h3>
        <button type="button" onClick={load} className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer">
          Refresh
        </button>
      </div>
      {error && (
        <p role="alert" className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
      {changes.length === 0 ? (
        <p className="px-6 py-6 text-center text-xs text-slate-500">
          No changes yet. Every change by an admin, teacher or HOD shows up here.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {changes.map(change => {
            const { who, text, detail } = describe(change);
            const state = undoState(change);
            const byTeacher = change.changed_by_role === 'faculty';
            return (
              <li key={change.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-3">
                <div className="min-w-0 text-xs">
                  <p className="text-slate-800">
                    <span className="font-bold">{who}</span>
                    {byTeacher && <span className="ml-1.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Teacher</span>}
                    {' '}{text}
                  </p>
                  <p className="mt-0.5 text-slate-500">{detail}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(change.created_at)}</p>
                </div>
                {state === 'undone' && <span className="text-[11px] font-semibold text-slate-400">Undone</span>}
                {state === 'stale' && <span className="text-[11px] font-semibold text-slate-400">Changed again since</span>}
                {state === 'ready' && (
                  <button
                    type="button"
                    onClick={() => undo(change)}
                    disabled={busyId === change.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> {busyId === change.id ? 'Undoing…' : 'Undo'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
