import React, { useState } from 'react';
import { Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import { FACULTY_IMPORT_COLUMNS, facultyTemplateCsv, validateFacultyImport } from '../../utils/faculty';

const MAX_FILE_BYTES = 2 * 1024 * 1024;

// Admin: add or update many teachers from a CSV of name, email, department and designation.
export default function FacultyImportModal({ isOpen, onClose, onImported }) {
  const { users, departments, importFaculty } = useData();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState(null);

  const reset = () => {
    setText('');
    setFileName('');
    setResult(null);
  };

  const check = (value) => {
    setText(value);
    setResult(value.trim() ? validateFacultyImport(value, { users, departments }) : null);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setResult({ error: 'That file is over 2 MB. Split it into smaller files.' });
      return;
    }
    setFileName(file.name);
    file.text().then(check);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([facultyTemplateCsv()], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const rows = result?.rows || [];
  const added = rows.filter(r => !r.existingId).length;
  const updated = rows.length - added;

  const handleImport = () => {
    const outcome = importFaculty(rows);
    onImported?.(outcome);
    reset();
    onClose();
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Import faculty from CSV"
      subtitle={`Columns: ${FACULTY_IMPORT_COLUMNS.join(', ')}. Teachers whose email already exists are updated.`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Choose CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
            />
          </label>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Template
          </button>
          {fileName && <span className="text-xs text-slate-500">{fileName}</span>}
        </div>

        <label className="block text-xs font-bold text-slate-700">
          Or paste rows
          <textarea
            rows={5}
            value={text}
            onChange={(e) => { setFileName(''); check(e.target.value); }}
            placeholder={'NAME,EMAIL,DEPARTMENT,DESIGNATION\nKavya R,kavya.r@college.edu,CD,Assistant Professor'}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </label>

        {result?.error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> {result.error}
          </p>
        )}

        {result && !result.error && (
          <div className="space-y-2" aria-live="polite">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {rows.length} {rows.length === 1 ? 'row' : 'rows'} ready: {added} new, {updated} to update
            </p>
            {result.errors.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-bold">{result.errors.length} {result.errors.length === 1 ? 'row has' : 'rows have'} problems and will be skipped:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {result.errors.slice(0, 8).map(e => <li key={e.line}>Line {e.line}: {e.message}</li>)}
                  {result.errors.length > 8 && <li>and {result.errors.length - 8} more</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={close} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={rows.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Import {rows.length || ''} {rows.length === 1 ? 'teacher' : 'teachers'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
