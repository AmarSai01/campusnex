import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '@/lib/utils';

// Opens a submitted file. Uploaded files get a short-lived signed link when clicked.
export default function SubmissionFileLink({ submission, className = '' }) {
  const { getSubmissionFileLink } = useData();
  const [state, setState] = useState('idle');
  const name = submission?.file_name || 'Submission';
  const hasFile =
    !!submission?.file_url &&
    (submission.file_url.startsWith('storage://') ||
      (/^https:\/\//i.test(submission.file_url) && !submission.file_url.startsWith('https://storage.campusnex.edu/')));

  if (!hasFile) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-slate-500', className)} title="No file was uploaded">
        <FileText className="w-3.5 h-3.5" />
        {name} <span className="text-[10px] font-medium">(no file)</span>
      </span>
    );
  }

  const open = async (e) => {
    e.stopPropagation();
    // Open the tab first so pop-up blockers allow it, then point it at the signed link.
    const tab = window.open('', '_blank');
    setState('loading');
    try {
      const link = await getSubmissionFileLink(submission.file_url);
      if (!link) throw new Error('No file');
      if (tab) {
        tab.opener = null;
        tab.location.href = link;
      } else {
        window.location.assign(link);
      }
      setState('idle');
    } catch {
      tab?.close();
      setState('error');
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      className={cn('inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-800 hover:underline text-left', className)}
    >
      <FileText className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{name}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
      {state === 'loading' && <span className="text-[10px] font-medium text-slate-400">opening…</span>}
      {state === 'error' && <span className="text-[10px] font-medium text-rose-600">couldn't open</span>}
    </button>
  );
}
