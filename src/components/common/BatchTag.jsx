import React from 'react';
import { batchLabel } from '../../utils/batches';

const BATCH_STYLES = {
  B1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  B2: 'bg-violet-50 text-violet-700 border-violet-200',
  B3: 'bg-sky-50 text-sky-700 border-sky-200',
  B4: 'bg-amber-50 text-amber-800 border-amber-200'
};

// Shown on lab slots that are for one batch of a class; whole-class slots show nothing.
export default function BatchTag({ batch }) {
  if (!batch) return null;
  return (
    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border whitespace-nowrap ${BATCH_STYLES[batch]}`}>
      {batchLabel(batch)}
    </span>
  );
}
