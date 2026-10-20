import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

// Courses and students a teacher or HOD may analyse. `scope` is 'teaching' (the signed-in teacher's
// own courses and the students enrolled in them) or 'department' (everything in the HOD's departments).
export function useAnalyticsScope(scope) {
  const { currentUser, hodDepartments } = useAuth();
  const { users, courses, enrollments, attendance, ia_marks } = useData();

  return useMemo(() => {
    const deptIds = new Set(hodDepartments.map((d) => d.id));
    const scopedCourses =
      scope === 'department'
        ? courses.filter((c) => deptIds.has(c.department_id))
        : courses.filter((c) => c.faculty_id === currentUser?.id);
    const courseIds = new Set(scopedCourses.map((c) => c.id));
    const active = (u) => u.role === 'student' && u.status !== 'inactive';
    const enrolledIds = new Set(enrollments.filter((e) => courseIds.has(e.course_id)).map((e) => e.student_id));
    const students =
      scope === 'department'
        ? users.filter((u) => active(u) && deptIds.has(u.department_id))
        : users.filter((u) => active(u) && enrolledIds.has(u.id));

    return {
      courses: scopedCourses,
      students,
      users,
      enrollments,
      attendance: attendance.filter((a) => courseIds.has(a.course_id)),
      marks: ia_marks.filter((m) => courseIds.has(m.course_id)),
      departmentCodes: hodDepartments.map((d) => d.code).join(', ')
    };
  }, [scope, currentUser, hodDepartments, users, courses, enrollments, attendance, ia_marks]);
}
