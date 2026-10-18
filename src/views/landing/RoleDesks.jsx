import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Check, Download, Eye, EyeOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { downloadCsv } from '@/utils/exportReport'
import {
  ADMIN_DEPARTMENTS,
  ADMIN_KPIS,
  FACULTY_ROSTER,
  HOD_AT_RISK,
  STUDENT_NEXT_EXAM,
  STUDENT_SUBJECTS,
} from './sampleData'

const DESKS = [
  {
    id: 'admin',
    label: 'Admin',
    title: 'Run the whole campus from one place',
    points: [
      'Set up departments, courses and timetables, with clash checks for rooms and teachers.',
      'Import hundreds of students from a spreadsheet, with every row checked first.',
      'Schedule exams, book halls and generate seating plans.',
      'Send circulars to everyone, one department, or only faculty or students.',
    ],
  },
  {
    id: 'hod',
    label: 'HOD',
    title: 'See your department before problems grow',
    points: [
      'Every student’s attendance and marks, subject by subject.',
      'Students below 75% attendance or a 40% IA average are flagged automatically.',
      'Spot classes that are behind on attendance, unpublished marks or grading.',
      'Post department notices and export reports to CSV or PDF.',
    ],
  },
  {
    id: 'faculty',
    label: 'Faculty',
    title: 'Less paperwork per class',
    points: [
      'Mark a whole class in a few taps.',
      'Enter IA marks and publish them when you are ready.',
      'Create assignments and grade submissions with feedback.',
      'Post notices to the classes you teach.',
    ],
  },
  {
    id: 'student',
    label: 'Student',
    title: 'Everything a student checks, in one hub',
    points: [
      'Attendance for every subject, with the 75% line shown.',
      'IA marks as soon as the teacher publishes them.',
      'Assignment submissions, the timetable and circulars.',
      'Exam dates with their own room and seat number.',
    ],
  },
]

const Panel = ({ children, className }) => (
  <div className={cn('rounded-xl border border-rule bg-white p-4 sm:p-5', className)}>{children}</div>
)

const SampleTag = () => (
  <span className="rounded-md bg-paper px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">Sample data</span>
)

function AdminPanel() {
  const [sorted, setSorted] = useState(false)
  const data = sorted ? [...ADMIN_DEPARTMENTS].sort((a, b) => a.attendance - b.attendance) : ADMIN_DEPARTMENTS
  return (
    <Panel>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-ink">Institution overview</p>
        <SampleTag />
      </div>
      <dl className="mt-3 grid grid-cols-2 divide-rule border-y border-rule sm:grid-cols-4 sm:divide-x">
        {ADMIN_KPIS.map((k) => (
          <div key={k.label} className="px-1 py-3 sm:px-3">
            <dt className="text-[11px] text-ink-soft">{k.label}</dt>
            <dd className="font-display text-xl font-semibold text-ink tabular-nums">{k.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">Attendance by department</p>
        <button
          type="button"
          onClick={() => setSorted((s) => !s)}
          className="rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 cursor-pointer"
        >
          {sorted ? 'Original order' : 'Lowest first'}
        </button>
      </div>
      <div className="mt-2 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#4a5876' }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="code" width={40} tick={{ fontSize: 12, fill: '#16233f' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#f6f8fb' }}
              formatter={(v) => [`${v}%`, 'Attendance']}
              contentStyle={{ borderRadius: 8, border: '1px solid #d5deec', fontSize: 12 }}
            />
            <ReferenceLine x={75} stroke="#16233f" strokeDasharray="3 3" label={{ value: '75%', position: 'top', fontSize: 11, fill: '#16233f' }} />
            <Bar dataKey="attendance" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.code} fill={d.attendance < 75 ? '#e5484d' : d.attendance < 80 ? '#e8a317' : '#1f9d55'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

function HodPanel() {
  const [filter, setFilter] = useState('all')
  const rows = HOD_AT_RISK.filter((r) => filter === 'all' || r.kind === filter)
  const exportCsv = () =>
    downloadCsv(
      'campusnex-sample-at-risk.csv',
      ['USN', 'Student', 'Subject', 'Reason', 'Value'],
      rows.map((r) => [r.usn, r.name, r.subject, r.kind === 'attendance' ? 'Attendance' : 'IA average', `${r.value}%`])
    )
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-ink">Students needing attention, CSE</p>
        <SampleTag />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Filter by reason" className="inline-flex rounded-lg border border-rule p-0.5">
          {[
            ['all', 'All'],
            ['attendance', 'Attendance'],
            ['marks', 'Marks'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer',
                filter === id ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1 text-xs font-semibold text-ink hover:bg-paper cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download CSV
        </button>
      </div>
      <ul className="mt-3 divide-y divide-rule/70">
        <AnimatePresence initial={false}>
          {rows.map((r) => {
            const limit = r.kind === 'attendance' ? 75 : 40
            return (
              <motion.li
                key={r.usn + r.subject}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
                  <p className="text-[11px] text-ink-soft tabular-nums">{r.usn}, {r.subject}</p>
                </div>
                <div className="w-40 text-right">
                  <p className="text-xs font-semibold text-absent-strong">
                    {r.kind === 'attendance' ? 'Attendance' : 'IA average'} {r.value}%
                  </p>
                  <div className="relative mt-1 h-1.5 rounded-full bg-rule" aria-hidden="true">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-absent" style={{ width: `${r.value}%` }} />
                    <span className="absolute -top-1 bottom-[-4px] w-px bg-ink/60" style={{ left: `${limit}%` }} />
                  </div>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}

function FacultyPanel() {
  const [present, setPresent] = useState(() => Object.fromEntries(FACULTY_ROSTER.map((s) => [s.id, true])))
  const [saved, setSaved] = useState(null)
  const [published, setPublished] = useState(false)
  const count = Object.values(present).filter(Boolean).length

  const setOne = (id, value) => {
    setPresent((p) => ({ ...p, [id]: value }))
    setSaved(null)
  }

  return (
    <div className="grid gap-3">
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-semibold text-ink">Today, CS302 Operating Systems</p>
          <SampleTag />
        </div>
        <ul className="mt-3 divide-y divide-rule/70">
          {FACULTY_ROSTER.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-ink">{s.name}</span>
              <div role="group" aria-label={`${s.name} attendance`} className="inline-flex rounded-lg border border-rule p-0.5">
                {[
                  [true, 'Present'],
                  [false, 'Absent'],
                ].map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={present[s.id] === value}
                    onClick={() => setOne(s.id, value)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer',
                      present[s.id] === value
                        ? value ? 'bg-present text-white' : 'bg-absent text-white'
                        : 'text-ink-soft hover:text-ink'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-soft" aria-live="polite">
            {saved ? (
              <span className="inline-flex items-center gap-1 font-semibold text-present-strong">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Saved: {saved.present} present, {saved.absent} absent
              </span>
            ) : (
              `${count} of ${FACULTY_ROSTER.length} present`
            )}
          </p>
          <button
            type="button"
            onClick={() => setSaved({ present: count, absent: FACULTY_ROSTER.length - count })}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 cursor-pointer"
          >
            Save attendance
          </button>
        </div>
      </Panel>

      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">IA-2 marks, CS302</p>
          <p className="text-xs text-ink-soft">
            {published ? 'Students can see their scores now.' : 'Hidden from students until you publish.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={published}
          onClick={() => setPublished((p) => !p)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer',
            published ? 'bg-ink text-white' : 'border border-rule text-ink hover:bg-paper'
          )}
        >
          {published ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
          {published ? 'Published' : 'Publish marks'}
        </button>
      </Panel>
    </div>
  )
}

function StudentPanel() {
  return (
    <div className="grid gap-3">
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-semibold text-ink">My subjects, Sem 5</p>
          <SampleTag />
        </div>
        <ul className="mt-3 divide-y divide-rule/70">
          {STUDENT_SUBJECTS.map((s) => (
            <li key={s.code} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[1fr_8rem_6.5rem]">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{s.code} {s.name}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 sm:order-none order-last">
                <div className="flex items-center justify-between text-[11px] text-ink-soft">
                  <span>Attendance</span>
                  <span className={cn('font-semibold tabular-nums', s.attendance < 80 ? 'text-ink' : 'text-present-strong')}>{s.attendance}%</span>
                </div>
                <div className="relative mt-1 h-1.5 rounded-full bg-rule" aria-hidden="true">
                  <div
                    className={cn('absolute inset-y-0 left-0 rounded-full', s.attendance < 75 ? 'bg-absent' : s.attendance < 80 ? 'bg-late' : 'bg-present')}
                    style={{ width: `${s.attendance}%` }}
                  />
                  <span className="absolute -top-1 bottom-[-4px] left-[75%] w-px bg-ink/60" />
                </div>
              </div>
              <p className="text-right text-xs text-ink-soft">
                IA <span className="font-semibold text-ink">{s.ia}</span>
              </p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2">
          <p className="text-[11px] text-ink-soft">Next exam</p>
          <p className="text-sm font-semibold text-ink">{STUDENT_NEXT_EXAM.subject}</p>
          <p className="text-xs text-ink-soft">{STUDENT_NEXT_EXAM.date}</p>
        </div>
        <div>
          <p className="text-[11px] text-ink-soft">Room</p>
          <p className="font-display text-xl font-semibold text-ink">{STUDENT_NEXT_EXAM.room}</p>
        </div>
        <div>
          <p className="text-[11px] text-ink-soft">Seat</p>
          <p className="font-display text-xl font-semibold text-brand-700">{STUDENT_NEXT_EXAM.seat}</p>
        </div>
      </Panel>
    </div>
  )
}

const PANELS = { admin: AdminPanel, hod: HodPanel, faculty: FacultyPanel, student: StudentPanel }

export default function RoleDesks() {
  const [desk, setDesk] = useState('admin')
  return (
    <Tabs value={desk} onValueChange={setDesk} className="gap-6">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-rule bg-white p-1 sm:w-auto">
        {DESKS.map((d) => (
          <TabsTrigger
            key={d.id}
            value={d.id}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-soft data-[state=active]:bg-ink data-[state=active]:text-white data-[state=active]:shadow-none cursor-pointer"
          >
            {d.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {DESKS.map((d) => {
        const PanelComponent = PANELS[d.id]
        return (
          <TabsContent key={d.id} value={d.id} className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{d.title}</h3>
              <ul className="mt-5 space-y-3">
                {d.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <PanelComponent />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
