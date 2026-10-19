import React, { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { DataContext } from '../../context/DataContext'
import { AuthContext } from '../../context/AuthContext'
import StudentAnalytics from '../../components/shared/StudentAnalytics'
import ClassPerformance from '../../components/shared/ClassPerformance'

// Dev-only preview of Student Analytics with sample data (no sign-in, nothing saved).
// Open http://localhost:5173/?preview=analytics on the dev server.

const DEPARTMENT = { id: 'dept_cse', code: 'CSE', name: 'Computer Science & Engineering', head_faculty_id: 'h1' }

const TEACHER = { id: 'f1', name: 'Dr. Kiran Rao', role: 'faculty', department_id: 'dept_cse' }
const HOD = { id: 'h1', name: 'Dr. Meena Iyer', role: 'faculty', department_id: 'dept_cse' }

const STUDENTS = [
  ['s1', 'Ananya Rao', '1CN26CS001', 'A'],
  ['s2', 'Rohan Shetty', '1CN26CS002', 'A'],
  ['s3', 'Kavya Menon', '1CN26CS003', 'A'],
  ['s4', 'Sneha Patil', '1CN26CS004', 'A'],
  ['s5', 'Arjun Gowda', '1CN26CS005', 'B'],
  ['s6', 'Meera Joshi', '1CN26CS006', 'B'],
].map(([id, name, usn, section]) => ({ id, name, usn, section, role: 'student', department_id: 'dept_cse', semester: 5 }))

const USERS = [
  TEACHER,
  HOD,
  { id: 'f2', name: 'Prof. Arun Kumar', role: 'faculty', department_id: 'dept_cse' },
  ...STUDENTS,
]

const COURSES = [
  ['c1', 'CS501', 'Compiler Design', 'f1', 'A'],
  ['c2', 'CS502', 'Computer Networks', 'f1', 'A'],
  ['c3', 'CS503', 'Machine Learning', 'f2', 'A'],
  ['c4', 'MA501', 'Probability & Statistics', 'f2', 'A'],
  ['c5', 'CS501', 'Compiler Design', 'f1', 'B'],
  ['c6', 'CS503', 'Machine Learning', 'f2', 'B'],
].map(([id, code, name, faculty_id, section]) => ({
  id, code, name, faculty_id, section, department_id: 'dept_cse', semester: 5, credits: 4,
}))

const ENROLLMENTS = STUDENTS.flatMap((s) =>
  COURSES.filter((c) => c.section === s.section).map((c) => ({ id: `e_${s.id}_${c.id}`, student_id: s.id, course_id: c.id }))
)

// Per student and subject: [attendance rate, IA level] so each story is visible in the charts.
const PROFILE = {
  s1: { default: [0.95, 0.88] },
  s2: { default: [0.85, 0.62], c2: [0.62, 0.55] }, // attendance shortage in CS502
  s3: { default: [0.9, 0.7], c3: [0.86, 0.33] }, // low IA in CS503
  s4: { default: [0.78, 0.48] }, // warnings
  s5: { default: [0.92, 0.75] },
  s6: { default: [0.7, null] }, // no IA marks yet
}

// Small deterministic random so the sample looks the same on every reload.
const seeded = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const CLASS_DATES = Array.from({ length: 22 }, (_, i) => format(addDays(parseISO('2026-08-03'), i * 3 + (i % 2)), 'yyyy-MM-dd'))
const TESTS = [
  ['IA-1', '2026-08-28', true],
  ['IA-2', '2026-09-25', true],
  ['IA-3', '2026-10-15', false],
]

const ATTENDANCE = []
const IA_MARKS = []
ENROLLMENTS.forEach(({ student_id, course_id }, n) => {
  const [rate, ia] = PROFILE[student_id][course_id] || PROFILE[student_id].default
  const rand = seeded(n + 7)
  CLASS_DATES.forEach((date, i) => {
    const r = rand()
    const status = r < rate ? 'present' : r < rate + 0.05 ? 'late' : 'absent'
    ATTENDANCE.push({ id: `att_${student_id}_${course_id}_${i}`, student_id, course_id, date, status })
  })
  if (ia === null) return
  TESTS.forEach(([ia_name, date, published], t) => {
    const pct = Math.min(1, Math.max(0.1, ia + (rand() - 0.5) * 0.3 + (t - 1) * 0.05))
    IA_MARKS.push({
      id: `ia_${student_id}_${course_id}_${t}`, student_id, course_id, ia_name, date, published,
      max_score: 50, score: Math.round(pct * 50),
    })
  })
})

const DATA = {
  users: USERS,
  departments: [DEPARTMENT],
  courses: COURSES,
  enrollments: ENROLLMENTS,
  attendance: ATTENDANCE,
  ia_marks: IA_MARKS,
  notifications: [],
}

const VIEWS = {
  teaching: {
    label: `Teacher view: ${TEACHER.name}`,
    note: 'Teaches CS501 (Sec A and B) and CS502 (Sec A). Only those subjects are shown.',
    auth: { currentUser: TEACHER, isHod: false, hodDepartments: [] },
  },
  department: {
    label: `HOD view: ${HOD.name}, CSE`,
    note: 'Every student in the department, every subject.',
    auth: { currentUser: HOD, isHod: true, hodDepartments: [DEPARTMENT] },
  },
}

const BOARDS = { student: 'Student board', class: 'Class board' }

function Toggle({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
      {Object.entries(options).map(([id, text]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${value === id ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

export default function AnalyticsPreview() {
  const [view, setView] = useState('teaching')
  const [board, setBoard] = useState('student')

  return (
    <DataContext.Provider value={DATA}>
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Preview with sample data. Nothing here is saved. Rohan has an attendance shortage in CS502, Kavya has low IA
            marks in CS503, Sneha is on warning, and Meera has no IA marks yet. Each IA test is out of 50; IA-3 is
            unpublished.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Toggle label="Board" options={BOARDS} value={board} onChange={setBoard} />
            <Toggle label="Signed in as" options={{ teaching: 'Teacher', department: 'HOD' }} value={view} onChange={setView} />
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{VIEWS[view].label}.</span> {VIEWS[view].note}
            </p>
          </div>

          <AuthContext.Provider key={`${view}-${board}`} value={VIEWS[view].auth}>
            {board === 'student' ? <StudentAnalytics scope={view} /> : <ClassPerformance scope={view} />}
          </AuthContext.Provider>
        </div>
      </div>
    </DataContext.Provider>
  )
}
