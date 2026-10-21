// Assignments across a teacher's classes: rosters, Late tags and per-class summaries.
// Late = submitted after the due date. Late work is accepted and tagged, never refused.

export const isLate = (submission, assignment) =>
  !!submission?.submitted_at &&
  !!assignment?.due_date &&
  new Date(submission.submitted_at).getTime() > new Date(assignment.due_date).getTime();

export const isPastDue = (assignment, now = Date.now()) => new Date(assignment.due_date).getTime() < now;

// Every active student enrolled in the assignment's class, with their submission and status:
// 'missing' (not submitted), 'submitted' (on time, ungraded), 'late' (late, ungraded), 'graded'.
export function assignmentRoster(assignment, data) {
  const ids = new Set(data.enrollments.filter((e) => e.course_id === assignment.course_id).map((e) => e.student_id));
  const subs = new Map(
    data.submissions.filter((s) => s.assignment_id === assignment.id).map((s) => [s.student_id, s])
  );
  return data.users
    .filter((u) => u.role === 'student' && u.status !== 'inactive' && ids.has(u.id))
    .sort((a, b) =>
      String(a.usn || a.roll_no || a.name).localeCompare(String(b.usn || b.roll_no || b.name), undefined, { numeric: true })
    )
    .map((student) => {
      const submission = subs.get(student.id) || null;
      const late = isLate(submission, assignment);
      let status = 'missing';
      if (submission) status = submission.graded ? 'graded' : late ? 'late' : 'submitted';
      return { student, submission, late, status };
    });
}

export function rosterCounts(roster) {
  const counts = { all: roster.length, missing: 0, submitted: 0, late: 0, graded: 0 };
  for (const r of roster) counts[r.status] += 1;
  return counts;
}

// One class at a glance: assignments, submissions waiting for marks, how many expected
// submissions arrived (for assignments already past due), and the average mark.
export function classAssignmentSummary(course, data, now = Date.now()) {
  const list = data.assignments.filter((a) => a.course_id === course.id);
  let toGrade = 0;
  let expected = 0;
  let received = 0;
  let pctSum = 0;
  let graded = 0;
  for (const a of list) {
    const roster = assignmentRoster(a, data);
    for (const r of roster) {
      if (r.submission && !r.submission.graded) toGrade += 1;
      if (r.submission?.graded && a.max_marks > 0) {
        pctSum += (Number(r.submission.marks) * 100) / a.max_marks;
        graded += 1;
      }
    }
    if (isPastDue(a, now)) {
      expected += roster.length;
      received += roster.filter((r) => r.submission).length;
    }
  }
  return {
    assignments: list.length,
    toGrade,
    submissionRate: expected ? Math.round((received * 100) / expected) : null,
    averagePct: graded ? Math.round(pctSum / graded) : null
  };
}

const newId = (prefix) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

// Notify students who haven't submitted an assignment yet.
export function remindStudents(prev, assignment, studentIds) {
  const course = prev.courses.find((c) => c.id === assignment.course_id);
  const due = new Date(assignment.due_date);
  const pastDue = isPastDue(assignment);
  return {
    ...prev,
    notifications: [
      ...studentIds.map((user_id) => ({
        id: newId('notif'),
        user_id,
        type: 'assignment_reminder',
        reference_id: assignment.id,
        title: `Reminder: ${assignment.title}`,
        message: pastDue
          ? `You haven't submitted "${assignment.title}" for ${course?.code || 'your class'}. It was due ${due.toLocaleString('en-IN')}; you can still submit, and it will be marked Late.`
          : `"${assignment.title}" for ${course?.code || 'your class'} is due ${due.toLocaleString('en-IN')}. You haven't submitted it yet.`,
        read: false,
        created_at: new Date().toISOString()
      })),
      ...prev.notifications
    ]
  };
}
