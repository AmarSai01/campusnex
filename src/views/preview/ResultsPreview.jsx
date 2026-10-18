import React, { useMemo, useState } from 'react'
import { DataContext } from '../../context/DataContext'
import { AuthContext } from '../../context/AuthContext'
import StudentResults from '../../components/student/StudentResults'
import ResultsManager from '../../components/admin/ResultsManager'
import { GRADE_POINTS, gradeFromTotal } from '../../utils/results'

// Dev-only preview of the results screens with sample data (no sign-in, nothing saved).
// Open http://localhost:5173/?preview=results on the dev server.

const DEPARTMENTS = [
  { id: 'dept_cse', code: 'CSE', name: 'Computer Science & Engineering' },
  { id: 'dept_ise', code: 'ISE', name: 'Information Science & Engineering' },
]
const STUDENT = { id: 's1', name: 'Ananya Rao', role: 'student', usn: '1CN26CS001', department_id: 'dept_cse', semester: 5, section: 'A' }
const USERS = [
  STUDENT,
  { id: 's2', name: 'Rohan Shetty', role: 'student', usn: '1CN26CS002', department_id: 'dept_cse', semester: 5, section: 'A' },
  { id: 's3', name: 'Priya Nair', role: 'student', usn: '1CN26IS003', department_id: 'dept_ise', semester: 5, section: 'A' },
  { id: 'a1', name: 'Test Admin', role: 'admin' },
]

const SAMPLE = [
  ['s1', 3, 'CS301', 'Data Structures', 4, 88], ['s1', 3, 'CS302', 'Digital Logic', 3, 78], ['s1', 3, 'MA301', 'Discrete Maths', 3, 65],
  ['s1', 4, 'CS401', 'Algorithms', 4, 92], ['s1', 4, 'CS402', 'Operating Systems', 4, 78], ['s1', 4, 'CS403', 'Microcontrollers', 3, 52],
  ['s1', 5, 'CS501', 'Compiler Design', 4, 84], ['s1', 5, 'CS502', 'Computer Networks', 4, 74], ['s1', 5, 'CS503', 'Machine Learning', 3, 95],
  ['s2', 5, 'CS501', 'Compiler Design', 4, 61], ['s2', 5, 'CS502', 'Computer Networks', 4, 38], ['s2', 5, 'CS503', 'Machine Learning', 3, 70],
  ['s3', 5, 'IS501', 'Cloud Computing', 4, 81], ['s3', 5, 'IS502', 'Data Mining', 4, 67],
].map(([student_id, semester, course_code, course_name, credits, total], i) => {
  const grade = gradeFromTotal(total)
  return {
    id: `sample${i}`, student_id, semester, course_code, course_name, credits, total, grade,
    grade_point: GRADE_POINTS[grade], published: semester < 5,
  }
})

export default function ResultsPreview() {
  const [results, setResults] = useState(SAMPLE)

  const data = useMemo(() => ({
    users: USERS,
    departments: DEPARTMENTS,
    results,
    notifications: [],
    importResults: (list) => {
      setResults((prev) => {
        const next = [...prev]
        for (const r of list) {
          const i = next.findIndex((x) => x.student_id === r.student_id && x.semester === r.semester && x.course_code === r.course_code)
          if (i >= 0) next[i] = { ...next[i], ...r }
          else next.push({ id: `imp${next.length}`, ...r, published: false })
        }
        return next
      })
      return list.length
    },
    setResultsPublished: (semester, departmentId, published) =>
      setResults((prev) => prev.map((r) => {
        const dept = USERS.find((u) => u.id === r.student_id)?.department_id
        return r.semester === semester && (!departmentId || dept === departmentId) ? { ...r, published } : r
      })),
  }), [results])

  return (
    <DataContext.Provider value={data}>
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Preview with sample data. Nothing here is saved. Semesters 3 and 4 are published; semester 5 is hidden until you
            publish it in the admin view below, and then it appears in the student view.
          </div>

          <section>
            <h2 className="mb-1 text-lg font-bold text-slate-900">Student view: {STUDENT.name} ({STUDENT.usn})</h2>
            <p className="mb-4 text-sm text-slate-500">What a student sees under Results.</p>
            <AuthContext.Provider value={{ currentUser: STUDENT, isHod: false, hodDepartments: [] }}>
              <StudentResults />
            </AuthContext.Provider>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-bold text-slate-900">Admin view: Semester Results</h2>
            <p className="mb-4 text-sm text-slate-500">Try Publish on semester 5, or Import CSV with test-import-results.csv.</p>
            <AuthContext.Provider value={{ currentUser: USERS[3], isHod: false, hodDepartments: [] }}>
              <ResultsManager />
            </AuthContext.Provider>
          </section>
        </div>
      </div>
    </DataContext.Provider>
  )
}
