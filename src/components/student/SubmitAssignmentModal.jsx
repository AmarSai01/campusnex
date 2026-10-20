import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';

const MAX_BYTES = 10 * 1024 * 1024;

export default function SubmitAssignmentModal({
  isOpen,
  onClose,
  assignment,
  course,
  onSubmit
}) {
  const { uploadSubmissionFile } = useData();
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assignment) return null;

  const handlePickFile = (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      setError('The file must be 10 MB or smaller. Zip large projects, or share a repository link instead.');
      return;
    }
    setFile(picked);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedLink = link.trim();
    if (!file && !trimmedLink) {
      setError('Choose a file to upload, or paste a link to your work.');
      return;
    }
    if (!file && !/^https:\/\/\S+$/i.test(trimmedLink)) {
      setError('Links must start with https://');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload first; the submission row only points at a file that really exists.
      const stored = file
        ? await uploadSubmissionFile(assignment.id, file)
        : { file_url: trimmedLink, file_name: trimmedLink };
      await onSubmit({
        assignment_id: assignment.id,
        ...stored,
        comments: comments
      });

      // Trigger celebratory confetti effect!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback if canvas not available
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Assignment Solution"
      subtitle={`${course?.code || 'Course'} • ${assignment.title}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Assignment Brief Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Max Points: {assignment.max_marks} Pts</span>
            <span className="text-amber-700 font-bold">
              Due: {new Date(assignment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <p className="text-slate-500 line-clamp-2 mt-1">{assignment.description}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Upload Box */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Upload your work (PDF, ZIP, document or source file)
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 focus-within:border-brand-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 relative cursor-pointer group">
            <input
              type="file"
              onChange={handlePickFile}
              aria-label="Choose a file to submit"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-brand-600 mb-2 group-hover:scale-105 transition-transform shadow-xs">
                {file ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
              </div>
              <p className="text-xs font-bold text-slate-800 break-all">
                {file ? file.name : 'Click or drag a file here'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Up to 10 MB'}
              </p>
            </div>
          </div>
          {file && (
            <button type="button" onClick={() => setFile(null)} className="mt-1.5 text-[11px] font-bold text-rose-600 hover:underline">
              Remove file
            </button>
          )}
        </div>

        <div>
          <label htmlFor="submission-link" className="block text-xs font-bold text-slate-700 mb-1">
            Or share a link instead (GitHub, Google Drive…)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Link2 className="w-3.5 h-3.5" />
            </div>
            <input
              id="submission-link"
              type="url"
              inputMode="url"
              value={link}
              disabled={!!file}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/your-name/project"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Student Submission Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any instructions for compiling or running your code..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Uploading...' : 'Submit Assignment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
