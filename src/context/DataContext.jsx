import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TABLES, toRow } from '../lib/db-schema';
import { missingEnrollments, replaceCourseEnrollments, studentMatchesCourse } from '../utils/enrollment';
import { gpa } from '../utils/results';
import { formatTimeRange } from '../utils/time';
import { eventAppliesTo } from '../utils/calendarScope';
import { calendarAppliesTo } from '../utils/semesterCalendar';

export const DataContext = createContext(null);

const PAGE_SIZE = 1000;

const emptyData = () => Object.fromEntries(TABLES.map((t) => [t.key, []]));

const toNumberOr = (value, fallback) => (value === '' || value === undefined ? fallback : Number(value));

async function fetchTable(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not load ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function fetchAll() {
  const tables = await Promise.all(TABLES.map((t) => fetchTable(t.table)));
  return Object.fromEntries(TABLES.map((t, i) => [t.key, tables[i]]));
}

const sameRow = (columns, a, b) =>
  JSON.stringify(toRow(columns, a)) === JSON.stringify(toRow(columns, b));

const assertWrite = (table, action, error, count, expected) => {
  if (error) throw new Error(`Could not ${action} ${table}: ${error.message}`);
  if (count !== null && count < expected) {
    throw new Error(`You don't have permission to ${action} some ${table} records.`);
  }
};

// Writes the difference between two data snapshots to Supabase.
// Deletes run children-first, inserts/updates parents-first, so foreign keys hold.
async function persistChanges(prev, next) {
  for (const { key, table } of [...TABLES].reverse()) {
    if (prev[key] === next[key]) continue;
    const nextIds = new Set(next[key].map((r) => r.id));
    const removed = prev[key].filter((r) => !nextIds.has(r.id)).map((r) => r.id);
    if (!removed.length) continue;
    const { error, count } = await supabase.from(table).delete({ count: 'exact' }).in('id', removed);
    assertWrite(table, 'delete', error, count, removed.length);
  }

  for (const { key, table, columns } of TABLES) {
    if (prev[key] === next[key]) continue;
    const prevById = new Map(prev[key].map((r) => [r.id, r]));
    const inserts = [];
    const updates = [];
    for (const record of next[key]) {
      const old = prevById.get(record.id);
      if (!old) inserts.push(toRow(columns, record));
      else if (!sameRow(columns, old, record)) updates.push(toRow(columns, record));
    }

    if (inserts.length) {
      const { error } = await supabase.from(table).insert(inserts, { defaultToNull: false });
      assertWrite(table, 'create', error, null, 0);
    }
    for (const { id, ...fields } of updates) {
      const { error, count } = await supabase.from(table).update(fields, { count: 'exact' }).eq('id', id);
      assertWrite(table, 'update', error, count, 1);
    }
  }
}

export function DataProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const [auth, setAuth] = useState({ session: null, loading: true });
  const [syncError, setSyncError] = useState(null);

  // Last snapshot known to match the server; local edits are diffed against it.
  const snapshot = useRef(null);
  // Serialises writes and reloads so they reach Supabase in order.
  const queue = useRef(Promise.resolve());
  const userIdRef = useRef(null);

  // Which signed-in user the snapshot belongs to. Writes only ever run for that user.
  const snapshotOwner = useRef(null);

  // Profile id of the signed-in user; recorded as created_by / updated_by on edits.
  const currentProfileId = auth.session
    ? data.users.find((u) => u.auth_id === auth.session.user.id)?.id || null
    : null;

  const loadAll = useCallback(async () => {
    const uid = userIdRef.current;
    const fresh = await fetchAll();
    if (uid !== userIdRef.current) return; // user changed mid-load; discard
    snapshot.current = fresh;
    snapshotOwner.current = uid;
    setData(fresh);
  }, []);

  const refreshData = useCallback(() => {
    queue.current = queue.current
      .then(loadAll)
      .catch((e) => setSyncError(e.message));
    return queue.current;
  }, [loadAll]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;

      if (!uid) {
        userIdRef.current = null;
        snapshot.current = null;
        snapshotOwner.current = null;
        setData(emptyData());
        setAuth({ session: null, loading: false });
        return;
      }

      const isNewUser = uid !== userIdRef.current;
      userIdRef.current = uid;
      setAuth((prev) => ({ session, loading: isNewUser ? true : prev.loading }));
      if (!isNewUser) return;

      // Drop the previous user's snapshot first: clearing local data must never be
      // diffed into deletes that would run under the new session.
      snapshot.current = null;
      snapshotOwner.current = null;
      setData(emptyData());

      // Defer Supabase calls out of the auth callback to avoid a client deadlock.
      setTimeout(() => {
        if (userIdRef.current !== uid) return;
        refreshData().finally(() => setAuth((prev) => ({ ...prev, loading: false })));
      }, 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [refreshData]);

  // Pick up changes made by other users when the tab regains focus.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && userIdRef.current) refreshData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshData]);

  // Persist local edits. On failure, reload so the UI matches what the server accepted.
  useEffect(() => {
    const prev = snapshot.current;
    const owner = snapshotOwner.current;
    if (!prev || prev === data || !owner || owner !== userIdRef.current) return;
    snapshot.current = data;
    queue.current = queue.current
      .then(() => {
        // Never apply one user's edits under another user's session.
        if (owner !== userIdRef.current) return;
        return persistChanges(prev, data);
      })
      .catch(async (e) => {
        console.error('Campusnex sync failed:', e);
        setSyncError(e.message);
        await loadAll().catch(() => {});
      });
  }, [data, loadAll]);

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
      // Notify the students and faculty the event applies to
      prev.users.forEach(u => {
        if ((u.role === 'student' || u.role === 'faculty') && u.status !== 'inactive' && eventAppliesTo(newEvt, u)) {
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
          message: `Scheduled on ${slotData.day_of_week} at ${formatTimeRange(slotData.start_time, slotData.end_time)} in ${slotData.room}.`
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
      created_by: authorId || currentProfileId,
      updated_by: authorId || currentProfileId,
      created_at: now,
      updated_at: now
    };

    // Auto enroll in courses for the student's department, semester and section
    setData(prev => {
      const pairs = prev.courses
        .filter(c => studentMatchesCourse(newStudent, c))
        .map(c => [newId, c.id]);
      return {
        ...prev,
        users: [...prev.users, newStudent],
        enrollments: [...prev.enrollments, ...missingEnrollments(prev.enrollments, pairs)]
      };
    });

    return newStudent;
  };

  // Bulk import of already-validated students (see utils/studentImport.js).
  // Adds all students and their course enrolments in one save.
  const createStudentsBulk = (students, authorId) => {
    const now = new Date().toISOString();
    const actor = authorId || currentProfileId;
    const newStudents = students.map(st => ({
      id: `student_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      name: st.name,
      email: st.email,
      role: 'student',
      usn: st.usn,
      roll_no: st.usn,
      department_id: st.department_id,
      semester: st.semester,
      section: st.section,
      phone: '',
      status: 'active',
      photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(st.name)}`,
      created_by: actor,
      updated_by: actor,
      created_at: now,
      updated_at: now
    }));

    setData(prev => {
      const pairs = newStudents.flatMap(st =>
        prev.courses.filter(c => studentMatchesCourse(st, c)).map(c => [st.id, c.id])
      );
      return {
        ...prev,
        users: [...prev.users, ...newStudents],
        enrollments: [...prev.enrollments, ...missingEnrollments(prev.enrollments, pairs)]
      };
    });
    return newStudents.length;
  };

  // Semester results from a validated CSV (see utils/results.js). A row for the same student,
  // semester and course replaces the old marks but keeps its published state.
  const importResults = (list) => {
    const now = new Date().toISOString();
    setData(prev => {
      const results = [...(prev.results || [])];
      const indexByKey = new Map(results.map((r, i) => [`${r.student_id}|${r.semester}|${r.course_code}`, i]));
      for (const r of list) {
        const key = `${r.student_id}|${r.semester}|${r.course_code}`;
        if (indexByKey.has(key)) {
          const i = indexByKey.get(key);
          results[i] = { ...results[i], ...r, updated_by: currentProfileId, updated_at: now };
        } else {
          indexByKey.set(key, results.length);
          results.push({
            id: `res_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
            ...r,
            published: false,
            created_by: currentProfileId,
            updated_by: currentProfileId,
            created_at: now,
            updated_at: now
          });
        }
      }
      return { ...prev, results };
    });
    return list.length;
  };

  // Publish or hide one semester's results, optionally for one department only.
  // Publishing notifies each student with their SGPA for that semester.
  const setResultsPublished = (semester, departmentId, published) => {
    const now = new Date().toISOString();
    setData(prev => {
      const deptOf = new Map(prev.users.map(u => [u.id, u.department_id]));
      const inScope = (r) => r.semester === semester && (!departmentId || deptOf.get(r.student_id) === departmentId);
      const changed = (prev.results || []).filter(r => inScope(r) && r.published !== published);
      if (!changed.length) return prev;

      const results = prev.results.map(r =>
        inScope(r) && r.published !== published ? { ...r, published, updated_by: currentProfileId, updated_at: now } : r
      );

      const notifications = [...prev.notifications];
      if (published) {
        const students = [...new Set(changed.map(r => r.student_id))];
        for (const studentId of students) {
          const sgpa = gpa(results.filter(r => r.student_id === studentId && r.semester === semester));
          notifications.unshift(addNotification({
            user_id: studentId,
            type: 'result_published',
            reference_id: `sem-${semester}`,
            title: `Semester ${semester} results published`,
            message: `Your SGPA for semester ${semester} is ${sgpa?.toFixed(2)}. Open Results to see your CGPA.`
          }));
        }
      }
      return { ...prev, results, notifications };
    });
  };

  // Semester calendars: one circular with many dated rows, published to its semesters at once.
  const notifySemesterCalendar = (prevUsers, calendar) =>
    prevUsers
      .filter(u => (u.role === 'student' || u.role === 'faculty') && calendarAppliesTo(calendar, u))
      .map(u => addNotification({
        user_id: u.id,
        type: 'semester_calendar_published',
        reference_id: calendar.id,
        title: `${calendar.title} published`,
        message: `The semester calendar for Sem ${calendar.semesters.join(', ')} is out: CIE tests, SEE dates and deadlines.`
      }));

  const createSemesterCalendar = ({ title, ref_no, semesters, department_id, items }, publish) => {
    if (!title?.trim()) throw new Error('Give the calendar a title.');
    if (!semesters?.length) throw new Error('Pick at least one semester.');
    if (!items?.length) throw new Error('Paste at least one row with a date.');

    const now = new Date().toISOString();
    const id = `semcal_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const calendar = {
      id,
      title: title.trim(),
      ref_no: ref_no?.trim() || null,
      semesters: [...semesters].sort((a, b) => a - b),
      department_id: department_id || null,
      status: publish ? 'published' : 'draft',
      published_at: publish ? now : null,
      created_by: currentProfileId,
      created_at: now,
      updated_at: now
    };
    const rows = items.map((item, i) => ({
      id: `${id}_${String(i + 1).padStart(3, '0')}`,
      calendar_id: id,
      activity: item.activity.trim(),
      start_date: item.start_date,
      end_date: item.end_date || null,
      type: item.type,
      sort_order: i
    }));

    setData(prev => ({
      ...prev,
      semester_calendars: [...prev.semester_calendars, calendar],
      semester_calendar_items: [...prev.semester_calendar_items, ...rows],
      notifications: publish
        ? [...notifySemesterCalendar(prev.users, calendar), ...prev.notifications]
        : prev.notifications
    }));
    return calendar;
  };

  const publishSemesterCalendar = (calendarId) => {
    const now = new Date().toISOString();
    setData(prev => {
      const calendar = prev.semester_calendars.find(c => c.id === calendarId);
      if (!calendar || calendar.status === 'published') return prev;
      const published = { ...calendar, status: 'published', published_at: now, updated_at: now };
      return {
        ...prev,
        semester_calendars: prev.semester_calendars.map(c => (c.id === calendarId ? published : c)),
        notifications: [...notifySemesterCalendar(prev.users, published), ...prev.notifications]
      };
    });
  };

  const deleteSemesterCalendar = (calendarId) => {
    setData(prev => ({
      ...prev,
      semester_calendars: prev.semester_calendars.filter(c => c.id !== calendarId),
      semester_calendar_items: prev.semester_calendar_items.filter(i => i.calendar_id !== calendarId)
    }));
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

    setData(prev => {
      let updated = null;
      const users = prev.users.map(u => {
        if (u.id !== studentId) return u;
        updated = {
          ...u,
          ...updateFields,
          ...(formattedUSN ? { usn: formattedUSN, roll_no: formattedUSN } : {}),
          updated_by: editorId || currentProfileId || u.updated_by,
          updated_at: now
        };
        return updated;
      });
      // Keep existing enrolments (and their history); add any courses the student now matches.
      const pairs = updated
        ? prev.courses.filter(c => studentMatchesCourse(updated, c)).map(c => [studentId, c.id])
        : [];
      return {
        ...prev,
        users,
        enrollments: [...prev.enrollments, ...missingEnrollments(prev.enrollments, pairs)]
      };
    });
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

    const prefix = userData.role === 'admin' ? 'admin' : 'faculty';
    const newId = `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

    // Student-only fields do not apply to faculty or admins.
    const { usn: _usn, roll_no: _rollNo, semester: _semester, section: _section, ...staffData } = userData;

    const now = new Date().toISOString();
    const newUser = {
      id: newId,
      status: 'active',
      photo_url: userData.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      created_by: authorId || currentProfileId,
      updated_by: authorId || currentProfileId,
      created_at: now,
      updated_at: now,
      ...staffData,
      email: userData.email.trim().toLowerCase()
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
        updated_by: editorId || currentProfileId || u.updated_by,
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
      ...courseData,
      semester: toNumberOr(courseData.semester, null),
      credits: toNumberOr(courseData.credits, null)
    };
    setData(prev => {
      const pairs = prev.users
        .filter(u => studentMatchesCourse(u, newCourse))
        .map(u => [u.id, newId]);
      return {
        ...prev,
        courses: [...prev.courses, newCourse],
        enrollments: [...prev.enrollments, ...missingEnrollments(prev.enrollments, pairs)]
      };
    });
    return newCourse;
  };

  const updateCourse = (courseId, updateFields) => {
    setData(prev => {
      let updated = null;
      const courses = prev.courses.map(c => {
        if (c.id !== courseId) return c;
        updated = {
          ...c,
          ...updateFields,
          semester: toNumberOr(updateFields.semester, c.semester),
          credits: toNumberOr(updateFields.credits, c.credits)
        };
        return updated;
      });
      // Keep existing enrolments; add students who now match the course.
      const pairs = updated
        ? prev.users.filter(u => studentMatchesCourse(u, updated)).map(u => [u.id, courseId])
        : [];
      return {
        ...prev,
        courses,
        enrollments: [...prev.enrollments, ...missingEnrollments(prev.enrollments, pairs)]
      };
    });
  };

  // Set exactly which students are enrolled in a course. Attendance and marks history is kept.
  const setCourseEnrollments = (courseId, studentIds) => {
    setData(prev => ({
      ...prev,
      enrollments: replaceCourseEnrollments(prev.enrollments, courseId, studentIds)
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
        if (u.status === 'inactive') return false;
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
      created_by: authorId || currentProfileId,
      updated_by: authorId || currentProfileId,
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
          updated_by: editorId || currentProfileId,
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
      created_by: authorId || currentProfileId,
      updated_by: authorId || currentProfileId,
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
          message: `Scheduled on ${newExam.exam_date} (${formatTimeRange(newExam.start_time, newExam.end_time)}). Rooms: ${newExam.rooms.join(', ') || 'TBD'}.`
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
          updated_by: editorId || currentProfileId,
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
    if (actorRole === 'faculty' && actorDeptId && exam?.department_id !== actorDeptId) {
      throw new Error('Permission Denied: Faculty can only arrange seating for exams of their own department.');
    }
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
          created_by: authorId || currentProfileId,
          updated_by: authorId || currentProfileId,
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
        created_by: authorId || currentProfileId,
        updated_by: authorId || currentProfileId,
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
          updated_by: authorId || currentProfileId,
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

  // Student self-service (supabase/migrations/20261019000600_student_self_service.sql).
  // These call server functions directly and then reload, so they bypass the diff sync,
  // which would try a profile update that row-level security refuses for students.
  const updateMyContact = async ({ phone, photo_url }) => {
    const { error } = await supabase.rpc('update_my_contact', {
      p_phone: phone || null,
      p_photo_url: photo_url || null
    });
    if (error) throw new Error(error.message);
    await refreshData();
  };

  const AVATAR_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const AVATAR_PREFIX = '/storage/v1/object/public/avatars/';

  // Uploads a new photo into the caller's own folder and returns its public link.
  const uploadProfilePhoto = async (file) => {
    if (!currentProfileId) throw new Error('Sign in again to change your photo.');
    const ext = AVATAR_TYPES[file.type];
    if (!ext) throw new Error('Use a JPG, PNG or WebP image.');
    if (file.size > 2 * 1024 * 1024) throw new Error('The photo must be 2 MB or smaller.');
    const path = `${currentProfileId}/photo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type });
    if (error) throw new Error(`Could not upload the photo: ${error.message}`);
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  };

  // Best effort: removes a photo this app uploaded. Links elsewhere are left alone.
  const deleteProfilePhoto = async (url) => {
    const at = url ? url.indexOf(AVATAR_PREFIX) : -1;
    if (at < 0) return;
    const path = decodeURIComponent(url.slice(at + AVATAR_PREFIX.length).split('?')[0]);
    await supabase.storage.from('avatars').remove([path]);
  };

  // Assignment files (supabase/migrations/20261020000000_submission_files.sql). The submission row
  // stores `storage://submissions/<path>`; links are signed on demand because the bucket is private.
  const SUBMISSION_PREFIX = 'storage://submissions/';
  const SUBMISSION_MAX_BYTES = 10 * 1024 * 1024;

  const uploadSubmissionFile = async (assignmentId, file) => {
    if (!currentProfileId) throw new Error('Sign in again to upload your file.');
    if (file.size > SUBMISSION_MAX_BYTES) throw new Error('The file must be 10 MB or smaller.');
    const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-120) || 'submission';
    const path = `${assignmentId}/${currentProfileId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from('submissions')
      .upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (error) throw new Error(`Could not upload the file: ${error.message}`);
    return { file_url: `${SUBMISSION_PREFIX}${path}`, file_name: file.name };
  };

  // Files teachers attach to assignments (20261020000100_assignment_files.sql).
  const uploadAssignmentFile = async (courseId, file) => {
    if (!courseId) throw new Error('Choose a course first.');
    if (file.size > 20 * 1024 * 1024) throw new Error('The file must be 20 MB or smaller.');
    const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-120) || 'attachment';
    const path = `${courseId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from('assignment-files')
      .upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (error) throw new Error(`Could not upload the file: ${error.message}`);
    return { attachment_url: `storage://assignment-files/${path}`, attachment_name: file.name };
  };

  // A link that opens a stored file: a signed link for files in our private buckets, or an
  // https link someone shared (a repository, say). Old placeholder links have no file.
  const STORED_FILE = /^storage:\/\/(submissions|assignment-files)\/(.+)$/;
  const getStoredFileLink = async (fileUrl) => {
    if (!fileUrl) return null;
    const stored = fileUrl.match(STORED_FILE);
    if (stored) {
      const { data: signed, error } = await supabase.storage.from(stored[1]).createSignedUrl(stored[2], 60 * 10);
      if (error) throw new Error(`Could not open the file: ${error.message}`);
      return signed.signedUrl;
    }
    if (/^https:\/\//i.test(fileUrl) && !/^https:\/\/(storage\.campusnex\.edu|raw\.githubusercontent\.com\/campusnex)\//.test(fileUrl)) {
      return fileUrl;
    }
    return null;
  };

  // Anonymous course feedback (20261020000200_course_feedback.sql).
  const fetchMyFeedbackCourses = async () => {
    const { data: rows, error } = await supabase.rpc('my_feedback_courses');
    if (error) throw new Error(error.message);
    return (rows || []).map((r) => (typeof r === 'string' ? r : r.my_feedback_courses));
  };

  const submitCourseFeedback = async (courseId, ratings, comment) => {
    const { error } = await supabase.rpc('submit_course_feedback', {
      p_course_id: courseId,
      p_ratings: ratings,
      p_comment: comment || null
    });
    if (error) throw new Error(error.message);
  };

  const fetchCourseFeedbackSummary = async (courseId) => {
    const { data: summary, error } = await supabase.rpc('course_feedback_summary', { p_course_id: courseId });
    if (error) throw new Error(error.message);
    return summary;
  };

  // Student requests and grievances (20261020000300_student_requests.sql). Plain table writes;
  // row-level security decides who may raise, withdraw and answer.
  const createStudentRequest = ({ type, course_id, subject, details }) => {
    if (!currentProfileId) return;
    setData((prev) => ({
      ...prev,
      student_requests: [
        {
          id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          student_id: currentProfileId,
          type,
          course_id: course_id || null,
          subject: subject.trim(),
          details: details.trim(),
          status: 'open',
          response: null,
          created_at: new Date().toISOString()
        },
        ...prev.student_requests
      ]
    }));
  };

  const withdrawStudentRequest = (id) => {
    setData((prev) => ({ ...prev, student_requests: prev.student_requests.filter((r) => r.id !== id) }));
  };

  const answerStudentRequest = (id, { status, response }) => {
    setData((prev) => ({
      ...prev,
      student_requests: prev.student_requests.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              response: response?.trim() || null,
              responded_by: currentProfileId,
              responded_at: new Date().toISOString()
            }
          : r
      )
    }));
  };

  // Class averages for the caller's own courses: aggregates only, never classmates' rows.
  const fetchClassAverages = async () => {
    const { data: rows, error } = await supabase.rpc('my_class_averages');
    if (error) throw new Error(error.message);
    return rows || [];
  };

  return (
    <DataContext.Provider
      value={{
        ...data,
        session: auth.session,
        loading: auth.loading,
        syncError,
        clearSyncError: () => setSyncError(null),
        refreshData,
        updateMyContact,
        uploadProfilePhoto,
        deleteProfilePhoto,
        fetchClassAverages,
        uploadSubmissionFile,
        uploadAssignmentFile,
        getStoredFileLink,
        fetchMyFeedbackCourses,
        submitCourseFeedback,
        fetchCourseFeedbackSummary,
        createStudentRequest,
        withdrawStudentRequest,
        answerStudentRequest,
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
        createStudentsBulk,
        importResults,
        setResultsPublished,
        createSemesterCalendar,
        publishSemesterCalendar,
        deleteSemesterCalendar,
        updateStudent,
        deleteStudent,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createCourse,
        updateCourse,
        assignFacultyToCourse,
        setCourseEnrollments,
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
