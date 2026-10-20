import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Handshake, Mail, Phone, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';

// Admin: pilot requests sent from the landing page form, newest first.
// These live outside the shared data sync; the list loads straight from the database.

const STATUSES = [
  { id: 'new', label: 'New', variant: 'primary' },
  { id: 'contacted', label: 'Contacted', variant: 'warning' },
  { id: 'closed', label: 'Closed', variant: 'neutral' },
];
const PLAN_LABEL = { pilot: 'Department pilot', institution: 'Whole institution' };

const formatWhen = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const formatPhone = (p) => p.replace(/(\d{5})(\d{5})/, '$1 $2');

export default function PilotRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('new');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('pilot_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (err) setError('Pilot requests could not be loaded. Try again.');
    else {
      setError('');
      setRequests(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s.id, requests.filter((r) => r.status === s.id).length])),
    [requests]
  );
  const shown = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const setStatus = async (id, status) => {
    const before = requests;
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error: err } = await supabase.from('pilot_requests').update({ status }).eq('id', id);
    if (err) {
      setRequests(before);
      setError('The status could not be saved. Try again.');
    }
  };

  const remove = (request) =>
    setConfirm({
      title: 'Delete this pilot request?',
      message: `The request from ${request.name} at ${request.college} will be removed permanently.`,
      confirmLabel: 'Delete request',
      tone: 'danger',
      onConfirm: async () => {
        const { error: err } = await supabase.from('pilot_requests').delete().eq('id', request.id);
        if (err) setError('The request could not be deleted. Try again.');
        else setRequests((list) => list.filter((r) => r.id !== request.id));
      },
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <Handshake className="h-5 w-5 text-brand-600" /> Pilot Requests
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Colleges that asked for a pilot from the website. Call them, then mark each request as contacted or closed.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {[...STATUSES, { id: 'all', label: 'All' }].map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={filter === s.id}
            onClick={() => setFilter(s.id)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              filter === s.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.label} {s.id === 'all' ? requests.length : counts[s.id]}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {!loading && shown.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={filter === 'new' ? 'No new pilot requests' : 'No pilot requests here'}
          description="Requests sent from the Request a pilot form on the website appear here."
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{r.college}</h3>
                    <Badge variant="info" size="sm">{PLAN_LABEL[r.plan]}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {r.name}, {r.role}. {r.city}
                    {r.departments ? `, ${r.departments} ${r.departments === 1 ? 'department' : 'departments'}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Received {formatWhen(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => setStatus(r.id, e.target.value)}
                    aria-label={`Status of the request from ${r.college}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    aria-label={`Delete the request from ${r.college}`}
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:+91${r.phone}`} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700">
                  <Phone className="h-3.5 w-3.5" /> +91 {formatPhone(r.phone)}
                </a>
                {r.email && (
                  <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Mail className="h-3.5 w-3.5" /> {r.email}
                  </a>
                )}
              </div>
              {r.message && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{r.message}</p>}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
