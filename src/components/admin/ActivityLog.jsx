import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  History,
  Download,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Trophy,
  BookOpen,
  Building2,
  Clock,
  CalendarDays,
  BadgeCheck,
  Layers,
  Megaphone,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData } from '../../context/DataContext';
import {
  ACTIVITY_CATEGORIES,
  activityCsv,
  describeEntry,
  groupEntries,
  groupText,
  makeLookup
} from '../../utils/activityLog';

const CATEGORY_STYLE = {
  users: [Users, 'bg-sky-50 text-sky-700'],
  results: [Trophy, 'bg-emerald-50 text-emerald-700'],
  courses: [BookOpen, 'bg-amber-50 text-amber-800'],
  departments: [Building2, 'bg-violet-50 text-violet-700'],
  timetable: [Clock, 'bg-orange-50 text-orange-700'],
  calendars: [CalendarDays, 'bg-indigo-50 text-indigo-700'],
  class_roles: [BadgeCheck, 'bg-violet-50 text-violet-700'],
  exams: [Layers, 'bg-rose-50 text-rose-700'],
  broadcasts: [Megaphone, 'bg-slate-100 text-slate-700']
};

const PERIODS = { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days', 0: 'All time' };
const MAX_ROWS = 1000;

const selectClass = 'px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:outline-none';

const dayKey = (iso) => new Date(iso).toDateString();
const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
};
const timeLabel = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

// Admin: every important change an admin made, who made it and when. Read only.
export default function ActivityLog() {
  const { users, departments, courses, whenSynced } = useData();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7');
  const [category, setCategory] = useState('');
  const [actor, setActor] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [notice, setNotice] = useState('');

  const lookup = useMemo(() => makeLookup({ users, departments, courses }), [users, departments, courses]);

  const load = useCallback(async () => {
    setLoading(true);
    let request = supabase.from('admin_activity').select('*').order('created_at', { ascending: false }).limit(MAX_ROWS);
    if (period !== '0') {
      const since = new Date();
      since.setDate(since.getDate() - Number(period));
      request = request.gte('created_at', since.toISOString());
    }
    const { data, error: loadError } = await request;
    if (loadError) setError(`Couldn't load the activity log: ${loadError.message}`);
    else {
      setError('');
      setEntries(data);
    }
    setLoading(false);
  }, [period]);

  // Wait for this tab's own pending saves so they show up in the log.
  const whenSyncedRef = useRef(whenSynced);
  useEffect(() => {
    whenSyncedRef.current = whenSynced;
  });
  useEffect(() => {
    whenSyncedRef.current().then(load);
  }, [load]);

  const admins = useMemo(() => {
    const ids = new Set(entries.map(e => e.actor_id).filter(Boolean));
    return [...ids].map(id => ({ id, name: lookup.userName(id) || 'Unknown admin' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, lookup]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(e => {
      if (category && e.category !== category) return false;
      if (actor && e.actor_id !== actor) return false;
      if (!q) return true;
      const { text, details } = describeEntry(e, lookup);
      return `${text} ${details.flat().join(' ')} ${lookup.userName(e.actor_id) || ''}`.toLowerCase().includes(q);
    });
  }, [entries, category, actor, query, lookup]);

  const groups = useMemo(() => groupEntries(filtered), [filtered]);

  const exportCsv = () => {
    if (!filtered.length) return;
    const url = URL.createObjectURL(new Blob(['﻿', activityCsv(filtered, lookup)],{ type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`Downloaded ${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}.`);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            Activity Log
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Every important admin change, who made it and when. Entries can't be edited or deleted.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={load}
            aria-label="Refresh"
            title="Refresh"
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!filtered.length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">{notice}</div>
      )}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a name, course or USN"
              aria-label="Search activity"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="Admin" className={selectClass}>
            <option value="">All admins</option>
            {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period" className={selectClass}>
            {Object.entries(PERIODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
          {[['', 'All'], ...Object.entries(ACTIVITY_CATEGORIES)].map(([key, label]) => (
            <button
              key={key || 'all'}
              type="button"
              aria-pressed={category === key}
              onClick={() => setCategory(key)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                category === key ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading && !entries.length ? (
          <p className="px-5 py-10 text-center text-xs text-slate-500">Loading activity…</p>
        ) : groups.length === 0 ? (
          <p className="px-5 py-10 text-center text-xs text-slate-500">
            {entries.length ? 'No activity matches these filters.' : `No admin changes in the ${PERIODS[period].toLowerCase()}.`}
          </p>
        ) : (
          <ul>
            {groups.map((group, i) => {
              const first = group.entries[0];
              const [Icon, tone] = CATEGORY_STYLE[first.category] || [History, 'bg-slate-100 text-slate-700'];
              const open = openId === group.id;
              const single = group.entries.length === 1;
              const { details } = describeEntry(first, lookup);
              const expandable = single ? details.length > 0 : true;
              const showDay = i === 0 || dayKey(groups[i - 1].entries[0].created_at) !== dayKey(first.created_at);
              return (
                <React.Fragment key={group.id}>
                  {showDay && (
                    <li className="border-t border-slate-100 bg-slate-50 px-5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 first:border-t-0">
                      {dayLabel(first.created_at)}
                    </li>
                  )}
                  <li className="border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => expandable && setOpenId(open ? null : group.id)}
                      aria-expanded={expandable ? open : undefined}
                      className={`flex w-full items-start gap-3 px-5 py-3 text-left ${expandable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-slate-800">{groupText(group, lookup)}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {lookup.userName(first.actor_id) || 'Unknown admin'} · {timeLabel(first.created_at)} · {ACTIVITY_CATEGORIES[first.category] || first.category}
                        </span>
                      </span>
                      {expandable && (open
                        ? <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                        : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />)}
                    </button>
                    {open && (
                      <div className="px-5 pb-3 pl-16 text-xs">
                        {single ? (
                          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
                            {details.map(([label, value]) => (
                              <React.Fragment key={label}>
                                <dt className="text-slate-500">{label}</dt>
                                <dd className="text-slate-800">{value}</dd>
                              </React.Fragment>
                            ))}
                          </dl>
                        ) : (
                          <ul className="list-disc space-y-0.5 pl-4 text-slate-700">
                            {group.entries.slice(0, 50).map(e => <li key={e.id}>{describeEntry(e, lookup).text}</li>)}
                            {group.entries.length > 50 && <li className="text-slate-500">And {group.entries.length - 50} more. Export CSV to see them all.</li>}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        )}
      </div>

      {entries.length >= MAX_ROWS && (
        <p className="text-xs text-slate-500">Showing the latest {MAX_ROWS} changes. Pick a shorter period to see older ones.</p>
      )}
    </div>
  );
}
