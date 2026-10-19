// Student request types and statuses (see supabase/migrations/20261020000300_student_requests.sql).
export const REQUEST_TYPES = {
  bonafide: { label: 'Bonafide certificate', needsCourse: false, hint: 'Say what it is for, e.g. a bank loan or passport.' },
  attendance: { label: 'Attendance correction', needsCourse: true, hint: 'Give the date and why it is wrong, e.g. you were on OD.' },
  marks: { label: 'Marks correction', needsCourse: true, hint: 'Name the test and what you think is wrong.' },
  other: { label: 'Other request or grievance', needsCourse: false, hint: 'Describe the problem and what you would like done.' }
};

export const REQUEST_STATUS = {
  open: { label: 'Open', variant: 'warning' },
  in_review: { label: 'In review', variant: 'info' },
  resolved: { label: 'Resolved', variant: 'success' },
  rejected: { label: 'Not approved', variant: 'danger' }
};

export const formatRequestDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
