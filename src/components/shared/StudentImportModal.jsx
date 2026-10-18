import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileUp, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import { downloadCsv } from '../../utils/exportReport';
import { IMPORT_COLUMNS, MAX_IMPORT_ROWS, parseCsv, validateImport } from '../../utils/studentImport';

// Upload a CSV of students, review every row, then import the valid ones.
export default function StudentImportModal({ isOpen, onClose, allowedDepartments, onImported }) {
  const { currentUser } = useAuth();
  const { users, createStudentsBulk } = useData();
  const fileInput = useRef(null);

  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'done'
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [rows, setRows] = useState([]);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const reset = () => {
    setStep('upload');
    setFileName('');
    setFileError('');
    setRows([]);
    setOnlyProblems(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file) => {
    setFileError('');
    if (!file) return;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      setFileError('Excel files must be saved as CSV first: in Excel choose File → Save As → "CSV UTF-8 (Comma delimited)".');
      return;
    }
    const text = await file.text();
    const result = validateImport({ rows: parseCsv(text), users, allowedDepartments });
    if (result.error) {
      setFileError(result.error);
      return;
    }
    if (result.rows.length === 0) {
      setFileError('No student rows found under the header.');
      return;
    }
    setFileName(file.name);
    setRows(result.rows);
    setStep('preview');
  };

  const validRows = rows.filter((r) => r.student);
  const problemRows = rows.filter((r) => !r.student);
  const visibleRows = onlyProblems ? problemRows : rows;

  const handleImport = () => {
    const count = createStudentsBulk(validRows.map((r) => r.student), currentUser?.id);
    setImportedCount(count);
    setStep('done');
    onImported?.(count);
  };

  const downloadTemplate = () => downloadCsv('campusnex-student-import-template.csv', IMPORT_COLUMNS, []);

  const downloadProblems = () =>
    downloadCsv(
      'campusnex-import-problems.csv',
      [...IMPORT_COLUMNS, 'PROBLEMS'],
      problemRows.map((r) => [
        r.values.usn, r.values.name, r.values.semester, r.values.department, r.values.section, r.values.email,
        r.errors.join('; ')
      ])
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Students from CSV"
      subtitle="Add many students at once. Nothing is saved until you review the rows and confirm."
      maxWidth="max-w-4xl"
    >
      {step === 'upload' && (
        <div className="space-y-4">
          <ol className="space-y-2 text-xs text-slate-600">
            <li>
              <strong className="text-slate-800">1. Download the template</strong> and fill one student per row, with
              these columns in order:
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {IMPORT_COLUMNS.map((c) => (
                  <span key={c} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </li>
            <li>
              <strong className="text-slate-800">2. Use these values:</strong> USN like <code>1MJ23CD006</code>,
              semester 1–8, section A–Z, and the department code
              {allowedDepartments.length ? ` (${allowedDepartments.map((d) => d.code).join(', ')})` : ''}.
            </li>
            <li>
              <strong className="text-slate-800">3. Save as CSV</strong> (in Excel: File → Save As → "CSV UTF-8") and
              upload it below. Up to {MAX_IMPORT_ROWS} students per file.
            </li>
          </ol>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download template
          </button>

          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-brand-400 hover:bg-brand-50/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            <FileUp className="h-8 w-8 text-brand-600" aria-hidden="true" />
            <span className="text-sm font-bold text-slate-800">Choose a CSV file or drop it here</span>
            <span className="text-xs text-slate-500">.csv files only</span>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>

          {fileError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {fileError}
            </div>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{fileName}</strong> · {rows.length} rows ·{' '}
              <span className="font-bold text-emerald-700">{validRows.length} ready</span>
              {problemRows.length > 0 && (
                <>
                  {' · '}
                  <span className="font-bold text-rose-700">{problemRows.length} with problems (will be skipped)</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {problemRows.length > 0 && (
                <>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={onlyProblems}
                      onChange={(e) => setOnlyProblems(e.target.checked)}
                      className="h-3.5 w-3.5 accent-brand-600"
                    />
                    Only problems
                  </label>
                  <button
                    type="button"
                    onClick={downloadProblems}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Problem rows
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  {IMPORT_COLUMNS.map((c) => (
                    <th key={c} className="px-3 py-2">{c}</th>
                  ))}
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((r) => (
                  <tr key={r.line} className={r.student ? '' : 'bg-rose-50/60'}>
                    <td className="px-3 py-2 text-slate-500">{r.line}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-900">{r.values.usn || '—'}</td>
                    <td className="px-3 py-2 text-slate-900">{r.values.name || '—'}</td>
                    <td className="px-3 py-2">{r.values.semester || '—'}</td>
                    <td className="px-3 py-2">{r.values.department || '—'}</td>
                    <td className="px-3 py-2">{r.values.section || '—'}</td>
                    <td className="px-3 py-2 text-slate-600">{r.values.email || '—'}</td>
                    <td className="px-3 py-2">
                      {r.student ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Ready
                        </span>
                      ) : (
                        <ul className="space-y-0.5 font-semibold text-rose-700">
                          {r.errors.map((err) => (
                            <li key={err}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Choose a different file
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Import {validRows.length} student{validRows.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {importedCount} student{importedCount === 1 ? '' : 's'} added
            </p>
            <p className="mt-1 text-xs text-slate-600">
              They were enrolled in every course matching their department, semester and section.
              Each student now activates their own account from the login page with their email.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
