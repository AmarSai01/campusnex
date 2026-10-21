// Academic records that a course delete would erase (the database cascades to them).
// Returns a sentence like "1 IA mark, 3 held classes", or '' when the course is safe to delete.
export function courseDeleteBlockers(data, courseId) {
  const assignmentIds = new Set((data.assignments || []).filter(a => a.course_id === courseId).map(a => a.id));
  return [
    [(data.attendance || []).filter(a => a.course_id === courseId).length, 'attendance record'],
    [(data.ia_marks || []).filter(m => m.course_id === courseId).length, 'IA mark'],
    [(data.submissions || []).filter(s => assignmentIds.has(s.assignment_id)).length, 'assignment submission'],
    [(data.class_sessions || []).filter(s => s.course_id === courseId && s.status === 'held').length, 'held class'],
    [(data.exam_timetables || []).filter(e => e.course_id === courseId).length, 'scheduled exam']
  ]
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}${count === 1 ? '' : 's'}`)
    .join(', ');
}
