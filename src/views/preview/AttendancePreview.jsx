import React, { useMemo, useState } from 'react'
import { DataContext } from '../../context/DataContext'
import { AuthContext } from '../../context/AuthContext'
import TeacherAttendance from '../../components/faculty/TeacherAttendance'
import IAMarksEntry from '../../components/faculty/IAMarksEntry'
import HodFacultyCompliance from '../../components/hod/HodFacultyCompliance'
import {
  addDays,
  addExtraClass,
  cancelSession,
  classesOn,
  dayName,
  enrolledStudents,
  markSession,
  requestUnlock,
  restoreSession,
  todayISO,
  unlockSession
} from '../../utils/classSessions'

// Dev-only preview of timetable-based attendance with sample data (no sign-in, nothing saved).
// Open http://localhost:5173/?preview=attendance on the dev server. Dates follow today's date.

const DEPARTMENT = { id: 'dept_cse', code: 'CSE', name: 'Computer Science & Engineering', head_faculty_id: 'h1' }
const TEACHER = { id: 'f1', name: 'Dr. Kiran Rao', role: 'faculty', department_id: 'dept_cse', status: 'active' }
const HOD = { id: 'h1', name: 'Dr. Meena Iyer', role: 'faculty', department_id: 'dept_cse', status: 'active' }

const STUDENT_NAMES = {
  '3A': ['Aditi Shenoy', 'Bharath Kumar', 'Chetan Naik', 'Divya Rao', 'Farhan Ali', 'Gayathri M'],
  '5A': ['Ananya Rao', 'Rohan Shetty', 'Kavya Menon', 'Sneha Patil', 'Varun Hegde', 'Diya Kulkarni'],
  '5B': ['Arjun Gowda', 'Meera Joshi', 'Nikhil Bhat', 'Pooja Reddy', 'Sahana Iyer']
}
const STUDENTS = Object.entries(STUDENT_NAMES).flatMap(([key, names]) =>
  names.map((name, i) => ({
    id: `s${key}${i}`,
    name,
    role: 'student',
    status: 'active',
    department_id: 'dept_cse',
    semester: Number(key[0]),
    section: key[1],
    usn: `1CN2${key[0] === '3' ? '5' : '4'}CS${key}${String(i + 1).padStart(2, '0')}`
  }))
)

const COURSES = [
  ['c301', 'CS301', 'Data Structures', 3, 'A'],
  ['c501', 'CS501', 'Compiler Design Lab', 5, 'B'],
  ['c502', 'CS502', 'Computer Networks', 5, 'A']
].map(([id, code, name, semester, section]) => ({
  id, code, name, semester, section, department_id: 'dept_cse', faculty_id: 'f1', credits: 4
}))

// A Sem 3 class in two rooms with a double period on Thursday, a Sem 5 lab and a Sem 5 theory class.
const TIMETABLE = [
  ['t1', 'c301', 'Monday', '09:00', '10:00', 'LH-101'],
  ['t2', 'c502', 'Monday', '11:15', '12:15', 'LH-104'],
  ['t3', 'c501', 'Tuesday', '14:00', '16:00', 'Lab-2'],
  ['t4', 'c301', 'Wednesday', '11:00', '12:00', 'LH-103'],
  ['t5', 'c301', 'Thursday', '09:00', '10:00', 'LH-101'],
  ['t6', 'c301', 'Thursday', '10:00', '11:00', 'LH-101'],
  ['t7', 'c502', 'Friday', '10:00', '11:00', 'LH-104'],
  ['t8', 'c502', 'Saturday', '09:00', '10:00', 'LH-104']
].map(([id, course_id, day_of_week, start_time, end_time, room]) => ({
  id, course_id, day_of_week, start_time, end_time, room, faculty_id: 'f1',
  section: COURSES.find((c) => c.id === course_id).section
}))

const ENROLLMENTS = STUDENTS.flatMap((s) =>
  COURSES.filter((c) => c.semester === s.semester && c.section === s.section).map((c) => ({
    id: `e_${s.id}_${c.id}`, student_id: s.id, course_id: c.id
  }))
)

const seeded = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

// Two weeks of history: most classes marked, one recent class forgotten, one old class
// forgotten (now locked), one lab cancelled. A holiday later this week.
function buildSample() {
  const today = todayISO()
  const holiday = [1, 2, 3].map((n) => addDays(today, n)).find((d) => dayName(d) !== 'Sunday')
  let data = {
    users: [TEACHER, HOD, ...STUDENTS],
    departments: [DEPARTMENT],
    courses: COURSES,
    enrollments: ENROLLMENTS,
    timetable: TIMETABLE,
    class_sessions: [],
    attendance: [],
    ia_marks: [],
    assignments: [],
    submissions: [],
    notifications: [],
    calendar_events: [
      { id: 'hol1', type: 'holiday', date: holiday, end_date: holiday, title: 'Kannada Rajyotsava' }
    ],
    semester_calendars: [],
    semester_calendar_items: []
  }

  const past = []
  for (let i = 14; i >= 1; i -= 1) past.push(...classesOn(addDays(today, -i), 'f1', data))
  const lastCs502 = [...past].reverse().find((c) => c.course.code === 'CS502')
  const lockedCs301 = past.filter((c) => c.course.code === 'CS301' && c.date < addDays(today, -8)).pop()
  const cancelledLab = past.find((c) => c.course.code === 'CS501')

  const rand = seeded(11)
  for (const item of past) {
    if (item === lastCs502 || item === lockedCs301) continue
    if (item === cancelledLab) {
      data = cancelSession(data, item, 'Lab equipment maintenance')
      continue
    }
    const statuses = Object.fromEntries(
      enrolledStudents(item.course, data).map((s, i) => {
        const r = rand()
        const shaky = s.name === 'Rohan Shetty' || s.name === 'Chetan Naik' || i === 4
        return [s.id, r < (shaky ? 0.62 : 0.9) ? 'present' : r < (shaky ? 0.7 : 0.95) ? 'late' : 'absent']
      })
    )
    data = markSession(data, item, statuses, 'f1')
  }
  // The history above should not show up as fresh notifications.
  return { ...data, notifications: [] }
}

const VIEWS = {
  attendance: { label: 'Teacher: Mark Attendance', auth: { currentUser: TEACHER, isHod: false, hodDepartments: [] } },
  iamarks: { label: 'Teacher: IA Marks', auth: { currentUser: TEACHER, isHod: false, hodDepartments: [] } },
  compliance: { label: 'HOD: Faculty Compliance', auth: { currentUser: HOD, isHod: true, hodDepartments: [DEPARTMENT] } }
}

export default function AttendancePreview() {
  const [data, setData] = useState(buildSample)
  const [view, setView] = useState('attendance')
  const meId = VIEWS[view].auth.currentUser.id

  const value = useMemo(
    () => ({
      ...data,
      markClassSession: (item, statuses) => setData((prev) => markSession(prev, item, statuses, meId)),
      cancelClassSession: (item, reason) => setData((prev) => cancelSession(prev, item, reason)),
      restoreClassSession: (item) => setData((prev) => restoreSession(prev, item)),
      addExtraClassSession: (fields) => setData((prev) => addExtraClass(prev, fields)),
      requestAttendanceUnlock: (item) => setData((prev) => requestUnlock(prev, item, TEACHER)),
      unlockClassSession: (item, today) => setData((prev) => unlockSession(prev, item, meId, today)),
      saveIAMarks: (marks) =>
        setData((prev) => {
          const keyOf = (m) => `${m.course_id}|${m.student_id}|${m.ia_name}`
          const incoming = new Map(marks.map((m) => [keyOf(m), m]))
          const kept = prev.ia_marks.filter((m) => !incoming.has(keyOf(m)))
          return {
            ...prev,
            ia_marks: [...kept, ...marks.map((m, i) => ({ id: `ia_${Date.now()}_${i}`, ...m }))]
          }
        })
    }),
    [data, meId]
  )

  const notes = data.notifications.slice(0, 6)

  return (
    <DataContext.Provider value={value}>
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Preview with sample data, based on today's date. Nothing is saved. Dr. Kiran Rao teaches CS301 (Sem 3 Sec
            A, two rooms, a double period on Thursday), the CS501 lab (Sem 5 Sec B) and CS502 (Sem 5 Sec A). One
            recent class was never marked, one class from over a week ago is locked, one lab was cancelled, and there
            is a holiday later this week.
          </div>

          <div role="group" aria-label="Preview view" className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
            {Object.entries(VIEWS).map(([id, v]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${view === id ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <AuthContext.Provider key={view} value={VIEWS[view].auth}>
            {view === 'attendance' && <TeacherAttendance />}
            {view === 'iamarks' && <IAMarksEntry />}
            {view === 'compliance' && <HodFacultyCompliance />}
          </AuthContext.Provider>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
            <h2 className="mb-2 font-bold text-slate-900">Notifications sent in this preview</h2>
            {notes.length === 0 ? (
              <p className="text-slate-500">None yet. Mark someone absent, cancel a class, or ask the HOD to unlock.</p>
            ) : (
              <ul className="space-y-1.5">
                {notes.map((n) => (
                  <li key={n.id}>
                    <span className="font-semibold text-slate-800">
                      To {data.users.find((u) => u.id === n.user_id)?.name}:
                    </span>{' '}
                    {n.title}
                    {data.notifications.length > 6 && n === notes[notes.length - 1]
                      ? ` (and ${data.notifications.length - 6} more)`
                      : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DataContext.Provider>
  )
}
