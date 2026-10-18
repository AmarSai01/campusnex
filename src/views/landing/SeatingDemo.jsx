import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEATING_STUDENTS } from './sampleData'

const COLUMNS = 6

// Count pairs of same-branch students sitting side by side or front to back.
const sameBranchNeighbours = (order) => {
  let pairs = 0
  order.forEach((s, i) => {
    const right = (i + 1) % COLUMNS !== 0 ? order[i + 1] : null
    const behind = order[i + COLUMNS]
    if (right && right.branch === s.branch) pairs++
    if (behind && behind.branch === s.branch) pairs++
  })
  return pairs
}

// Checkerboard: no student has a same-branch neighbour in front, behind or beside them.
const arrange = (students) => {
  const cse = students.filter((s) => s.branch === 'CSE')
  const ise = students.filter((s) => s.branch === 'ISE')
  return students.map((_, i) => {
    const row = Math.floor(i / COLUMNS)
    const col = i % COLUMNS
    return (row + col) % 2 === 0 ? cse.shift() : ise.shift()
  })
}

export default function SeatingDemo() {
  const arranged = useMemo(() => arrange(SEATING_STUDENTS), [])
  const [isArranged, setIsArranged] = useState(false)
  const order = isArranged ? arranged : SEATING_STUDENTS
  const neighbours = sameBranchNeighbours(order)

  return (
    <div className="rounded-2xl border border-rule bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">LH-101, 30 seats, CS301 and IS301 exams</p>
          <p className="text-xs text-ink-soft">Sample room. Front of the hall is at the top.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsArranged((a) => !a)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold cursor-pointer',
            isArranged ? 'border border-rule text-ink hover:bg-paper' : 'bg-brand-500 text-white hover:bg-brand-600'
          )}
        >
          {isArranged ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Shuffle className="h-4 w-4" aria-hidden="true" />}
          {isArranged ? 'Show unarranged' : 'Arrange seating'}
        </button>
      </div>

      <div className="mt-4 rounded-md bg-ink/90 py-1 text-center text-[11px] font-medium text-white">Invigilator desk</div>

      <ol
        className="mt-3 grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
        aria-label={`Seating plan: ${neighbours} same-branch neighbour pairs`}
      >
        {order.map((s, i) => (
          <motion.li
            key={s.id}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'flex flex-col items-center justify-center rounded-md border py-1.5 text-center',
              s.branch === 'CSE' ? 'border-ink bg-ink text-white' : 'border-brand-200 bg-brand-50 text-brand-900'
            )}
          >
            <span className="text-[11px] font-bold">{s.branch}</span>
            <span className="text-[10px] opacity-80 tabular-nums">S-{String(i + 1).padStart(2, '0')}</span>
          </motion.li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3 text-sm">
        <p className="text-ink-soft" aria-live="polite">
          Same-branch neighbours:{' '}
          <span className={cn('font-display text-lg font-semibold tabular-nums', neighbours === 0 ? 'text-present-strong' : 'text-absent-strong')}>
            {neighbours}
          </span>
        </p>
        <p className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-ink" aria-hidden="true" />CSE</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-brand-200 bg-brand-50" aria-hidden="true" />ISE</span>
        </p>
      </div>
    </div>
  )
}
