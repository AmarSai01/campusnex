import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

// Shown instead of the seating form until the exam rooms and exam schedule it depends on exist.
export default function SeatingSetupChecklist({ roomCount, examCount, canManageRooms, onNavigate }) {
  const steps = [
    {
      done: roomCount > 0,
      title: 'Add exam rooms',
      detail: roomCount > 0
        ? `${roomCount} ${roomCount === 1 ? 'room' : 'rooms'} ready`
        : canManageRooms
          ? 'Add each hall with its seating capacity.'
          : 'Ask an administrator to add exam rooms.',
      tab: canManageRooms ? 'rooms' : null,
      action: 'Go to Room Management'
    },
    {
      done: examCount > 0,
      title: 'Schedule an exam',
      detail: examCount > 0
        ? `${examCount} ${examCount === 1 ? 'exam' : 'exams'} scheduled`
        : 'Set the subject, date, time, department and semester.',
      tab: 'timetable',
      action: 'Go to Exam Timetable'
    },
    {
      done: false,
      title: 'Generate the seating plan',
      detail: 'Pick the exam, rooms and the two branch groups to seat alternately.',
      tab: null
    }
  ];
  const nextIndex = steps.findIndex(s => !s.done);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-slate-900">Before you can generate a seating plan</p>
      <p className="mt-0.5 text-xs text-slate-500">Seating plans are built from scheduled exams and the rooms they're held in.</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          return (
            <li
              key={step.title}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                isNext ? 'border-brand-200 bg-brand-50/40' : 'border-slate-100'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <Circle className={`mt-0.5 h-4 w-4 shrink-0 ${isNext ? 'text-brand-600' : 'text-slate-300'}`} aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${step.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {i + 1}. {step.title}
                  <span className="sr-only">{step.done ? ' (done)' : ''}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{step.detail}</p>
              </div>
              {!step.done && step.tab && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(step.tab)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    isNext
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {step.action}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
