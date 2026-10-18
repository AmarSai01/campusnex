// Illustrative data for the landing page demos. Every name and number here is fictional
// and is labelled "sample data" wherever it is shown.

export const SESSION_COUNT = 12;

// P = present, A = absent, L = late. One student sits exactly on 75% so a single
// absence shows the shortage alert.
export const REGISTER_STUDENTS = [
  { id: 'r1', name: 'Ananya Rao', usn: '1CN23CS014', marks: 'PPPPPPLPPPPP' },
  { id: 'r2', name: 'Rohan Shetty', usn: '1CN23CS027', marks: 'PPAPPPAPPAPP' },
  { id: 'r3', name: 'Meera Iyer', usn: '1CN23CS031', marks: 'PPPPLPPPPPPP' },
  { id: 'r4', name: 'Farhan Ali', usn: '1CN23CS042', marks: 'PAPPAPPLPPAP' },
  { id: 'r5', name: 'Divya Nair', usn: '1CN23CS055', marks: 'PPPPPPPPPAPP' }
];

export const ADMIN_DEPARTMENTS = [
  { code: 'CSE', attendance: 88 },
  { code: 'ISE', attendance: 84 },
  { code: 'ECE', attendance: 79 },
  { code: 'EEE', attendance: 76 },
  { code: 'ME', attendance: 72 },
  { code: 'CE', attendance: 81 }
];

export const ADMIN_KPIS = [
  { label: 'Students', value: '1,240' },
  { label: 'Faculty', value: '86' },
  { label: 'Courses this term', value: '142' },
  { label: 'Exam halls booked', value: '18 / 22' }
];

export const HOD_AT_RISK = [
  { name: 'Farhan Ali', usn: '1CN23CS042', subject: 'CS301', kind: 'attendance', value: 71 },
  { name: 'Kavya Menon', usn: '1CN23CS066', subject: 'CS303', kind: 'marks', value: 36 },
  { name: 'Rohan Shetty', usn: '1CN23CS027', subject: 'CS302', kind: 'attendance', value: 74 },
  { name: 'Aditya Kulkarni', usn: '1CN23CS071', subject: 'CS301', kind: 'marks', value: 38 },
  { name: 'Sneha Patil', usn: '1CN23CS080', subject: 'CS304', kind: 'attendance', value: 69 }
];

export const FACULTY_ROSTER = [
  { id: 'f1', name: 'Ananya Rao' },
  { id: 'f2', name: 'Rohan Shetty' },
  { id: 'f3', name: 'Meera Iyer' },
  { id: 'f4', name: 'Farhan Ali' },
  { id: 'f5', name: 'Divya Nair' }
];

export const STUDENT_SUBJECTS = [
  { code: 'CS301', name: 'Data Structures', attendance: 91, ia: '44 / 50' },
  { code: 'CS302', name: 'Operating Systems', attendance: 78, ia: '39 / 50' },
  { code: 'CS303', name: 'Database Systems', attendance: 86, ia: 'Not published' }
];

export const STUDENT_NEXT_EXAM = {
  subject: 'CS301 Data Structures',
  date: '15 Oct, 9:30 am',
  room: 'LH-101',
  seat: 'S-07'
};

// Exam room: two branches seated in blocks before arranging.
export const SEATING_STUDENTS = Array.from({ length: 30 }, (_, i) => ({
  id: `seat${i}`,
  branch: i < 15 ? 'CSE' : 'ISE',
  usn: i < 15 ? `1CN23CS${String(101 + i)}` : `1CN23IS${String(101 + i - 15)}`
}));

// A small CSV with a few common mistakes, checked by the real import rules.
export const IMPORT_SAMPLE_CSV = [
  'USN,NAME,SEMESTER,DEPARTMENT,SECTION,EMAIL',
  '1CN24CS101,Ishaan Gupta,3,CSE,A,ishaan.gupta@college.edu',
  '1CN24CS102,Pooja Hegde,3,CSE,A,pooja.hegde@college.edu',
  '1CN24CS10,Varun Joshi,3,CSE,A,varun.joshi@college.edu',
  '1CN24IS103,Nisha Reddy,9,ISE,B,nisha.reddy@college.edu',
  '1CN24CS102,Tanvi Shah,3,CSE,A,tanvi.shah@college.edu',
  '1CN24ME104,Karthik Das,3,MECH,A,karthik.das@college.edu'
].join('\n');

export const IMPORT_SAMPLE_DEPARTMENTS = [
  { id: 'cse', code: 'CSE', name: 'Computer Science & Engineering' },
  { id: 'ise', code: 'ISE', name: 'Information Science & Engineering' },
  { id: 'me', code: 'ME', name: 'Mechanical Engineering' }
];
