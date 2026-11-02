import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Bell,
  Edit2,
  Plus,
  Download,
  FileText,
  Paperclip
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import {
  SEMESTER_CALENDAR_TYPES,
  SEMESTER_CALENDAR_TYPE_STYLES,
  calendarAppliesTo,
  describeDateChanges,
  formatDateRange,
  parseSemesterCalendar,
  parseSemesterCalendarCsv,
  semesterCalendarTemplateCsv
} from '../../utils/semesterCalendar';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const FILE_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';

const blankForm = () => ({ title: '', ref_no: '', semesters: [], department_id: '', paste: '' });

// Rows in the editor carry a client key; saved rows also keep their database id.
let rowKey = 0;
const toEditorRow = (item) => ({ key: `r${++rowKey}`, id: item.id, activity: item.activity, start_date: item.start_date, end_date: item.end_date || '', type: item.type });

function TypeChip({ type }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-bold ${SEMESTER_CALENDAR_TYPE_STYLES[type] || SEMESTER_CALENDAR_TYPE_STYLES.milestone}`}>
      {SEMESTER_CALENDAR_TYPES[type] || type}
    </span>
  );
}

const semesterList = (semesters) => {
  const list = [...semesters].sort((a, b) => a - b);
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : String(list[0] ?? '');
};

const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none';

// Admin: the full-semester schedule from the Controller of Examinations, kept apart from the
// Academic calendar's one-off holidays and events.
export default function SemesterCalendarManager() {
  const {
    semester_calendars = [],
    semester_calendar_items = [],
    departments,
    users,
    createSemesterCalendar,
    updateSemesterCalendar,
    publishSemesterCalendar,
    deleteSemesterCalendar,
    newSemesterCalendarId,
    uploadCalendarFile,
    removeCalendarFile,
    getStoredFileLink
  } = useData();

  // editor: null when closed; { mode: 'create' } or { mode: 'edit', calendar }.
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [rows, setRows] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [file, setFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const [notice, setNotice] = useState('');

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 6000);
  };

  const itemsByCalendar = useMemo(() => {
    const map = new Map();
    for (const item of semester_calendar_items) {
      if (!map.has(item.calendar_id)) map.set(item.calendar_id, []);
      map.get(item.calendar_id).push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_date.localeCompare(b.start_date) || a.sort_order - b.sort_order);
    }
    return map;
  }, [semester_calendar_items]);

  const sortedCalendars = [...semester_calendars].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at))
  );

  const reachCount = (calendar) =>
    users.filter(u => (u.role === 'student' || u.role === 'faculty') && calendarAppliesTo(calendar, u)).length;

  const draftReach = reachCount({ semesters: form.semesters, department_id: form.department_id || null });
  const editing = editor?.mode === 'edit' ? editor.calendar : null;
  const existingFile = editing?.attachment_url && !removeFile ? editing : null;

  const openCreate = () => {
    setEditor({ mode: 'create' });
    setForm(blankForm());
    setRows([]);
    setSkipped([]);
    setFile(null);
    setRemoveFile(false);
    setFormError('');
  };

  const openEdit = (calendar) => {
    setEditor({ mode: 'edit', calendar });
    setForm({
      title: calendar.title,
      ref_no: calendar.ref_no || '',
      semesters: calendar.semesters || [],
      department_id: calendar.department_id || '',
      paste: ''
    });
    setRows((itemsByCalendar.get(calendar.id) || []).map(toEditorRow));
    setSkipped([]);
    setFile(null);
    setRemoveFile(false);
    setFormError('');
  };

  const closeEditor = () => setEditor(null);

  // Pasted or uploaded rows are added below any rows already in the editor.
  const addParsedRows = (parsed) => {
    setRows(prev => [...prev, ...parsed.items.map(toEditorRow)]);
    setSkipped(prev => [...prev, ...parsed.skipped]);
    setFormError(parsed.error || '');
  };

  const handlePasteAdd = () => {
    if (!form.paste.trim()) return;
    addParsedRows(parseSemesterCalendar(form.paste));
    setForm(prev => ({ ...prev, paste: '' }));
  };

  const handleCsvFile = (csvFile) => {
    if (!csvFile) return;
    if (csvFile.size > 2 * 1024 * 1024) {
      setFormError('That CSV is over 2 MB. Split it into smaller files.');
      return;
    }
    csvFile.text().then(text => addParsedRows(parseSemesterCalendarCsv(text)));
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([semesterCalendarTemplateCsv()], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'semester-calendar-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOfficialCopy = (picked) => {
    if (!picked) return;
    if (!FILE_ACCEPT.split(',').includes(picked.type)) {
      setFormError('The official copy must be a PDF or a photo (JPG, PNG or WebP).');
      return;
    }
    if (picked.size > 10 * 1024 * 1024) {
      setFormError('The official copy must be 10 MB or smaller.');
      return;
    }
    setFile(picked);
    setFormError('');
  };

  const openStoredFile = async (url) => {
    try {
      const link = await getStoredFileLink(url);
      if (link) window.open(link, '_blank', 'noopener');
    } catch (err) {
      showNotice(err.message);
    }
  };

  const toggleSemester = (sem) => {
    setForm(prev => ({
      ...prev,
      semesters: prev.semesters.includes(sem) ? prev.semesters.filter(s => s !== sem) : [...prev.semesters, sem]
    }));
    setFormError('');
  };

  const updateRow = (key, fields) => setRows(prev => prev.map(r => (r.key === key ? { ...r, ...fields } : r)));
  const addBlankRow = () => setRows(prev => [...prev, toEditorRow({ activity: '', start_date: '', end_date: '', type: 'milestone' })]);

  // Rows ready to save, or an error message.
  const checkedRows = () => {
    for (const [i, r] of rows.entries()) {
      if (!r.activity.trim()) return { error: `Row ${i + 1} needs an activity.` };
      if (!r.start_date) return { error: `Row ${i + 1} (${r.activity}) needs a start date.` };
      if (r.end_date && r.end_date < r.start_date) return { error: `Row ${i + 1} (${r.activity}) ends before it starts.` };
    }
    return { items: rows.map(r => ({ id: r.id, activity: r.activity, start_date: r.start_date, end_date: r.end_date || null, type: r.type })) };
  };

  const fields = (items) => ({
    title: form.title,
    ref_no: form.ref_no,
    semesters: form.semesters,
    department_id: form.department_id,
    items
  });

  const saveNew = async (publish, items) => {
    setSaving(true);
    try {
      const id = newSemesterCalendarId();
      const attachment = file ? await uploadCalendarFile(id, file) : {};
      const calendar = createSemesterCalendar({ id, ...fields(items), ...attachment }, publish);
      closeEditor();
      setExpandedId(calendar.id);
      showNotice(publish
        ? `${calendar.title} published to Sem ${semesterList(calendar.semesters)}.`
        : `${calendar.title} saved as a draft. Only admins can see it until you publish.`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (items) => {
    setSaving(true);
    try {
      const calendar = editing;
      let attachment = { attachment_url: calendar.attachment_url, attachment_name: calendar.attachment_name };
      if (file) attachment = await uploadCalendarFile(calendar.id, file);
      else if (removeFile) attachment = { attachment_url: null, attachment_name: null };
      const result = updateSemesterCalendar(calendar.id, { ...fields(items), ...attachment });
      if ((file || removeFile) && calendar.attachment_url) removeCalendarFile(calendar.attachment_url);
      closeEditor();
      setExpandedId(calendar.id);
      showNotice(result.notified
        ? `${form.title.trim()} saved. ${result.changedCount} ${result.changedCount === 1 ? 'date change was' : 'date changes were'} sent to everyone it applies to.`
        : `${form.title.trim()} saved.`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (publish) => {
    setFormError('');
    if (!form.title.trim()) return setFormError('Give the calendar a title.');
    if (!form.semesters.length) return setFormError('Pick at least one semester.');
    if (!rows.length) return setFormError('Add at least one row: paste them, upload a CSV or add one by hand.');
    const checked = checkedRows();
    if (checked.error) return setFormError(checked.error);

    if (editing) {
      const oldRows = itemsByCalendar.get(editing.id) || [];
      const newRows = checked.items.map((r, i) => ({ ...r, id: r.id || `new_${i}` }));
      const changes = editing.status === 'published' ? describeDateChanges(oldRows, newRows) : null;
      if (!changes) return saveEdit(checked.items);
      const reach = reachCount({ semesters: form.semesters, department_id: form.department_id || null });
      return setConfirmRequest({
        title: `Save and tell ${reach} ${reach === 1 ? 'person' : 'people'}?`,
        message: `${changes.count} ${changes.count === 1 ? 'date has' : 'dates have'} changed on this published calendar, so everyone it applies to gets one notice: ${changes.summary}`,
        confirmLabel: 'Save and notify',
        tone: 'neutral',
        onConfirm: () => saveEdit(checked.items)
      });
    }

    if (!publish) return saveNew(false, checked.items);
    setConfirmRequest({
      title: `Publish ${form.title.trim()}?`,
      message: `${checked.items.length} dates go live for Sem ${semesterList(form.semesters)}, and ${draftReach} ${draftReach === 1 ? 'person gets' : 'people get'} one notification.`,
      confirmLabel: 'Publish calendar',
      tone: 'neutral',
      onConfirm: () => saveNew(true, checked.items)
    });
  };

  const askPublish = (calendar) => {
    const reach = reachCount(calendar);
    setConfirmRequest({
      title: `Publish ${calendar.title}?`,
      message: `It goes live for Sem ${semesterList(calendar.semesters)}, and ${reach} ${reach === 1 ? 'person gets' : 'people get'} one notification.`,
      confirmLabel: 'Publish calendar',
      tone: 'neutral',
      onConfirm: () => {
        publishSemesterCalendar(calendar.id);
        showNotice(`${calendar.title} published.`);
      }
    });
  };

  const askDelete = (calendar) => {
    const count = itemsByCalendar.get(calendar.id)?.length || 0;
    setConfirmRequest({
      title: `Delete ${calendar.title}?`,
      message: `This removes the calendar, its ${count} ${count === 1 ? 'date' : 'dates'}${calendar.attachment_url ? ' and its official copy' : ''}${calendar.status === 'published' ? ' for everyone who can see it' : ''}.`,
      confirmLabel: 'Delete calendar',
      onConfirm: () => {
        deleteSemesterCalendar(calendar.id);
        showNotice(`${calendar.title} deleted.`);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-brand-600" />
            Semester Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            The full-semester schedule from the Controller of Examinations: CIE tests, SEE, deadlines and results.
          </p>
        </div>
        {!editor && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Import circular</span>
          </button>
        )}
      </div>

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {editor && (
        <section className="rounded-2xl border border-brand-200 bg-white shadow-xs overflow-hidden" aria-labelledby="editor-title">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h3 id="editor-title" className="text-sm font-bold text-slate-900">
                {editing ? `Edit ${editing.title}` : 'Import semester calendar'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {editing
                  ? editing.status === 'published'
                    ? 'Change dates, add or remove rows. If dates change, everyone it applies to gets one notice.'
                    : 'This is a draft, so nobody is notified until you publish it.'
                  : 'Paste rows or upload a CSV, check the rows, then publish once.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeEditor}
              aria-label="Close editor"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-5">
            {formError && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
                Title *
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => { setForm({ ...form, title: e.target.value }); setFormError(''); }}
                  placeholder="Academic Calendar 2024-25 · Even semester"
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Circular reference
                <input
                  type="text"
                  value={form.ref_no}
                  onChange={(e) => setForm({ ...form, ref_no: e.target.value })}
                  placeholder="MVJCE/COE/2024-25/133"
                  className={`mt-1 ${inputClass}`}
                />
              </label>

              <fieldset className="sm:col-span-2">
                <legend className="text-xs font-bold text-slate-700">Semesters *</legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {SEMESTERS.map(sem => {
                    const on = form.semesters.includes(sem);
                    return (
                      <button
                        key={sem}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSemester(sem)}
                        className={`h-8 min-w-9 rounded-lg border px-2.5 text-xs font-bold transition-colors cursor-pointer ${
                          on ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sem}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="block text-xs font-bold text-slate-700">
                Departments
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className={`mt-1 ${inputClass} font-semibold text-slate-700 bg-white`}
                >
                  <option value="">All departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code} · {d.name}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Official copy */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <p className="text-xs font-bold text-slate-700">Official copy <span className="font-normal text-slate-500">(optional, PDF or photo up to 10 MB)</span></p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {file ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700">
                    <Paperclip className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> {file.name}
                    <span className="text-emerald-700">· uploads when you save</span>
                  </span>
                ) : existingFile ? (
                  <button
                    type="button"
                    onClick={() => openStoredFile(existingFile.attachment_url)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-brand-700 hover:bg-brand-50 cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {existingFile.attachment_name || 'Official copy'}
                  </button>
                ) : (
                  <span className="text-slate-500">{removeFile ? 'The official copy will be removed when you save.' : 'No file attached.'}</span>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {file || existingFile ? 'Replace' : 'Attach file'}
                  <input
                    type="file"
                    accept={FILE_ACCEPT}
                    className="sr-only"
                    onChange={(e) => { handleOfficialCopy(e.target.files?.[0]); e.target.value = ''; }}
                  />
                </label>
                {(file || existingFile) && (
                  <button
                    type="button"
                    onClick={() => { if (file) setFile(null); else setRemoveFile(true); }}
                    className="rounded-lg px-2 py-1.5 font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Adding rows */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Paste rows
                  <span className="ml-1 font-normal text-slate-500">Activity, then a date or range, one per line.</span>
                  <textarea
                    rows={4}
                    value={form.paste}
                    onChange={(e) => setForm({ ...form, paste: e.target.value })}
                    placeholder={'First CIE Test\t24.03.2025 to 27.03.2025\nLast Working Day\t31.05.2025'}
                    className={`mt-1 ${inputClass} font-mono`}
                  />
                </label>
                <button
                  type="button"
                  onClick={handlePasteAdd}
                  disabled={!form.paste.trim()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add pasted rows
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Or upload a CSV</p>
                <p className="text-[11px] text-slate-500">Columns: ACTIVITY, START DATE, END DATE, TYPE. End date and type are optional.</p>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Choose CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(e) => { handleCsvFile(e.target.files?.[0]); e.target.value = ''; }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" /> Template
                  </button>
                </div>
              </div>
            </div>

            {skipped.length > 0 && (
              <details className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <summary className="cursor-pointer font-bold">
                  {skipped.length} {skipped.length === 1 ? 'line' : 'lines'} skipped (no valid date)
                </summary>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5 font-mono text-[11px]">
                  {skipped.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </details>
            )}

            {/* Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">{rows.length}</strong> {rows.length === 1 ? 'row' : 'rows'}.
                  {rows.length > 0 && ' Types are guessed from the activity; change any that are wrong.'}
                </p>
                <button
                  type="button"
                  onClick={addBlankRow}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add row
                </button>
              </div>
              {rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Activity</th>
                        <th className="px-3 py-2 w-36">Start</th>
                        <th className="px-3 py-2 w-36">End (if a range)</th>
                        <th className="px-3 py-2 w-40">Type</th>
                        <th className="px-3 py-2 w-10"><span className="sr-only">Remove</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={row.key}>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={row.activity}
                              onChange={(e) => updateRow(row.key, { activity: e.target.value })}
                              aria-label={`Activity, row ${i + 1}`}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-800"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={row.start_date}
                              onChange={(e) => updateRow(row.key, { start_date: e.target.value })}
                              aria-label={`Start date for ${row.activity || `row ${i + 1}`}`}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={row.end_date}
                              onChange={(e) => updateRow(row.key, { end_date: e.target.value })}
                              aria-label={`End date for ${row.activity || `row ${i + 1}`}`}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={row.type}
                              onChange={(e) => updateRow(row.key, { type: e.target.value })}
                              aria-label={`Type for ${row.activity || `row ${i + 1}`}`}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                            >
                              {Object.entries(SEMESTER_CALENDAR_TYPES).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => setRows(prev => prev.filter(r => r.key !== row.key))}
                              aria-label={`Remove ${row.activity || `row ${i + 1}`}`}
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Bell className="h-3.5 w-3.5" />
              {editing
                ? editing.status === 'published'
                  ? 'If dates change, everyone it applies to gets one notice.'
                  : 'Draft: nobody is notified.'
                : form.semesters.length
                  ? `Publishing sends 1 notification each to ${draftReach} ${draftReach === 1 ? 'person' : 'people'} in Sem ${semesterList(form.semesters)}`
                  : 'Pick the semesters this calendar is for'}
            </span>
            <div className="flex items-center gap-2">
              {editing ? (
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    Save as draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {saving ? 'Saving…' : 'Publish calendar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {!editor && sortedCalendars.length === 0 && (
        <EmptyState
          icon={CalendarRange}
          title="Import your first semester calendar"
          description="Paste the rows from the COE circular or upload a CSV. Dates stay hidden from students until you publish."
          actionLabel="Import circular"
          onAction={openCreate}
        />
      )}

      <div className="space-y-3">
        {sortedCalendars.map(calendar => {
          const rowsOf = itemsByCalendar.get(calendar.id) || [];
          const dept = departments.find(d => d.id === calendar.department_id);
          const expanded = expandedId === calendar.id;
          const published = calendar.status === 'published';
          return (
            <article key={calendar.id} className="rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{calendar.title}</h3>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {[
                      calendar.ref_no && `Ref ${calendar.ref_no}`,
                      `Sem ${semesterList(calendar.semesters || [])}`,
                      dept ? dept.code : 'All departments',
                      `${rowsOf.length} ${rowsOf.length === 1 ? 'date' : 'dates'}`
                    ].filter(Boolean).join(' · ')}
                  </p>
                  {calendar.attachment_url && (
                    <button
                      type="button"
                      onClick={() => openStoredFile(calendar.attachment_url)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Official copy
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {!published && (
                    <button
                      type="button"
                      onClick={() => askPublish(calendar)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" /> Publish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(calendar)}
                    disabled={Boolean(editor)}
                    aria-label={`Edit ${calendar.title}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : calendar.id)}
                    aria-expanded={expanded}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expanded ? 'Hide dates' : 'View dates'}
                  </button>
                  <button
                    type="button"
                    onClick={() => askDelete(calendar)}
                    aria-label={`Delete ${calendar.title}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {expanded && (
                <div className="overflow-x-auto border-t border-slate-100">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {rowsOf.map(row => (
                        <tr key={row.id}>
                          <td className="w-48 whitespace-nowrap px-5 py-2 font-semibold text-slate-700 tabular-nums">
                            {formatDateRange(row.start_date, row.end_date)}
                          </td>
                          <td className="px-3 py-2 text-slate-800">{row.activity}</td>
                          <td className="px-5 py-2 text-right"><TypeChip type={row.type} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}
