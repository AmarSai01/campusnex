import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '@/lib/utils';

const PLACEHOLDER = /^https:\/\/(storage\.campusnex\.edu|raw\.githubusercontent\.com\/campusnex)\//;
const hasStoredFile = (url) =>
  !!url && (url.startsWith('storage://') || (/^https:\/\//i.test(url) && !PLACEHOLDER.test(url)));

// Opens a stored file (a submission, or a teacher's assignment attachment). Files in private
// buckets get a short-lived signed link when clicked. Pass `submission`, or `url` and `name`.
export default function SubmissionFileLink({ submission, url, name, className = '' }) {
  const { getStoredFileLink } = useData();
  const [state, setState] = useState('idle');
  const fileUrl = url ?? submission?.file_url;
  const label = name ?? submission?.file_name ?? 'File';

  if (!hasStoredFile(fileUrl)) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-slate-500', className)} title="No file was uploaded">
        <FileText className="w-3.5 h-3.5" />
        {label} <span className="text-[10px] font-medium">(no file)</span>
      </span>
    );
  }

  const open = async (e) => {
    e.stopPropagation();
    // Open the tab first so pop-up blockers allow it, then point it at the signed link.
    const tab = window.open('', '_blank');
    setState('loading');
    try {
      const link = await getStoredFileLink(fileUrl);
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
      className={cn('inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-800 hover:underline text-left min-w-0', className)}
    >
      <FileText className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
      {state === 'loading' && <span className="text-[10px] font-medium text-slate-400">opening…</span>}
      {state === 'error' && <span className="text-[10px] font-medium text-rose-600">couldn't open</span>}
    </button>
  );
}
