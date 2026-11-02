import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Upload,
  Plus,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { enrolledStudents } from '../../utils/classSessions';
import {
  LAB_PARTS,
  SHEET_KINDS,
  UPLOAD_LABELS,
  buildTemplate,
  checkUpload,
  courseBatches,
  extractTable,
  guessKind,
  isLabCourse,
  planIaCopy,
  readSheetFile,
  sheetToCsv,
  templateToXlsx
} from '../../utils/classSheets';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PREVIEW_ROWS = 5;

const KIND_TONES = {
  students: 'bg-slate-100 text-slate-700',
  ia: 'bg-emerald-50 text-emerald-700',
  attendance: 'bg-amber-50 text-amber-800',
  lab_marks: 'bg-violet-50 text-violet-700',
  lab_attendance: 'bg-sky-50 text-sky-700'
};

const inputClass = 'px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none';
const buttonClass = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

const monthBounds = (offset = 0) => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: iso(first), to: iso(last) };
};

const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Keeps the original file in the private sheet-files bucket, under the subject's folder.
async function storeSheetFile(courseId, file) {
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-120) || 'sheet';
  const path = `${courseId}/${Date.now()}-${safeName}`;
  const contentType = /\.xlsx$/i.test(file.name) ? XLSX_TYPE : 'text/csv';
  const { error } = await supabase.storage.from('sheet-files').upload(path, file, { contentType });
  if (error) throw new Error(`Couldn't upload the file: ${error.message}`);
  return `storage://sheet-files/${path}`;
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const when = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// Teachers: spreadsheet templates filled with a subject's students, and the filled sheets
// they upload back. Uploads are kept apart from live attendance and IA marks.
export default function ClassSheets() {
  const { currentUser, hodDepartments = [] } = useAuth();
  const data = useData();
  const { courses, users, ia_marks: iaMarks, saveIAMarks, getStoredFileLink, whenSynced } = data;

  const myCourses = useMemo(() => courses.filter(c => c.faculty_id === currentUser?.id), [courses, currentUser]);
  // An HOD can also see their department's other subjects, read only.
  const deptCourses = useMemo(() => {
    const ids = new Set(hodDepartments.map(d => d.id));
    return courses.filter(c => ids.has(c.department_id) && c.faculty_id !== currentUser?.id);
  }, [courses, hodDepartments, currentUser]);

  const [courseId, setCourseId] = useState(myCourses[0]?.id || deptCourses[0]?.id || '');
  const course = courses.find(c => c.id === courseId);
  const canEdit = Boolean(course && course.faculty_id === currentUser?.id);

  const [tab, setTab] = useState('templates');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const showNotice = (text) => {
    setNotice(text);
    setError('');
    setTimeout(() => setNotice(''), 6000);
  };

  // ── Templates ──
  const [kind, setKind] = useState('ia');
  const [iaColumns, setIaColumns] = useState(['IA 1', 'IA 2', 'IA 3']);
  const [iaMax, setIaMax] = useState(30);
  const [range, setRange] = useState(monthBounds(0));
  const [programs, setPrograms] = useState(10);
  const [partMax, setPartMax] = useState({ Execution: 10, Observation: 5, Record: 5, Viva: 5 });
  const [batchChoice, setBatchChoice] = useState('all');
  const [own, setOwn] = useState([]);
  const [newColumn, setNewColumn] = useState('');
  const [columnError, setColumnError] = useState('');
  const [format, setFormat] = useState('xlsx');
  const [previewSheet, setPreviewSheet] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const lab = course ? isLabCourse(course, data.timetable) : false;
  const batches = course ? courseBatches(course, data.timetable) : [];
  const kindsOffered = Object.keys(SHEET_KINDS).filter(k => lab || !k.startsWith('lab_'));
  const activeKind = kindsOffered.includes(kind) ? kind : 'ia';
  const rosterSize = course ? enrolledStudents(course, data).length : 0;

  // Rebuilt on every render, so it always reflects the latest roster and timetable.
  const template = course ? buildTemplate(activeKind, course, data, {
    iaColumns,
    iaMax,
    from: range.from,
    to: range.to,
    programs,
    partMax,
    batches: batchChoice === 'all' ? batches : [batchChoice],
    own
  }) : null;

  const sheet = template?.sheets[Math.min(previewSheet, template.sheets.length - 1)];
  const dateColumnCount = sheet ? sheet.columns.filter(c => /^\d{1,2} [A-Z][a-z]{2}$/.test(c)).length : 0;

  const addOwnColumn = () => {
    const name = newColumn.trim();
    if (!name) return setColumnError('Type a column name first.');
    if (template?.sheets[0].columns.some(c => c.toLowerCase() === name.toLowerCase())) {
      return setColumnError('That column is already in the sheet.');
    }
    setOwn(prev => [...prev, name]);
    setNewColumn('');
    setColumnError('');
  };

  const download = async () => {
    if (!template) return;
    setDownloading(true);
    setError('');
    try {
      if (format === 'xlsx') {
        saveBlob(await templateToXlsx(template, activeKind), `${template.fileBase}.xlsx`);
        showNotice(`Downloaded ${template.fileBase}.xlsx${template.sheets.length > 1 ? ` with ${plural(template.sheets.length, 'sheet')}` : ''}.`);
      } else {
        template.sheets.forEach((s, i) => {
          const suffix = s.batch ? `_${s.batch}` : '';
          setTimeout(() => saveBlob(new Blob([sheetToCsv(s)], { type: 'text/csv' }), `${template.fileBase}${suffix}.csv`), i * 400);
        });
        showNotice(template.sheets.length > 1
          ? `Downloaded ${plural(template.sheets.length, 'CSV file')}, one per batch.`
          : `Downloaded ${template.fileBase}.csv.`);
      }
    } catch (err) {
      setError(`Couldn't make the file: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // ── Uploaded sheets ──
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [pending, setPending] = useState(null); // { file, table, kind, checked, replacing }
  const [busy, setBusy] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [copyPlan, setCopyPlan] = useState(null); // { upload, plan, replace }
  const [confirmRequest, setConfirmRequest] = useState(null);
  const fileInput = useRef(null);
  const replaceTarget = useRef(null);

  const loadUploads = async () => {
    if (!courseId) return;
    setLoadingUploads(true);
    const { data: rows, error: loadError } = await supabase
      .from('uploaded_sheets')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    if (loadError) setError(`Couldn't load uploaded sheets: ${loadError.message}`);
    else setUploads(rows);
    setLoadingUploads(false);
  };

  // The uploads list follows the chosen subject.
  const loadRef = useRef(loadUploads);
  useEffect(() => {
    loadRef.current = loadUploads;
  });
  useEffect(() => {
    loadRef.current();
  }, [courseId]);

  const changeCourse = (id) => {
    setCourseId(id);
    setUploads([]);
    setPending(null);
    setViewId(null);
    setCopyPlan(null);
    setPreviewSheet(0);
  };

  const pickFile = (replacing = null) => {
    replaceTarget.current = replacing;
    fileInput.current?.click();
  };

  const onFile = async (file) => {
    if (!file || !course) return;
    setError('');
    setCopyPlan(null);
    if (file.size > MAX_FILE_BYTES) return setError('The file is over 10 MB.');
    try {
      const replacing = replaceTarget.current;
      replaceTarget.current = null;
      const table = extractTable(await readSheetFile(file));
      const k = replacing ? replacing.kind : guessKind(table);
      setPending({ file, table, kind: k, checked: checkUpload(k, table, course, data), replacing });
    } catch (err) {
      setError(err.message);
    }
  };

  const changePendingKind = (k) => setPending(p => ({ ...p, kind: k, checked: checkUpload(k, p.table, course, data) }));

  const removeFiles = (urls) => {
    const paths = urls.map(u => u?.match(/^storage:\/\/sheet-files\/(.+)$/)?.[1]).filter(Boolean);
    if (paths.length) supabase.storage.from('sheet-files').remove(paths).catch(() => {});
  };

  const savePending = async () => {
    if (!pending) return;
    if (!pending.checked.rows.length) return setError('No student in this file matches this class, so there is nothing to save.');
    setBusy(true);
    setError('');
    try {
      const fileUrl = await storeSheetFile(course.id, pending.file);
      const fields = {
        kind: pending.kind,
        file_name: pending.file.name,
        file_url: fileUrl,
        columns: pending.checked.columns,
        max_marks: pending.checked.maxMarks,
        rows: pending.checked.rows,
        summary: pending.checked.summary,
        updated_at: new Date().toISOString()
      };
      if (pending.replacing) {
        const old = pending.replacing;
        const { error: upError } = await supabase.from('uploaded_sheets').update({
          ...fields,
          version: old.version + 1,
          previous_versions: [
            ...(old.previous_versions || []),
            { file_name: old.file_name, file_url: old.file_url, replaced_at: new Date().toISOString(), copy_summary: old.copy_summary }
          ],
          copied_at: null,
          copy_summary: null
        }).eq('id', old.id);
        if (upError) throw new Error(upError.message);
        showNotice(`${pending.file.name} replaced ${old.file_name}. The earlier version is kept.`);
      } else {
        const { error: insError } = await supabase.from('uploaded_sheets').insert({
          ...fields,
          course_id: course.id,
          uploaded_by: currentUser.id
        });
        if (insError) throw new Error(insError.message);
        showNotice(`Saved under ${UPLOAD_LABELS[pending.kind]}. Live attendance and IA marks are unchanged.`);
      }
      setPending(null);
      await loadUploads();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openFile = async (url) => {
    try {
      const link = await getStoredFileLink(url);
      if (link) window.open(link, '_blank', 'noopener');
    } catch (err) {
      setError(err.message);
    }
  };

  const askDelete = (upload) => setConfirmRequest({
    title: `Delete ${upload.file_name}?`,
    message: `Only this uploaded copy${upload.previous_versions?.length ? ' and its earlier versions are' : ' is'} removed. ${upload.copied_at ? 'Marks already copied into IA marks stay.' : 'Live attendance and IA marks are not touched.'}`,
    confirmLabel: 'Delete upload',
    onConfirm: async () => {
      const { error: delError } = await supabase.from('uploaded_sheets').delete().eq('id', upload.id);
      if (delError) return setError(delError.message);
      removeFiles([upload.file_url, ...(upload.previous_versions || []).map(v => v.file_url)]);
      showNotice(`${upload.file_name} deleted.`);
      loadUploads();
    }
  });

  const startCopy = (upload) => {
    setPending(null);
    setCopyPlan({ upload, plan: planIaCopy(upload, course, iaMarks), replace: false });
  };

  const runCopy = async () => {
    const { upload, plan, replace } = copyPlan;
    const changed = plan.clashes.filter(c => !c.same);
    const marks = [...plan.adds, ...(replace ? changed : [])].map(({ same: _same, ...m }) => m);
    setBusy(true);
    try {
      if (marks.length) saveIAMarks(marks);
      const summary = `${plural(plan.adds.length, 'mark')} added, ${plural(plan.clashes.length, 'mark')} already in the app ${replace ? 'replaced' : 'kept'}`;
      await whenSynced();
      const { error: upError } = await supabase.from('uploaded_sheets')
        .update({ copied_at: new Date().toISOString(), copy_summary: summary })
        .eq('id', upload.id);
      if (upError) throw new Error(upError.message);
      setCopyPlan(null);
      showNotice(`Copied into IA marks: ${summary}. New marks are unpublished; publish them from IA Marks Entry.`);
      loadUploads();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!myCourses.length && !deptCourses.length) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No subjects assigned to you yet"
        description="Once an admin assigns you a subject, its class sheets appear here."
      />
    );
  }

  const nameOf = (id) => users.find(u => u.id === id)?.name || 'A teacher';
  const courseLabel = (c) => `${c.code} ${c.name} · Sem ${c.semester} ${c.section}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-600" />
            Class Sheets
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Templates filled with your students, and the sheets you upload back. Uploads never change live attendance or marks.
          </p>
        </div>
        <select value={courseId} onChange={(e) => changeCourse(e.target.value)} aria-label="Subject" className={`${inputClass} bg-white font-semibold text-slate-700 sm:max-w-sm`}>
          {myCourses.length > 0 && (
            <optgroup label="Your subjects">
              {myCourses.map(c => <option key={c.id} value={c.id}>{courseLabel(c)}</option>)}
            </optgroup>
          )}
          {deptCourses.length > 0 && (
            <optgroup label="Your department (view only)">
              {deptCourses.map(c => <option key={c.id} value={c.id}>{courseLabel(c)}</option>)}
            </optgroup>
          )}
        </select>
      </div>

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200" role="tablist">
        {[['templates', 'Templates'], ['uploads', `Uploaded sheets (${uploads.length})`]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-xs font-bold cursor-pointer ${tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'templates' && course && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          {rosterSize === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              No students are in this class yet. Templates fill in once the admin adds them in Manage Students.
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-700">1 · Template</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Template">
              {kindsOffered.map(k => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={activeKind === k}
                  onClick={() => { setKind(k); setPreviewSheet(0); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer ${activeKind === k ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {SHEET_KINDS[k]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700">2 · Options</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {activeKind === 'students' && <span>Just the student details. Add your own columns below if you need any.</span>}
              {activeKind === 'ia' && (
                <>
                  {iaColumns.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-bold text-slate-700">
                      {c}
                      <button type="button" aria-label={`Remove ${c}`} disabled={iaColumns.length === 1} onClick={() => setIaColumns(cols => cols.filter(x => x !== c))} className="text-slate-400 hover:text-rose-600 cursor-pointer disabled:opacity-30">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIaColumns(cols => {
                      for (let n = 1; ; n++) if (!cols.includes(`IA ${n}`)) return [...cols, `IA ${n}`].sort();
                    })}
                    className={buttonClass}
                  >
                    <Plus className="h-3.5 w-3.5" /> IA
                  </button>
                  <label className="inline-flex items-center gap-1.5">
                    Max marks
                    <input type="number" min={1} max={200} value={iaMax} onChange={(e) => setIaMax(Math.max(1, Math.min(200, Math.round(Number(e.target.value) || 1))))} className={`${inputClass} w-20`} />
                  </label>
                  <span className="text-slate-400">Total and Average are added.</span>
                </>
              )}
              {(activeKind === 'attendance' || activeKind === 'lab_attendance') && (
                <>
                  <button type="button" onClick={() => setRange(monthBounds(0))} className={buttonClass}>This month</button>
                  <button type="button" onClick={() => setRange(monthBounds(1))} className={buttonClass}>Next month</button>
                  <label className="inline-flex items-center gap-1.5">
                    From
                    <input type="date" value={range.from} onChange={(e) => e.target.value && setRange(r => ({ ...r, from: e.target.value }))} className={inputClass} />
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    To
                    <input type="date" value={range.to} min={range.from} onChange={(e) => e.target.value && setRange(r => ({ ...r, to: e.target.value }))} className={inputClass} />
                  </label>
                  <span className="text-slate-400">Dates come from your timetable; holidays are left out.</span>
                </>
              )}
              {activeKind.startsWith('lab_') && (
                <label className="inline-flex items-center gap-1.5">
                  Batches
                  <select value={batchChoice} onChange={(e) => { setBatchChoice(e.target.value); setPreviewSheet(0); }} className={`${inputClass} bg-white`}>
                    <option value="all">{batches.length ? `${batches.join(' and ')} (one sheet each)` : 'Whole class'}</option>
                    {batches.map(b => <option key={b} value={b}>{b} only</option>)}
                  </select>
                </label>
              )}
              {activeKind === 'lab_marks' && (
                <>
                  <label className="inline-flex items-center gap-1.5">
                    Programs
                    <input type="number" min={1} max={20} value={programs} onChange={(e) => setPrograms(Math.max(1, Math.min(20, Math.round(Number(e.target.value) || 1))))} className={`${inputClass} w-16`} />
                  </label>
                  {LAB_PARTS.map(part => (
                    <label key={part} className="inline-flex items-center gap-1.5">
                      {part} max
                      <input type="number" min={1} max={100} value={partMax[part]} onChange={(e) => setPartMax(p => ({ ...p, [part]: Math.max(1, Math.min(100, Math.round(Number(e.target.value) || 1))) }))} className={`${inputClass} w-16`} />
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700">3 · Your own columns <span className="font-normal text-slate-400">(optional)</span></p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {own.map(c => (
                <span key={c} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                  {c}
                  <button type="button" aria-label={`Remove ${c}`} onClick={() => setOwn(cols => cols.filter(x => x !== c))} className="text-brand-400 hover:text-rose-600 cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={newColumn}
                onChange={(e) => { setNewColumn(e.target.value); setColumnError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOwnColumn(); } }}
                placeholder="Remarks"
                aria-label="New column name"
                maxLength={40}
                className={`${inputClass} w-40`}
              />
              <button type="button" onClick={addOwnColumn} className={buttonClass}><Plus className="h-3.5 w-3.5" /> Add column</button>
              {columnError && <span className="text-xs font-semibold text-rose-600">{columnError}</span>}
            </div>
          </div>

          {sheet && (
            <div className="space-y-2">
              {template.sheets.length > 1 && (
                <div className="flex gap-1.5">
                  {template.sheets.map((s, i) => (
                    <button key={s.name} type="button" onClick={() => setPreviewSheet(i)} className={`rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer ${sheet === s ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                      Sheet {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="text-[11px] text-slate-500">
                {sheet.title.slice(0, 2).join(' · ')}
                {(activeKind === 'attendance' || activeKind === 'lab_attendance') && dateColumnCount === 0 && (
                  <span className="ml-1 font-semibold text-amber-700">No classes on the timetable in these dates.</span>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="text-left text-xs">
                  <thead>
                    <tr>
                      {sheet.columns.map((c, i) => (
                        <th key={c} className={`whitespace-nowrap border-b border-r border-slate-200 px-2.5 py-1.5 font-bold ${own.includes(c) && i >= sheet.columns.length - own.length ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-700'}`}>{c}</th>
                      ))}
                    </tr>
                    {sheet.maxRow && (
                      <tr>
                        {sheet.columns.map((c, i) => (
                          <th key={c} className="whitespace-nowrap border-b border-r border-slate-200 bg-amber-50 px-2.5 py-1 font-normal italic text-amber-800">
                            {i === 0 ? 'Max marks' : i >= sheet.baseCount ? sheet.maxRow[i - sheet.baseCount] : ''}
                          </th>
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {sheet.rows.slice(0, PREVIEW_ROWS).map(r => (
                      <tr key={r[0]}>
                        {r.map((v, i) => <td key={i} className={`whitespace-nowrap border-b border-r border-slate-100 px-2.5 py-1.5 ${i < sheet.baseCount ? 'text-slate-800' : 'min-w-12'}`}>{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500">
                {sheet.rows.length > PREVIEW_ROWS ? `First ${PREVIEW_ROWS} of ${sheet.rows.length} students shown.` : `${plural(sheet.rows.length, 'student')}.`}
                {' '}Students come from the admin&apos;s records, so new students appear in the next download.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <select value={format} onChange={(e) => setFormat(e.target.value)} aria-label="File format" className={`${inputClass} bg-white font-semibold`}>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV</option>
            </select>
            <button
              type="button"
              onClick={download}
              disabled={downloading || !template}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Making the file…' : 'Download'}
            </button>
            {format === 'xlsx' && <span className="text-[11px] text-slate-500">Student details are locked against accidental edits; no password needed to unlock.</span>}
          </div>
        </div>
      )}

      {tab === 'uploads' && course && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {canEdit
                ? 'Upload a filled template. It is checked against your class and saved on its own.'
                : `Uploaded by ${nameOf(course.faculty_id)}. You can view them; only the subject's teacher can change them.`}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={loadUploads} aria-label="Refresh" className={buttonClass}>
                <RefreshCw className={`h-3.5 w-3.5 ${loadingUploads ? 'animate-spin' : ''}`} />
              </button>
              {canEdit && (
                <button type="button" onClick={() => pickFile(null)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 cursor-pointer">
                  <Upload className="h-4 w-4" /> Upload filled sheet
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>
          </div>

          {pending && (
            <UploadCheck
              pending={pending}
              busy={busy}
              onKind={changePendingKind}
              onSave={savePending}
              onCancel={() => setPending(null)}
            />
          )}

          {copyPlan && (
            <CopyPanel
              copyPlan={copyPlan}
              busy={busy}
              onReplace={(replace) => setCopyPlan(p => ({ ...p, replace }))}
              onRun={runCopy}
              onCancel={() => setCopyPlan(null)}
            />
          )}

          {uploads.length === 0 && !pending ? (
            <p className="py-8 text-center text-xs text-slate-500">{loadingUploads ? 'Loading…' : 'No sheets uploaded for this subject yet.'}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {uploads.map(u => {
                const s = u.summary || {};
                const issues = (s.unknown?.length || 0) + (s.duplicates?.length || 0) + (s.problems?.length || 0);
                const open = viewId === u.id;
                return (
                  <li key={u.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${KIND_TONES[u.kind]}`}>{UPLOAD_LABELS[u.kind]}</span>
                          <span className="text-sm font-semibold text-slate-800 break-all">{u.file_name}</span>
                          {u.version > 1 && <span className="text-[11px] text-slate-500">version {u.version}</span>}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {nameOf(u.uploaded_by)} · {when(u.updated_at || u.created_at)} · {s.matched ?? u.rows.length} of {s.rosterSize ?? '—'} students
                          {issues > 0 && <span className="font-semibold text-amber-700"> · {plural(issues, 'issue')}</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {u.copied_at
                            ? `Copied into IA marks on ${when(u.copied_at)}: ${u.copy_summary}`
                            : u.kind === 'ia' ? 'Not copied into IA marks' : 'Kept as uploaded, separate from live records'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button type="button" onClick={() => setViewId(open ? null : u.id)} aria-expanded={open} className={buttonClass}>
                          {open ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {open ? 'Hide' : 'View'}
                        </button>
                        {canEdit && u.kind === 'ia' && (
                          <button type="button" onClick={() => startCopy(u)} className={buttonClass}><Copy className="h-3.5 w-3.5" /> Copy into IA marks</button>
                        )}
                        <button type="button" onClick={() => openFile(u.file_url)} className={buttonClass}><Download className="h-3.5 w-3.5" /> Original</button>
                        {canEdit && (
                          <>
                            <button type="button" onClick={() => pickFile(u)} className={buttonClass}><RefreshCw className="h-3.5 w-3.5" /> Replace</button>
                            <button type="button" onClick={() => askDelete(u)} aria-label={`Delete ${u.file_name}`} className={`${buttonClass} hover:text-rose-600`}><Trash2 className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                    </div>
                    {open && <UploadView upload={u} onOpenFile={openFile} />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}

function IssueList({ summary }) {
  const lines = [
    summary.unknown?.length > 0 && { tone: 'text-amber-800', text: `${plural(summary.unknown.length, 'USN')} not in this class, left out: ${summary.unknown.slice(0, 6).join(', ')}${summary.unknown.length > 6 ? '…' : ''}` },
    summary.duplicates?.length > 0 && { tone: 'text-amber-800', text: `${plural(summary.duplicates.length, 'USN')} listed twice; only the first row is kept: ${summary.duplicates.slice(0, 6).join(', ')}` },
    ...(summary.problems || []).slice(0, 8).map(p => ({ tone: 'text-rose-700', text: p })),
    summary.problems?.length > 8 && { tone: 'text-rose-700', text: `And ${summary.problems.length - 8} more values to fix.` }
  ].filter(Boolean);
  if (!lines.length) return <p className="text-xs font-semibold text-emerald-700">No problems found.</p>;
  return (
    <ul className="space-y-0.5 text-xs">
      {lines.map((l, i) => <li key={i} className={l.tone}>{l.text}</li>)}
    </ul>
  );
}

function UploadCheck({ pending, busy, onKind, onSave, onCancel }) {
  const { checked, file, kind, replacing } = pending;
  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <FileSpreadsheet className="h-4 w-4 text-brand-600" />
          {replacing ? `Replace ${replacing.file_name} with ${file.name}` : `Checking ${file.name}`}
        </p>
        {!replacing && (
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            This is
            <select value={kind} onChange={(e) => onKind(e.target.value)} className={`${inputClass} bg-white`}>
              {Object.entries(SHEET_KINDS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="text-xs font-semibold text-emerald-700">
        {checked.summary.matched} of {checked.summary.rosterSize} students matched by USN
        {checked.columns.length > 0 && ` · columns: ${checked.columns.slice(0, 8).join(', ')}${checked.columns.length > 8 ? '…' : ''}`}
      </p>
      <IssueList summary={checked.summary} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onSave} disabled={busy || !checked.rows.length} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 cursor-pointer disabled:opacity-50">
          {busy ? 'Saving…' : replacing ? 'Replace sheet' : 'Save upload'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
        <span className="text-[11px] text-slate-500">Saved on its own. Values with problems are kept but marked, and are never copied.</span>
      </div>
    </div>
  );
}

function CopyPanel({ copyPlan, busy, onReplace, onRun, onCancel }) {
  const { plan, replace, upload } = copyPlan;
  const changed = plan.clashes.filter(c => !c.same);
  const publishedChanged = changed.filter(c => c.published).length;
  const nothing = plan.adds.length === 0 && (changed.length === 0 || !replace);
  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <p className="text-sm font-bold text-slate-900">Copy {upload.file_name} into IA marks</p>
      <ul className="space-y-0.5 text-xs text-slate-700">
        <li><strong>{plan.adds.length}</strong> new {plan.adds.length === 1 ? 'mark' : 'marks'} will be added, unpublished</li>
        {plan.clashes.length > 0 && (
          <li className="text-amber-800">
            <strong>{plan.clashes.length}</strong> already entered in the app{plan.clashes.length > changed.length && ` (${plan.clashes.length - changed.length} with the same value)`}
          </li>
        )}
        {plan.problemCells > 0 && <li className="text-rose-700">{plural(plan.problemCells, 'value')} with problems left out</li>}
        {plan.unmapped.length > 0 && <li className="text-slate-500">{plan.unmapped.join(', ')} left out: the app has IA 1 to IA 3 only</li>}
        {plan.maxMismatch.map(m => <li key={m} className="text-rose-700">Left out because max marks differ: {m}. Change the sheet's max row to match.</li>)}
      </ul>
      {changed.length > 0 && (
        <fieldset className="space-y-1 text-xs text-slate-700">
          <label className="flex items-center gap-2">
            <input type="radio" name="clash" checked={!replace} onChange={() => onReplace(false)} />
            Keep the {plural(changed.length, 'mark')} already in the app (recommended)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="clash" checked={replace} onChange={() => onReplace(true)} />
            Replace them with the uploaded values
            {publishedChanged > 0 && <span className="text-amber-700">({publishedChanged} already published; students will see the new value)</span>}
          </label>
        </fieldset>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onRun} disabled={busy || nothing} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50">
          {busy ? 'Copying…' : 'Copy marks'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
        {nothing && <span className="text-[11px] text-slate-500">Nothing new to copy.</span>}
      </div>
    </div>
  );
}

function UploadView({ upload, onOpenFile }) {
  const cols = upload.columns;
  return (
    <div className="mt-3 space-y-2">
      <IssueList summary={upload.summary || {}} />
      <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
        <table className="text-left text-xs">
          <thead className="sticky top-0">
            <tr>
              {['USN', 'Name', ...(upload.kind.startsWith('lab_') ? ['Batch'] : []), ...cols].map(c => (
                <th key={c} className="whitespace-nowrap border-b border-r border-slate-200 bg-slate-50 px-2.5 py-1.5 font-bold text-slate-700">
                  {c}
                  {upload.max_marks?.[c] !== undefined && <span className="ml-1 font-normal text-slate-400">/{upload.max_marks[c]}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upload.rows.map(r => (
              <tr key={r.usn}>
                <td className="whitespace-nowrap border-b border-r border-slate-100 px-2.5 py-1.5 font-mono">{r.usn}</td>
                <td className="whitespace-nowrap border-b border-r border-slate-100 px-2.5 py-1.5">{r.name}</td>
                {upload.kind.startsWith('lab_') && <td className="border-b border-r border-slate-100 px-2.5 py-1.5">{r.batch}</td>}
                {cols.map(c => (
                  <td key={c} className={`whitespace-nowrap border-b border-r border-slate-100 px-2.5 py-1.5 ${r.problems?.includes(c) ? 'bg-rose-50 font-bold text-rose-700' : ''}`}>
                    {String(r.values?.[c] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {upload.previous_versions?.length > 0 && (
        <div className="text-xs text-slate-600">
          Earlier versions:{' '}
          {upload.previous_versions.map((v, i) => (
            <button key={v.file_url} type="button" onClick={() => onOpenFile(v.file_url)} className="mr-2 font-bold text-brand-700 hover:underline cursor-pointer">
              {i + 1}. {v.file_name} (replaced {when(v.replaced_at)})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
