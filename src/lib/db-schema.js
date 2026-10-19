// Maps each DataContext collection to its Supabase table and columns.
// Order matters: parents come before children so inserts satisfy foreign keys
// (deletes run in reverse).
export const TABLES = [
  {
    key: 'departments',
    table: 'departments',
    columns: ['id', 'name', 'code', 'head_faculty_id', 'description', 'created_by', 'updated_by', 'created_at', 'updated_at']
  },
  {
    key: 'users',
    table: 'profiles',
    columns: [
      'id', 'name', 'email', 'role', 'department_id', 'designation', 'office', 'phone', 'photo_url',
      'usn', 'roll_no', 'semester', 'section', 'status', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ]
  },
  {
    key: 'courses',
    table: 'courses',
    columns: [
      'id', 'name', 'code', 'department_id', 'faculty_id', 'semester', 'section', 'credits', 'color',
      'description', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ]
  },
  {
    key: 'enrollments',
    table: 'enrollments',
    columns: ['id', 'student_id', 'course_id', 'enrolled_at']
  },
  {
    key: 'attendance',
    table: 'attendance',
    columns: ['id', 'course_id', 'student_id', 'date', 'status', 'marked_by', 'created_at']
  },
  {
    key: 'ia_marks',
    table: 'ia_marks',
    columns: ['id', 'student_id', 'course_id', 'ia_name', 'score', 'max_score', 'published', 'date', 'created_at', 'updated_at']
  },
  {
    key: 'assignments',
    table: 'assignments',
    columns: [
      'id', 'course_id', 'title', 'description', 'due_date', 'attachment_url', 'attachment_name',
      'max_marks', 'created_by', 'created_at'
    ]
  },
  {
    key: 'submissions',
    table: 'submissions',
    columns: [
      'id', 'assignment_id', 'student_id', 'file_url', 'file_name', 'comments', 'submitted_at', 'marks',
      'max_marks', 'feedback', 'graded', 'graded_at', 'graded_by'
    ]
  },
  {
    key: 'timetable',
    table: 'timetable',
    columns: ['id', 'course_id', 'section', 'day_of_week', 'start_time', 'end_time', 'room', 'faculty_id', 'created_at']
  },
  {
    key: 'announcements',
    table: 'announcements',
    columns: [
      'id', 'author_id', 'author_name', 'author_role', 'scope', 'course_id', 'department_id', 'title',
      'body', 'priority', 'created_at'
    ]
  },
  {
    key: 'calendar_events',
    table: 'calendar_events',
    columns: [
      'id', 'date', 'end_date', 'type', 'title', 'description', 'affects_department_id', 'affects_semester',
      'affects_section', 'created_by', 'created_at'
    ]
  },
  {
    key: 'notifications',
    table: 'notifications',
    columns: ['id', 'user_id', 'type', 'reference_id', 'title', 'message', 'read', 'created_at']
  },
  {
    key: 'exam_rooms',
    table: 'exam_rooms',
    columns: [
      'id', 'name', 'room_number', 'capacity', 'building', 'floor', 'status', 'created_by', 'updated_by',
      'created_at', 'updated_at'
    ]
  },
  {
    key: 'exam_timetables',
    table: 'exam_timetables',
    columns: [
      'id', 'subject', 'course_id', 'department_id', 'semester', 'exam_date', 'start_time', 'end_time',
      'rooms', 'room_ids', 'exam_type', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ]
  },
  {
    key: 'exam_seating_plans',
    table: 'exam_seating_plans',
    columns: [
      'id', 'exam_id', 'exam_name', 'room_id', 'room_name', 'capacity', 'department_id', 'department_ids',
      'group1', 'group2', 'seats', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ]
  },
  {
    key: 'exam_seatings',
    table: 'exam_seatings',
    columns: [
      'id', 'student_id', 'student_name', 'usn', 'exam_id', 'subject', 'room_id', 'room_name', 'seat_number',
      'bench_row', 'bench_col', 'department_id', 'branch', 'section', 'semester', 'exam_date', 'start_time',
      'end_time', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ]
  }
];

// Keep only known columns; empty strings become null so date/number columns accept them.
// Appended after the original list: results reference profiles only.
TABLES.push({
  key: 'results',
  table: 'results',
  columns: [
    'id', 'student_id', 'semester', 'course_code', 'course_name', 'credits', 'cie', 'see', 'total',
    'grade', 'grade_point', 'published', 'created_by', 'updated_by', 'created_at', 'updated_at'
  ]
});

export function toRow(columns, record) {
  const row = {};
  for (const col of columns) {
    if (!(col in record)) continue;
    const value = record[col];
    row[col] = value === '' || value === undefined ? null : value;
  }
  return row;
}
