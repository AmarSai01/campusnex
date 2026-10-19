import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { BellRing, Check, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RISK_RULES } from '@/utils/risk'
import { useSectionBackdrop, useSetBackdrop } from './Backdrop'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ROSTER = [
  ['Ananya Rao', true],
  ['Rohan Shetty', false],
  ['Meera Iyer', true],
  ['Farhan Ali', true],
  ['Divya Nair', true],
]

const MARKS = [
  ['1CN23CS014', 'Ananya Rao', 46],
  ['1CN23CS027', 'Rohan Shetty', 31],
  ['1CN23CS031', 'Meera Iyer', 44],
  ['1CN23CS042', 'Farhan Ali', 18],
]

const AT_RISK = [
  ['Farhan Ali', 'CS301 attendance', 71],
  ['Rohan Shetty', 'CS301 attendance', 67],
  ['Farhan Ali', 'CS301 IA average', 36],
]

function Screen({ title, children }) {
  return (
    <div className="rounded-xl border border-night-line bg-night p-4">
      <p className="text-xs font-medium text-mist">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

const AttendanceScreen = () => (
  <Screen title="CS301, Sem 5 Sec A, today">
    <ul className="space-y-1.5">
      {ROSTER.map(([name, present]) => (
        <li key={name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-white">
          {name}
          <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', present ? 'bg-emerald-400/10 text-emerald-300' : 'bg-absent text-white')}>
            {present ? 'Present' : 'Absent'}
          </span>
        </li>
      ))}
    </ul>
    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved: 58 present, 2 absent
    </p>
  </Screen>
)

const MarksScreen = () => (
  <Screen title="IA-2 marks, CS301">
    <ul className="divide-y divide-night-line">
      {MARKS.map(([usn, name, score]) => (
        <li key={usn} className="flex items-center justify-between py-2 text-sm">
          <span className="text-white">{name} <span className="text-[11px] text-mist tabular-nums">{usn}</span></span>
          <span className={cn('font-semibold tabular-nums', score < 20 ? 'text-red-300' : 'text-white')}>{score} / 50</span>
        </li>
      ))}
    </ul>
    <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-500/10 px-3 py-2 text-xs">
      <span className="inline-flex items-center gap-1.5 font-semibold text-brand-300"><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Published</span>
      <span className="text-mist">60 students can see their scores</span>
    </div>
  </Screen>
)

const HodScreen = () => (
  <Screen title="HOD, CSE department: needs attention">
    <ul className="space-y-3">
      {AT_RISK.map(([name, what, value]) => {
        const limit = what.includes('IA') ? RISK_RULES.marks.fail : RISK_RULES.attendance.shortage
        return (
          <li key={name + what}>
            <div className="flex justify-between text-sm">
              <span className="text-white">{name}</span>
              <span className="font-semibold text-red-300 tabular-nums">{value}%</span>
            </div>
            <p className="text-[11px] text-mist">{what}, minimum {limit}%</p>
            <div className="relative mt-1.5 h-1.5 rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 rounded-full bg-absent" style={{ width: `${value}%` }} />
              <span className="absolute -top-1 -bottom-1 w-px bg-brand-500 shadow-[0_0_8px_2px_rgba(255,92,0,0.6)]" style={{ left: `${limit}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  </Screen>
)

const SeatScreen = () => (
  <Screen title="Student hub, Rohan Shetty">
    <div className="flex items-end justify-between gap-4 rounded-lg bg-white/[0.03] p-3">
      <div>
        <p className="text-[11px] text-mist">CS301 exam, 15 Oct, 9:30 am</p>
        <p className="font-display text-3xl font-semibold text-white">LH-101</p>
      </div>
      <div className="text-right">
        <p className="text-[11px] text-mist">Seat</p>
        <p className="font-display text-3xl font-semibold text-brand-400">S-07</p>
      </div>
    </div>
    <div className="mt-3 grid grid-cols-6 gap-1" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-5 rounded',
            i === 6 ? 'bg-brand-500 shadow-[0_0_10px_2px_rgba(255,92,0,0.6)]' : (Math.floor(i / 6) + i) % 2 ? 'bg-white/15' : 'bg-white/5'
          )}
        />
      ))}
    </div>
    <p className="mt-3 flex items-center gap-1.5 text-xs text-mist">
      <BellRing className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" /> CS301 attendance 67%. Attend upcoming classes to stay eligible.
    </p>
  </Screen>
)

const STEPS = [
  { time: '8:45 am', who: 'Faculty', theme: 'dawn', title: 'Attendance for a full class in under a minute', body: 'The teacher marks CS301. Rohan is absent, which takes him to 67%.', Screen: AttendanceScreen },
  { time: '11:30 am', who: 'Faculty', theme: 'morning', title: 'IA-2 marks, published when ready', body: 'Marks stay hidden until the teacher publishes. Then all 60 students see their score.', Screen: MarksScreen },
  { time: '2:30 pm', who: 'HOD', theme: 'afternoon', title: 'The HOD sees who is slipping', body: `Every student below ${RISK_RULES.attendance.shortage}% attendance or a ${RISK_RULES.marks.fail}% IA average is already on the list.`, Screen: HodScreen },
  { time: '5:00 pm', who: 'Student', theme: 'dusk', title: 'Students know where they stand', body: 'Rohan sees his exam room and seat, and a nudge about his attendance.', Screen: SeatScreen },
]

// Stacked layout (phones, reduced motion): each moment sets its own time of day.
function StepBlock({ step }) {
  const ref = useRef(null)
  useSectionBackdrop(ref, step.theme)
  const S = step.Screen
  return (
    <div ref={ref}>
      <p className="text-sm font-medium text-brand-400">{step.time}, {step.who}</p>
      <h3 className="mt-1 font-display text-2xl font-semibold text-white">{step.title}</h3>
      <p className="mt-2 text-mist">{step.body}</p>
      <div className="mt-5"><S /></div>
    </div>
  )
}

export default function CollegeDay() {
  const sectionRef = useRef(null)
  const [step, setStep] = useState(0)
  const [pinned, setPinned] = useState(false)
  const progress = useMotionValue(0)
  const setBackdrop = useSetBackdrop()
  const active = useRef(false)
  const stepRef = useRef(0)

  // While the story is pinned, the background follows the time of day.
  useEffect(() => {
    stepRef.current = step
    if (active.current) setBackdrop(STEPS[step].theme)
  }, [step, setBackdrop])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')
    const update = () => setPinned(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useGSAP(
    () => {
      if (!pinned) return
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: true,
        onToggle: (self) => {
          active.current = self.isActive
          if (self.isActive) setBackdrop(STEPS[stepRef.current].theme)
        },
        onUpdate: (self) => {
          progress.set(self.progress)
          const next = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))
          setStep((current) => (current === next ? current : next))
        },
      })
      // Let smooth scrolling re-measure the page now that the pin adds scroll length.
      ScrollTrigger.refresh()
    },
    { dependencies: [pinned], scope: sectionRef, revertOnUpdate: true }
  )

  if (!pinned) {
    return (
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">A day at your college</h2>
          {STEPS.map((s) => <StepBlock key={s.time} step={s} />)}
        </div>
      </section>
    )
  }

  const Current = STEPS[step].Screen
  return (
    <section ref={sectionRef} className="flex h-screen items-center">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-16 px-6">
        <div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-white">A day at your college</h2>
          <ol className="relative mt-8 space-y-1 pl-6">
            <div className="absolute top-2 bottom-2 left-0 w-px bg-night-line" aria-hidden="true">
              <motion.div className="w-px origin-top bg-brand-500 shadow-[0_0_10px_2px_rgba(255,92,0,0.5)]" style={{ height: '100%', scaleY: progress }} />
            </div>
            {STEPS.map((s, i) => (
              <li key={s.time} className={cn('rounded-lg px-3 py-3 transition-colors duration-300', i === step ? 'bg-white/[0.04]' : 'opacity-45')}>
                <p className="text-xs font-medium text-brand-400">{s.time}, {s.who}</p>
                <p className="mt-0.5 font-display text-lg font-semibold text-white">{s.title}</p>
                {i === step && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-mist">
                    {s.body}
                  </motion.p>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-night-line bg-night-2 p-3 shadow-[0_40px_100px_-40px_rgba(255,92,0,0.4)]">
          <div className="mb-3 flex gap-1.5 px-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Current />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
