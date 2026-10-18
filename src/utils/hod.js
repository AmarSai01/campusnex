// HOD status comes from the admin's department assignment (departments.head_faculty_id).
export const headedDepartments = (departments, userId) =>
  userId ? departments.filter((d) => d.head_faculty_id === userId) : [];

export const hodLabel = (departments, userId) => {
  const headed = headedDepartments(departments, userId);
  return headed.length ? `HOD · ${headed.map((d) => d.code).join(', ')}` : '';
};
