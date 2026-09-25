// Comprehensive Seed Data for Campusnex Academic Portal

export const SEED_DEPARTMENTS = [
  {
    id: 'dept_cse',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    head_faculty_id: 'faculty_1',
    description: 'Department of Computer Science and Engineering, focusing on Core Computing, Systems, and AI.'
  },
  {
    id: 'dept_cd',
    name: 'Computer Science (Data Science)',
    code: 'CD',
    head_faculty_id: null,
    description: 'Specialized programs in Big Data Analytics, Machine Learning, Statistical Modeling, and AI Applications.'
  },
  {
    id: 'dept_ece',
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    head_faculty_id: null,
    description: 'Focusing on Embedded Systems, VLSI Design, Wireless Communications, and Signal Processing.'
  },
  {
    id: 'dept_eee',
    name: 'Electrical & Electronics Engineering',
    code: 'EEE',
    head_faculty_id: null,
    description: 'Power Systems, Smart Grid Infrastructure, Renewable Energy, and Control Systems Engineering.'
  },
  {
    id: 'dept_me',
    name: 'Mechanical Engineering',
    code: 'ME',
    head_faculty_id: null,
    description: 'Thermodynamics, Robotics, Mechatronics, CAD/CAM, and Advanced Materials Manufacturing.'
  },
  {
    id: 'dept_ce',
    name: 'Civil Engineering',
    code: 'CE',
    head_faculty_id: null,
    description: 'Structural Engineering, Geotechnical Design, Environmental Systems, and Urban Transportation Planning.'
  },
  {
    id: 'dept_ise',
    name: 'Information Science & Engineering',
    code: 'ISE',
    head_faculty_id: 'faculty_2',
    description: 'Department of Information Science, specializing in Data Engineering, Cloud, and Software Architectures.'
  }
];

export const SEED_USERS = [
  // 1 Admin
  {
    id: 'admin_1',
    name: 'Dr. Sarah Connor',
    email: 'admin@campusnex.edu',
    role: 'admin',
    department_id: 'dept_cse',
    designation: 'Dean of Academic Affairs & Registrar',
    office: 'Central Admin Block, Room 101',
    phone: '+1 (555) 019-2834',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  // 2 Faculty
  {
    id: 'faculty_1',
    name: 'Dr. Alan Turing',
    email: 'faculty1@campusnex.edu',
    role: 'faculty',
    department_id: 'dept_cse',
    designation: 'Professor & Head of Department',
    office: 'CSE Tech Tower, Room 304',
    phone: '+1 (555) 012-3456',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_at: '2026-01-15T09:00:00.000Z'
  },
  {
    id: 'faculty_2',
    name: 'Dr. Ada Lovelace',
    email: 'faculty2@campusnex.edu',
    role: 'faculty',
    department_id: 'dept_cse',
    designation: 'Associate Professor',
    office: 'CSE Tech Tower, Room 212',
    phone: '+1 (555) 012-7890',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_at: '2026-01-15T09:30:00.000Z'
  },
  // 5 Students
  {
    id: 'student_1',
    name: 'Alice Smith',
    email: 'student1@campusnex.edu',
    role: 'student',
    usn: '1MS22CS101',
    roll_no: '1MS22CS101',
    department_id: 'dept_cse',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-9988',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T10:00:00.000Z',
    updated_at: '2026-07-20T10:00:00.000Z'
  },
  {
    id: 'student_2',
    name: 'Bob Johnson',
    email: 'student2@campusnex.edu',
    role: 'student',
    usn: '1MS22CS102',
    roll_no: '1MS22CS102',
    department_id: 'dept_cse',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-7722',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T10:15:00.000Z',
    updated_at: '2026-07-20T10:15:00.000Z'
  },
  {
    id: 'student_3',
    name: 'Charlie Davis',
    email: 'student3@campusnex.edu',
    role: 'student',
    usn: '1MS22CS103',
    roll_no: '1MS22CS103',
    department_id: 'dept_cse',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-6633',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T10:30:00.000Z',
    updated_at: '2026-07-20T10:30:00.000Z'
  },
  {
    id: 'student_4',
    name: 'David Lee',
    email: 'student4@campusnex.edu',
    role: 'student',
    usn: '1MS22CS104',
    roll_no: '1MS22CS104',
    department_id: 'dept_cse',
    semester: 5,
    section: 'B',
    phone: '+1 (555) 014-5544',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T10:45:00.000Z',
    updated_at: '2026-07-20T10:45:00.000Z'
  },
  {
    id: 'student_5',
    name: 'Eva Martinez',
    email: 'student5@campusnex.edu',
    role: 'student',
    usn: '1MS22CS105',
    roll_no: '1MS22CS105',
    department_id: 'dept_cse',
    semester: 5,
    section: 'B',
    phone: '+1 (555) 014-4411',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T11:00:00.000Z',
    updated_at: '2026-07-20T11:00:00.000Z'
  },
  {
    id: 'student_6',
    name: 'Frank Miller',
    email: 'student6@campusnex.edu',
    role: 'student',
    usn: '1MS22CD101',
    roll_no: '1MS22CD101',
    department_id: 'dept_cd',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-2233',
    photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T11:15:00.000Z',
    updated_at: '2026-07-20T11:15:00.000Z'
  },
  {
    id: 'student_7',
    name: 'Grace Hopper',
    email: 'student7@campusnex.edu',
    role: 'student',
    usn: '1MS22CD102',
    roll_no: '1MS22CD102',
    department_id: 'dept_cd',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-3344',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T11:30:00.000Z',
    updated_at: '2026-07-20T11:30:00.000Z'
  },
  {
    id: 'student_8',
    name: 'Henry Cavill',
    email: 'student8@campusnex.edu',
    role: 'student',
    usn: '1MS22CD103',
    roll_no: '1MS22CD103',
    department_id: 'dept_cd',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-5566',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T11:45:00.000Z',
    updated_at: '2026-07-20T11:45:00.000Z'
  },
  {
    id: 'student_9',
    name: 'Ivy Chen',
    email: 'student9@campusnex.edu',
    role: 'student',
    usn: '1MS22CD104',
    roll_no: '1MS22CD104',
    department_id: 'dept_cd',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-6677',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T12:00:00.000Z',
    updated_at: '2026-07-20T12:00:00.000Z'
  },
  {
    id: 'student_10',
    name: 'Jack Ryan',
    email: 'student10@campusnex.edu',
    role: 'student',
    usn: '1MS22CD105',
    roll_no: '1MS22CD105',
    department_id: 'dept_cd',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-8899',
    photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T12:15:00.000Z',
    updated_at: '2026-07-20T12:15:00.000Z'
  },
  {
    id: 'student_11',
    name: 'Katherine Johnson',
    email: 'student11@campusnex.edu',
    role: 'student',
    usn: '1MS22CS106',
    roll_no: '1MS22CS106',
    department_id: 'dept_cse',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-1122',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T12:30:00.000Z',
    updated_at: '2026-07-20T12:30:00.000Z'
  },
  {
    id: 'student_12',
    name: 'Leo Tolstoy',
    email: 'student12@campusnex.edu',
    role: 'student',
    usn: '1MS22CS107',
    roll_no: '1MS22CS107',
    department_id: 'dept_cse',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 014-3355',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-07-20T12:45:00.000Z',
    updated_at: '2026-07-20T12:45:00.000Z'
  }
];

export const SEED_COURSES = [
  {
    id: 'course_cs301',
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    department_id: 'dept_cse',
    faculty_id: 'faculty_1', // Dr. Alan Turing
    semester: 5,
    section: 'A',
    credits: 4,
    color: '#4f46e5', // Indigo
    description: 'Advanced trees, graphs, dynamic programming, sorting complexity, and greedy strategies.'
  },
  {
    id: 'course_cs302',
    name: 'Operating Systems',
    code: 'CS302',
    department_id: 'dept_cse',
    faculty_id: 'faculty_1', // Dr. Alan Turing
    semester: 5,
    section: 'A',
    credits: 4,
    color: '#0284c7', // Sky
    description: 'Processes, threads, CPU scheduling, synchronization, deadlock, and virtual memory.'
  },
  {
    id: 'course_cs303',
    name: 'Database Management Systems',
    code: 'CS303',
    department_id: 'dept_cse',
    faculty_id: 'faculty_2', // Dr. Ada Lovelace
    semester: 5,
    section: 'A',
    credits: 4,
    color: '#0d9488', // Teal
    description: 'Relational algebra, SQL, indexing, 3NF/BCNF normalization, ACID transactions, and NoSQL.'
  },
  {
    id: 'course_cs301_b',
    name: 'Data Structures & Algorithms (Sec B)',
    code: 'CS301',
    department_id: 'dept_cse',
    faculty_id: 'faculty_1', // Dr. Alan Turing
    semester: 5,
    section: 'B',
    credits: 4,
    color: '#7c3aed', // Purple
    description: 'Advanced trees, graphs, dynamic programming, sorting complexity, and greedy strategies.'
  },
  {
    id: 'course_cs303_b',
    name: 'Database Management Systems (Sec B)',
    code: 'CS303',
    department_id: 'dept_cse',
    faculty_id: 'faculty_2', // Dr. Ada Lovelace
    semester: 5,
    section: 'B',
    credits: 4,
    color: '#059669', // Emerald
    description: 'Relational algebra, SQL, indexing, 3NF/BCNF normalization, ACID transactions, and NoSQL.'
  }
];

export const SEED_ENROLLMENTS = [
  // Section A students in courses
  { id: 'enr_1', student_id: 'student_1', course_id: 'course_cs301', enrolled_at: '2026-08-01' },
  { id: 'enr_2', student_id: 'student_1', course_id: 'course_cs302', enrolled_at: '2026-08-01' },
  { id: 'enr_3', student_id: 'student_1', course_id: 'course_cs303', enrolled_at: '2026-08-01' },

  { id: 'enr_4', student_id: 'student_2', course_id: 'course_cs301', enrolled_at: '2026-08-01' },
  { id: 'enr_5', student_id: 'student_2', course_id: 'course_cs302', enrolled_at: '2026-08-01' },
  { id: 'enr_6', student_id: 'student_2', course_id: 'course_cs303', enrolled_at: '2026-08-01' },

  { id: 'enr_7', student_id: 'student_3', course_id: 'course_cs301', enrolled_at: '2026-08-01' },
  { id: 'enr_8', student_id: 'student_3', course_id: 'course_cs302', enrolled_at: '2026-08-01' },
  { id: 'enr_9', student_id: 'student_3', course_id: 'course_cs303', enrolled_at: '2026-08-01' },

  // Section B students in courses
  { id: 'enr_10', student_id: 'student_4', course_id: 'course_cs301_b', enrolled_at: '2026-08-01' },
  { id: 'enr_11', student_id: 'student_4', course_id: 'course_cs303_b', enrolled_at: '2026-08-01' },

  { id: 'enr_12', student_id: 'student_5', course_id: 'course_cs301_b', enrolled_at: '2026-08-01' },
  { id: 'enr_13', student_id: 'student_5', course_id: 'course_cs303_b', enrolled_at: '2026-08-01' }
];

// Generate 3 weeks of attendance logs (Aug 10 - Aug 28, 2026)
export const SEED_ATTENDANCE = [
  // CS301 (Sec A) - Dr. Alan Turing
  // Dates: 2026-08-10, 2026-08-12, 2026-08-14, 2026-08-17, 2026-08-19, 2026-08-21, 2026-08-24, 2026-08-26, 2026-08-28
  { id: 'att_101', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-10', status: 'present' },
  { id: 'att_102', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-10', status: 'present' },
  { id: 'att_103', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-10', status: 'present' },

  { id: 'att_104', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-12', status: 'present' },
  { id: 'att_105', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-12', status: 'absent' },
  { id: 'att_106', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-12', status: 'present' },

  { id: 'att_107', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-14', status: 'present' },
  { id: 'att_108', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-14', status: 'present' },
  { id: 'att_109', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-14', status: 'late' },

  { id: 'att_110', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-17', status: 'absent' },
  { id: 'att_111', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-17', status: 'present' },
  { id: 'att_112', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-17', status: 'present' },

  { id: 'att_113', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-19', status: 'present' },
  { id: 'att_114', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-19', status: 'present' },
  { id: 'att_115', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-19', status: 'present' },

  { id: 'att_116', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-21', status: 'present' },
  { id: 'att_117', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-21', status: 'present' },
  { id: 'att_118', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-21', status: 'present' },

  { id: 'att_119', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-24', status: 'present' },
  { id: 'att_120', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-24', status: 'absent' },
  { id: 'att_121', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-24', status: 'present' },

  { id: 'att_122', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-26', status: 'present' },
  { id: 'att_123', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-26', status: 'present' },
  { id: 'att_124', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-26', status: 'present' },

  { id: 'att_125', course_id: 'course_cs301', student_id: 'student_1', date: '2026-08-28', status: 'present' },
  { id: 'att_126', course_id: 'course_cs301', student_id: 'student_2', date: '2026-08-28', status: 'present' },
  { id: 'att_127', course_id: 'course_cs301', student_id: 'student_3', date: '2026-08-28', status: 'present' },

  // CS302 (Sec A) - Dr. Alan Turing
  { id: 'att_201', course_id: 'course_cs302', student_id: 'student_1', date: '2026-08-11', status: 'present' },
  { id: 'att_202', course_id: 'course_cs302', student_id: 'student_2', date: '2026-08-11', status: 'present' },
  { id: 'att_203', course_id: 'course_cs302', student_id: 'student_3', date: '2026-08-11', status: 'present' },

  { id: 'att_204', course_id: 'course_cs302', student_id: 'student_1', date: '2026-08-13', status: 'present' },
  { id: 'att_205', course_id: 'course_cs302', student_id: 'student_2', date: '2026-08-13', status: 'present' },
  { id: 'att_206', course_id: 'course_cs302', student_id: 'student_3', date: '2026-08-13', status: 'absent' },

  { id: 'att_207', course_id: 'course_cs302', student_id: 'student_1', date: '2026-08-18', status: 'present' },
  { id: 'att_208', course_id: 'course_cs302', student_id: 'student_2', date: '2026-08-18', status: 'present' },
  { id: 'att_209', course_id: 'course_cs302', student_id: 'student_3', date: '2026-08-18', status: 'present' },

  { id: 'att_210', course_id: 'course_cs302', student_id: 'student_1', date: '2026-08-20', status: 'present' },
  { id: 'att_211', course_id: 'course_cs302', student_id: 'student_2', date: '2026-08-20', status: 'present' },
  { id: 'att_212', course_id: 'course_cs302', student_id: 'student_3', date: '2026-08-20', status: 'present' },

  { id: 'att_213', course_id: 'course_cs302', student_id: 'student_1', date: '2026-08-25', status: 'present' },
  { id: 'att_214', course_id: 'course_cs302', student_id: 'student_2', date: '2026-08-25', status: 'present' },
  { id: 'att_215', course_id: 'course_cs302', student_id: 'student_3', date: '2026-08-25', status: 'late' },

  { id: 'att_216', course_id: 'course_cs302', student_id: 'student_1', date: '2026-08-27', status: 'present' },
  { id: 'att_217', course_id: 'course_cs302', student_id: 'student_2', date: '2026-08-27', status: 'present' },
  { id: 'att_218', course_id: 'course_cs302', student_id: 'student_3', date: '2026-08-27', status: 'present' },

  // CS303 (Sec A) - Dr. Ada Lovelace
  { id: 'att_301', course_id: 'course_cs303', student_id: 'student_1', date: '2026-08-10', status: 'present' },
  { id: 'att_302', course_id: 'course_cs303', student_id: 'student_2', date: '2026-08-10', status: 'present' },
  { id: 'att_303', course_id: 'course_cs303', student_id: 'student_3', date: '2026-08-10', status: 'present' },

  { id: 'att_304', course_id: 'course_cs303', student_id: 'student_1', date: '2026-08-14', status: 'present' },
  { id: 'att_305', course_id: 'course_cs303', student_id: 'student_2', date: '2026-08-14', status: 'present' },
  { id: 'att_306', course_id: 'course_cs303', student_id: 'student_3', date: '2026-08-14', status: 'absent' },

  { id: 'att_307', course_id: 'course_cs303', student_id: 'student_1', date: '2026-08-19', status: 'present' },
  { id: 'att_308', course_id: 'course_cs303', student_id: 'student_2', date: '2026-08-19', status: 'present' },
  { id: 'att_309', course_id: 'course_cs303', student_id: 'student_3', date: '2026-08-19', status: 'present' },

  { id: 'att_310', course_id: 'course_cs303', student_id: 'student_1', date: '2026-08-24', status: 'present' },
  { id: 'att_311', course_id: 'course_cs303', student_id: 'student_2', date: '2026-08-24', status: 'present' },
  { id: 'att_312', course_id: 'course_cs303', student_id: 'student_3', date: '2026-08-24', status: 'present' },

  { id: 'att_313', course_id: 'course_cs303', student_id: 'student_1', date: '2026-08-28', status: 'present' },
  { id: 'att_314', course_id: 'course_cs303', student_id: 'student_2', date: '2026-08-28', status: 'absent' },
  { id: 'att_315', course_id: 'course_cs303', student_id: 'student_3', date: '2026-08-28', status: 'present' },

  // Section B courses
  { id: 'att_401', course_id: 'course_cs301_b', student_id: 'student_4', date: '2026-08-10', status: 'present' },
  { id: 'att_402', course_id: 'course_cs301_b', student_id: 'student_5', date: '2026-08-10', status: 'present' },
  { id: 'att_403', course_id: 'course_cs301_b', student_id: 'student_4', date: '2026-08-17', status: 'present' },
  { id: 'att_404', course_id: 'course_cs301_b', student_id: 'student_5', date: '2026-08-17', status: 'absent' }
];

export const SEED_IA_MARKS = [
  // IA-1 Marks (All Published)
  // CS301 (Max: 50)
  { id: 'ia_101', student_id: 'student_1', course_id: 'course_cs301', ia_name: 'IA-1 (Theory & Algo)', score: 47, max_score: 50, published: true, date: '2026-08-14' },
  { id: 'ia_102', student_id: 'student_2', course_id: 'course_cs301', ia_name: 'IA-1 (Theory & Algo)', score: 39, max_score: 50, published: true, date: '2026-08-14' },
  { id: 'ia_103', student_id: 'student_3', course_id: 'course_cs301', ia_name: 'IA-1 (Theory & Algo)', score: 42, max_score: 50, published: true, date: '2026-08-14' },

  // CS302 (Max: 50)
  { id: 'ia_104', student_id: 'student_1', course_id: 'course_cs302', ia_name: 'IA-1 (Kernel & Sync)', score: 45, max_score: 50, published: true, date: '2026-08-16' },
  { id: 'ia_105', student_id: 'student_2', course_id: 'course_cs302', ia_name: 'IA-1 (Kernel & Sync)', score: 36, max_score: 50, published: true, date: '2026-08-16' },
  { id: 'ia_106', student_id: 'student_3', course_id: 'course_cs302', ia_name: 'IA-1 (Kernel & Sync)', score: 40, max_score: 50, published: true, date: '2026-08-16' },

  // CS303 (Max: 50)
  { id: 'ia_107', student_id: 'student_1', course_id: 'course_cs303', ia_name: 'IA-1 (Relational SQL)', score: 48, max_score: 50, published: true, date: '2026-08-15' },
  { id: 'ia_108', student_id: 'student_2', course_id: 'course_cs303', ia_name: 'IA-1 (Relational SQL)', score: 41, max_score: 50, published: true, date: '2026-08-15' },
  { id: 'ia_109', student_id: 'student_3', course_id: 'course_cs303', ia_name: 'IA-1 (Relational SQL)', score: 38, max_score: 50, published: true, date: '2026-08-15' },

  // IA-2 Marks (CS301 & CS302 Published, CS303 Draft/Unpublished)
  // CS301 IA-2 (Published)
  { id: 'ia_201', student_id: 'student_1', course_id: 'course_cs301', ia_name: 'IA-2 (Graphs & DP)', score: 49, max_score: 50, published: true, date: '2026-08-27' },
  { id: 'ia_202', student_id: 'student_2', course_id: 'course_cs301', ia_name: 'IA-2 (Graphs & DP)', score: 43, max_score: 50, published: true, date: '2026-08-27' },
  { id: 'ia_203', student_id: 'student_3', course_id: 'course_cs301', ia_name: 'IA-2 (Graphs & DP)', score: 45, max_score: 50, published: true, date: '2026-08-27' },

  // CS302 IA-2 (Published)
  { id: 'ia_204', student_id: 'student_1', course_id: 'course_cs302', ia_name: 'IA-2 (Virtual Memory)', score: 46, max_score: 50, published: true, date: '2026-08-28' },
  { id: 'ia_205', student_id: 'student_2', course_id: 'course_cs302', ia_name: 'IA-2 (Virtual Memory)', score: 40, max_score: 50, published: true, date: '2026-08-28' },
  { id: 'ia_206', student_id: 'student_3', course_id: 'course_cs302', ia_name: 'IA-2 (Virtual Memory)', score: 42, max_score: 50, published: true, date: '2026-08-28' },

  // CS303 IA-2 (UNPUBLISHED DRAFT - so Dr. Lovelace can test publishing it)
  { id: 'ia_207', student_id: 'student_1', course_id: 'course_cs303', ia_name: 'IA-2 (Transactions & Indexing)', score: 46, max_score: 50, published: false, date: '2026-08-29' },
  { id: 'ia_208', student_id: 'student_2', course_id: 'course_cs303', ia_name: 'IA-2 (Transactions & Indexing)', score: 44, max_score: 50, published: false, date: '2026-08-29' },
  { id: 'ia_209', student_id: 'student_3', course_id: 'course_cs303', ia_name: 'IA-2 (Transactions & Indexing)', score: 41, max_score: 50, published: false, date: '2026-08-29' },

  // Section B marks
  { id: 'ia_301', student_id: 'student_4', course_id: 'course_cs301_b', ia_name: 'IA-1 (Theory & Algo)', score: 44, max_score: 50, published: true, date: '2026-08-14' },
  { id: 'ia_302', student_id: 'student_5', course_id: 'course_cs301_b', ia_name: 'IA-1 (Theory & Algo)', score: 38, max_score: 50, published: true, date: '2026-08-14' }
];

export const SEED_ASSIGNMENTS = [
  {
    id: 'asg_1',
    course_id: 'course_cs301',
    title: 'Assignment 1: B-Tree & Red-Black Balanced Search Trees',
    description: 'Implement insertion, deletion, and split operations for a B-Tree of order 5 in C++ or Java. Submit source code along with a benchmarking report comparing traversal speeds.',
    due_date: '2026-09-03T23:59:00.000Z',
    attachment_url: 'https://raw.githubusercontent.com/campusnex/docs/main/asg1-spec.pdf',
    attachment_name: 'asg1_btree_specification.pdf',
    max_marks: 30,
    created_at: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'asg_2',
    course_id: 'course_cs302',
    title: 'Assignment 2: Banker\'s Algorithm & Deadlock Avoidance Simulator',
    description: 'Create a CLI or GUI simulation of Dijkstra\'s Banker\'s Algorithm. Handle dynamic resource request vectors and demonstrate state safety verification.',
    due_date: '2026-09-06T23:59:00.000Z',
    attachment_url: 'https://raw.githubusercontent.com/campusnex/docs/main/asg2-spec.pdf',
    attachment_name: 'bankers_algo_problem_statement.pdf',
    max_marks: 25,
    created_at: '2026-08-22T14:30:00.000Z'
  },
  {
    id: 'asg_3',
    course_id: 'course_cs303',
    title: 'Assignment 3: Enterprise E-Commerce Schema & Normalization (3NF/BCNF)',
    description: 'Design an Entity-Relationship (ER) diagram for a multi-vendor e-commerce platform. Provide DDL scripts and mathematical functional dependency decomposition proofs.',
    due_date: '2026-09-08T23:59:00.000Z',
    attachment_url: 'https://raw.githubusercontent.com/campusnex/docs/main/asg3-spec.pdf',
    attachment_name: 'schema_normalization_guidelines.pdf',
    max_marks: 40,
    created_at: '2026-08-24T11:00:00.000Z'
  }
];

export const SEED_SUBMISSIONS = [
  // Assignment 1 Submissions
  {
    id: 'sub_101',
    assignment_id: 'asg_1',
    student_id: 'student_1', // Alice
    file_url: 'https://storage.campusnex.edu/submissions/alice_btree_v2.zip',
    file_name: 'alice_smith_btree_impl.zip',
    submitted_at: '2026-08-26T16:45:00.000Z',
    marks: 28,
    max_marks: 30,
    feedback: 'Outstanding tree re-balancing implementation. Clean recursive split logic and modular code documentation.',
    graded: true,
    graded_at: '2026-08-28T14:00:00.000Z',
    graded_by: 'faculty_1'
  },
  {
    id: 'sub_102',
    assignment_id: 'asg_1',
    student_id: 'student_2', // Bob
    file_url: 'https://storage.campusnex.edu/submissions/bob_btree.zip',
    file_name: 'bob_johnson_asg1.zip',
    submitted_at: '2026-08-27T19:20:00.000Z',
    marks: null,
    max_marks: 30,
    feedback: null,
    graded: false,
    graded_at: null,
    graded_by: null
  },
  // Assignment 2 Submissions
  {
    id: 'sub_201',
    assignment_id: 'asg_2',
    student_id: 'student_1', // Alice
    file_url: 'https://storage.campusnex.edu/submissions/alice_bankers.py',
    file_name: 'alice_bankers_algo_sim.py',
    submitted_at: '2026-08-28T21:10:00.000Z',
    marks: null,
    max_marks: 25,
    feedback: null,
    graded: false,
    graded_at: null,
    graded_by: null
  },
  // Assignment 3 Submissions
  {
    id: 'sub_301',
    assignment_id: 'asg_3',
    student_id: 'student_1', // Alice
    file_url: 'https://storage.campusnex.edu/submissions/alice_schema_3nf.pdf',
    file_name: 'alice_ecommerce_3nf_proof.pdf',
    submitted_at: '2026-08-25T11:00:00.000Z',
    marks: 38,
    max_marks: 40,
    feedback: 'Very thorough normalization proofs and robust primary/foreign key indexing strategy.',
    graded: true,
    graded_at: '2026-08-27T16:00:00.000Z',
    graded_by: 'faculty_2'
  }
];

export const SEED_TIMETABLE = [
  // Monday
  { id: 'tt_1', course_id: 'course_cs301', section: 'A', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', room: 'LH-101', faculty_id: 'faculty_1' },
  { id: 'tt_2', course_id: 'course_cs302', section: 'A', day_of_week: 'Monday', start_time: '10:00', end_time: '11:00', room: 'LH-101', faculty_id: 'faculty_1' },
  { id: 'tt_3', course_id: 'course_cs303', section: 'A', day_of_week: 'Monday', start_time: '11:15', end_time: '12:15', room: 'Lab-CSE-2', faculty_id: 'faculty_2' },
  { id: 'tt_4', course_id: 'course_cs301_b', section: 'B', day_of_week: 'Monday', start_time: '13:30', end_time: '14:30', room: 'LH-102', faculty_id: 'faculty_1' },

  // Tuesday
  { id: 'tt_5', course_id: 'course_cs303', section: 'A', day_of_week: 'Tuesday', start_time: '09:00', end_time: '10:00', room: 'LH-101', faculty_id: 'faculty_2' },
  { id: 'tt_6', course_id: 'course_cs301', section: 'A', day_of_week: 'Tuesday', start_time: '10:00', end_time: '11:00', room: 'LH-101', faculty_id: 'faculty_1' },
  { id: 'tt_7', course_id: 'course_cs302', section: 'A', day_of_week: 'Tuesday', start_time: '11:15', end_time: '12:15', room: 'LH-101', faculty_id: 'faculty_1' },
  { id: 'tt_8', course_id: 'course_cs303_b', section: 'B', day_of_week: 'Tuesday', start_time: '14:30', end_time: '15:30', room: 'LH-102', faculty_id: 'faculty_2' },

  // Wednesday
  { id: 'tt_9', course_id: 'course_cs301', section: 'A', day_of_week: 'Wednesday', start_time: '09:00', end_time: '10:00', room: 'LH-101', faculty_id: 'faculty_1' },
  { id: 'tt_10', course_id: 'course_cs302', section: 'A', day_of_week: 'Wednesday', start_time: '10:00', end_time: '11:00', room: 'LH-101', faculty_id: 'faculty_1' },
  { id: 'tt_11', course_id: 'course_cs303', section: 'A', day_of_week: 'Wednesday', start_time: '13:30', end_time: '15:30', room: 'Lab-CSE-2', faculty_id: 'faculty_2' },

  // Thursday
  { id: 'tt_12', course_id: 'course_cs302', section: 'A', day_of_week: 'Thursday', start_time: '09:00', end_time: '10:00', room: 'LH-101', faculty_id: 'faculty_1' },
  { id: 'tt_13', course_id: 'course_cs303', section: 'A', day_of_week: 'Thursday', start_time: '10:00', end_time: '11:00', room: 'LH-101', faculty_id: 'faculty_2' },
  { id: 'tt_14', course_id: 'course_cs301', section: 'A', day_of_week: 'Thursday', start_time: '11:15', end_time: '12:15', room: 'LH-101', faculty_id: 'faculty_1' },

  // Friday
  { id: 'tt_15', course_id: 'course_cs301', section: 'A', day_of_week: 'Friday', start_time: '09:00', end_time: '11:00', room: 'Lab-CSE-2', faculty_id: 'faculty_1' },
  { id: 'tt_16', course_id: 'course_cs303', section: 'A', day_of_week: 'Friday', start_time: '11:15', end_time: '12:15', room: 'LH-101', faculty_id: 'faculty_2' },
  { id: 'tt_17', course_id: 'course_cs302', section: 'A', day_of_week: 'Friday', start_time: '14:00', end_time: '15:00', room: 'LH-101', faculty_id: 'faculty_1' }
];

export const SEED_ANNOUNCEMENTS = [
  {
    id: 'ann_1',
    author_id: 'admin_1',
    author_name: 'Dr. Sarah Connor (Dean of Academics)',
    author_role: 'admin',
    scope: 'global',
    course_id: null,
    title: '📢 Campus Placements & Industry Internship Drive 2026-27 Announced',
    body: 'Registration for Phase-1 On-Campus Placement Drive commences on September 15. All eligible 5th and 7th semester students must verify their academic profile details on Campusnex before September 10.',
    created_at: '2026-08-25T09:00:00.000Z',
    priority: 'high'
  },
  {
    id: 'ann_2',
    author_id: 'faculty_1',
    author_name: 'Dr. Alan Turing',
    author_role: 'faculty',
    scope: 'department',
    course_id: null,
    department_id: 'dept_cse',
    title: '💻 Annual HackNex 2026 Hackathon Registrations Open',
    body: 'The CSE Department is hosting the 36-hour HackNex 2026 Hackathon on September 22-23. Themes include Decentralized Computing, AI Agents, and Scalable Cloud Systems. Cash prizes worth $10,000.',
    created_at: '2026-08-26T11:30:00.000Z',
    priority: 'normal'
  },
  {
    id: 'ann_3',
    author_id: 'faculty_1',
    author_name: 'Dr. Alan Turing',
    author_role: 'faculty',
    scope: 'course',
    course_id: 'course_cs301',
    title: '📘 CS301: Advanced Dynamic Programming Handout Uploaded',
    body: 'Please review the lecture notes on Matrix Chain Multiplication and Knapsack variants before the lab session this Friday.',
    created_at: '2026-08-27T15:00:00.000Z',
    priority: 'normal'
  },
  {
    id: 'ann_4',
    author_id: 'faculty_2',
    author_name: 'Dr. Ada Lovelace',
    author_role: 'faculty',
    scope: 'course',
    course_id: 'course_cs303',
    title: '🗄️ CS303: PostgreSQL Practical Lab Assessment Dates',
    body: 'The hands-on SQL query tuning and normalization viva exam will be conducted during your respective lab batches next week.',
    created_at: '2026-08-28T14:15:00.000Z',
    priority: 'normal'
  }
];

export const SEED_CALENDAR_EVENTS = [
  {
    id: 'evt_1',
    date: '2026-08-15',
    type: 'holiday',
    title: 'Independence Day',
    description: 'National Holiday - Campus closed.',
    affects_section: null
  },
  {
    id: 'evt_2',
    date: '2026-08-22',
    type: 'working_day',
    title: 'Compensatory Working Saturday',
    description: 'Monday timetable will be observed for all engineering departments.',
    affects_section: null
  },
  {
    id: 'evt_3',
    date: '2026-09-04',
    type: 'exam',
    title: 'CS301 Lab Mid-Term Evaluation',
    description: 'Algorithms practical lab exam in Lab-CSE-2.',
    affects_section: 'A'
  },
  {
    id: 'evt_4',
    date: '2026-09-11',
    type: 'exam',
    title: 'Mid-Semester Theory Exams: Day 1 (CS301)',
    description: 'Theory exam 10:00 AM - 01:00 PM in Main Exam Hall.',
    affects_section: null
  },
  {
    id: 'evt_5',
    date: '2026-09-14',
    type: 'exam',
    title: 'Mid-Semester Theory Exams: Day 2 (CS302)',
    description: 'Theory exam 10:00 AM - 01:00 PM.',
    affects_section: null
  },
  {
    id: 'evt_6',
    date: '2026-09-16',
    type: 'exam',
    title: 'Mid-Semester Theory Exams: Day 3 (CS303)',
    description: 'Theory exam 10:00 AM - 01:00 PM.',
    affects_section: null
  },
  {
    id: 'evt_7',
    date: '2026-09-22',
    type: 'working_day',
    title: 'HackNex 2026 Tech Festival',
    description: 'Annual CSE Department Technical Symposium & Hackathon.',
    affects_section: null
  },
  {
    id: 'evt_8',
    date: '2026-10-02',
    type: 'holiday',
    title: 'Gandhi Jayanti',
    description: 'National Holiday - Campus closed.',
    affects_section: null
  }
];

export const SEED_NOTIFICATIONS = [
  // Notifications for Student 1 (Alice)
  {
    id: 'notif_1',
    user_id: 'student_1',
    type: 'ia_published',
    reference_id: 'ia_201',
    title: 'New IA Marks Published',
    message: 'Dr. Alan Turing published marks for CS301 IA-2 (Graphs & DP). You scored 49/50.',
    read: false,
    created_at: '2026-08-27T17:00:00.000Z'
  },
  {
    id: 'notif_2',
    user_id: 'student_1',
    type: 'assignment_graded',
    reference_id: 'sub_101',
    title: 'Assignment Graded',
    message: 'Your submission for "B-Tree Implementation" was graded: 28/30.',
    read: false,
    created_at: '2026-08-28T14:05:00.000Z'
  },
  {
    id: 'notif_3',
    user_id: 'student_1',
    type: 'attendance_absent',
    reference_id: 'att_110',
    title: 'Attendance Alert: Marked Absent',
    message: 'You were marked absent in CS301 (Data Structures) on Aug 17, 2026.',
    read: true,
    created_at: '2026-08-17T10:05:00.000Z'
  },
  {
    id: 'notif_4',
    user_id: 'student_1',
    type: 'new_announcement',
    reference_id: 'ann_1',
    title: 'New Announcement',
    message: 'Dean Dr. Sarah Connor posted: Campus Placements & Industry Internship Drive 2026-27.',
    read: true,
    created_at: '2026-08-25T09:05:00.000Z'
  },
  {
    id: 'notif_5',
    user_id: 'student_1',
    type: 'assignment_due',
    reference_id: 'asg_1',
    title: 'Assignment Deadline Reminder',
    message: 'Assignment "B-Tree & Red-Black Trees" is due in 3 days.',
    read: true,
    created_at: '2026-08-28T09:00:00.000Z'
  },
  // Notifications for Faculty 1 (Dr. Alan Turing)
  {
    id: 'notif_6',
    user_id: 'faculty_1',
    type: 'assignment_submitted',
    reference_id: 'sub_102',
    title: 'New Assignment Submission',
    message: 'Bob Johnson submitted Assignment 1: B-Tree & Red-Black Balanced Search Trees.',
    read: false,
    created_at: '2026-08-27T19:21:00.000Z'
  },
  {
    id: 'notif_7',
    user_id: 'faculty_1',
    type: 'new_announcement',
    reference_id: 'ann_1',
    title: 'Administrative Circular',
    message: 'Campus Placements & Industry Internship Drive 2026-27 Announced.',
    read: true,
    created_at: '2026-08-25T09:05:00.000Z'
  },
  // Notifications for Admin 1 (Dr. Sarah Connor)
  {
    id: 'notif_8',
    user_id: 'admin_1',
    type: 'admin_broadcast',
    reference_id: 'ann_1',
    title: 'Broadcast Published',
    message: 'Global announcement "Campus Placements Drive" was successfully delivered to all students and faculty.',
    read: true,
    created_at: '2026-08-25T09:02:00.000Z'
  }
];

export const SEED_EXAM_ROOMS = [
  {
    id: 'room_lh101',
    name: 'LH-101',
    room_number: 'LH-101',
    capacity: 30,
    building: 'Main Academic Block',
    floor: '1st Floor',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'room_lh102',
    name: 'LH-102',
    room_number: 'LH-102',
    capacity: 35,
    building: 'Main Academic Block',
    floor: '1st Floor',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'room_sem1',
    name: 'Seminar Hall 1',
    room_number: 'SH-01',
    capacity: 40,
    building: 'Tech Tower',
    floor: '3rd Floor',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'room_audi1',
    name: 'Central Auditorium',
    room_number: 'AUD-01',
    capacity: 60,
    building: 'Admin Complex',
    floor: 'Ground Floor',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'room_eh3',
    name: 'Exam Hall 3',
    room_number: 'EH-03',
    capacity: 32,
    building: 'Science Block',
    floor: '2nd Floor',
    status: 'active',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z'
  }
];

export const SEED_EXAM_TIMETABLE = [
  {
    id: 'exam_1',
    subject: 'CS301 - Data Structures & Algorithms',
    course_id: 'course_cs301',
    department_id: 'dept_cse',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    rooms: ['LH-101', 'LH-102'],
    room_ids: ['room_lh101', 'room_lh102'],
    exam_type: 'Mid-Semester Theory',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'exam_2',
    subject: 'CS302 - Operating Systems',
    course_id: 'course_cs302',
    department_id: 'dept_cse',
    semester: 5,
    exam_date: '2026-10-17',
    start_time: '09:30',
    end_time: '12:30',
    rooms: ['LH-101'],
    room_ids: ['room_lh101'],
    exam_type: 'Mid-Semester Theory',
    created_by: 'faculty_1',
    updated_by: 'faculty_1',
    created_at: '2026-09-02T11:00:00.000Z',
    updated_at: '2026-09-02T11:00:00.000Z'
  },
  {
    id: 'exam_3',
    subject: 'CD301 - Machine Learning & Statistical Modeling',
    course_id: 'course_cd301',
    department_id: 'dept_cd',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    rooms: ['LH-101'],
    room_ids: ['room_lh101'],
    exam_type: 'Mid-Semester Theory',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'exam_4',
    subject: 'CS303 - Database Management Systems',
    course_id: 'course_cs303',
    department_id: 'dept_cse',
    semester: 5,
    exam_date: '2026-10-20',
    start_time: '09:30',
    end_time: '12:30',
    rooms: ['Central Auditorium'],
    room_ids: ['room_audi1'],
    exam_type: 'Mid-Semester Theory',
    created_by: 'faculty_2',
    updated_by: 'faculty_2',
    created_at: '2026-09-03T09:30:00.000Z',
    updated_at: '2026-09-03T09:30:00.000Z'
  }
];

// Helper to pre-generate seed seating for LH-101 (30 seats: 15 CSE + 15 CD)
const generateSeedSeatsLH101 = () => {
  const seats = [];
  const cseNames = [
    { name: 'Alice Smith', usn: '1MS22CS101', id: 'student_1' },
    { name: 'Bob Johnson', usn: '1MS22CS102', id: 'student_2' },
    { name: 'Charlie Davis', usn: '1MS22CS103', id: 'student_3' },
    { name: 'Katherine Johnson', usn: '1MS22CS106', id: 'student_11' },
    { name: 'Leo Tolstoy', usn: '1MS22CS107', id: 'student_12' },
    { name: 'Maya Angelou', usn: '1MS22CS108', id: 'mock_cs_8' },
    { name: 'Niels Bohr', usn: '1MS22CS109', id: 'mock_cs_9' },
    { name: 'Oscar Wilde', usn: '1MS22CS110', id: 'mock_cs_10' },
    { name: 'Pierre Curie', usn: '1MS22CS111', id: 'mock_cs_11' },
    { name: 'Quentin Blake', usn: '1MS22CS112', id: 'mock_cs_12' },
    { name: 'Rosa Parks', usn: '1MS22CS113', id: 'mock_cs_13' },
    { name: 'Stephen Hawking', usn: '1MS22CS114', id: 'mock_cs_14' },
    { name: 'Tim Berners-Lee', usn: '1MS22CS115', id: 'mock_cs_15' },
    { name: 'Ursula Le Guin', usn: '1MS22CS116', id: 'mock_cs_16' },
    { name: 'Victor Hugo', usn: '1MS22CS117', id: 'mock_cs_17' }
  ];

  const cdNames = [
    { name: 'Frank Miller', usn: '1MS22CD101', id: 'student_6' },
    { name: 'Grace Hopper', usn: '1MS22CD102', id: 'student_7' },
    { name: 'Henry Cavill', usn: '1MS22CD103', id: 'student_8' },
    { name: 'Ivy Chen', usn: '1MS22CD104', id: 'student_9' },
    { name: 'Jack Ryan', usn: '1MS22CD105', id: 'student_10' },
    { name: 'Karen Jones', usn: '1MS22CD106', id: 'mock_cd_6' },
    { name: 'Liam Neeson', usn: '1MS22CD107', id: 'mock_cd_7' },
    { name: 'Mona Lisa', usn: '1MS22CD108', id: 'mock_cd_8' },
    { name: 'Noah Centineo', usn: '1MS22CD109', id: 'mock_cd_9' },
    { name: 'Olivia Rodrigo', usn: '1MS22CD110', id: 'mock_cd_10' },
    { name: 'Paul Rudd', usn: '1MS22CD111', id: 'mock_cd_11' },
    { name: 'Queen Latifah', usn: '1MS22CD112', id: 'mock_cd_12' },
    { name: 'Rachel Green', usn: '1MS22CD113', id: 'mock_cd_13' },
    { name: 'Sam Altman', usn: '1MS22CD114', id: 'mock_cd_14' },
    { name: 'Taylor Swift', usn: '1MS22CD115', id: 'mock_cd_15' }
  ];

  let cseIdx = 0;
  let cdIdx = 0;
  const cols = 5;

  for (let i = 0; i < 30; i++) {
    const isGrp1 = i % 2 === 0;
    const student = isGrp1 ? cseNames[cseIdx++] : cdNames[cdIdx++];
    const seatNum = `S-${String(i + 1).padStart(2, '0')}`;
    const row = Math.floor(i / cols) + 1;
    const col = (i % cols) + 1;

    seats.push({
      seat_number: seatNum,
      bench_row: row,
      bench_col: col,
      group: isGrp1 ? 1 : 2,
      department_id: isGrp1 ? 'dept_cse' : 'dept_cd',
      branch: isGrp1 ? 'CSE' : 'CD',
      section: 'A',
      semester: 5,
      student_id: student.id,
      student_name: student.name,
      usn: student.usn
    });
  }
  return seats;
};

// Helper to pre-generate seed seating for LH-102 (35 seats: 18 CSE-B + 17 CD-B)
const generateSeedSeatsLH102 = () => {
  const seats = [];
  const cseB = [
    { name: 'David Lee', usn: '1MS22CS104', id: 'student_4' },
    { name: 'Eva Martinez', usn: '1MS22CS105', id: 'student_5' },
    ...Array.from({ length: 16 }, (_, k) => ({
      name: `CSE Candidate B${k + 3}`,
      usn: `1MS22CS1${String(k + 20).padStart(2, '0')}`,
      id: `mock_csb_${k + 3}`
    }))
  ];

  const cdB = Array.from({ length: 17 }, (_, k) => ({
    name: `CD Candidate B${k + 1}`,
    usn: `1MS22CD1${String(k + 20).padStart(2, '0')}`,
    id: `mock_cdb_${k + 1}`
  }));

  let cseIdx = 0;
  let cdIdx = 0;
  const cols = 5;

  for (let i = 0; i < 35; i++) {
    const isGrp1 = i % 2 === 0;
    const student = isGrp1 ? cseB[cseIdx++] : cdB[cdIdx++];
    const seatNum = `S-${String(i + 1).padStart(2, '0')}`;
    const row = Math.floor(i / cols) + 1;
    const col = (i % cols) + 1;

    seats.push({
      seat_number: seatNum,
      bench_row: row,
      bench_col: col,
      group: isGrp1 ? 1 : 2,
      department_id: isGrp1 ? 'dept_cse' : 'dept_cd',
      branch: isGrp1 ? 'CSE' : 'CD',
      section: 'B',
      semester: 5,
      student_id: student.id,
      student_name: student.name,
      usn: student.usn
    });
  }
  return seats;
};

export const SEED_EXAM_SEATING_PLANS = [
  {
    id: 'plan_lh101_cs301',
    exam_id: 'exam_1',
    exam_name: 'CS301 - Data Structures & Algorithms',
    room_id: 'room_lh101',
    room_name: 'LH-101',
    capacity: 30,
    department_id: 'dept_cse',
    department_ids: ['dept_cse', 'dept_cd'],
    group1: {
      department_id: 'dept_cse',
      branch: 'CSE',
      semester: 5,
      section: 'A',
      allocated_count: 15
    },
    group2: {
      department_id: 'dept_cd',
      branch: 'CD',
      semester: 5,
      section: 'A',
      allocated_count: 15
    },
    seats: generateSeedSeatsLH101(),
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-02T14:00:00.000Z'
  },
  {
    id: 'plan_lh102_cs301',
    exam_id: 'exam_1',
    exam_name: 'CS301 - Data Structures & Algorithms',
    room_id: 'room_lh102',
    room_name: 'LH-102',
    capacity: 35,
    department_id: 'dept_cse',
    department_ids: ['dept_cse', 'dept_cd'],
    group1: {
      department_id: 'dept_cse',
      branch: 'CSE',
      semester: 5,
      section: 'B',
      allocated_count: 18
    },
    group2: {
      department_id: 'dept_cd',
      branch: 'CD',
      semester: 5,
      section: 'B',
      allocated_count: 17
    },
    seats: generateSeedSeatsLH102(),
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:30:00.000Z',
    updated_at: '2026-09-02T14:30:00.000Z'
  }
];

export const SEED_EXAM_SEATINGS = [
  // Alice Smith (student_1)
  {
    id: 'seat_exam1_student1',
    student_id: 'student_1',
    student_name: 'Alice Smith',
    usn: '1MS22CS101',
    exam_id: 'exam_1',
    subject: 'CS301 - Data Structures & Algorithms',
    room_id: 'room_lh101',
    room_name: 'LH-101',
    seat_number: 'S-01',
    bench_row: 1,
    bench_col: 1,
    department_id: 'dept_cse',
    branch: 'CSE',
    section: 'A',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-02T14:00:00.000Z'
  },
  // Bob Johnson (student_2)
  {
    id: 'seat_exam1_student2',
    student_id: 'student_2',
    student_name: 'Bob Johnson',
    usn: '1MS22CS102',
    exam_id: 'exam_1',
    subject: 'CS301 - Data Structures & Algorithms',
    room_id: 'room_lh101',
    room_name: 'LH-101',
    seat_number: 'S-03',
    bench_row: 1,
    bench_col: 3,
    department_id: 'dept_cse',
    branch: 'CSE',
    section: 'A',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-02T14:00:00.000Z'
  },
  // Charlie Davis (student_3)
  {
    id: 'seat_exam1_student3',
    student_id: 'student_3',
    student_name: 'Charlie Davis',
    usn: '1MS22CS103',
    exam_id: 'exam_1',
    subject: 'CS301 - Data Structures & Algorithms',
    room_id: 'room_lh101',
    room_name: 'LH-101',
    seat_number: 'S-05',
    bench_row: 1,
    bench_col: 5,
    department_id: 'dept_cse',
    branch: 'CSE',
    section: 'A',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-02T14:00:00.000Z'
  },
  // Frank Miller (student_6)
  {
    id: 'seat_exam1_student6',
    student_id: 'student_6',
    student_name: 'Frank Miller',
    usn: '1MS22CD101',
    exam_id: 'exam_1',
    subject: 'CD301 - Machine Learning & Statistical Modeling',
    room_id: 'room_lh101',
    room_name: 'LH-101',
    seat_number: 'S-02',
    bench_row: 1,
    bench_col: 2,
    department_id: 'dept_cd',
    branch: 'CD',
    section: 'A',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-02T14:00:00.000Z'
  },
  // Grace Hopper (student_7)
  {
    id: 'seat_exam1_student7',
    student_id: 'student_7',
    student_name: 'Grace Hopper',
    usn: '1MS22CD102',
    exam_id: 'exam_1',
    subject: 'CD301 - Machine Learning & Statistical Modeling',
    room_id: 'room_lh101',
    room_name: 'LH-101',
    seat_number: 'S-04',
    bench_row: 1,
    bench_col: 4,
    department_id: 'dept_cd',
    branch: 'CD',
    section: 'A',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:00:00.000Z',
    updated_at: '2026-09-02T14:00:00.000Z'
  },
  // David Lee (student_4)
  {
    id: 'seat_exam1_student4',
    student_id: 'student_4',
    student_name: 'David Lee',
    usn: '1MS22CS104',
    exam_id: 'exam_1',
    subject: 'CS301 - Data Structures & Algorithms',
    room_id: 'room_lh102',
    room_name: 'LH-102',
    seat_number: 'S-01',
    bench_row: 1,
    bench_col: 1,
    department_id: 'dept_cse',
    branch: 'CSE',
    section: 'B',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:30:00.000Z',
    updated_at: '2026-09-02T14:30:00.000Z'
  },
  // Eva Martinez (student_5)
  {
    id: 'seat_exam1_student5',
    student_id: 'student_5',
    student_name: 'Eva Martinez',
    usn: '1MS22CS105',
    exam_id: 'exam_1',
    subject: 'CS301 - Data Structures & Algorithms',
    room_id: 'room_lh102',
    room_name: 'LH-102',
    seat_number: 'S-03',
    bench_row: 1,
    bench_col: 3,
    department_id: 'dept_cse',
    branch: 'CSE',
    section: 'B',
    semester: 5,
    exam_date: '2026-10-15',
    start_time: '09:30',
    end_time: '12:30',
    created_by: 'admin_1',
    updated_by: 'admin_1',
    created_at: '2026-09-02T14:30:00.000Z',
    updated_at: '2026-09-02T14:30:00.000Z'
  }
];

