// Conflict Detection Utility for Timetable Builder

/**
 * Checks if two time intervals overlap (e.g. "09:00" - "10:00" vs "09:30" - "10:30")
 */
export function timeOverlaps(start1, end1, start2, end2) {
  const s1 = parseTimeInMinutes(start1);
  const e1 = parseTimeInMinutes(end1);
  const s2 = parseTimeInMinutes(start2);
  const e2 = parseTimeInMinutes(end2);

  return Math.max(s1, s2) < Math.min(e1, e2);
}

function parseTimeInMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Students in the same department, semester and section attend the same classes.
export function classGroupKey(course) {
  return `${course.department_id || ''}|${course.semester ?? ''}|${course.section || ''}`;
}

/**
 * Detects timetable scheduling conflicts
 * @param {Object} newSlot - { id, course_id, faculty_id, room, day_of_week, start_time, end_time, section }
 * @param {Array} existingTimetable - list of current timetable slots
 * @param {Array} courses - list of courses to resolve names
 * @param {Array} users - list of users to resolve faculty names
 * @returns {Object} { hasConflict: boolean, conflicts: Array }
 */
export function detectTimetableConflict(newSlot, existingTimetable, courses = [], users = []) {
  const conflicts = [];

  const otherSlots = existingTimetable.filter(slot => slot.id !== newSlot.id);

  for (const slot of otherSlots) {
    if (slot.day_of_week !== newSlot.day_of_week) continue;

    if (timeOverlaps(newSlot.start_time, newSlot.end_time, slot.start_time, slot.end_time)) {
      // 1. Faculty Conflict: Same faculty double-booked
      if (newSlot.faculty_id && slot.faculty_id && newSlot.faculty_id === slot.faculty_id) {
        const faculty = users.find(u => u.id === newSlot.faculty_id);
        const facultyName = faculty ? faculty.name : 'Selected Faculty';
        const course = courses.find(c => c.id === slot.course_id);
        const courseName = course ? `${course.code} - ${course.name}` : 'Another Course';

        conflicts.push({
          type: 'faculty',
          title: 'Faculty Schedule Conflict',
          message: `${facultyName} is already assigned to ${courseName} (Room ${slot.room}, Sec ${slot.section}) on ${slot.day_of_week} at ${slot.start_time} - ${slot.end_time}.`,
          conflictingSlot: slot
        });
      }

      // 2. Room Conflict: Same room double-booked
      if (newSlot.room && slot.room && newSlot.room.trim().toLowerCase() === slot.room.trim().toLowerCase()) {
        const course = courses.find(c => c.id === slot.course_id);
        const courseName = course ? `${course.code} - ${course.name}` : 'Another Course';

        conflicts.push({
          type: 'room',
          title: 'Room Double-Booking Conflict',
          message: `Room "${slot.room}" is already booked for ${courseName} (Sec ${slot.section}) on ${slot.day_of_week} at ${slot.start_time} - ${slot.end_time}.`,
          conflictingSlot: slot
        });
      }

      // 3. Section Conflict: the same class (department, semester, section) has overlapping classes
      const course = courses.find(c => c.id === slot.course_id);
      const newCourse = courses.find(c => c.id === newSlot.course_id);
      const sameClass = course && newCourse
        ? classGroupKey(course) === classGroupKey(newCourse)
        : Boolean(newSlot.section && slot.section && newSlot.section === slot.section);
      if (sameClass) {
        const courseName = course ? `${course.code} - ${course.name}` : 'Another Course';

        conflicts.push({
          type: 'section',
          title: 'Student Section Schedule Collision',
          message: `Section ${slot.section} already has ${courseName} scheduled at ${slot.start_time} - ${slot.end_time}.`,
          conflictingSlot: slot
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}
