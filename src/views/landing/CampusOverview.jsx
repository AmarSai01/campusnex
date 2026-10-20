import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CalendarClock, ClipboardCheck, GraduationCap, MapPin, Megaphone, TriangleAlert, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RISK_RULES } from '@/utils/risk'
import { ADMIN_DEPARTMENTS, ADMIN_KPIS, HOD_AT_RISK, STUDENT_NEXT_EXAM } from './sampleData'

const SHORTAGE = RISK_RULES.attendance.shortage

const Card = ({ className, children }) => (
  <div className={cn('relative overflow-hidden rounded-2xl border border-night-line bg-night-2/90 shadow-[0_40px_120px_-40px_rgba(255,92,0,0.35)] backdrop-blur', className)}>
    {children}
  </div>
)

// One window, four desks: the same campus seen by each role.
const ROLE_VIEWS = {
  Admin: [
    { title: 'Institution today', icon: Users, kind: 'stats', data: ADMIN_KPIS },
    { title: 'Attendance by department', icon: ClipboardCheck, kind: 'bars', data: ADMIN_DEPARTMENTS.map((d) => ({ label: d.code, value: d.attendance })) },
    { title: 'Semester 5 results', icon: GraduationCap, kind: 'big', data: { value: 'Ready', label: 'CSE and ISE uploaded and checked', action: 'Publish results' } },
    { title: 'Circulars', icon: Megaphone, kind: 'big', data: { value: 'Circular No. 42', label: 'Sent to every department, faculty member and student' } },
  ],
  HOD: [
    { title: 'Students at risk, CSE', icon: TriangleAlert, kind: 'list', wide: true, data: HOD_AT_RISK.slice(0, 4).map((r) => ({ primary: r.name, secondary: `${r.subject}, ${r.kind === 'attendance' ? 'attendance' : 'IA average'}`, value: `${r.value}%`, tone: 'bad' })) },
    { title: 'Behind on publishing', icon: ClipboardCheck, kind: 'list', data: [{ primary: 'CS303 IA-2', secondary: 'Marks entered, not published', value: '3 days', tone: 'warn' }, { primary: 'CS305 attendance', secondary: 'Not marked today', value: 'Today', tone: 'warn' }] },
    { title: 'Department notice', icon: Megaphone, kind: 'big', data: { value: 'IA-3 timetable', label: 'Posted to all CSE students and faculty' } },
  ],
  Faculty: [
    { title: "Today's classes", icon: CalendarClock, kind: 'list', data: [{ primary: 'CS301, 9:00 am', secondary: 'LH-101, Sem 5 Sec A', value: 'Marked', tone: 'good' }, { primary: 'CS302, 11:30 am', secondary: 'LH-104, Sem 5 Sec B', value: 'Pending', tone: 'warn' }] },
    { title: 'IA-2 marks, CS301', icon: BookOpen, kind: 'big', data: { value: '34 / 50', label: 'Class average, hidden from students', action: 'Publish marks' } },
    { title: 'Assignments to grade', icon: ClipboardCheck, kind: 'big', data: { value: '12', label: 'Submissions waiting for CS301' } },
    { title: 'Shortage in my classes', icon: TriangleAlert, kind: 'list', data: [{ primary: 'Rohan Shetty', secondary: 'CS301 attendance', value: '67%', tone: 'bad' }] },
  ],
  Student: [
    { title: 'My attendance', icon: ClipboardCheck, kind: 'bars', data: [{ label: 'CS301', value: 67 }, { label: 'CS302', value: 78 }, { label: 'CS303', value: 86 }] },
    { title: 'Next exam', icon: MapPin, kind: 'big', data: { value: `${STUDENT_NEXT_EXAM.room}, seat ${STUDENT_NEXT_EXAM.seat}`, label: `${STUDENT_NEXT_EXAM.subject}, ${STUDENT_NEXT_EXAM.date}` } },
    { title: 'Results', icon: GraduationCap, kind: 'stats', data: [{ label: 'SGPA, Sem 5', value: '8.90' }, { label: 'CGPA', value: '8.22' }] },
    { title: 'Notices', icon: Megaphone, kind: 'list', data: [{ primary: 'IA-3 timetable posted', secondary: 'From HOD, CSE', value: 'New', tone: 'good' }] },
  ],
}
const ROLES = Object.keys(ROLE_VIEWS)
const TONE = { good: 'text-emerald-300', warn: 'text-amber-200', bad: 'text-red-300' }

function Tile({ tile }) {
  const Icon = tile.icon
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-white/10 bg-white/[0.03] p-4', tile.wide && 'sm:row-span-2')}
    >
      <p className="flex items-center gap-2 text-xs font-medium text-mist">
        <Icon className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" /> {tile.title}
      </p>
      {tile.kind === 'stats' && (
        <dl className="mt-3 grid grid-cols-2 gap-3">
          {tile.data.map((d) => (
            <div key={d.label}>
              <dd className="font-display text-xl font-semibold text-white tabular-nums">{d.value}</dd>
              <dt className="text-[11px] text-mist">{d.label}</dt>
            </div>
          ))}
        </dl>
      )}
      {tile.kind === 'bars' && (
        <ul className="mt-3 space-y-2">
          {tile.data.map((d) => (
            <li key={d.label} className="grid grid-cols-[44px_minmax(0,1fr)_36px] items-center gap-2 text-xs">
              <span className="text-white/85">{d.label}</span>
              <span className="relative h-1.5 rounded-full bg-white/10">
                <motion.span initial={{ width: 0 }} animate={{ width: `${d.value}%` }} transition={{ duration: 0.6 }} className={cn('absolute inset-y-0 left-0 rounded-full', d.value < SHORTAGE ? 'bg-absent' : 'bg-emerald-400')} />
                <span className="absolute -inset-y-1 w-px bg-brand-500/70" style={{ left: `${SHORTAGE}%` }} aria-hidden="true" />
              </span>
              <span className={cn('text-right tabular-nums', d.value < SHORTAGE ? 'text-red-300' : 'text-white')}>{d.value}%</span>
            </li>
          ))}
        </ul>
      )}
      {tile.kind === 'list' && (
        <ul className="mt-3 space-y-2.5">
          {tile.data.map((d) => (
            <li key={d.primary} className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">{d.primary}</span>
                <span className="block truncate text-[11px] text-mist">{d.secondary}</span>
              </span>
              <span className={cn('shrink-0 text-xs font-semibold tabular-nums', TONE[d.tone])}>{d.value}</span>
            </li>
          ))}
        </ul>
      )}
      {tile.kind === 'big' && (
        <div className="mt-3">
          <p className="font-display text-2xl font-semibold text-white">{tile.data.value}</p>
          <p className="mt-1 text-xs text-mist">{tile.data.label}</p>
          {tile.data.action && (
            <span className="mt-3 inline-block rounded-md bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white">{tile.data.action}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function CampusOverview() {
  const [role, setRole] = useState('HOD')
  const picked = useRef(false)

  // Tour the desks on its own until the visitor picks one.
  useEffect(() => {
    const t = setInterval(() => {
      if (!picked.current) setRole((r) => ROLES[(ROLES.indexOf(r) + 1) % ROLES.length])
    }, 4200)
    return () => clearInterval(t)
  }, [])

  return (
    <Card className="mx-auto max-w-[920px] text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-night-line px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </span>
          <span className="text-xs text-mist">Sample college, sample data</span>
        </div>
        <div role="tablist" aria-label="View Campusnex as" className="flex rounded-lg border border-night-line bg-night p-0.5">
          {ROLES.map((r) => (
            <button
              key={r}
              role="tab"
              type="button"
              aria-selected={role === r}
              onClick={() => {
                picked.current = true
                setRole(r)
              }}
              className={cn('relative cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors', role === r ? 'text-white' : 'text-mist hover:text-white')}
            >
              {role === r && <motion.span layoutId="role-pill" className="absolute inset-0 rounded-md bg-brand-500" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} />}
              <span className="relative">{r}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pt-4 pb-1">
        <p className="font-display text-lg font-semibold text-white">{role === 'HOD' ? 'HOD desk, CSE' : `${role} desk`}</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid gap-3 p-4 sm:grid-cols-2"
        >
          {ROLE_VIEWS[role].map((tile) => <Tile key={tile.title} tile={tile} />)}
        </motion.div>
      </AnimatePresence>
    </Card>
  )
}
