import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useData } from '../../context/DataContext';
import LoginSheetModal from './LoginSheetModal';

// Creates, resets or re-syncs logins through the admin-logins server function (admin only).
// Starting password: students = USN + date of birth (DDMMYYYY), staff = email name + date of birth.
// Usage: const { runLogins, loginSheet } = useLogins(); ... render {loginSheet} once.
const BATCH = 100;

async function callFunction(action, ids) {
  const { data, error } = await supabase.functions.invoke('admin-logins', { body: { action, profile_ids: ids } });
  if (error) {
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error || 'Could not reach the login service. Check your connection and try again.');
  }
  return data.results || [];
}

export function useLogins() {
  const { users, whenSaved, refreshData } = useData();
  const [result, setResult] = useState(null);

  // options.quiet: show the window only if something went wrong (used for email updates).
  const runLogins = async (action, ids, options = {}) => {
    if (!ids.length) return [];
    const nameOf = (id) => users.find((u) => u.id === id)?.name || 'New user';
    if (!options.quiet) setResult({ action, loading: true, done: 0, total: ids.length, results: [] });

    // New people must be saved in Supabase before their login can be created.
    await whenSaved(ids);

    const all = [];
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      try {
        const rows = await callFunction(action, chunk);
        all.push(...rows);
        const returned = new Set(rows.map((r) => r.id));
        chunk.filter((id) => !returned.has(id)).forEach((id) =>
          all.push({ id, name: nameOf(id), ok: false, error: 'Not saved yet. Open Edit and try again in a moment.' })
        );
      } catch (err) {
        chunk.forEach((id) => all.push({ id, name: nameOf(id), ok: false, error: err.message }));
      }
      if (!options.quiet) setResult((r) => r && { ...r, done: Math.min(i + chunk.length, ids.length) });
    }

    await refreshData();
    const failed = all.some((r) => !r.ok);
    if (!options.quiet || failed) setResult({ action, loading: false, results: all });
    return all;
  };

  const loginSheet = <LoginSheetModal result={result} onClose={() => setResult(null)} />;
  return { runLogins, loginSheet };
}
