import React from 'react';
import { Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';

// Shows the starting passwords returned by the admin-logins function, once.
// Campusnex doesn't store them, so the admin downloads the sheet here: everything in one file
// (sorted department → semester → section), or one file per class to send to its class
// coordinator or HOD. Staff are grouped per department.
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function downloadCsv(rows, filename) {
  const header = ['Department', 'Semester', 'Section', 'Name', 'Role', 'USN', 'Login email', 'Starting password'];
  const lines = [header, ...rows.map((r) => [r.dept, r.semester ?? '', r.section ?? '', r.name, r.roleLabel, r.usn || '', r.email, r.password])]
    .map((l) => l.map(csvCell).join(','));
  // The BOM makes Excel open the file as UTF-8.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ROLE_LABEL = { student: 'Student', faculty: 'Faculty', admin: 'Admin' };

export default function LoginSheetModal({ result, onClose }) {
  const { departments } = useData();
  if (!result) return null;

  const deptName = (id) => {
    const d = departments.find((x) => x.id === id);
    return d?.code || d?.name || 'No department';
  };
  const today = new Date().toISOString().slice(0, 10);

  const done = result.results
    .filter((r) => r.ok)
    .map((r) => {
      const dept = deptName(r.department_id);
      const isStudent = r.role === 'student';
      return {
        ...r,
        dept,
        roleLabel: ROLE_LABEL[r.role] || r.role,
        semester: isStudent ? r.semester : null,
        section: isStudent ? r.section : null,
        group: isStudent ? `${dept} · Sem ${r.semester ?? '?'} · Sec ${r.section ?? '?'}` : `${dept} · Staff`,
        // Students first by class, then staff, each sorted by name.
        sortKey: `${dept}|${isStudent ? 0 : 1}|${String(r.semester ?? 0).padStart(2, '0')}|${r.section ?? ''}|${r.name}`
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const failed = result.results.filter((r) => !r.ok);
  const groups = [...new Set(done.map((r) => r.group))].map((g) => ({ name: g, rows: done.filter((r) => r.group === g) }));
  const verb = result.action === 'reset' ? 'reset' : result.action === 'sync_email' ? 'updated' : 'created';

  // While the server function runs.
  if (result.loading) {
    return (
      <Modal isOpen onClose={() => {}} title={result.action === 'reset' ? 'Resetting password…' : 'Creating logins…'}>
        <div className="flex items-center gap-3 py-4 text-sm text-slate-700">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          {result.total > 1 ? `${result.done} / ${result.total} done` : 'One moment…'}
        </div>
      </Modal>
    );
  }

  // One person: a simple card with the details to hand over.
  if (result.results.length === 1 && done.length === 1) {
    const r = done[0];
    const text = `Campusnex login\nEmail: ${r.email}\nPassword: ${r.password}`;
    return (
      <Modal isOpen onClose={onClose} title={result.action === 'reset' ? `Password reset for ${r.name}` : `Login created for ${r.name}`} subtitle="Give them these details. Campusnex doesn't keep the password, so note it now.">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4 text-sm">
            <div className="flex justify-between gap-3 py-1"><span className="text-slate-500">Login email</span><b className="text-slate-900">{r.email}</b></div>
            <div className="flex justify-between gap-3 py-1"><span className="text-slate-500">Starting password</span><b className="font-mono text-brand-700">{r.password}</b></div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={(e) => { navigator.clipboard?.writeText(text); e.currentTarget.textContent = 'Copied'; }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Copy details
            </button>
            <button type="button" onClick={onClose} className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700">Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title={`Logins ${verb}`} subtitle="Download the sheets now: Campusnex doesn't keep these passwords, so it can't show them again.">
      <div className="space-y-4">
        {done.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {done.length} login{done.length === 1 ? '' : 's'} {verb} across {groups.length} {groups.length === 1 ? 'class' : 'classes and groups'}.
          </div>
        )}

        {groups.length > 0 && (
          <div className="max-h-80 space-y-3 overflow-auto pr-1">
            {groups.map((g) => (
              <div key={g.name} className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-bold text-slate-800">
                    {g.name} <span className="font-semibold text-slate-500">({g.rows.length})</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadCsv(g.rows, `campusnex-logins-${slug(g.name)}-${today}.csv`)}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:border-brand-300 hover:text-brand-700"
                  >
                    <Download className="h-3.5 w-3.5" /> This class
                  </button>
                </div>
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {g.rows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-1.5 font-semibold text-slate-900">{r.name}</td>
                        <td className="px-3 py-1.5 text-slate-600">{r.email}</td>
                        <td className="px-3 py-1.5 font-mono font-semibold text-brand-700">{r.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {failed.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              No login yet for {failed.length}
            </p>
            <ul className="mt-2 space-y-1">
              {failed.map((r) => (
                <li key={r.id}>
                  <span className="font-semibold">{r.name}</span>: {r.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {done.length > 0 && (
            <button
              type="button"
              onClick={() => downloadCsv(done, `campusnex-logins-all-${today}.csv`)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Download all (one sheet)
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
