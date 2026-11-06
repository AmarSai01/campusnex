import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { BookOpen, Bot, ChartLine, ClipboardList, FileText, GraduationCap, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeading } from './Sections'
import { useRequestPilot } from './PilotRequest'

// "Ask Campusnex": AI assistants Campusnex can build for a college on request.
// Not part of the product today, so the section says "Built on request", the chat is
// labelled as a sample, and visitors pick from written questions instead of typing.

const ROLES = {
  Student: [
    {
      q: "What's my first class tomorrow?",
      a: 'CS301 Data Structures at 9:00 am in LH-101, with Dr. Rao.',
    },
    {
      q: 'Unit 3 notes on deadlocks',
      a: 'A deadlock happens when processes wait on each other forever. Your teacher covers the four conditions and how to prevent them here:',
      source: 'OS Unit 3 notes, page 12',
    },
    {
      q: 'Am I short on attendance?',
      a: 'CS301 is at 75%, below the 85% you need for the SEE. Attend the next 7 CS301 classes to get back above 85%. Your other subjects are fine.',
    },
  ],
  Faculty: [
    {
      q: 'What are students asking about most?',
      a: 'This week in CS301, students asked most about:',
      lines: [
        'AVL rotations (Unit 4): 23 questions',
        'Inorder vs preorder traversal (Unit 4): 15 questions',
        'Circular queues (Unit 2): 9 questions',
      ],
      note: 'A good topic to revise in your next class.',
    },
    {
      q: "Who hasn't submitted Assignment 2?",
      a: '4 of 60 students in CS301, Sem 5 Sec A. It was due on Monday:',
      lines: ['Varun Joshi', 'Nisha Reddy', 'Tanvi Shah', 'Karthik Das'],
      note: 'Send them a reminder from Assignments.',
    },
    {
      q: 'Who is below 85% in CS301?',
      a: 'Two students: Rohan Shetty at 75% and Farhan Ali at 70%. Both have already been alerted, along with the HOD.',
    },
  ],
  HOD: [
    {
      q: 'Who is at risk this week?',
      a: 'Three students in CSE:',
      lines: [
        'Farhan Ali: CS301 attendance 70%',
        'Kavya Menon: CS303 IA average 36%',
        'Rohan Shetty: CS301 attendance 75%',
      ],
    },
    {
      q: 'Which subjects are behind on IA marks?',
      a: 'CS303 IA-2 marks were entered 3 days ago but are not published yet. Everything else is up to date.',
    },
    {
      q: 'Draft a notice for IA-3',
      a: 'Draft notice: IA-3 for all CSE semesters will be held next week. The timetable and hall allotment are on Campusnex. Students below 85% attendance should meet their subject teacher.',
      note: 'Draft only. Review before sending.',
    },
  ],
}
const ROLE_NAMES = Object.keys(ROLES)

const CAPABILITIES = [
  { icon: GraduationCap, title: 'Student assistant', body: 'Timetable, faculty, subjects, syllabus and course outcomes, answered from your college data.' },
  { icon: BookOpen, title: 'Study library', body: 'Teachers upload notes. Students get answers with the exact file, page and link.' },
  { icon: ClipboardList, title: 'Faculty helpers', body: 'See which topics students ask about most, who has not submitted work and who is falling behind. Test questions stay with the teacher.' },
  { icon: ChartLine, title: 'HOD and admin insights', body: 'A weekly digest of students at risk and classes falling behind, plus notice drafts.' },
]

function Answer({ item }) {
  return (
    <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm leading-relaxed text-white/90">
      {item.a}
      {item.lines && (
        <ul className="mt-2 space-y-1">
          {item.lines.map((line) => (
            <li key={line} className="text-white/80">{line}</li>
          ))}
        </ul>
      )}
      {item.source && (
        <span className="mt-2 flex w-fit items-center gap-1.5 rounded-md border border-white/10 bg-night px-2 py-1 text-xs font-medium text-brand-200">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          {item.source}
        </span>
      )}
      {item.note && <p className="mt-2 text-xs font-medium text-amber-200/90">{item.note}</p>}
    </div>
  )
}

// A sample chat: pick a role, then click a question to see how the assistant would answer.
function DemoChat() {
  const ref = useRef(null)
  const listRef = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduce = useReducedMotion()
  const [role, setRole] = useState('Student')
  const [asked, setAsked] = useState([]) // indexes of questions asked in this role, in order
  const [typing, setTyping] = useState(false)
  const timer = useRef(null)

  const ask = (index) => {
    if (typing) return
    clearTimeout(timer.current)
    setAsked((list) => [...list.filter((i) => i !== index), index])
    if (reduce) return
    setTyping(true)
    timer.current = setTimeout(() => setTyping(false), 1100)
  }

  const switchRole = (next) => {
    clearTimeout(timer.current)
    setTyping(false)
    setRole(next)
    setAsked([])
  }

  // Play the first student question once on its own, so the chat never looks empty.
  useEffect(() => {
    if (!inView) return undefined
    const t = setTimeout(() => setAsked((list) => (list.length ? list : [0])), reduce ? 0 : 600)
    return () => clearTimeout(t)
  }, [inView, reduce])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  }, [asked, typing, reduce])

  const items = ROLES[role]
  const last = asked[asked.length - 1]

  return (
    <div ref={ref} className="flex h-full flex-col rounded-2xl border border-night-line bg-night-2/90 shadow-[0_40px_120px_-40px_rgba(255,92,0,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-night-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </span>
          Ask Campusnex
        </span>
        <div role="tablist" aria-label="Ask as" className="flex rounded-lg border border-night-line bg-night p-0.5">
          {ROLE_NAMES.map((r) => (
            <button
              key={r}
              role="tab"
              type="button"
              aria-selected={role === r}
              onClick={() => switchRole(r)}
              className={cn('relative cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors', role === r ? 'text-white' : 'text-mist hover:text-white')}
            >
              {role === r && <motion.span layoutId="ask-role" className="absolute inset-0 rounded-md bg-brand-500" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
              <span className="relative">{r}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="flex h-[320px] flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {asked.map((index) => {
            const item = items[index]
            const pending = typing && index === last
            return (
              <motion.div key={`${role}-${index}`} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-500 px-4 py-2.5 text-sm text-white">{item.q}</div>
                </div>
                {pending ? (
                  <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3" aria-hidden="true">
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-white/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
                    ))}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <Answer item={item} />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        {!asked.length && <p className="m-auto text-sm text-mist">Pick a question below to see how the assistant answers.</p>}
      </div>

      <div className="border-t border-night-line px-4 py-3">
        <p className="text-xs font-medium text-mist">Try asking as {role === 'HOD' ? 'an HOD' : `a ${role.toLowerCase()}`}:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <button
              key={item.q}
              type="button"
              onClick={() => ask(i)}
              disabled={typing}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-wait',
                last === i ? 'border-brand-400/60 bg-brand-500/15 text-brand-100' : 'border-white/15 bg-white/[0.04] text-white/85 hover:border-white/30 hover:bg-white/[0.08]'
              )}
            >
              {item.q}
            </button>
          ))}
        </div>
      </div>

      <p className="rounded-b-2xl border-t border-night-line bg-white/[0.02] px-4 py-2.5 text-xs text-mist">
        Sample answers. In your college, these come from your own timetable, records and teachers' notes.
      </p>
    </div>
  )
}

export default function AskCampusnex() {
  const requestPilot = useRequestPilot()
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
        Built on request
      </span>
      <div className="mt-4">
        <SectionHeading title="Ask Campusnex.">
          AI assistants and study search, built for your college when you ask for them. Students, teachers and HODs ask
          in plain words, and the answers come from your own timetable, records and teachers' notes.
        </SectionHeading>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <DemoChat />
        <div className="grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            // Hover: a soft orange fill rises from the bottom of the card and the icon turns solid orange.
            <div
              key={title}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-white/10 bg-night-2/60 p-5 backdrop-blur-sm transition-[border-color] duration-300 hover:border-brand-500/40',
                'before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-gradient-to-t before:from-brand-500/25 before:to-brand-500/0 before:transition-transform before:duration-500 before:ease-out before:content-[""] hover:before:scale-y-100',
                'motion-reduce:transition-none motion-reduce:before:transition-none',
              )}
            >
              <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-500/12 text-brand-300 transition-[background-color,color] duration-300 group-hover:bg-brand-500 group-hover:text-white motion-reduce:transition-none">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="relative mt-3 font-display text-base font-semibold text-white">{title}</h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-mist">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3 text-sm leading-relaxed text-mist">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" aria-hidden="true" />
          Answers come only from your college's data, follow the same role rules as the rest of Campusnex, and every
          draft is approved by a person.
        </p>
        <button
          type="button"
          onClick={() => requestPilot('institution')}
          className="shrink-0 cursor-pointer rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Talk to us about AI
        </button>
      </div>
    </>
  )
}
