import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'

// Demo page for the Calendar component: open /?calendar-demo
const today = new Date()
const y = today.getFullYear()
const m = today.getMonth()
const day = (d, offset = 0) => new Date(y, m + offset, d)

const exams = [
  { date: day(10), label: 'Data Structures IA-1' },
  { date: day(13), label: 'DBMS IA-1' },
  { date: day(18), label: 'Operating Systems IA-1' },
  { date: day(4, 1), label: 'Lab internal' },
]
const holidays = [day(14), day(26), day(1, 1)]
const isSunday = (d) => d.getDay() === 0

const fmt = (d) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

function Panel({ title, hint, children, footer }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
      <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{footer}</div>
    </section>
  )
}

export default function CalendarDemo() {
  const [examDate, setExamDate] = useState(day(10))
  const [leave, setLeave] = useState({ from: day(20), to: day(23) })
  const [labDays, setLabDays] = useState([day(6), day(8), day(15)])

  const examLabel = exams.find((e) => examDate && e.date.toDateString() === examDate.toDateString())?.label

  return (
    <main className="min-h-screen bg-muted/40 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Calendar component</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three ways it could be used in CampusNex. Click the month or year in the header to jump quickly.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Panel
            title="Pick an exam date"
            hint="Dots mark scheduled exams. Holidays are struck through."
            footer={<>Selected: <b className="text-foreground">{fmt(examDate)}</b>{examLabel ? ` · ${examLabel}` : ''}</>}
          >
            <Calendar selected={examDate} onSelect={setExamDate} events={exams} bookedDates={holidays} />
          </Panel>

          <Panel
            title="Apply for leave"
            hint="Range mode. Week starts Monday, Sundays disabled."
            footer={<>Leave: <b className="text-foreground">{fmt(leave?.from)}</b> to <b className="text-foreground">{fmt(leave?.to)}</b></>}
          >
            <Calendar
              mode="range"
              selected={leave}
              onSelect={setLeave}
              weekStartsOn={1}
              disabled={isSunday}
              bookedDates={holidays}
            />
          </Panel>

          <Panel
            title="Mark lab days"
            hint="Multiple mode. Click days to toggle them."
            footer={<><b className="text-foreground">{labDays.length}</b> lab day{labDays.length === 1 ? '' : 's'} marked</>}
          >
            <Calendar mode="multiple" selected={labDays} onSelect={setLabDays} />
          </Panel>
        </div>
      </div>
    </main>
  )
}
