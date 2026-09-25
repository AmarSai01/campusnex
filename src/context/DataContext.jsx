import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SEED_DEPARTMENTS,
  SEED_USERS,
  SEED_COURSES,
  SEED_ENROLLMENTS,
  SEED_ATTENDANCE,
  SEED_IA_MARKS,
  SEED_ASSIGNMENTS,
  SEED_SUBMISSIONS,
  SEED_TIMETABLE,
  SEED_ANNOUNCEMENTS,
  SEED_CALENDAR_EVENTS,
  SEED_NOTIFICATIONS,
  SEED_EXAM_ROOMS,
  SEED_EXAM_TIMETABLE,
  SEED_EXAM_SEATING_PLANS,
  SEED_EXAM_SEATINGS
} from '../data/seedData';

const DataContext = createContext(null);

const STORAGE_KEY = 'campusnex_data_v1';

export function DataProvider({ children }) {
  // Load state from localStorage or initialize from seed data
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all default pre-seeded departments exist even if an older state was saved in localStorage
        const existingDeptIds = new Set((parsed.departments || []).map(d => d.id));
        const mergedDepartments = [
          ...(parsed.departments || []),
          ...SEED_DEPARTMENTS.filter(d => !existingDeptIds.has(d.id))
        ];

        // Ensure all default seed users exist
        const existingUserIds = new Set((parsed.users || []).map(u => u.id));
        const mergedUsers = [
          ...(parsed.users || []),
          ...SEED_USERS.filter(u => !existingUserIds.has(u.id))
        ];

        return {
          ...parsed,
          departments: mergedDepartments,
          users: mergedUsers,
          exam_rooms: (parsed.exam_rooms && parsed.exam_rooms.length > 0) ? parsed.exam_rooms : SEED_EXAM_ROOMS,
          exam_timetables: (parsed.exam_timetables && parsed.exam_timetables.length > 0) ? parsed.exam_timetables : SEED_EXAM_TIMETABLE,
          exam_seating_plans: (parsed.exam_seating_plans && parsed.exam_seating_plans.length > 0) ? parsed.exam_seating_plans : SEED_EXAM_SEATING_PLANS,
          exam_seatings: (parsed.exam_seatings && parsed.exam_seatings.length > 0) ? parsed.exam_seatings : SEED_EXAM_SEATINGS
        };
      }
    } catch (e) {
      console.error('Failed to load Campusnex local data:', e);
    }
    return {
      departments: SEED_DEPARTMENTS,
      users: SEED_USERS,
      courses: SEED_COURSES,
      enrollments: SEED_ENROLLMENTS,
      attendance: SEED_ATTENDANCE,
      ia_marks: SEED_IA_MARKS,
      assignments: SEED_ASSIGNMENTS,
      submissions: SEED_SUBMISSIONS,
      timetable: SEED_TIMETABLE,
      announcements: SEED_ANNOUNCEMENTS,
      calendar_events: SEED_CALENDAR_EVENTS,
      notifications: SEED_NOTIFICATIONS,
      exam_rooms: SEED_EXAM_ROOMS,
      exam_timetables: SEED_EXAM_TIMETABLE,
      exam_seating_plans: SEED_EXAM_SEATING_PLANS,
      exam_seatings: SEED_EXAM_SEATINGS
    };
  });

  // Persist state to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist Campusnex data:', e);
    }
  }, [data]);

  // Reset to original seed data
  const resetToSeedData = () => {
    const initial = {
      departments: SEED_DEPARTMENTS,
      users: SEED_USERS,
      courses: SEED_COURSES,
      enrollments: SEED_ENROLLMENTS,
      attendance: SEED_ATTENDANCE,
      ia_marks: SEED_IA_MARKS,
      assignments: SEED_ASSIGNMENTS,
      submissions: SEED_SUBMISSIONS,
      timetable: SEED_TIMETABLE,
      announcements: SEED_ANNOUNCEMENTS,
      calendar_events: SEED_CALENDAR_EVENTS,
      notifications: SEED_NOTIFICATIONS,
      exam_rooms: SEED_EXAM_ROOMS,
      exam_timetables: SEED_EXAM_TIMETABLE,
      exam_seating_plans: SEED_EXAM_SEATING_PLANS,
      exam_seatings: SEED_EXAM_SEATINGS
    };
    setData(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  };

  // Helper to add internal notification
  const addNotification = (notif) => {
    const newNotif = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: notif.user_id,
      type: notif.type,
      reference_id: notif.reference_id || null,
      title: notif.title,
      message: notif.message,
      read: false,
      created_at: new Date().toISOString()
    };
    return newNotif;
  };

  // 1. Bulk Attendance Marking
  const markBulkAttendance = (courseId, date, attendanceList) => {
    setData((prev) => {
      const course = prev.courses.find(c => c.id === courseId);
      const courseName = course ? course.name : 'Class';

      // Remove existing attendance records for same course and date
      const filtered = prev.attendance.filter(
        a => !(a.course_id === courseId && a.date === date)
      );

      const newRecords = attendanceList.map((item) => ({
        id: `att_${Date.now()}_${item.student_id}`,
        course_id: courseId,
        student_id: item.student_id,
        date: date,
        status: item.status // 'present' | 'absent' | 'late'
      }));

      // Trigger notifications for absent students
      const newNotifs = [...prev.notifications];
      attendanceList.forEach(item => {
        if (item.status === 'absent') {
          newNotifs.unshift(addNotification({
            user_id: item.student_id,
            type: 'attendance_absent',
            reference_id: courseId,
            title: 'Attendance Alert: Marked Absent',
            message: `You were marked absent in ${courseName} on ${date}. Please contact your instructor if this is an error.`
          }));
        }
      });

      return {
        ...prev,
        attendance: [...filtered, ...newRecords],
        notifications: newNotifs
      };
    });
  };

  // 2. IA Marks Entry & Publish / Unpublish
  const saveIAMarks = (marksArray) => {
    setData((prev) => {
      let updatedMarks = [...prev.ia_marks];
      const newNotifs = [...prev.notifications];

      marksArray.forEach((newMark) => {
        const index = updatedMarks.findIndex(
          m => m.course_id === newMark.course_id &&
               m.student_id === newMark.student_id &&
               m.ia_name === newMark.ia_name
        );

        const course = prev.courses.find(c => c.id === newMark.course_id);
        const courseName = course ? `${course.code} - ${course.name}` : 'Course';

        if (index >= 0) {
          const oldMark = updatedMarks[index];
          // Check if newly published
          if (!oldMark.published && newMark.published) {
            newNotifs.unshift(addNotification({
              user_id: newMark.student_id,
              type: 'ia_published',
              reference_id: newMark.id || oldMark.id,
              title: `New IA Marks Published: ${newMark.ia_name}`,
              message: `Marks for ${courseName} (${newMark.ia_name}) have been published. Score: ${newMark.score}/${newMark.max_score}.`
            }));
          }
          updatedMarks[index] = { ...oldMark, ...newMark };
        } else {
          const markObj = {
            id: newMark.id || `ia_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            ...newMark
          };
          if (newMark.published) {
            newNotifs.unshift(addNotification({
              user_id: newMark.student_id,
              type: 'ia_published',
              reference_id: markObj.id,
              title: `New IA Marks Published: ${newMark.ia_name}`,
              message: `Marks for ${courseName} (${newMark.ia_name}) have been published. Score: ${newMark.score}/${newMark.max_score}.`
            }));
          }
          updatedMarks.push(markObj);
        }
      });

      return {
        ...prev,
        ia_marks: updatedMarks,
        notifications: newNotifs
      };
    });
  };

  // 3. Assignment Management (Create / Update / Delete)
  const createAssignment = (assignmentData) => {
    const newId = `asg_${Date.now()}`;
    const newAsg = {
      id: newId,
      ...assignmentData,
      created_at: new Date().toISOString()
    };

    setData((prev) => {
      const course = prev.courses.find(c => c.id === assignmentData.course_id);
      const courseName = course ? course.name : 'Course';

      // Find enrolled students
      const enrolledStudents = prev.enrollments
        .filter(e => e.course_id === assignmentData.course_id)
        .map(e => e.student_id);

      const newNotifs = [...prev.notifications];
      enrolledStudents.forEach(studentId => {
        newNotifs.unshift(addNotification({
          user_id: studentId,
          type: 'assignment_created',
          reference_id: newId,
          title: `New Assignment: ${assignmentData.title}`,
          message: `New assignment posted in ${courseName}. Due: ${new Date(assignmentData.due_date).toLocaleDateString()}.`
        }));
      });

      return {
        ...prev,
        assignments: [newAsg, ...prev.assignments],
        notifications: newNotifs
      };
    });
    return newId;
  };

  // 4. Student Assignment Submission
  const submitAssignment = (submissionData) => {
    const newId = `sub_${Date.now()}`;
    const newSub = {
      id: newId,
      ...submissionData,
      submitted_at: new Date().toISOString(),
      marks: null,
      feedback: null,
      graded: false,
      graded_at: null,
      graded_by: null
    };

    setData((prev) => {
      // Find assignment and course faculty
      const assignment = prev.assignments.find(a => a.id === submissionData.assignment_id);
      const course = assignment ? prev.courses.find(c => c.id === assignment.course_id) : null;
      const student = prev.users.find(u => u.id === submissionData.student_id);
      const studentName = student ? student.name : 'A student';

      const newNotifs = [...prev.notifications];
      if (course && course.faculty_id) {
        newNotifs.unshift(addNotification({
          user_id: course.faculty_id,
          type: 'assignment_submitted',
          reference_id: newId,
          title: 'Assignment Submitted',
          message: `${studentName} submitted "${assignment?.title || 'Assignment'}".`
        }));
      }

      // Replace existing submission if student resubmitted
      const filtered = prev.submissions.filter(
        s => !(s.assignment_id === submissionData.assignment_id && s.student_id === submissionData.student_id)
      );

      return {
        ...prev,
        submissions: [newSub, ...filtered],
        notifications: newNotifs
      };
    });
    return newId;
  };

  // 5. Faculty Grade Submission
  const gradeSubmission = (submissionId, marks, feedback, gradedByFacultyId) => {
    setData((prev) => {
      const submissionIndex = prev.submissions.findIndex(s => s.id === submissionId);
      if (submissionIndex === -1) return prev;

      const sub = prev.submissions[submissionIndex];
      const asg = prev.assignments.find(a => a.id === sub.assignment_id);
      const asgTitle = asg ? asg.title : 'Assignment';

      const updatedSub = {
        ...sub,
        marks: Number(marks),
        feedback: feedback || '',
        graded: true,
        graded_at: new Date().toISOString(),
        graded_by: gradedByFacultyId
      };

      const updatedSubmissions = [...prev.submissions];
      updatedSubmissions[submissionIndex] = updatedSub;

      const newNotifs = [...prev.notifications];
      newNotifs.unshift(addNotification({
        user_id: sub.student_id,
        type: 'assignment_graded',
        reference_id: submissionId,
        title: 'Assignment Graded',
        message: `Your submission for "${asgTitle}" was graded: ${marks}/${asg?.max_marks || sub.max_marks || 100}. Feedback: "${feedback || 'No feedback'}"`
      }));

      return {
        ...prev,
        submissions: updatedSubmissions,
        notifications: newNotifs
      };
    });
  };

  // 6. Announcements Creation
  const createAnnouncement = (annData) => {
    const newId = `ann_${Date.now()}`;
    const newAnn = {
      id: newId,
      ...annData,
      created_at: new Date().toISOString()
    };

    setData((prev) => {
      const newNotifs = [...prev.notifications];

      // Determine recipients based on scope
      if (annData.scope === 'global') {
        // Send to all students and faculty
        prev.users.forEach(u => {
          if (u.id !== annData.author_id) {
            newNotifs.unshift(addNotification({
              user_id: u.id,
              type: 'new_announcement',
              reference_id: newId,
              title: `Announcement: ${annData.title}`,
              message: annData.body.length > 120 ? `${annData.body.substring(0, 117)}...` : annData.body
            }));
          }
        });
      } else if (annData.scope === 'department') {
        prev.users
          .filter(u => u.department_id === annData.department_id && u.id !== annData.author_id)
          .forEach(u => {
            newNotifs.unshift(addNotification({
              user_id: u.id,
              type: 'new_announcement',
              reference_id: newId,
              title: `Dept Announcement: ${annData.title}`,
              message: annData.body.length > 120 ? `${annData.body.substring(0, 117)}...` : annData.body
            }));
          });
      } else if (annData.scope === 'course' && annData.course_id) {
        const enrolledStudents = prev.enrollments
          .filter(e => e.course_id === annData.course_id)
          .map(e => e.student_id);

        enrolledStudents.forEach(studentId => {
          newNotifs.unshift(addNotification({
            user_id: studentId,
            type: 'new_announcement',
            reference_id: newId,
            title: `Course Announcement: ${annData.title}`,
            message: annData.body.length > 120 ? `${annData.body.substring(0, 117)}...` : annData.body
          }));
        });
      }

      return {
        ...prev,
        announcements: [newAnn, ...prev.announcements],
        notifications: newNotifs
      };
    });
    return newId;
  };

  // 7. Academic Calendar Management
  const createCalendarEvent = (eventData) => {
    const newId = `evt_${Date.now()}`;
    const newEvt = {
      id: newId,
      ...eventData
    };

    setData((prev) => {
      const newNotifs = [...prev.notifications];
      // Notify all users about holiday / exam
      prev.users.forEach(u => {
        if (u.role === 'student' || u.role === 'faculty') {
          // If affects specific section, check student section
          if (eventData.affects_section && u.section && u.section !== eventData.affects_section) {
            return;
          }
          newNotifs.unshift(addNotification({
            user_id: u.id,
            type: 'calendar_event_added',
            reference_id: newId,
            title: `Calendar Update: ${eventData.title}`,
            message: `${eventData.type.toUpperCase()}: ${eventData.description || eventData.title} on ${eventData.date}.`
          }));
        }
      });

      return {
        ...prev,
        calendar_events: [...prev.calendar_events, newEvt],
        notifications: newNotifs
      };
    });
    return newId;
  };

  const deleteCalendarEvent = (eventId) => {
    setData(prev => ({
      ...prev,
      calendar_events: prev.calendar_events.filter(e => e.id !== eventId)
    }));
  };

  // 8. Timetable Management (Slot save & delete)
  const saveTimetableSlot = (slotData) => {
    const slotId = slotData.id || `tt_${Date.now()}`;
    const newSlot = { ...slotData, id: slotId };

    setData((prev) => {
      const existsIndex = prev.timetable.findIndex(s => s.id === slotId);
      let updatedTimetable = [...prev.timetable];

      if (existsIndex >= 0) {
        updatedTimetable[existsIndex] = newSlot;
      } else {
        updatedTimetable.push(newSlot);
      }

      const course = prev.courses.find(c => c.id === slotData.course_id);
      const courseName = course ? `${course.code} - ${course.name}` : 'Course';

      // Notify enrolled students and faculty
      const enrolledStudents = prev.enrollments
        .filter(e => e.course_id === slotData.course_id)
        .map(e => e.student_id);

      const newNotifs = [...prev.notifications];
      const targetUserIds = new Set([...enrolledStudents, slotData.faculty_id].filter(Boolean));

      targetUserIds.forEach(userId => {
        newNotifs.unshift(addNotification({
          user_id: userId,
          type: 'timetable_changed',
          reference_id: slotId,
          title: `Timetable Updated: ${courseName}`,
          message: `Scheduled on ${slotData.day_of_week} at ${slotData.start_time} - ${slotData.end_time} in ${slotData.room}.`
        }));
      });

      return {
        ...prev,
        timetable: updatedTimetable,
        notifications: newNotifs
      };
    });
    return slotId;
  };

  const deleteTimetableSlot = (slotId) => {
    setData(prev => ({
      ...prev,
      timetable: prev.timetable.filter(s => s.id !== slotId)
    }));
  };

  // USN Validation Regex: 1XX00XX000 (1 digit + 2 letters + 2 digits + 2 letters + 3 digits)
  const USN_REGEX = /^1[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;

  // 9. Student Management (Shared for Admin & Faculty)
  const createStudent = (studentData, authorId) => {
    const formattedUSN = (studentData.usn || studentData.roll_no || '').trim().toUpperCase();
    
    if (!USN_REGEX.test(formattedUSN)) {
      throw new Error('USN must follow format 1XX00XX000 (e.g. 1MJ23CD006)');
    }

    const existingUSN = data.users.find(
      u => u.role === 'student' && 
      ((u.usn && u.usn.toUpperCase() === formattedUSN) || (u.roll_no && u.roll_no.toUpperCase() === formattedUSN))
    );
    if (existingUSN) {
      throw new Error(`A student with USN "${formattedUSN}" already exists.`);
    }

    const existingEmail = data.users.find(
      u => u.email.toLowerCase() === studentData.email.trim().toLowerCase()
    );
    if (existingEmail) {
      throw new Error(`A user with email "${studentData.email}" already exists.`);
    }

    const now = new Date().toISOString();
    const newId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newStudent = {
      id: newId,
      name: studentData.name.trim(),
      email: studentData.email.trim().toLowerCase(),
      role: 'student',
      usn: formattedUSN,
      roll_no: formattedUSN,
      department_id: studentData.department_id,
      semester: Number(studentData.semester) || 5,
      section: studentData.section || 'A',
      phone: studentData.phone || '',
      status: studentData.status || 'active',
      photo_url: studentData.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentData.name)}`,
      created_by: authorId || 'admin_1',
      updated_by: authorId || 'admin_1',
      created_at: now,
      updated_at: now
    };

    // Auto enroll in courses for matching department and section
    const matchingCourses = data.courses.filter(
      c => c.department_id === newStudent.department_id &&
           c.section === newStudent.section &&
           c.semester === newStudent.semester
    );

    const newEnrollments = matchingCourses.map((c, i) => ({
      id: `enr_${Date.now()}_${i}`,
      student_id: newId,
      course_id: c.id,
      enrolled_at: now.split('T')[0]
    }));

    setData(prev => ({
      ...prev,
      users: [...prev.users, newStudent],
      enrollments: [...prev.enrollments, ...newEnrollments]
    }));

    return newStudent;
  };

  const updateStudent = (studentId, updateFields, editorId) => {
    let formattedUSN = updateFields.usn || updateFields.roll_no;
    if (formattedUSN) {
      formattedUSN = formattedUSN.trim().toUpperCase();
      if (!USN_REGEX.test(formattedUSN)) {
        throw new Error('USN must follow format 1XX00XX000 (e.g. 1MJ23CD006)');
      }

      const duplicateUSN = data.users.find(
        u => u.id !== studentId && u.role === 'student' && 
        ((u.usn && u.usn.toUpperCase() === formattedUSN) || (u.roll_no && u.roll_no.toUpperCase() === formattedUSN))
      );
      if (duplicateUSN) {
        throw new Error(`USN "${formattedUSN}" is already assigned to another student.`);
      }
    }

    if (updateFields.email) {
      const duplicateEmail = data.users.find(
        u => u.id !== studentId && u.email.toLowerCase() === updateFields.email.trim().toLowerCase()
      );
      if (duplicateEmail) {
        throw new Error(`Email "${updateFields.email}" is already used by another user.`);
      }
    }

    const now = new Date().toISOString();

    setData(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id !== studentId) return u;
        return {
          ...u,
          ...updateFields,
          ...(formattedUSN ? { usn: formattedUSN, roll_no: formattedUSN } : {}),
          updated_by: editorId || u.updated_by || 'admin_1',
          updated_at: now
        };
      })
    }));
  };

  const deleteStudent = (studentId, actorRole) => {
    if (actorRole !== 'admin') {
      throw new Error('Permission Denied: Only Administrators are authorized to delete student records.');
    }

    setData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== studentId),
      enrollments: prev.enrollments.filter(e => e.student_id !== studentId),
      attendance: prev.attendance.filter(a => a.student_id !== studentId),
      ia_marks: prev.ia_marks.filter(m => m.student_id !== studentId),
      submissions: prev.submissions.filter(s => s.student_id !== studentId)
    }));
  };

  // 10. General User Management (Admin)
  const createUser = (userData, authorId) => {
    if (userData.role === 'student') {
      return createStudent(userData, authorId);
    }

    const newId = userData.role === 'faculty' 
      ? `faculty_${Date.now()}` 
      : `user_${Date.now()}`;

    const now = new Date().toISOString();
    const newUser = {
      id: newId,
      status: 'active',
      photo_url: userData.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      created_by: authorId || 'admin_1',
      updated_by: authorId || 'admin_1',
      created_at: now,
      updated_at: now,
      ...userData
    };

    setData(prev => ({
      ...prev,
      users: [...prev.users, newUser]
    }));
    return newUser;
  };

  const updateUser = (userId, updateFields, editorId) => {
    const targetUser = data.users.find(u => u.id === userId);
    if (targetUser && targetUser.role === 'student') {
      return updateStudent(userId, updateFields, editorId);
    }

    const now = new Date().toISOString();
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? {
        ...u,
        ...updateFields,
        updated_by: editorId || u.updated_by || 'admin_1',
        updated_at: now
      } : u)
    }));
  };

  // 10. Department Management (Admin)
  const createDepartment = (deptData) => {
    const formattedCode = deptData.code.trim().toUpperCase();
    const formattedName = deptData.name.trim();

    if (!formattedCode) {
      throw new Error('Department code is required (e.g. CSE, CD, ECE).');
    }
    if (!formattedName) {
      throw new Error('Department name is required.');
    }

    const existingCode = data.departments.find(
      d => d.code.toUpperCase() === formattedCode
    );
    if (existingCode) {
      throw new Error(`A department with code "${formattedCode}" already exists.`);
    }

    const newId = deptData.id || `dept_${formattedCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString().slice(-4)}`;

    const newDept = {
      id: newId,
      name: formattedName,
      code: formattedCode,
      head_faculty_id: deptData.head_faculty_id || null,
      description: deptData.description || `Department of ${formattedName}`
    };

    setData(prev => ({
      ...prev,
      departments: [...prev.departments, newDept]
    }));

    return newDept;
  };

  const updateDepartment = (deptId, updateFields) => {
    const formattedCode = updateFields.code ? updateFields.code.trim().toUpperCase() : null;
    const formattedName = updateFields.name ? updateFields.name.trim() : null;

    if (formattedCode) {
      const duplicateCode = data.departments.find(
        d => d.id !== deptId && d.code.toUpperCase() === formattedCode
      );
      if (duplicateCode) {
        throw new Error(`A department with code "${formattedCode}" already exists.`);
      }
    }

    setData(prev => ({
      ...prev,
      departments: prev.departments.map(d => {
        if (d.id !== deptId) return d;
        return {
          ...d,
          ...updateFields,
          ...(formattedCode ? { code: formattedCode } : {}),
          ...(formattedName ? { name: formattedName } : {})
        };
      })
    }));
  };

  const deleteDepartment = (deptId, actorRole) => {
    if (actorRole !== 'admin') {
      throw new Error('Permission Denied: Only Administrators can delete academic departments.');
    }

    const associatedUsers = data.users.filter(u => u.department_id === deptId);
    if (associatedUsers.length > 0) {
      throw new Error(`Cannot delete department: ${associatedUsers.length} user(s) are currently assigned to it.`);
    }

    const associatedCourses = data.courses.filter(c => c.department_id === deptId);
    if (associatedCourses.length > 0) {
      throw new Error(`Cannot delete department: ${associatedCourses.length} course(s) are currently linked to it.`);
    }

    setData(prev => ({
      ...prev,
      departments: prev.departments.filter(d => d.id !== deptId)
    }));
  };

  // 11. Course & Faculty Assignment (Admin)
  const createCourse = (courseData) => {
    const newId = `course_${courseData.code.toLowerCase().replace(/\s+/g, '')}_${Date.now().toString().slice(-4)}`;
    const newCourse = {
      id: newId,
      ...courseData
    };
    setData(prev => ({
      ...prev,
      courses: [...prev.courses, newCourse]
    }));
    return newCourse;
  };

  const updateCourse = (courseId, updateFields) => {
    setData(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === courseId ? { ...c, ...updateFields } : c)
    }));
  };

  const assignFacultyToCourse = (courseId, facultyId) => {
    setData((prev) => {
      const updatedCourses = prev.courses.map(c => 
        c.id === courseId ? { ...c, faculty_id: facultyId } : c
      );
      // Also update timetable slots for this course
      const updatedTimetable = prev.timetable.map(t => 
        t.course_id === courseId ? { ...t, faculty_id: facultyId } : t
      );
      return {
        ...prev,
        courses: updatedCourses,
        timetable: updatedTimetable
      };
    });
  };

  // 12. Notifications Actions
  const markNotificationAsRead = (notifId) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === notifId ? { ...n, read: true } : n)
    }));
  };

  const markAllNotificationsAsRead = (userId) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.user_id === userId ? { ...n, read: true } : n)
    }));
  };

  // 13. Admin Manual Broadcast
  const pushManualBroadcast = ({ title, message, targetRole = 'all' }) => {
    setData((prev) => {
      const newNotifs = [...prev.notifications];
      const targetUsers = prev.users.filter(u => {
        if (targetRole === 'all') return true;
        return u.role === targetRole;
      });

      targetUsers.forEach(u => {
        newNotifs.unshift(addNotification({
          user_id: u.id,
          type: 'admin_broadcast',
          reference_id: null,
          title: `Announcement: ${title}`,
          message: message
        }));
      });

      return {
        ...prev,
        notifications: newNotifs
      };
    });
  };

  // 14. Exam Room Management (Admin Only)
  const createExamRoom = (roomData, authorId) => {
    const capacity = parseInt(roomData.capacity, 10);
    if (!roomData.name || !roomData.name.trim()) {
      throw new Error('Room / Hall name is required.');
    }
    if (isNaN(capacity) || capacity <= 0) {
      throw new Error('Room capacity must be a positive number (e.g., 30, 35, 40).');
    }

    const trimmedName = roomData.name.trim();
    const existing = (data.exam_rooms || []).find(
      r => r.name.toLowerCase() === trimmedName.toLowerCase() ||
           (r.room_number && r.room_number.toLowerCase() === (roomData.room_number || trimmedName).toLowerCase())
    );
    if (existing) {
      throw new Error(`An exam room with name/number "${trimmedName}" already exists.`);
    }

    const now = new Date().toISOString();
    const newId = roomData.id || `room_${Date.now()}`;
    const newRoom = {
      id: newId,
      name: trimmedName,
      room_number: roomData.room_number ? roomData.room_number.trim() : trimmedName,
      capacity: capacity,
      building: roomData.building ? roomData.building.trim() : 'Academic Block',
      floor: roomData.floor ? roomData.floor.trim() : '1st Floor',
      status: roomData.status || 'active',
      created_by: authorId || 'admin_1',
      updated_by: authorId || 'admin_1',
      created_at: now,
      updated_at: now
    };

    setData(prev => ({
      ...prev,
      exam_rooms: [...(prev.exam_rooms || []), newRoom]
    }));

    return newRoom;
  };

  const updateExamRoom = (roomId, updateFields, editorId) => {
    let capacity = updateFields.capacity !== undefined ? parseInt(updateFields.capacity, 10) : undefined;
    if (capacity !== undefined && (isNaN(capacity) || capacity <= 0)) {
      throw new Error('Room capacity must be a positive number.');
    }

    if (updateFields.name) {
      const trimmedName = updateFields.name.trim();
      const duplicate = (data.exam_rooms || []).find(
        r => r.id !== roomId && r.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Another room with name "${trimmedName}" already exists.`);
      }
    }

    const now = new Date().toISOString();
    setData(prev => ({
      ...prev,
      exam_rooms: (prev.exam_rooms || []).map(r => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          ...updateFields,
          ...(capacity !== undefined ? { capacity } : {}),
          updated_by: editorId || 'admin_1',
          updated_at: now
        };
      })
    }));
  };

  const deleteExamRoom = (roomId, actorRole) => {
    if (actorRole !== 'admin') {
      throw new Error('Permission Denied: Only Administrators can delete exam rooms.');
    }

    const usedInPlans = (data.exam_seating_plans || []).filter(p => p.room_id === roomId);
    if (usedInPlans.length > 0) {
      throw new Error(`Cannot delete room: It is currently assigned to ${usedInPlans.length} active exam seating plan(s).`);
    }

    setData(prev => ({
      ...prev,
      exam_rooms: (prev.exam_rooms || []).filter(r => r.id !== roomId)
    }));
  };

  // 15. Exam Timetable Management (Admin: all depts; Faculty: own dept only, no delete; Student: read-only)
  const createExamTimetable = (examData, authorId, actorRole, actorDeptId) => {
    if (actorRole === 'faculty' && actorDeptId && examData.department_id !== actorDeptId) {
      throw new Error('Permission Denied: Faculty can only schedule exams for their own department.');
    }

    if (!examData.subject || !examData.subject.trim()) {
      throw new Error('Exam subject is required.');
    }
    if (!examData.exam_date) {
      throw new Error('Exam date is required.');
    }
    if (!examData.start_time || !examData.end_time) {
      throw new Error('Exam start and end times are required.');
    }
    if (!examData.department_id) {
      throw new Error('Department is required.');
    }

    const now = new Date().toISOString();
    const newId = examData.id || `exam_${Date.now()}`;
    const newExam = {
      id: newId,
      subject: examData.subject.trim(),
      course_id: examData.course_id || null,
      department_id: examData.department_id,
      semester: parseInt(examData.semester, 10) || 5,
      exam_date: examData.exam_date,
      start_time: examData.start_time,
      end_time: examData.end_time,
      rooms: examData.rooms || [],
      room_ids: examData.room_ids || [],
      exam_type: examData.exam_type || 'Theory Examination',
      created_by: authorId || 'admin_1',
      updated_by: authorId || 'admin_1',
      created_at: now,
      updated_at: now
    };

    setData(prev => {
      const newNotifs = [...prev.notifications];
      const targetStudents = (prev.users || []).filter(
        u => u.role === 'student' && u.department_id === newExam.department_id && u.semester === newExam.semester
      );

      targetStudents.forEach(st => {
        newNotifs.unshift(addNotification({
          user_id: st.id,
          type: 'exam_scheduled',
          reference_id: newId,
          title: `Exam Scheduled: ${newExam.subject}`,
          message: `Scheduled on ${newExam.exam_date} (${newExam.start_time} - ${newExam.end_time}). Rooms: ${newExam.rooms.join(', ') || 'TBD'}.`
        }));
      });

      return {
        ...prev,
        exam_timetables: [...(prev.exam_timetables || []), newExam],
        notifications: newNotifs
      };
    });

    return newExam;
  };

  const updateExamTimetable = (timetableId, updateFields, editorId, actorRole, actorDeptId) => {
    const existing = (data.exam_timetables || []).find(e => e.id === timetableId);
    if (!existing) throw new Error('Exam schedule not found.');

    if (actorRole === 'faculty' && actorDeptId) {
      if (existing.department_id !== actorDeptId) {
        throw new Error('Permission Denied: Faculty can only edit exams for their own department.');
      }
      if (updateFields.department_id && updateFields.department_id !== actorDeptId) {
        throw new Error('Permission Denied: Cannot reassign exam to another department.');
      }
    }

    const now = new Date().toISOString();
    setData(prev => ({
      ...prev,
      exam_timetables: (prev.exam_timetables || []).map(e => {
        if (e.id !== timetableId) return e;
        return {
          ...e,
          ...updateFields,
          updated_by: editorId || 'admin_1',
          updated_at: now
        };
      })
    }));
  };

  const deleteExamTimetable = (timetableId, actorRole) => {
    if (actorRole !== 'admin') {
      throw new Error('Permission Denied: Only Administrators can delete exam timetables.');
    }

    setData(prev => ({
      ...prev,
      exam_timetables: (prev.exam_timetables || []).filter(e => e.id !== timetableId),
      exam_seating_plans: (prev.exam_seating_plans || []).filter(p => p.exam_id !== timetableId),
      exam_seatings: (prev.exam_seatings || []).filter(s => s.exam_id !== timetableId)
    }));
  };

  // 16. Exam Seating Arrangement Generation
  // Admin: full CRUD; Faculty: own dept only, no delete; Students: view-only on own record
  const generateExamSeatingPlan = ({
    exam_id,
    room_ids,
    group1,
    group2,
    start_offset1 = 0,
    start_offset2 = 0
  }, authorId, actorRole, actorDeptId) => {
    if (!exam_id) throw new Error('Exam selection is required.');
    if (!room_ids || room_ids.length === 0) throw new Error('At least one exam room must be selected.');
    if (!group1?.department_id || !group2?.department_id) {
      throw new Error('Two branch + section groups are required to generate seating arrangement.');
    }

    if (actorRole === 'faculty' && actorDeptId) {
      const isFacultyDeptInvolved = group1.department_id === actorDeptId || group2.department_id === actorDeptId;
      if (!isFacultyDeptInvolved) {
        throw new Error('Permission Denied: Faculty can only generate seating arrangements involving their own department.');
      }
    }

    const exam = (data.exam_timetables || []).find(e => e.id === exam_id);
    const selectedRooms = (data.exam_rooms || []).filter(r => room_ids.includes(r.id));
    if (selectedRooms.length === 0) throw new Error('Selected room(s) not found.');

    const g1Students = (data.users || []).filter(
      u => u.role === 'student' &&
           u.department_id === group1.department_id &&
           (!group1.semester || u.semester === parseInt(group1.semester, 10)) &&
           (!group1.section || u.section === group1.section)
    );

    const g2Students = (data.users || []).filter(
      u => u.role === 'student' &&
           u.department_id === group2.department_id &&
           (!group2.semester || u.semester === parseInt(group2.semester, 10)) &&
           (!group2.section || u.section === group2.section)
    );

    const now = new Date().toISOString();
    const newPlans = [];
    const newStudentSeatings = [];
    let currentG1Idx = start_offset1;
    let currentG2Idx = start_offset2;
    const assignedRoomNames = [];

    selectedRooms.forEach((room) => {
      assignedRoomNames.push(room.name);
      const capacity = room.capacity || 30;
      // Proportional split based on room's actual capacity (e.g., 30 -> 15+15, 35 -> 18+17, 40 -> 20+20)
      const g1Cap = Math.ceil(capacity / 2);
      const g2Cap = Math.floor(capacity / 2);

      const seats = [];
      const cols = 5;

      for (let i = 0; i < capacity; i++) {
        // Alternating by branch to prevent adjacent same-branch seating
        const isGroup1 = i % 2 === 0;
        const seatNum = `S-${String(i + 1).padStart(2, '0')}`;
        const row = Math.floor(i / cols) + 1;
        const col = (i % cols) + 1;

        let studentObj = null;

        if (isGroup1) {
          if (currentG1Idx < g1Students.length) {
            const st = g1Students[currentG1Idx];
            studentObj = {
              id: st.id,
              name: st.name,
              usn: st.usn || st.roll_no,
              isReal: true
            };
          } else {
            const candNum = currentG1Idx + 1;
            const branchCode = group1.branch || 'BR1';
            studentObj = {
              id: `cand_${group1.department_id}_${candNum}`,
              name: `${branchCode} Examinee #${candNum}`,
              usn: `1MS22${branchCode}${String(candNum).padStart(3, '0')}`,
              isReal: false
            };
          }
          currentG1Idx++;
        } else {
          if (currentG2Idx < g2Students.length) {
            const st = g2Students[currentG2Idx];
            studentObj = {
              id: st.id,
              name: st.name,
              usn: st.usn || st.roll_no,
              isReal: true
            };
          } else {
            const candNum = currentG2Idx + 1;
            const branchCode = group2.branch || 'BR2';
            studentObj = {
              id: `cand_${group2.department_id}_${candNum}`,
              name: `${branchCode} Examinee #${candNum}`,
              usn: `1MS22${branchCode}${String(candNum).padStart(3, '0')}`,
              isReal: false
            };
          }
          currentG2Idx++;
        }

        const seatRecord = {
          seat_number: seatNum,
          bench_row: row,
          bench_col: col,
          group: isGroup1 ? 1 : 2,
          department_id: isGroup1 ? group1.department_id : group2.department_id,
          branch: isGroup1 ? group1.branch : group2.branch,
          section: isGroup1 ? group1.section : group2.section,
          semester: isGroup1 ? group1.semester : group2.semester,
          student_id: studentObj.id,
          student_name: studentObj.name,
          usn: studentObj.usn
        };
        seats.push(seatRecord);

        // Add to student-level exam_seatings
        newStudentSeatings.push({
          id: `seat_${exam_id}_${room.id}_${seatNum}`,
          student_id: studentObj.id,
          student_name: studentObj.name,
          usn: studentObj.usn,
          exam_id: exam_id,
          subject: exam ? exam.subject : 'Exam',
          room_id: room.id,
          room_name: room.name,
          seat_number: seatNum,
          bench_row: row,
          bench_col: col,
          department_id: isGroup1 ? group1.department_id : group2.department_id,
          branch: isGroup1 ? group1.branch : group2.branch,
          section: isGroup1 ? group1.section : group2.section,
          semester: isGroup1 ? group1.semester : group2.semester,
          exam_date: exam ? exam.exam_date : '',
          start_time: exam ? exam.start_time : '',
          end_time: exam ? exam.end_time : '',
          created_by: authorId || 'admin_1',
          updated_by: authorId || 'admin_1',
          created_at: now,
          updated_at: now
        });
      }

      const planId = `plan_${exam_id}_${room.id}_${Date.now()}`;
      newPlans.push({
        id: planId,
        exam_id: exam_id,
        exam_name: exam ? exam.subject : 'Exam',
        room_id: room.id,
        room_name: room.name,
        capacity: capacity,
        department_id: group1.department_id,
        department_ids: [group1.department_id, group2.department_id],
        group1: {
          ...group1,
          allocated_count: g1Cap
        },
        group2: {
          ...group2,
          allocated_count: g2Cap
        },
        seats: seats,
        created_by: authorId || 'admin_1',
        updated_by: authorId || 'admin_1',
        created_at: now,
        updated_at: now
      });
    });

    setData(prev => {
      const existingPlanRoomIds = new Set(selectedRooms.map(r => r.id));
      const filteredPlans = (prev.exam_seating_plans || []).filter(
        p => !(p.exam_id === exam_id && existingPlanRoomIds.has(p.room_id))
      );
      const filteredSeatings = (prev.exam_seatings || []).filter(
        s => !(s.exam_id === exam_id && existingPlanRoomIds.has(s.room_id))
      );

      const updatedTimetables = (prev.exam_timetables || []).map(e => {
        if (e.id !== exam_id) return e;
        const mergedRoomIds = Array.from(new Set([...(e.room_ids || []), ...room_ids]));
        const mergedRoomNames = Array.from(new Set([...(e.rooms || []), ...assignedRoomNames]));
        return {
          ...e,
          room_ids: mergedRoomIds,
          rooms: mergedRoomNames,
          updated_by: authorId || 'admin_1',
          updated_at: now
        };
      });

      const newNotifs = [...prev.notifications];
      newStudentSeatings.forEach(seat => {
        if (seat.student_id && !seat.student_id.startsWith('cand_')) {
          newNotifs.unshift(addNotification({
            user_id: seat.student_id,
            type: 'seating_allocated',
            reference_id: exam_id,
            title: `Exam Seating Allotment: ${seat.subject}`,
            message: `You are allotted Seat ${seat.seat_number} in Room ${seat.room_name} for your exam on ${seat.exam_date}.`
          }));
        }
      });

      return {
        ...prev,
        exam_seating_plans: [...newPlans, ...filteredPlans],
        exam_seatings: [...newStudentSeatings, ...filteredSeatings],
        exam_timetables: updatedTimetables,
        notifications: newNotifs
      };
    });

    return newPlans;
  };

  const deleteExamSeatingPlan = (planId, actorRole) => {
    if (actorRole !== 'admin') {
      throw new Error('Permission Denied: Only Administrators can delete seating arrangements.');
    }

    const plan = (data.exam_seating_plans || []).find(p => p.id === planId);
    if (!plan) return;

    setData(prev => ({
      ...prev,
      exam_seating_plans: (prev.exam_seating_plans || []).filter(p => p.id !== planId),
      exam_seatings: (prev.exam_seatings || []).filter(
        s => !(s.exam_id === plan.exam_id && s.room_id === plan.room_id)
      )
    }));
  };

  return (
    <DataContext.Provider
      value={{
        ...data,
        resetToSeedData,
        markBulkAttendance,
        saveIAMarks,
        createAssignment,
        submitAssignment,
        gradeSubmission,
        createAnnouncement,
        createCalendarEvent,
        deleteCalendarEvent,
        saveTimetableSlot,
        deleteTimetableSlot,
        createUser,
        updateUser,
        createStudent,
        updateStudent,
        deleteStudent,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createCourse,
        updateCourse,
        assignFacultyToCourse,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        pushManualBroadcast,
        createExamRoom,
        updateExamRoom,
        deleteExamRoom,
        createExamTimetable,
        updateExamTimetable,
        deleteExamTimetable,
        generateExamSeatingPlan,
        deleteExamSeatingPlan
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
