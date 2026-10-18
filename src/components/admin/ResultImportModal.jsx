import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileUp, RefreshCw, Upload } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import { downloadCsv } from '../../utils/exportReport';
import { parseCsv } from '../../utils/studentImport';
import { RESULT_COLUMNS, validateResultImport } from '../../utils/results';

// Upload the university result file, review every row, then save the valid ones (hidden until published).
export default function ResultImportModal({ isOpen, onClose, onImported }) {
  const { users, results = [], importResults } = useData();
  const fileInput = useRef(null);
  const [step, setStep] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [rows, setRows] = useState([]);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [saved, setSaved] = useState(0);

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
      setFileError('Excel files must be saved as CSV first: File → Save As → "CSV UTF-8 (Comma delimited)".');
      return;
    }
    const check = validateResultImport({ rows: parseCsv(await file.text()), users, existing: results });
    if (check.error) return setFileError(check.error);
    if (!check.rows.length) return setFileError('No result rows found under the header.');
    setFileName(file.name);
    setRows(check.rows);
    setStep('preview');
  };

  const valid = rows.filter((r) => r.result);
  const problems = rows.filter((r) => !r.result);
  const updates = valid.filter((r) => r.updates).length;

  const handleImport = () => {
    setSaved(importResults(valid.map((r) => r.result)));
    setStep('done');
    onImported?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import semester results"
      subtitle="Upload the university result file. Results stay hidden from students until you publish the semester."
      maxWidth="max-w-4xl"
    >
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="text-xs leading-relaxed text-slate-600">
            <p>One row per student per subject, with these columns:</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {RESULT_COLUMNS.map((c) => (
                <span key={c} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">{c}</span>
              ))}
            </div>
            <p className="mt-2">
              COURSE NAME, CIE and SEE are optional. Give either the <strong>GRADE</strong> (O, A+, A, B+, B, C, P, F) or the
              <strong> TOTAL</strong> out of 100, and the grade is worked out on the 10-point scale. Uploading the same student,
              semester and course again updates it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv('campusnex-results-template.csv', RESULT_COLUMNS, [])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Download template
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
            <input ref={fileInput} type="file" accept=".csv,.tsv,.txt,text/csv" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          {fileError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {fileError}
            </div>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{fileName}</strong> · {rows.length} rows ·{' '}
              <span className="font-bold text-emerald-700">{valid.length} ready</span>
              {updates > 0 && <> · <span className="font-bold text-sky-700">{updates} will update existing results</span></>}
              {problems.length > 0 && <> · <span className="font-bold text-rose-700">{problems.length} with problems (skipped)</span></>}
            </p>
            {problems.length > 0 && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} className="h-3.5 w-3.5 accent-brand-600" />
                Only problems
              </label>
            )}
          </div>
          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <tr>
                  {['Row', 'USN', 'Sem', 'Course', 'Credits', 'Total', 'Grade', 'Status'].map((h) => (
                    <th key={h} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(onlyProblems ? problems : rows).map((r) => (
                  <tr key={r.line} className={r.result ? '' : 'bg-rose-50/60'}>
                    <td className="px-3 py-2 text-slate-500">{r.line}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-900">{r.values.usn || '—'}</td>
                    <td className="px-3 py-2">{r.values.semester || '—'}</td>
                    <td className="px-3 py-2">{r.values.code || '—'} <span className="text-slate-500">{r.values.name}</span></td>
                    <td className="px-3 py-2">{r.values.credits || '—'}</td>
                    <td className="px-3 py-2">{r.values.total || '—'}</td>
                    <td className="px-3 py-2 font-bold">{r.result?.grade || r.values.grade || '—'}</td>
                    <td className="px-3 py-2">
                      {r.result ? (
                        r.updates ? (
                          <span className="inline-flex items-center gap-1 font-bold text-sky-700"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Updates existing</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> New</span>
                        )
                      ) : (
                        <ul className="space-y-0.5 font-semibold text-rose-700">{r.errors.map((e) => <li key={e}>{e}</li>)}</ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={reset} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Choose a different file
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!valid.length}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" /> Save {valid.length} result{valid.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-slate-900">{saved} result{saved === 1 ? '' : 's'} saved</p>
            <p className="mt-1 text-xs text-slate-600">Students can't see them yet. Publish the semester when you're ready.</p>
          </div>
          <button type="button" onClick={handleClose} className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl cursor-pointer">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
