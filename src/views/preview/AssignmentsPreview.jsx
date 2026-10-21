import React, { useMemo, useState } from 'react'
import { DataContext } from '../../context/DataContext'
import { AuthContext } from '../../context/AuthContext'
import AssignmentManager from '../../components/faculty/AssignmentManager'
import AssignmentSubmissionList from '../../components/student/AssignmentSubmissionList'
import { remindStudents } from '../../utils/assignments'

// Dev-only preview of assignments across a teacher's classes, with sample data (no sign-in,
// nothing saved). Open http://localhost:5173/?preview=assignments on the dev server.

const TEACHER = { id: 'f1', name: 'Dr. Kiran Rao', role: 'faculty', department_id: 'dept_cse', status: 'active' }

const GROUPS = {
  '3A': ['Aditi Shenoy', 'Bharath Kumar', 'Chetan Naik', 'Divya Rao', 'Farhan Ali'],
  '3B': ['Harsha V', 'Isha Pai', 'Jeevan R', 'Kiran M'],
  '5A': ['Ananya Rao', 'Rohan Shetty', 'Kavya Menon', 'Sneha Patil', 'Varun Hegde'],
  '5B': ['Arjun Gowda', 'Meera Joshi', 'Nikhil Bhat', 'Pooja Reddy']
}
const STUDENTS = Object.entries(GROUPS).flatMap(([key, names]) =>
  names.map((name, i) => ({
    id: `s${key}${i}`, name, role: 'student', status: 'active', department_id: 'dept_cse',
    semester: Number(key[0]), section: key[1], usn: `1CN2${key[0] === '3' ? '5' : '4'}CS${key}${String(i + 1).padStart(2, '0')}`
  }))
)
const ROHAN = STUDENTS.find((s) => s.name === 'Rohan Shetty')

const COURSES = [
  ['c1', 'CS301', 'Data Structures', 3, 'A'],
  ['c2', 'CS301', 'Data Structures', 3, 'B'],
  ['c3', 'CS502', 'Computer Networks', 5, 'A'],
  ['c4', 'CS501', 'Compiler Design Lab', 5, 'B']
].map(([id, code, name, semester, section]) => ({ id, code, name, semester, section, department_id: 'dept_cse', faculty_id: 'f1' }))

const ENROLLMENTS = STUDENTS.flatMap((s) =>
  COURSES.filter((c) => c.semester === s.semester && c.section === s.section).map((c) => ({
    id: `e_${s.id}_${c.id}`, student_id: s.id, course_id: c.id
  }))
)

const DAY = 86400000
const at = (days, hour = 23, minute = 59) => {
  const d = new Date(Date.now() + days * DAY)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// [id, course, title, due in days, max marks]
const ASSIGNMENTS = [
  ['a1', 'c1', 'Linked list operations', -2, 20],
  ['a2', 'c2', 'Linked list operations', -2, 20],
  ['a3', 'c3', 'Subnetting worksheet', -1, 10],
  ['a4', 'c3', 'Socket programming mini project', 6, 25],
  ['a5', 'c4', 'Lexer using Flex', 3, 25]
].map(([id, course_id, title, due, max_marks]) => ({
  id, course_id, title, max_marks, due_date: at(due),
  description: 'Hand in a PDF or a link to your code. Marks for correctness and clarity.',
  created_at: at(due - 7, 10, 0)
}))

// [assignment, student, submitted (days from now), marks or null]
const SUBMISSIONS = [
  ['a1', 'Aditi Shenoy', -3, 17], ['a1', 'Bharath Kumar', -2.1, null], ['a1', 'Divya Rao', -1.2, null],
  ['a2', 'Harsha V', -2.5, 15], ['a2', 'Isha Pai', -1.5, null],
  ['a3', 'Ananya Rao', -2, null], ['a3', 'Kavya Menon', -1.4, 8], ['a3', 'Varun Hegde', -0.5, null],
  ['a4', 'Sneha Patil', -0.2, null],
  ['a5', 'Meera Joshi', -0.4, null]
].map(([assignment_id, name, days, marks], i) => {
  const student = STUDENTS.find((s) => s.name === name)
  return {
    id: `sub${i}`, assignment_id, student_id: student.id, file_url: null, file_name: 'solution.pdf',
    submitted_at: new Date(Date.now() + days * DAY).toISOString(),
    marks, graded: marks !== null, feedback: marks !== null ? 'Good work.' : null
  }
})

const VIEWS = {
  teacher: { label: 'Teacher: Assignments', auth: { currentUser: TEACHER, isHod: false, hodDepartments: [] } },
  student: { label: 'Student: Rohan (Sem 5 Sec A)', auth: { currentUser: ROHAN, isHod: false, hodDepartments: [] } }
}

export default function AssignmentsPreview() {
  const [view, setView] = useState('teacher')
  const [data, setData] = useState(() => ({
    users: [TEACHER, ...STUDENTS],
    courses: COURSES,
    enrollments: ENROLLMENTS,
    assignments: ASSIGNMENTS,
    submissions: SUBMISSIONS,
    notifications: []
  }))

  const value = useMemo(
    () => ({
      ...data,
      createAssignment: (fields) =>
        setData((prev) => ({
          ...prev,
          assignments: [{ id: `new_${crypto.randomUUID().slice(0, 8)}`, created_at: new Date().toISOString(), ...fields }, ...prev.assignments],
          notifications: [
            ...prev.enrollments
              .filter((e) => e.course_id === fields.course_id)
              .map((e) => ({ id: crypto.randomUUID(), user_id: e.student_id, title: `New Assignment: ${fields.title}` })),
            ...prev.notifications
          ]
        })),
      uploadAssignmentFile: async (_courseId, file) => ({ attachment_url: null, attachment_name: file.name }),
      gradeSubmission: (id, marks, feedback) =>
        setData((prev) => {
          const sub = prev.submissions.find((s) => s.id === id)
          return {
            ...prev,
            submissions: prev.submissions.map((s) => (s.id === id ? { ...s, marks, feedback, graded: true } : s)),
            notifications: [{ id: crypto.randomUUID(), user_id: sub.student_id, title: `Assignment graded: ${marks}` }, ...prev.notifications]
          }
        }),
      remindAssignment: (assignment, ids) => setData((prev) => remindStudents(prev, assignment, ids)),
      submitAssignment: async (payload) =>
        setData((prev) => ({
          ...prev,
          submissions: [
            { id: `sub_${crypto.randomUUID().slice(0, 8)}`, ...payload, submitted_at: new Date().toISOString(), marks: null, graded: false },
            ...prev.submissions.filter((s) => !(s.assignment_id === payload.assignment_id && s.student_id === payload.student_id))
          ]
        })),
      uploadSubmissionFile: async (_assignmentId, file) => ({ file_url: null, file_name: file.name }),
      getStoredFileLink: async () => null
    }),
    [data]
  )

  const notes = data.notifications.slice(0, 6)

  return (
    <DataContext.Provider value={value}>
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Preview with sample data. Nothing is saved, and files aren't uploaded. Dr. Kiran Rao teaches four classes:
            CS301 Sem 3 Sec A and Sec B, CS502 Sem 5 Sec A and the CS501 lab for Sem 5 Sec B. Some work came in late,
            some is graded, and some students haven't submitted.
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
            {view === 'teacher' ? <AssignmentManager /> : <AssignmentSubmissionList />}
          </AuthContext.Provider>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
            <h2 className="mb-2 font-bold text-slate-900">Notifications sent in this preview</h2>
            {notes.length === 0 ? (
              <p className="text-slate-500">None yet. Grade someone, send a reminder, or post an assignment.</p>
            ) : (
              <ul className="space-y-1.5">
                {notes.map((n) => (
                  <li key={n.id}>
                    <span className="font-semibold text-slate-800">To {data.users.find((u) => u.id === n.user_id)?.name}:</span> {n.title}
                  </li>
                ))}
                {data.notifications.length > 6 && <li className="text-slate-500">and {data.notifications.length - 6} more</li>}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DataContext.Provider>
  )
}
