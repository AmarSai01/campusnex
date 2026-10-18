import React, { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BellRing, CheckCircle2, ListChecks, RotateCcw, Shuffle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseCsv, validateImport } from '@/utils/studentImport'
import { IMPORT_SAMPLE_CSV, IMPORT_SAMPLE_DEPARTMENTS, SEATING_STUDENTS } from './sampleData'

// A dark card with a soft light that follows the cursor across it.
function Tile({ title, body, className, children }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-night-2/70 p-5 backdrop-blur-sm sm:p-6',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(360px circle at var(--mx) var(--my), rgba(255,92,0,0.10), transparent 60%)' }}
      />
      <div className="relative">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-mist">{body}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

const COLUMNS = 6
const sameBranchNeighbours = (order) =>
  order.reduce((n, s, i) => {
    const right = (i + 1) % COLUMNS !== 0 ? order[i + 1] : null
    const behind = order[i + COLUMNS]
    return n + (right?.branch === s.branch ? 1 : 0) + (behind?.branch === s.branch ? 1 : 0)
  }, 0)
const checkerboard = (students) => {
  const cse = students.filter((s) => s.branch === 'CSE')
  const ise = students.filter((s) => s.branch === 'ISE')
  return students.map((_, i) => ((Math.floor(i / COLUMNS) + (i % COLUMNS)) % 2 === 0 ? cse.shift() : ise.shift()))
}

function SeatingDemo() {
  const arranged = useMemo(() => checkerboard(SEATING_STUDENTS), [])
  const [on, setOn] = useState(false)
  const order = on ? arranged : SEATING_STUDENTS
  const pairs = sameBranchNeighbours(order)
  return (
    <div>
      <div className="mb-2 rounded-md bg-white/10 py-1 text-center text-[11px] text-mist">Invigilator desk, LH-101</div>
      <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0,1fr))` }} aria-label={`${pairs} same-branch neighbour pairs`}>
        {order.map((s, i) => (
          <motion.li
            key={s.id}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'rounded-md py-1.5 text-center text-[10px] font-bold sm:text-[11px]',
              s.branch === 'CSE' ? 'bg-white text-night' : 'border border-brand-400/40 bg-brand-500/20 text-brand-200'
            )}
          >
            {s.branch}
            <span className="block text-[9px] font-medium opacity-70 tabular-nums">S-{String(i + 1).padStart(2, '0')}</span>
          </motion.li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist" aria-live="polite">
          Same-branch neighbours{' '}
          <span className={cn('font-display text-xl font-semibold tabular-nums', pairs ? 'text-red-300' : 'text-emerald-300')}>{pairs}</span>
        </p>
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold cursor-pointer',
            on ? 'border border-white/15 text-white hover:bg-white/5' : 'bg-brand-500 text-white hover:bg-brand-600'
          )}
        >
          {on ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Shuffle className="h-4 w-4" aria-hidden="true" />}
          {on ? 'Show unarranged' : 'Arrange seating'}
        </button>
      </div>
    </div>
  )
}

function ImportDemo() {
  const [checked, setChecked] = useState(false)
  const rows = useMemo(
    () => validateImport({ rows: parseCsv(IMPORT_SAMPLE_CSV), users: [], allowedDepartments: IMPORT_SAMPLE_DEPARTMENTS }).rows,
    []
  )
  const ready = rows.filter((r) => r.student).length
  return (
    <div>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={r.line} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
            <span className="min-w-0">
              <span className="block font-semibold text-white tabular-nums">{r.values.usn}</span>
              <span className="block truncate text-mist">{r.values.name}</span>
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {checked ? (
                <motion.span
                  key="r"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={cn('flex max-w-[55%] items-start gap-1 text-right font-semibold', r.student ? 'text-emerald-300' : 'text-red-300')}
                >
                  {r.student ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <XCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  {r.student ? 'Ready' : r.errors[0]}
                </motion.span>
              ) : (
                <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-mist">Not checked</motion.span>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-mist" aria-live="polite">{checked ? `${ready} ready, ${rows.length - ready} to fix` : 'Six rows, a few typical mistakes'}</p>
        <button
          type="button"
          onClick={() => setChecked((c) => !c)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/5 cursor-pointer"
        >
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          {checked ? 'Clear' : 'Check rows'}
        </button>
      </div>
    </div>
  )
}

const ALERTS = [
  { who: 'Rohan Shetty', what: 'CS301 attendance 67%', to: 'Student, teacher, HOD' },
  { who: 'Kavya Menon', what: 'CS303 IA average 36%', to: 'Student, teacher, HOD' },
  { who: 'Sneha Patil', what: 'CS304 attendance 69%', to: 'Student, teacher, HOD' },
]
function AlertsDemo() {
  return (
    <ul className="space-y-2">
      {ALERTS.map((a, i) => (
        <motion.li
          key={a.who}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.15 + i * 0.25, type: 'spring', stiffness: 260, damping: 24 }}
          className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-night/60 p-3"
        >
          <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
          <span className="text-xs">
            <span className="block font-semibold text-white">{a.who}</span>
            <span className="block text-red-300">{a.what}</span>
            <span className="block text-mist">Sent to {a.to}</span>
          </span>
        </motion.li>
      ))}
    </ul>
  )
}

const SGPAS = [7.6, 8.1, 7.9, 8.6, 8.9]
function ResultsDemo() {
  const cgpa = (SGPAS.reduce((a, b) => a + b, 0) / SGPAS.length).toFixed(2)
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-mist">CGPA</p>
          <p className="font-display text-3xl font-semibold text-white tabular-nums">{cgpa}</p>
        </div>
        <p className="text-xs text-emerald-300">Sem 5 SGPA 8.90</p>
      </div>
      <div className="relative mt-4 flex h-24 items-end gap-2" aria-hidden="true">
        <span className="absolute inset-x-0 border-t border-dashed border-brand-400/70" style={{ bottom: `${(cgpa / 10) * 100}%` }} />
        {SGPAS.map((s, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-t-md bg-white/80"
            initial={{ height: 0 }}
            whileInView={{ height: `${(s / 10) * 100}%` }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-mist">
        {SGPAS.map((_, i) => <span key={i}>Sem {i + 1}</span>)}
      </div>
    </div>
  )
}

function ClashDemo() {
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-[56px_1fr] gap-2">
        <span className="pt-2 text-mist tabular-nums">10:00</span>
        <div className="space-y-1.5">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white">CS302 · Dr. Rao · LH-101</div>
          <motion.div
            initial={{ x: 0 }}
            whileInView={{ x: [0, -4, 4, -3, 3, 0] }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-2 text-white"
          >
            CS303 · Dr. Rao · LH-102
          </motion.div>
        </div>
      </div>
      <p className="flex items-center gap-1.5 font-semibold text-red-300">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Dr. Rao is already teaching at 10:00
      </p>
    </div>
  )
}

export default function FeatureBento() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Tile
        className="lg:col-span-2 lg:row-span-2"
        title="Exam seating in one click"
        body="Pick the hall and the branches sharing it. Campusnex seats them so nobody sits beside or behind someone from their own branch."
      >
        <SeatingDemo />
      </Tile>
      <Tile
        className="lg:row-span-2"
        title="Your whole student list in one upload"
        body="Every row is checked for USN format, semester, department and duplicates before anything is saved."
      >
        <ImportDemo />
      </Tile>
      <Tile title="Alerts before it's too late" body="Below 75% attendance or a 40% IA average, the right people hear about it.">
        <AlertsDemo />
      </Tile>
      <Tile title="Results, published when ready" body="SGPA and CGPA on the 10-point scale, visible to students only after you publish.">
        <ResultsDemo />
      </Tile>
      <Tile title="Timetables without clashes" body="Teachers and rooms are checked before a slot is saved.">
        <ClashDemo />
      </Tile>
    </div>
  )
}
