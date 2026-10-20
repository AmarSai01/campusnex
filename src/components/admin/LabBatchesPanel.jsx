import React, { useState } from 'react';
import { Users, Shuffle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import { BATCHES, batchLabel, splitEvenly } from '../../utils/batches';

// Admin: split a class into lab batches. Students without a batch see every batch's labs.
export default function LabBatchesPanel({ deptId, semester, section, classLabel }) {
  const { users, setStudentBatches } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState({});
  const [batchCount, setBatchCount] = useState(2);
  const [notice, setNotice] = useState('');

  const students = users
    .filter(u =>
      u.role === 'student' &&
      u.status !== 'inactive' &&
      u.department_id === deptId &&
      Number(u.semester) === Number(semester) &&
      u.section === section
    )
    .sort((a, b) => String(a.usn || a.name).localeCompare(String(b.usn || b.name)));

  const counts = BATCHES.map(b => [b, students.filter(s => s.batch === b).length]).filter(([, n]) => n > 0);
  const unassigned = students.filter(s => !s.batch).length;

  const openEditor = () => {
    setDraft(Object.fromEntries(students.map(s => [s.id, s.batch || ''])));
    const used = BATCHES.filter(b => students.some(s => s.batch === b)).length;
    setBatchCount(Math.max(2, used));
    setNotice('');
    setIsOpen(true);
  };

  const save = () => {
    setStudentBatches(Object.fromEntries(Object.entries(draft).map(([id, b]) => [id, b || null])));
    setIsOpen(false);
    setNotice(`Lab batches saved for ${classLabel}.`);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Users className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" /> Lab batches
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500" aria-live="polite">
          {notice || (students.length === 0
            ? 'No students in this class yet.'
            : [
                ...counts.map(([b, n]) => `${batchLabel(b)}: ${n}`),
                unassigned ? `${unassigned} not assigned (they see every batch's labs)` : null
              ].filter(Boolean).join(' · '))}
        </p>
      </div>
      <button
        type="button"
        onClick={openEditor}
        disabled={students.length === 0}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        Manage batches
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Lab batches · ${classLabel}`}
        subtitle="Split the class for labs. Each batch only sees its own lab slots."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="block text-xs font-bold text-slate-700">
              Number of batches
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                {[2, 3, 4].map(n => <option key={n} value={n}>{n} batches</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setDraft(splitEvenly(students, batchCount))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5" aria-hidden="true" /> Split evenly by USN
            </button>
          </div>

          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
            {students.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-900">{s.name}</span>
                  <span className="block text-[11px] text-slate-500">{s.usn || '—'}</span>
                </span>
                <select
                  value={draft[s.id] || ''}
                  onChange={(e) => setDraft(prev => ({ ...prev, [s.id]: e.target.value }))}
                  aria-label={`Batch for ${s.name}`}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value="">Not assigned</option>
                  {BATCHES.slice(0, Math.max(batchCount, ...BATCHES.map((b, i) => (draft[s.id] === b ? i + 1 : 0)))).map(b => (
                    <option key={b} value={b}>{batchLabel(b)}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md cursor-pointer"
            >
              Save batches
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
