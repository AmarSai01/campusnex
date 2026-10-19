import React, { useMemo, useState } from 'react';
import { Award, Eye, EyeOff, FileSpreadsheet, Upload } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import ResultImportModal from './ResultImportModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { gpa } from '../../utils/results';

// Admin: import semester results and publish them, semester by semester.
export default function ResultsManager() {
  const { users, departments, results = [], setResultsPublished } = useData();
  const [deptId, setDeptId] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmRequest, setConfirmRequest] = useState(null);

  const deptOf = useMemo(() => new Map(users.map((u) => [u.id, u.department_id])), [users]);
  const scoped = results.filter((r) => !deptId || deptOf.get(r.student_id) === deptId);

  const semesters = [...new Set(scoped.map((r) => r.semester))].sort((a, b) => a - b).map((semester) => {
    const rows = scoped.filter((r) => r.semester === semester);
    const students = [...new Set(rows.map((r) => r.student_id))];
    const sgpas = students.map((s) => gpa(rows.filter((r) => r.student_id === s))).filter((v) => v !== null);
    const publishedCount = rows.filter((r) => r.published).length;
    return {
      semester,
      students: students.length,
      subjects: new Set(rows.map((r) => r.course_code)).size,
      average: sgpas.length ? (sgpas.reduce((a, b) => a + b, 0) / sgpas.length).toFixed(2) : '—',
      failed: rows.filter((r) => r.grade === 'F').length,
      status: publishedCount === 0 ? 'hidden' : publishedCount === rows.length ? 'published' : 'partial',
    };
  });

  const deptLabel = deptId ? departments.find((d) => d.id === deptId)?.code : 'all departments';

  const toggle = (semester, publish, studentCount) => {
    setConfirmRequest({
      title: publish ? `Publish Semester ${semester} results?` : `Hide Semester ${semester} results?`,
      message: publish
        ? `${studentCount} ${studentCount === 1 ? 'student' : 'students'} in ${deptLabel} will see their SGPA and CGPA and get a notification. Check the numbers first.`
        : `Students in ${deptLabel} will no longer see their Semester ${semester} results until you publish again.`,
      confirmLabel: publish ? 'Publish results' : 'Hide results',
      tone: publish ? 'neutral' : 'danger',
      onConfirm: () => applyToggle(semester, publish)
    });
  };

  const applyToggle = (semester, publish) => {
    setResultsPublished(semester, deptId || null, publish);
    setNotice(publish
      ? `Semester ${semester} results published for ${deptLabel}. Students have been notified.`
      : `Semester ${semester} results hidden for ${deptLabel}.`);
    setTimeout(() => setNotice(''), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <Award className="h-5 w-5 text-brand-600" /> Semester Results
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Import the university result file, check it, then publish each semester. Students see only their own published SGPA and CGPA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            aria-label="Department"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 cursor-pointer"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">{notice}</div>
      )}

      {semesters.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Import your first results"
          description="Upload the university result file as CSV. Results stay hidden until you publish them."
          actionLabel="Import CSV"
          onAction={() => setImportOpen(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
              <tr>
                {['Semester', 'Students', 'Subjects', 'Average SGPA', 'Fails', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {semesters.map((s) => (
                <tr key={s.semester}>
                  <td className="px-5 py-3 font-bold text-slate-900">Semester {s.semester}</td>
                  <td className="px-5 py-3 tabular-nums">{s.students}</td>
                  <td className="px-5 py-3 tabular-nums">{s.subjects}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{s.average}</td>
                  <td className="px-5 py-3 tabular-nums">{s.failed}</td>
                  <td className="px-5 py-3">
                    <Badge variant={s.status === 'published' ? 'success' : s.status === 'partial' ? 'warning' : 'neutral'} size="sm" dot>
                      {s.status === 'published' ? 'Published' : s.status === 'partial' ? 'Partly published' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.status !== 'published' ? (
                      <button type="button" onClick={() => toggle(s.semester, true, s.students)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer">
                        <Eye className="h-3.5 w-3.5" /> Publish
                      </button>
                    ) : (
                      <button type="button" onClick={() => toggle(s.semester, false, s.students)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                        <EyeOff className="h-3.5 w-3.5" /> Hide
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ResultImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}
