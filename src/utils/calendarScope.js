// Who a calendar event applies to. Empty department, semester and section = whole institution.

export function eventAppliesTo(event, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const dept = event.affects_department_id || null;
  const sem = event.affects_semester ?? null;
  const section = event.affects_section || null;

  if (user.role === 'student') {
    if (dept && user.department_id !== dept) return false;
    if (sem !== null && Number(user.semester) !== Number(sem)) return false;
    if (section && user.section !== section) return false;
    return true;
  }

  // Faculty have no semester or section; they see their department's events.
  return !dept || user.department_id === dept;
}

export function describeScope(event, departments = []) {
  const dept = event.affects_department_id || null;
  const sem = event.affects_semester ?? null;
  const section = event.affects_section || null;

  if (!dept && sem === null && !section) return 'Whole institution';

  const parts = [dept ? departments.find(d => d.id === dept)?.code || 'Department' : 'All departments'];
  if (sem !== null) parts.push(`Sem ${sem}`);
  parts.push(section ? `Sec ${section}` : 'all sections');
  return parts.join(' · ');
}
