import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  FileText,
  Download,
  Award,
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function SubmissionGraderModal({
  isOpen,
  onClose,
  submission,
  assignment,
  student,
  onSaveGrade
}) {
  const [marks, setMarks] = useState(submission?.marks || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (submission) {
      setMarks(submission.marks ?? '');
      setFeedback(submission.feedback || '');
      setError('');
    }
  }, [submission]);

  if (!submission || !assignment) return null;

  const maxMarks = assignment.max_marks || 30;

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(marks);
    if (isNaN(num) || num < 0 || num > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}.`);
      return;
    }

    onSaveGrade(submission.id, num, feedback);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Grade Submission: ${student?.name || 'Student'}`}
      subtitle={`Assignment: ${assignment.title}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student and Submission Details Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={student?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.name}`}
                alt={student?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{student?.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold">Roll: {student?.roll_no}</p>
              </div>
            </div>
            {submission.graded ? (
              <Badge variant="success">Graded</Badge>
            ) : (
              <Badge variant="warning">Pending Evaluation</Badge>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Submitted Artifact:</span>
            <div className="flex items-center gap-1.5 font-bold text-brand-600">
              <FileText className="w-3.5 h-3.5" />
              <span>{submission.file_name || 'project_submission.zip'}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Timestamp: {new Date(submission.submitted_at).toLocaleString()}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Award Score (Out of {maxMarks}) *
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={maxMarks}
              required
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder={`0 - ${maxMarks}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Instructor Feedback & Rubric Notes
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide constructive assessment comments for the student..."
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
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submit Grade & Notify</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
