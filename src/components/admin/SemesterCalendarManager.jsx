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
  Bell
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import {
  SEMESTER_CALENDAR_TYPES,
  SEMESTER_CALENDAR_TYPE_STYLES,
  calendarAppliesTo,
  formatDateRange,
  parseSemesterCalendar
} from '../../utils/semesterCalendar';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const blankForm = () => ({ title: '', ref_no: '', semesters: [], department_id: '', paste: '' });

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

// Admin: the full-semester schedule from the Controller of Examinations, kept apart from the
// Academic calendar's one-off holidays and events.
export default function SemesterCalendarManager() {
  const {
    semester_calendars = [],
    semester_calendar_items = [],
    departments,
    users,
    createSemesterCalendar,
    publishSemesterCalendar,
    deleteSemesterCalendar
  } = useData();

  const [isImporting, setIsImporting] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [items, setItems] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [formError, setFormError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [confirmRequest, setConfirmRequest] = useState(null);
  const [notice, setNotice] = useState('');

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 5000);
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

  const handlePaste = (text) => {
    const parsed = parseSemesterCalendar(text);
    setForm(prev => ({ ...prev, paste: text }));
    setItems(parsed.items);
    setSkipped(parsed.skipped);
    setFormError('');
  };

  const toggleSemester = (sem) => {
    setForm(prev => ({
      ...prev,
      semesters: prev.semesters.includes(sem)
        ? prev.semesters.filter(s => s !== sem)
        : [...prev.semesters, sem]
    }));
    setFormError('');
  };

  const openImport = () => {
    setForm(blankForm());
    setItems([]);
    setSkipped([]);
    setFormError('');
    setIsImporting(true);
  };

  const save = (publish) => {
    try {
      const calendar = createSemesterCalendar(
        { title: form.title, ref_no: form.ref_no, semesters: form.semesters, department_id: form.department_id, items },
        publish
      );
      setIsImporting(false);
      setExpandedId(calendar.id);
      showNotice(publish
        ? `${calendar.title} published to Sem ${semesterList(calendar.semesters)}.`
        : `${calendar.title} saved as a draft. Only admins can see it until you publish.`);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSave = (publish) => {
    if (!publish) {
      save(false);
      return;
    }
    if (!form.title.trim() || !form.semesters.length || !items.length) {
      save(true); // surfaces the validation message
      return;
    }
    setConfirmRequest({
      title: `Publish ${form.title.trim()}?`,
      message: `${items.length} dates go live for Sem ${semesterList(form.semesters)}, and ${draftReach} ${draftReach === 1 ? 'person gets' : 'people get'} one notification.`,
      confirmLabel: 'Publish calendar',
      tone: 'neutral',
      onConfirm: () => save(true)
    });
  };

  const updateItem = (index, fields) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, ...fields } : item)));
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
      message: `This removes the calendar and its ${count} ${count === 1 ? 'date' : 'dates'}${calendar.status === 'published' ? ' for everyone who can see it' : ''}.`,
      confirmLabel: 'Delete calendar',
      onConfirm: () => {
        deleteSemesterCalendar(calendar.id);
        showNotice(`${calendar.title} deleted.`);
      }
    });
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none';

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
        {!isImporting && (
          <button
            onClick={openImport}
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

      {isImporting && (
        <section className="rounded-2xl border border-brand-200 bg-white shadow-xs overflow-hidden" aria-labelledby="import-title">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h3 id="import-title" className="text-sm font-bold text-slate-900">Import semester calendar</h3>
              <p className="mt-0.5 text-xs text-slate-500">Paste rows from the PDF or Excel, check the preview, then publish once.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsImporting(false)}
              aria-label="Close import"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
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
                          on
                            ? 'border-brand-300 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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

              <label className="block text-xs font-bold text-slate-700 sm:col-span-3">
                Paste rows *
                <span className="ml-1 font-normal text-slate-500">Activity, then a date or range, one per line. Header rows are skipped.</span>
                <textarea
                  rows={6}
                  value={form.paste}
                  onChange={(e) => handlePaste(e.target.value)}
                  placeholder={'First CIE Test\t24.03.2025 to 27.03.2025\nLast Working Day\t31.05.2025'}
                  className={`mt-1 ${inputClass} font-mono`}
                />
              </label>
            </div>

            {(items.length > 0 || skipped.length > 0) && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">{items.length}</strong> {items.length === 1 ? 'row' : 'rows'} found.
                  {' '}Types are guessed from the activity; change any that are wrong.
                </p>
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
                {items.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Activity</th>
                          <th className="px-3 py-2">Dates</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2"><span className="sr-only">Remove</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-semibold text-slate-800">{item.activity}</td>
                            <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">{formatDateRange(item.start_date, item.end_date)}</td>
                            <td className="px-3 py-1.5">
                              <select
                                value={item.type}
                                onChange={(e) => updateItem(i, { type: e.target.value })}
                                aria-label={`Type for ${item.activity}`}
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
                                onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                                aria-label={`Remove ${item.activity}`}
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
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Bell className="h-3.5 w-3.5" />
              {form.semesters.length
                ? `Publishing sends 1 notification each to ${draftReach} ${draftReach === 1 ? 'person' : 'people'} in Sem ${semesterList(form.semesters)}`
                : 'Pick the semesters this calendar is for'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Save as draft
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                Publish calendar
              </button>
            </div>
          </div>
        </section>
      )}

      {!isImporting && sortedCalendars.length === 0 && (
        <EmptyState
          icon={CalendarRange}
          title="Import your first semester calendar"
          description="Paste the rows from the COE circular. Dates stay hidden from students until you publish."
          actionLabel="Import circular"
          onAction={openImport}
        />
      )}

      <div className="space-y-3">
        {sortedCalendars.map(calendar => {
          const rows = itemsByCalendar.get(calendar.id) || [];
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
                      `${rows.length} ${rows.length === 1 ? 'date' : 'dates'}`
                    ].filter(Boolean).join(' · ')}
                  </p>
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
                      {rows.map(row => (
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
