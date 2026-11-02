// The assessment cycles teachers enter marks for. Stored as ia_marks.ia_name, so the
// wording must stay the same once marks exist.
export const IA_CYCLES = [
  'IA-1 (Theory & Assessment)',
  'IA-2 (Advanced Modules & Problem Solving)',
  'IA-3 (Pre-University Evaluation)',
  'Lab Assessment 1 (Hands-on Viva)'
];

// "IA 2" in a Class Sheets marks template is the app's second cycle; there is no IA 4.
export const iaCycleForColumn = (column) => {
  const n = Number(String(column).match(/^IA\s*-?\s*(\d+)$/i)?.[1]);
  return n >= 1 && n <= 3 ? IA_CYCLES[n - 1] : null;
};
