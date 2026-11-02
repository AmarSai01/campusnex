// Who an announcement is for, and how to label it. Mirrors the "read announcements" policy in
// 20261103000000_announcement_audiences.sql, so screens and notifications agree with the database.
//   scope    global | department | class | course
//   audience all | students | faculty

export const ANNOUNCEMENT_AUDIENCES = {
  all: 'Everyone',
  students: 'Students only',
  faculty: 'Faculty only'
};

const roleInAudience = (audience, role) =>
  audience === 'students' ? role === 'student'
    : audience === 'faculty' ? role === 'faculty'
      : role === 'student' || role === 'faculty';

const headsDept = (user, deptId, departments) =>
  departments.some(d => d.id === deptId && d.head_faculty_id === user.id);

const sameClass = (a, x) =>
  x.department_id === a.department_id && Number(x.semester) === Number(a.semester) && x.section === a.section;

// The people a notice is addressed to (they get the notification).
export function isAddressedTo(a, user, { enrollments = [] } = {}) {
  if (!user || user.status === 'inactive' || user.id === a.author_id) return false;
  switch (a.scope) {
    case 'global':
      return roleInAudience(a.audience || 'all', user.role);
    case 'department':
      return user.department_id === a.department_id && roleInAudience(a.audience || 'all', user.role);
    case 'class':
      return user.role === 'student' && sameClass(a, user);
    case 'course':
      return user.role === 'student' && enrollments.some(e => e.student_id === user.id && e.course_id === a.course_id);
    default:
      return false;
  }
}

// Everyone who may read it: its audience, its author, the HOD / CC / teacher who oversees it, admins.
export function canSeeAnnouncement(a, user, { departments = [], courses = [], enrollments = [], classRoles = [] } = {}) {
  if (!user) return false;
  if (user.role === 'admin' || a.author_id === user.id) return true;
  if (isAddressedTo(a, { ...user, status: 'active' }, { enrollments })) return true;
  if (user.role !== 'faculty') return false;
  switch (a.scope) {
    case 'department':
    case 'class':
      return headsDept(user, a.department_id, departments) ||
        (a.scope === 'class' && classRoles.some(r => r.faculty_id === user.id && r.role === 'class_coordinator' && sameClass(a, r)));
    case 'course': {
      const course = courses.find(c => c.id === a.course_id);
      return Boolean(course) && (course.faculty_id === user.id || headsDept(user, course.department_id, departments));
    }
    default:
      return false;
  }
}

// Short label and Badge variant, e.g. "CSE students", "CSE 5A class", "Faculty only".
export function announcementTag(a, { departments = [], courses = [] } = {}) {
  const code = departments.find(d => d.id === a.department_id)?.code || 'Department';
  const audience = a.audience || 'all';
  switch (a.scope) {
    case 'global':
      return audience === 'students' ? { label: 'All students', variant: 'success' }
        : audience === 'faculty' ? { label: 'All faculty', variant: 'purple' }
          : { label: 'Everyone', variant: 'neutral' };
    case 'department':
      return audience === 'students' ? { label: `${code} students`, variant: 'success' }
        : audience === 'faculty' ? { label: `${code} faculty`, variant: 'purple' }
          : { label: `Everyone in ${code}`, variant: 'info' };
    case 'class':
      return { label: `${code} ${a.semester}${a.section} class`, variant: 'primary' };
    case 'course': {
      const course = courses.find(c => c.id === a.course_id);
      return { label: `${course?.code || 'Subject'} class notice`, variant: 'primary' };
    }
    default:
      return { label: 'Notice', variant: 'neutral' };
  }
}

// Which "Show:" group a notice belongs to on the admin page: who it is for. Class and subject
// notices (from a CC or teacher) form their own group; the department filter narrows any group.
export function announcementGroup(a) {
  if (a.scope === 'class' || a.scope === 'course') return 'class';
  return a.audience === 'students' ? 'students' : a.audience === 'faculty' ? 'faculty' : 'everyone';
}
