import React, { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REGISTER_STUDENTS, SESSION_COUNT } from './sampleData'

const NEXT = { P: 'A', A: 'L', L: 'P' }
const LABEL = { P: 'present', A: 'absent', L: 'late' }
const CELL_STYLE = {
  P: 'bg-present/12 text-present-strong border-present/25',
  A: 'bg-absent text-white border-absent',
  L: 'bg-late/20 text-ink border-late/50',
}

// Same rule as the app: a late counts as half a class.
const percentOf = (marks) => {
  const attended = [...marks].reduce((sum, m) => sum + (m === 'P' ? 1 : m === 'L' ? 0.5 : 0), 0)
  return Math.round((attended * 100) / marks.length)
}

const statusOf = (pct) =>
  pct < 75 ? { label: 'Shortage', tone: 'text-white bg-absent' }
    : pct < 80 ? { label: 'Warning', tone: 'text-ink bg-late/30' }
      : { label: 'On track', tone: 'text-present-strong bg-present/12' }

export default function AttendanceRegisterDemo() {
  const initial = useMemo(() => Object.fromEntries(REGISTER_STUDENTS.map((s) => [s.id, s.marks])), [])
  const [marks, setMarks] = useState(initial)
  const [alert, setAlert] = useState(null)
  const alertTimer = useRef(null)
  const alertCount = useRef(0)

  const toggle = (student, index) => {
    const before = marks[student.id]
    const after = before.slice(0, index) + NEXT[before[index]] + before.slice(index + 1)
    setMarks((m) => ({ ...m, [student.id]: after }))

    // The real system alerts student, teacher and HOD when a student first drops below 75%.
    if (percentOf(before) >= 75 && percentOf(after) < 75) {
      clearTimeout(alertTimer.current)
      alertCount.current += 1
      setAlert({ name: student.name, pct: percentOf(after), key: alertCount.current })
      alertTimer.current = setTimeout(() => setAlert(null), 6000)
    }
  }

  const reset = () => {
    setMarks(initial)
    setAlert(null)
  }

  const changed = REGISTER_STUDENTS.some((s) => marks[s.id] !== initial[s.id])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rule bg-white shadow-[0_24px_60px_-28px_rgba(22,35,63,0.35)]">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-rule px-4 pt-4 pb-3 sm:px-5">
        <div>
          <p className="font-display text-base font-semibold text-ink">CS301 Data Structures, Sem 5 Sec A</p>
          <p className="text-xs text-ink-soft">Sample register. Click any session to change it.</p>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={!changed}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">
            Sample attendance register with 12 sessions. Each session button cycles present, absent and late.
          </caption>
          <thead>
            <tr className="text-[11px] text-ink-soft">
              <th scope="col" className="px-4 py-2 text-left font-medium sm:px-5">Student</th>
              {Array.from({ length: SESSION_COUNT }, (_, i) => (
                <th key={i} scope="col" className="w-7 px-0 py-2 text-center font-medium tabular-nums">
                  {i + 1}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-right font-medium">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {REGISTER_STUDENTS.map((student, row) => {
              const pct = percentOf(marks[student.id])
              const status = statusOf(pct)
              return (
                <tr key={student.id} className="border-t border-rule/70">
                  <th scope="row" className="px-4 py-2 text-left font-normal sm:px-5">
                    <span className="block font-semibold whitespace-nowrap text-ink">{student.name}</span>
                    <span className="block text-[11px] text-ink-soft tabular-nums">{student.usn}</span>
                  </th>
                  {[...marks[student.id]].map((m, i) => (
                    <td key={i} className="px-[3px] py-2 text-center">
                      <motion.button
                        type="button"
                        onClick={() => toggle(student, i)}
                        aria-label={`${student.name}, session ${i + 1}: ${LABEL[m]}. Change to ${LABEL[NEXT[m]]}.`}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + row * 0.08 + i * 0.025, duration: 0.2 }}
                        className={cn(
                          'h-7 w-6 rounded-[5px] border text-[11px] font-bold transition-colors cursor-pointer',
                          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
                          CELL_STYLE[m]
                        )}
                      >
                        {m}
                      </motion.button>
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <div className="relative hidden h-1.5 w-16 rounded-full bg-rule sm:block" aria-hidden="true">
                        <motion.div
                          className={cn('absolute inset-y-0 left-0 rounded-full', pct < 75 ? 'bg-absent' : pct < 80 ? 'bg-late' : 'bg-present')}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.3 }}
                        />
                        <span className="absolute -top-1 bottom-[-4px] left-[75%] w-px bg-ink/60" />
                      </div>
                      <span className="w-10 text-right font-semibold text-ink tabular-nums">{pct}%</span>
                      <span className={cn('w-[74px] rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold', status.tone)}>
                        {status.label}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule bg-paper px-4 py-2.5 text-[11px] text-ink-soft sm:px-5" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {alert ? (
            <motion.p
              key={alert.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-xs font-semibold text-ink"
            >
              <BellRing className="h-4 w-4 text-absent" aria-hidden="true" />
              {alert.name} fell to {alert.pct}%. Alert sent to the student, the subject teacher and the HOD.
            </motion.p>
          ) : (
            <motion.p
              key="legend"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-1"
            >
              <span><b className="text-present-strong">P</b> present</span>
              <span><b className="text-absent-strong">A</b> absent</span>
              <span><b className="text-ink">L</b> late counts as half</span>
              <span className="text-ink">Rohan is at exactly 75%. Mark one more absence.</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
