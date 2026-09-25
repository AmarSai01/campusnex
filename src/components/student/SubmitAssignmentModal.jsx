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

export default function SubmitAssignmentModal({
  isOpen,
  onClose,
  assignment,
  course,
  onSubmit
}) {
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!assignment) return null;

  const handleSimulateFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileUrl(`https://storage.campusnex.edu/submissions/${encodeURIComponent(file.name)}`);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName.trim()) {
      setError('Please upload a submission file or provide an artifact name.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        assignment_id: assignment.id,
        file_name: fileName,
        file_url: fileUrl || `https://storage.campusnex.edu/submissions/${fileName}`,
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
              Due: {new Date(assignment.due_date).toLocaleDateString()}
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
            Artifact Upload (ZIP, PDF, Source Code) *
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 relative cursor-pointer group">
            <input
              type="file"
              onChange={handleSimulateFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-brand-600 mb-2 group-hover:scale-105 transition-transform shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {fileName ? fileName : 'Click or Drag & Drop File'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Supports PDF, ZIP, C++, Java, Python (up to 25MB)
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Or Type Custom File Name / Repository Link
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Link2 className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. alice_smith_final_project.zip"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
