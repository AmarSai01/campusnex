import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Inbox, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RISK_RULES } from '@/utils/risk'
import { REGISTER_STUDENTS, SESSION_COUNT } from './sampleData'

const { shortage: SHORTAGE, warning: WARNING } = RISK_RULES.attendance

// Fixed column widths so the shortage line can run straight through every row's bar.
const NAME_W = 150
const CELLS_W = SESSION_COUNT * 24 + (SESSION_COUNT - 1) * 4
const BAR_W = 110
const COL_GAP = 16
const COLUMNS = `${NAME_W}px ${CELLS_W}px ${BAR_W}px 44px 78px`
const BEAM_LEFT = NAME_W + COL_GAP + CELLS_W + COL_GAP + (BAR_W * SHORTAGE) / 100
const ROW_MIN_W = 40 + NAME_W + CELLS_W + BAR_W + 44 + 78 + COL_GAP * 4

// Phones show only the latest classes, so the percentage and status fit without swiping.
const PHONE_SESSIONS = 3
const PHONE_COLUMNS = `minmax(0,1fr) ${PHONE_SESSIONS * 24 + (PHONE_SESSIONS - 1) * 4}px 36px 62px`

function usePhone() {
  const query = '(max-width: 639px)'
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setPhone(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return phone
}

const NEXT = { P: 'A', A: 'L', L: 'P' }
const LABEL = { P: 'present', A: 'absent', L: 'late' }
const CELL = {
  P: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  A: 'border-absent bg-absent text-white',
  L: 'border-amber-300/40 bg-amber-300/15 text-amber-200',
}

const percentOf = (marks) =>
  Math.round(([...marks].reduce((s, m) => s + (m === 'P' ? 1 : m === 'L' ? 0.5 : 0), 0) * 100) / marks.length)

export default function HeroRegister() {
  const reduceMotion = useReducedMotion()
  const phone = usePhone()
  const firstShown = phone ? SESSION_COUNT - PHONE_SESSIONS : 0
  const columns = phone ? PHONE_COLUMNS : COLUMNS
  const initial = useMemo(() => Object.fromEntries(REGISTER_STUDENTS.map((s) => [s.id, s.marks])), [])
  const [marks, setMarks] = useState(initial)
  const [flight, setFlight] = useState(null)
  const [inbox, setInbox] = useState(0)
  const [alert, setAlert] = useState(null)
  const cardRef = useRef(null)
  const inboxRef = useRef(null)
  const rowRefs = useRef({})
  const interacted = useRef(false)
  const flightCount = useRef(0)

  const marksRef = useRef(initial)

  const toggle = useCallback((student, index) => {
    const before = marksRef.current[student.id]
    const after = before.slice(0, index) + NEXT[before[index]] + before.slice(index + 1)
    marksRef.current = { ...marksRef.current, [student.id]: after }
    setMarks(marksRef.current)

    // First drop below the shortage line: send a signal from the row to the HOD inbox.
    if (percentOf(before) >= SHORTAGE && percentOf(after) < SHORTAGE && cardRef.current && inboxRef.current) {
      const card = cardRef.current.getBoundingClientRect()
      const row = rowRefs.current[student.id]?.getBoundingClientRect()
      const target = inboxRef.current.getBoundingClientRect()
      if (row) {
        flightCount.current += 1
        setFlight({
          key: flightCount.current,
          name: student.name,
          pct: percentOf(after),
          from: { x: row.right - card.left - 60, y: row.top - card.top + row.height / 2 },
          to: { x: target.left - card.left + target.width / 2, y: target.top - card.top + target.height / 2 },
        })
      }
    }
  }, [])

  // Play the key moment once on its own, when the register comes into view:
  // Rohan, sitting on exactly 85%, misses one class.
  const inView = useInView(cardRef, { once: true, amount: 0.5 })
  useEffect(() => {
    if (!inView) return undefined
    const t = setTimeout(() => {
      if (!interacted.current) toggle(REGISTER_STUDENTS[1], SESSION_COUNT - 1)
    }, reduceMotion ? 300 : 1200)
    return () => clearTimeout(t)
  }, [inView, toggle, reduceMotion])

  const landed = () => {
    setInbox((n) => n + 1)
    setAlert({ name: flight.name, pct: flight.pct })
    setFlight(null)
  }

  const reset = () => {
    interacted.current = true
    marksRef.current = initial
    setMarks(initial)
    setAlert(null)
    setInbox(0)
  }

  return (
    <div ref={cardRef} className="relative mx-auto w-full max-w-[860px]">
      {/* Spotlight cone onto the register */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(148,180,255,0.16),transparent)]"
      />

      <div className="relative overflow-hidden rounded-2xl border border-night-line bg-night-2/90 shadow-[0_40px_120px_-40px_rgba(255,92,0,0.35)] backdrop-blur">
        <div className="flex flex-col items-start gap-3 border-b border-night-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-[15px] font-semibold text-white">CS301 Data Structures, Sem 5 Sec A</p>
            <p className="text-xs text-mist">Sample register. Click any session to change it.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-mist hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
            <div
              ref={inboxRef}
              className="relative inline-flex items-center gap-1.5 rounded-lg border border-night-line bg-night px-2.5 py-1.5 text-xs font-medium text-white"
            >
              <Inbox className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
              HOD inbox
              <AnimatePresence>
                {inbox > 0 && (
                  <motion.span
                    key={inbox}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-0.5 rounded-full bg-brand-500 px-1.5 text-[11px] font-bold tabular-nums"
                  >
                    {inbox}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className={cn('relative py-2', phone ? 'px-4' : 'px-5')} style={phone ? undefined : { minWidth: ROW_MIN_W }} role="table" aria-label="Sample attendance register">
            {/* The shortage line */}
            {!phone && (
              <div aria-hidden="true" className="pointer-events-none absolute top-0 bottom-0" style={{ left: 20 + BEAM_LEFT }}>
                <div className="absolute inset-y-2 w-px bg-brand-500 shadow-[0_0_14px_3px_rgba(255,92,0,0.55)]" />
                <span className="absolute -top-0 -translate-x-1/2 rounded-sm bg-brand-500 px-1 text-[10px] font-bold text-white">{SHORTAGE}%</span>
              </div>
            )}

            <div role="row" className={cn('grid items-end pt-4 pb-1 text-[11px] text-mist', phone ? 'gap-1.5' : 'gap-4')} style={{ gridTemplateColumns: columns }}>
              <span role="columnheader">Student</span>
              <span role="columnheader" className="flex gap-1">
                {Array.from({ length: SESSION_COUNT - firstShown }, (_, i) => (
                  <span key={i} className="w-6 text-center tabular-nums">{firstShown + i + 1}</span>
                ))}
              </span>
              {phone ? <span role="columnheader" className="col-span-2 text-right">Attendance</span> : <span role="columnheader">Attendance</span>}
              {!phone && (
                <>
                  <span role="columnheader" className="sr-only">Percent</span>
                  <span role="columnheader" className="sr-only">Status</span>
                </>
              )}
            </div>

            {REGISTER_STUDENTS.map((student, row) => {
              const pct = percentOf(marks[student.id])
              const short = pct < SHORTAGE
              return (
                <motion.div
                  key={student.id}
                  ref={(el) => { rowRefs.current[student.id] = el }}
                  role="row"
                  animate={{ backgroundColor: short ? 'rgba(229,72,77,0.08)' : 'rgba(0,0,0,0)' }}
                  className={cn('-mx-2 grid items-center rounded-lg px-2 py-2', phone ? 'gap-1.5' : 'gap-4')}
                  style={{ gridTemplateColumns: columns }}
                >
                  <div role="rowheader">
                    <p className="truncate text-sm font-medium text-white">{student.name}</p>
                    <p className="text-[11px] text-mist tabular-nums">{student.usn}</p>
                  </div>
                  <div role="cell" className="flex gap-1">
                    {[...marks[student.id]].map((m, i) => i < firstShown ? null : (
                      <motion.button
                        key={i}
                        type="button"
                        onClick={() => {
                          interacted.current = true
                          toggle(student, i)
                        }}
                        aria-label={`${student.name}, session ${i + 1}: ${LABEL[m]}. Change to ${LABEL[NEXT[m]]}.`}
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + row * 0.07 + i * 0.02, duration: 0.25 }}
                        whileTap={{ scale: 0.85 }}
                        className={cn(
                          'h-7 w-6 rounded-[5px] border text-[11px] font-bold cursor-pointer',
                          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400',
                          CELL[m]
                        )}
                      >
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={m}
                            initial={{ rotateX: 90, opacity: 0 }}
                            animate={{ rotateX: 0, opacity: 1 }}
                            exit={{ rotateX: -90, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="block"
                          >
                            {m}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                    ))}
                  </div>
                  {!phone && (
                    <div role="cell" className="relative h-1.5 rounded-full bg-white/10" aria-hidden="true">
                      <motion.div
                        className={cn('absolute inset-y-0 left-0 rounded-full', short ? 'bg-absent' : pct < WARNING ? 'bg-late' : 'bg-emerald-400')}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.6 + row * 0.07 }}
                      />
                    </div>
                  )}
                  <span role="cell" className={cn('text-right text-sm font-semibold tabular-nums', short ? 'text-red-300' : 'text-white')}>
                    {pct}%
                  </span>
                  <span
                    role="cell"
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold',
                      short ? 'bg-absent text-white' : pct < WARNING ? 'bg-amber-300/15 text-amber-200' : 'bg-emerald-400/10 text-emerald-300'
                    )}
                  >
                    {short ? 'Shortage' : pct < WARNING ? 'Warning' : 'On track'}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="min-h-11 border-t border-night-line px-5 py-3 text-xs text-mist" aria-live="polite">
          {alert ? (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <span className="font-semibold text-white">{alert.name}</span> fell to {alert.pct}%. Alert sent to the
              student, the CS301 teacher and the HOD.
            </motion.p>
          ) : (
            <p>
              <b className="text-emerald-300">P</b> present &nbsp; <b className="text-red-300">A</b> absent &nbsp;
              <b className="text-amber-200">L</b> late counts as half{phone && '. Latest 3 classes shown.'}
            </p>
          )}
        </div>
      </div>

      {/* Signal flying from the student's row to the HOD inbox */}
      <AnimatePresence>
        {flight && (
          <motion.span
            key={flight.key}
            aria-hidden="true"
            className="pointer-events-none absolute z-10 h-3 w-3 rounded-full bg-brand-500 shadow-[0_0_16px_4px_rgba(255,92,0,0.7)]"
            initial={{ x: flight.from.x, y: flight.from.y, opacity: 0, scale: 0.6 }}
            animate={{ x: flight.to.x, y: flight.to.y, opacity: [0, 1, 1, 0.2], scale: [0.6, 1.2, 1, 0.6] }}
            transition={{ duration: reduceMotion ? 0.01 : 0.9, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={landed}
            style={{ left: -6, top: -6 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
