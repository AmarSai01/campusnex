// Lab batches: a class can be split into up to four batches for labs.
// A timetable slot with no batch is for the whole class.

export const BATCHES = ['B1', 'B2', 'B3', 'B4'];

export const batchLabel = (batch) => (batch ? `Batch ${batch.slice(1)}` : 'Whole class');

// A student sees whole-class slots and their own batch's labs.
// Until the admin assigns batches, students see every batch's labs.
export const slotVisibleToStudent = (slot, student) =>
  !slot.batch || !student?.batch || slot.batch === student.batch;

// Splits students into `count` batches in USN order: the first group is Batch 1, and so on.
export function splitEvenly(students, count) {
  const sorted = [...students].sort((a, b) =>
    String(a.usn || a.roll_no || a.name).localeCompare(String(b.usn || b.roll_no || b.name))
  );
  const size = Math.ceil(sorted.length / count);
  return Object.fromEntries(sorted.map((s, i) => [s.id, BATCHES[Math.min(count - 1, Math.floor(i / size))]]));
}
