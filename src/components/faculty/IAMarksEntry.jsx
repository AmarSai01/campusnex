import React, { useState, useEffect } from 'react';
import {
  Award,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  CheckCheck,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';

export default function IAMarksEntry() {
  const { currentUser } = useAuth();
  const { courses, enrollments, users, ia_marks, saveIAMarks } = useData();

  // Scoped to assigned courses
  const myCourses = courses.filter(c => c.faculty_id === currentUser?.id);

  const [selectedCourseId, setSelectedCourseId] = useState(myCourses[0]?.id || '');
  const [selectedIAName, setSelectedIAName] = useState('IA-1 (Theory & Assessment)');
  const [maxScore, setMaxScore] = useState(50);
  const [marksRoster, setMarksRoster] = useState([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const iaOptions = [
    'IA-1 (Theory & Assessment)',
    'IA-2 (Advanced Modules & Problem Solving)',
    'IA-3 (Pre-University Evaluation)',
    'Lab Assessment 1 (Hands-on Viva)'
  ];

  // Set default course
  useEffect(() => {
    if (!selectedCourseId && myCourses.length > 0) {
      setSelectedCourseId(myCourses[0].id);
    }
  }, [myCourses, selectedCourseId]);

  // Load enrolled students & existing marks
  useEffect(() => {
    if (!selectedCourseId) return;

    const enrolledStudents = enrollments
      .filter(e => e.course_id === selectedCourseId)
      .map(e => users.find(u => u.id === e.student_id))
      .filter(Boolean);

    const existingMarks = ia_marks.filter(
      m => m.course_id === selectedCourseId && m.ia_name === selectedIAName
    );

    const initialRoster = enrolledStudents.map(student => {
      const existing = existingMarks.find(m => m.student_id === student.id);
      return {
        id: existing?.id,
        student_id: student.id,
        course_id: selectedCourseId,
        ia_name: selectedIAName,
        name: student.name,
        roll_no: student.roll_no || 'N/A',
        section: student.section || 'A',
        photo_url: student.photo_url,
        score: existing ? existing.score : 40,
        max_score: existing ? existing.max_score : maxScore,
        published: existing ? existing.published : false,
        date: existing ? existing.date : new Date().toISOString().split('T')[0]
      };
    });

    setMarksRoster(initialRoster);
    if (existingMarks.length > 0 && existingMarks[0].max_score) {
      setMaxScore(existingMarks[0].max_score);
    }
    setSavedSuccess(false);
  }, [selectedCourseId, selectedIAName, enrollments, users, ia_marks]);

  const handleScoreChange = (studentId, val) => {
    const num = Math.max(0, Math.min(maxScore, Number(val) || 0));
    setMarksRoster(prev => prev.map(item =>
      item.student_id === studentId ? { ...item, score: num } : item
    ));
    setSavedSuccess(false);
  };

  const handlePublishToggle = (studentId) => {
    setMarksRoster(prev => prev.map(item =>
      item.student_id === studentId ? { ...item, published: !item.published } : item
    ));
    setSavedSuccess(false);
  };

  const handleBulkPublish = (shouldPublish) => {
    setMarksRoster(prev => prev.map(item => ({ ...item, published: shouldPublish })));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    if (!selectedCourseId || marksRoster.length === 0) return;

    const payload = marksRoster.map(item => ({
      id: item.id,
      student_id: item.student_id,
      course_id: selectedCourseId,
      ia_name: selectedIAName,
      score: Number(item.score),
      max_score: Number(maxScore),
      published: Boolean(item.published),
      date: new Date().toISOString().split('T')[0]
    }));

    saveIAMarks(payload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const allPublished = marksRoster.length > 0 && marksRoster.every(r => r.published);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            Internal Assessment (IA) Marks Entry & Publisher
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input marks per test cycle. Publishing marks triggers instant grade notifications to students.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={marksRoster.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save & Update Marks</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>IA Marks successfully saved! Published records dispatched to student portals.</span>
        </div>
      )}

      {/* Class picker: one card per class (subject + semester + section) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="radiogroup" aria-label="Class">
        {[...myCourses]
          .sort((a, b) => a.code.localeCompare(b.code) || String(a.section).localeCompare(String(b.section)))
          .map(c => {
            const enrolled = enrollments.filter(e => e.course_id === c.id).length;
            const entered = ia_marks.filter(
              m => m.course_id === c.id && m.ia_name === selectedIAName && m.score !== null && m.score !== undefined
            ).length;
            const isSelected = c.id === selectedCourseId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedCourseId(c.id)}
                className={`text-left p-4 rounded-2xl border transition-colors ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="block text-sm font-extrabold text-slate-900">
                  {c.code} · Sem {c.semester} · Sec {c.section}
                </span>
                <span className="block text-xs text-slate-500 truncate">{c.name}</span>
                <span className="block mt-2 text-[11px] font-semibold text-slate-600">
                  {enrolled} students · {entered} of {enrolled} marks entered for {selectedIAName.split(' ')[0]}
                </span>
              </button>
            );
          })}
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Assessment Cycle *
          </label>
          <select
            value={selectedIAName}
            onChange={(e) => setSelectedIAName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            {iaOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Max Score
          </label>
          <input
            type="number"
            min={10}
            max={100}
            value={maxScore}
            onChange={(e) => setMaxScore(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleBulkPublish(!allPublished)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              allPublished
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            {allPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {allPublished ? 'Unpublish All' : 'Publish All to Students'}
          </button>
        </div>
      </div>

      {/* Spreadsheet / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Roll No & Section</th>
                <th className="px-6 py-3.5">Score (Out of {maxScore})</th>
                <th className="px-6 py-3.5">Percentage</th>
                <th className="px-6 py-3.5">Visibility Status</th>
                <th className="px-6 py-3.5 text-right">Publish Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {marksRoster.map((item, idx) => {
                const pct = Math.round((item.score / maxScore) * 100);
                return (
                  <tr key={item.student_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.name}`}
                          alt={item.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {item.roll_no} • Sec {item.section}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxScore}
                          value={item.score}
                          onChange={(e) => handleScoreChange(item.student_id, e.target.value)}
                          className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                        <span className="text-slate-400 font-bold">/ {maxScore}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`font-extrabold text-xs ${
                        pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-brand-600' : 'text-rose-600'
                      }`}>
                        {pct}%
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.published ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Published to Student
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Draft / Hidden
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handlePublishToggle(item.student_id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          item.published
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                        }`}
                      >
                        {item.published ? 'Hide / Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
