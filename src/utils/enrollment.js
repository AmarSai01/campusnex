// Course enrolment rules shared by the data layer and the course screens.

const newEnrollmentId = () => `enr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
const today = () => new Date().toISOString().split('T')[0];

// A student belongs in a course when department, semester and section all match.
export const studentMatchesCourse = (student, course) =>
  student.role === 'student' &&
  student.status !== 'inactive' &&
  student.department_id === course.department_id &&
  Number(student.semester) === Number(course.semester) &&
  String(student.section || '') === String(course.section || '');

// Enrollment rows for [studentId, courseId] pairs that are not enrolled yet.
export const missingEnrollments = (enrollments, pairs) => {
  const existing = new Set(enrollments.map((e) => `${e.student_id}|${e.course_id}`));
  const added = new Set();
  return pairs
    .filter(([studentId, courseId]) => {
      const key = `${studentId}|${courseId}`;
      if (existing.has(key) || added.has(key)) return false;
      added.add(key);
      return true;
    })
    .map(([student_id, course_id]) => ({ id: newEnrollmentId(), student_id, course_id, enrolled_at: today() }));
};

// Enrolments after setting exactly which students take a course; other courses are untouched.
export const replaceCourseEnrollments = (enrollments, courseId, studentIds) => {
  const keep = new Set(studentIds);
  const remaining = enrollments.filter((e) => e.course_id !== courseId || keep.has(e.student_id));
  return [...remaining, ...missingEnrollments(remaining, studentIds.map((id) => [id, courseId]))];
};
