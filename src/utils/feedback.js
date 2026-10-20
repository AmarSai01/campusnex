// Course feedback questions, rated 1 (poor) to 5 (excellent). The order matches the ratings
// array stored by submit_course_feedback (supabase/migrations/20261020000200_course_feedback.sql).
export const FEEDBACK_QUESTIONS = [
  'The teacher explains concepts clearly',
  'Classes are well prepared and cover the syllabus on time',
  'The teacher encourages questions and discussion',
  'The teacher is available for help outside class',
  'Overall, how would you rate this course?'
];

export const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// Results are hidden until this many students have answered, so no one is identifiable.
export const MIN_FEEDBACK_RESPONSES = 3;
