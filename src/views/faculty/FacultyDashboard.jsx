import React from 'react';
import ClassAnalytics from '../../components/faculty/ClassAnalytics';
import ManageStudents from '../../components/shared/ManageStudents';
import TeacherAttendance from '../../components/faculty/TeacherAttendance';
import IAMarksEntry from '../../components/faculty/IAMarksEntry';
import AssignmentManager from '../../components/faculty/AssignmentManager';
import FacultyTimetable from '../../components/faculty/FacultyTimetable';
import TimetableBuilder from '../../components/admin/TimetableBuilder';
import CourseAnnouncementModal from '../../components/faculty/CourseAnnouncementModal';
import ExamManagement from '../../components/exams/ExamManagement';
import SemesterCalendarView from '../../components/shared/SemesterCalendarView';
import HodDepartmentOverview from '../../components/hod/HodDepartmentOverview';
import HodFacultyCompliance from '../../components/hod/HodFacultyCompliance';
import StudentAnalytics from '../../components/shared/StudentAnalytics';
import ClassPerformance from '../../components/shared/ClassPerformance';
import RequestsInbox from '../../components/shared/RequestsInbox';
import FeedbackResults from '../../components/shared/FeedbackResults';
import { useAuth } from '../../context/AuthContext';

export default function FacultyDashboard({ activeTab = 'overview', setActiveTab }) {
  const { isHod } = useAuth();
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ClassAnalytics onNavigateTab={setActiveTab} />;
      case 'students':
        return isHod ? <ManageStudents /> : <ClassAnalytics onNavigateTab={setActiveTab} />;
      case 'attendance':
        return <TeacherAttendance />;
      case 'iamarks':
        return <IAMarksEntry />;
      case 'student_analytics':
        return <StudentAnalytics scope="teaching" />;
      case 'class_analytics':
        return <ClassPerformance scope="teaching" />;
      case 'assignments':
        return <AssignmentManager />;
      case 'timetable':
        return <FacultyTimetable />;
      case 'timetable_edit':
        return <TimetableBuilder mode="faculty" />;
      case 'exam_seating':
        return <ExamManagement />;
      case 'semester_calendar':
        return <SemesterCalendarView />;
      case 'announcements':
        return <CourseAnnouncementModal />;
      case 'hod_overview':
        return isHod ? <HodDepartmentOverview /> : <ClassAnalytics onNavigateTab={setActiveTab} />;
      case 'hod_student_analytics':
        return isHod ? <StudentAnalytics scope="department" /> : <ClassAnalytics onNavigateTab={setActiveTab} />;
      case 'hod_class_analytics':
        return isHod ? <ClassPerformance scope="department" /> : <ClassAnalytics onNavigateTab={setActiveTab} />;
      case 'hod_compliance':
        return isHod ? <HodFacultyCompliance /> : <ClassAnalytics onNavigateTab={setActiveTab} />;
      case 'requests':
        return <RequestsInbox />;
      case 'feedback_results':
        return <FeedbackResults />;
      default:
        return <ClassAnalytics onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {renderActiveTabContent()}
    </div>
  );
}
