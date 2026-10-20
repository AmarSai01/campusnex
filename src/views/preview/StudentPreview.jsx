import React, { useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { DataContext } from '../../context/DataContext'
import { AuthContext } from '../../context/AuthContext'
import AttendanceOverview from '../../components/student/AttendanceOverview'
import MyPerformance from '../../components/student/MyPerformance'
import MyProfile from '../../components/student/MyProfile'
import StudentHub from '../../components/student/StudentHub'
import StudentTimetable from '../../components/student/StudentTimetable'
import StudentExamView from '../../components/exams/StudentExamView'
import AssignmentSubmissionList from '../../components/student/AssignmentSubmissionList'
import CourseFeedback from '../../components/student/CourseFeedback'
import StudentRequests from '../../components/student/StudentRequests'
import RequestsInbox from '../../components/shared/RequestsInbox'
import FeedbackResults from '../../components/shared/FeedbackResults'

// Dev-only preview of the student screens with
// sample data (no sign-in, nothing saved). Open http://localhost:5173/?preview=student.

const DEPARTMENT = { id: 'dept_cse', code: 'CSE', name: 'Computer Science & Engineering', head_faculty_id: 'h1' }

const FACULTY = [
  { id: 'f1', name: 'Dr. Kiran Rao', role: 'faculty', department_id: 'dept_cse', email: 'kiran.rao@college.test' },
  { id: 'f2', name: 'Prof. Arun Kumar', role: 'faculty', department_id: 'dept_cse', email: 'arun.kumar@college.test' },
  {
    id: 'h1', name: 'Dr. Meena Iyer', role: 'faculty', department_id: 'dept_cse', email: 'hod.cse@college.test',
    phone: '+91 80 4000 1234', office: 'Block A, Room 204',
  },
]

const STUDENTS = [
  ['s1', 'Ananya Rao', '1CN26CS001'],
  ['s2', 'Rohan Shetty', '1CN26CS002'],
  ['s3', 'Kavya Menon', '1CN26CS003'],
  ['s4', 'Sneha Patil', '1CN26CS004'],
  ['s5', 'Arjun Gowda', '1CN26CS005'],
].map(([id, name, usn], i) => ({
  id, name, usn, roll_no: usn, section: 'A', semester: 5, role: 'student', department_id: 'dept_cse',
  email: `${usn.toLowerCase()}@college.test`, status: 'active', phone: i === 0 ? '+91 98765 43210' : null,
}))

const COURSES = [
  ['c1', 'CS501', 'Compiler Design', 'f1', '#2a78d6'],
  ['c2', 'CS502', 'Computer Networks', 'f1', '#0ca30c'],
  ['c3', 'CS503', 'Machine Learning', 'f2', '#a855f7'],
  ['c4', 'MA501', 'Probability & Statistics', 'f2', '#f97316'],
].map(([id, code, name, faculty_id, color]) => ({
  id, code, name, faculty_id, color, section: 'A', department_id: 'dept_cse', semester: 5, credits: 4,
}))

const ENROLLMENTS = STUDENTS.flatMap((s) =>
  COURSES.map((c) => ({ id: `e_${s.id}_${c.id}`, student_id: s.id, course_id: c.id }))
)

// Three classes a week per subject, Saturday included.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMETABLE = COURSES.flatMap((c, i) =>
  [0, 2, 4].map((d) => ({
    id: `tt_${c.id}_${d}`, course_id: c.id, section: 'A', day_of_week: DAYS[(d + i) % 6], room: '301',
    start_time: `${String(9 + i).padStart(2, '0')}:00`, end_time: `${String(10 + i).padStart(2, '0')}:00`, faculty_id: c.faculty_id,
  }))
)

// SEE papers are attendance-gated; the mid-semester test is not.
const EXAMS = [
  ['x1', 'CS501 Compiler Design', 'c1', '2026-11-03', 'Mid-Semester Theory'],
  ['x2', 'CS502 Computer Networks', 'c2', '2026-12-01', 'End-Semester Theory'],
  ['x3', 'CS503 Machine Learning', 'c3', '2026-12-04', 'End-Semester Theory'],
  ['x4', 'MA501 Probability & Statistics', 'c4', '2026-12-08', 'End-Semester Theory'],
].map(([id, subject, course_id, exam_date, exam_type]) => ({
  id, subject, course_id, exam_date, exam_type, department_id: 'dept_cse', semester: 5,
  start_time: '09:30', end_time: '12:30', rooms: ['LH-102'],
}))

const ASSIGNMENTS = [
  { id: 'a1', course_id: 'c2', attachment_url: 'storage://assignment-files/data:text/plain,Build%20a%20TCP%20chat%20server', attachment_name: 'lab3_problem_statement.txt', title: 'Socket programming lab', description: 'Build a TCP chat server and client.', due_date: '2026-10-30T23:59:00', max_marks: 20, created_by: 'f1' },
]

// Per student and subject: [attendance rate, IA level].
const PROFILE = {
  s1: { default: [0.95, 0.88] },
  s2: { default: [0.84, 0.62], c2: [0.62, 0.55] }, // attendance shortage in CS502
  s3: { default: [0.9, 0.7], c3: [0.86, 0.33] }, // low IA in CS503
  s4: { default: [0.78, 0.48] }, // warnings, little room to miss
  s5: { default: [0.92, 0.75] },
}

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
  const rand = seeded(n + 11)
  CLASS_DATES.forEach((date, i) => {
    const r = rand()
    const status = r < rate ? 'present' : r < rate + 0.05 ? 'late' : 'absent'
    ATTENDANCE.push({ id: `att_${student_id}_${course_id}_${i}`, student_id, course_id, date, status })
  })
  TESTS.forEach(([ia_name, date, published], t) => {
    const pct = Math.min(1, Math.max(0.1, ia + (rand() - 0.5) * 0.3 + (t - 1) * 0.05))
    IA_MARKS.push({
      id: `ia_${student_id}_${course_id}_${t}`, student_id, course_id, ia_name, date, published,
      max_score: 50, score: Math.round(pct * 50),
    })
  })
})

// Same result shape as the my_class_averages() server function, including the 3-student floor.
function classAverages(studentId) {
  const mine = new Set(ENROLLMENTS.filter((e) => e.student_id === studentId).map((e) => e.course_id))
  const rows = []
  for (const courseId of mine) {
    const byStudent = new Map()
    for (const a of ATTENDANCE.filter((x) => x.course_id === courseId)) {
      const s = byStudent.get(a.student_id) || { held: 0, got: 0 }
      s.held += 1
      s.got += a.status === 'present' ? 1 : a.status === 'late' ? 0.5 : 0
      byStudent.set(a.student_id, s)
    }
    const pcts = [...byStudent.values()].map((s) => (s.got * 100) / s.held)
    if (pcts.length >= 3) {
      rows.push({ course_id: courseId, kind: 'attendance', ia_name: null, avg_pct: pcts.reduce((a, b) => a + b, 0) / pcts.length, students: pcts.length })
    }
    for (const [name] of TESTS) {
      const marks = IA_MARKS.filter((m) => m.course_id === courseId && m.ia_name === name && m.published)
      if (marks.length < 3) continue
      const avg = marks.reduce((sum, m) => sum + (m.score * 100) / m.max_score, 0) / marks.length
      rows.push({ course_id: courseId, kind: 'ia', ia_name: name, avg_pct: avg, max_score: 50, students: marks.length })
    }
  }
  return rows
}

const TABS = {
  overview: 'Hub', attendance: 'My Attendance', performance: 'My Performance', timetable: 'Timetable',
  exam_seating: 'Exams', assignments: 'Assignments', feedback: 'Feedback', requests: 'Requests', profile: 'My Profile',
  staff_requests: 'Teacher: requests', staff_feedback: 'Teacher: feedback',
}
const NOTES = {
  s1: 'on track everywhere',
  s2: 'attendance shortage in CS502',
  s3: 'low IA marks in CS503',
  s4: 'short in several subjects',
  s5: 'on track',
}

function Toggle({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
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

export default function StudentPreview() {
  const [studentId, setStudentId] = useState('s2')
  const [tab, setTab] = useState('attendance')
  // Profile edits stay in this page only.
  const [edits, setEdits] = useState({})
  const [subs, setSubs] = useState([])
  const [requests, setRequests] = useState([
    {
      id: 'req_demo', student_id: 's2', type: 'attendance', course_id: 'c2', subject: 'Marked absent on 12 Aug while on OD',
      details: 'I was at the inter-college hackathon with the department team on 12 August. OD letter attached with the HOD.',
      status: 'resolved', response: 'Checked with the HOD. Corrected to present.', created_at: '2026-08-14T10:00:00Z',
      responded_at: '2026-08-16T09:30:00Z', responded_by: 'f1',
    },
  ])
  const [feedbackDone, setFeedbackDone] = useState({})

  const student = { ...STUDENTS.find((s) => s.id === studentId), ...edits[studentId] }

  // What row-level security lets a student read: their own attendance and published marks only.
  const data = useMemo(
    () => ({
      users: [...FACULTY, ...STUDENTS.map((s) => ({ ...s, ...edits[s.id] }))],
      departments: [DEPARTMENT],
      courses: COURSES,
      enrollments: ENROLLMENTS.filter((e) => e.student_id === studentId),
      attendance: ATTENDANCE.filter((a) => a.student_id === studentId),
      ia_marks: IA_MARKS.filter((m) => m.student_id === studentId && m.published),
      timetable: TIMETABLE,
      notifications: [],
      exam_timetables: EXAMS,
      exam_rooms: [],
      exam_seatings: [],
      assignments: ASSIGNMENTS,
      submissions: subs.filter((x) => x.student_id === studentId),
      announcements: [],
      submitAssignment: (sub) =>
        setSubs((prev) => [
          { id: `sub_${Date.now()}`, ...sub, submitted_at: new Date().toISOString(), graded: false },
          ...prev.filter((x) => !(x.assignment_id === sub.assignment_id && x.student_id === sub.student_id)),
        ]),
      // Files stay in this page: an object URL stands in for the storage path.
      uploadSubmissionFile: async (_assignmentId, file) => ({
        file_url: `storage://submissions/${URL.createObjectURL(file)}`,
        file_name: file.name,
      }),
      getStoredFileLink: async (url) => url.replace(/^storage:\/\/[^/]+\//, ''),
      student_requests: requests.filter((r) => r.student_id === studentId),
      createStudentRequest: (req) =>
        setRequests((prev) => [
          { id: `req_${Date.now()}`, student_id: studentId, status: 'open', response: null, created_at: new Date().toISOString(), ...req },
          ...prev,
        ]),
      withdrawStudentRequest: (id) => setRequests((prev) => prev.filter((r) => r.id !== id)),
      fetchMyFeedbackCourses: async () => feedbackDone[studentId] || [],
      submitCourseFeedback: async (courseId) =>
        setFeedbackDone((prev) => ({ ...prev, [studentId]: [...(prev[studentId] || []), courseId] })),
      fetchClassAverages: async () => classAverages(studentId),
      updateMyContact: async ({ phone, photo_url }) =>
        setEdits((prev) => ({ ...prev, [studentId]: { phone: phone || null, photo_url: photo_url || null } })),
      uploadProfilePhoto: async (file) => URL.createObjectURL(file),
      deleteProfilePhoto: async () => {},
    }),
    [studentId, edits, subs, requests, feedbackDone]
  )

  // Dr. Kiran Rao's view (teaches CS501 and CS502): every request for those subjects, and feedback.
  const staffData = {
    ...data,
    student_requests: requests,
    answerStudentRequest: (id, { status, response }) =>
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, response, responded_by: 'f1', responded_at: new Date().toISOString() } : r))
      ),
    fetchCourseFeedbackSummary: async (courseId) =>
      courseId === 'c1'
        ? { responses: 2, enrolled: 5, averages: null, comments: null }
        : {
            responses: 4, enrolled: 5, averages: [4.25, 3.5, 4.75, 2.75, 4],
            comments: ['Labs were really useful.', 'Please share slides before class.'],
          },
  }

  return (
    <DataContext.Provider value={data}>
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Preview with sample data. Nothing here is saved. 22 classes held per subject, three a week. IA tests are out
            of 50; IA-3 is unpublished, so students don't see it. Class averages count all five students.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Toggle label="Tab" options={TABS} value={tab} onChange={setTab} />
            <Toggle
              label="Signed in as"
              options={Object.fromEntries(STUDENTS.map((s) => [s.id, s.name.split(' ')[0]]))}
              value={studentId}
              onChange={setStudentId}
            />
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{student.name}:</span> {NOTES[studentId]}.
            </p>
          </div>

          {tab.startsWith('staff_') && (
            <DataContext.Provider value={staffData}>
              <AuthContext.Provider key={tab} value={{ currentUser: FACULTY[0], isHod: false, hodDepartments: [] }}>
                {tab === 'staff_requests' && <RequestsInbox />}
                {tab === 'staff_feedback' && <FeedbackResults />}
              </AuthContext.Provider>
            </DataContext.Provider>
          )}

          <AuthContext.Provider key={`${studentId}-${tab}`} value={{ currentUser: student, isHod: false, hodDepartments: [] }}>
            {tab === 'overview' && <StudentHub onNavigateTab={(t) => setTab(t in TABS ? t : 'overview')} />}
            {tab === 'timetable' && <StudentTimetable />}
            {tab === 'exam_seating' && <StudentExamView />}
            {tab === 'assignments' && <AssignmentSubmissionList />}
            {tab === 'attendance' && <AttendanceOverview />}
            {tab === 'performance' && <MyPerformance onNavigateTab={(t) => setTab(t in TABS ? t : 'performance')} />}
            {tab === 'feedback' && <CourseFeedback />}
            {tab === 'requests' && <StudentRequests />}
            {tab === 'profile' && <MyProfile />}
          </AuthContext.Provider>
        </div>
      </div>
    </DataContext.Provider>
  )
}
