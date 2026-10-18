import React from 'react';
import StudentHub from '../../components/student/StudentHub';
import AttendanceOverview from '../../components/student/AttendanceOverview';
import IAMarksView from '../../components/student/IAMarksView';
import AssignmentSubmissionList from '../../components/student/AssignmentSubmissionList';
import StudentTimetable from '../../components/student/StudentTimetable';
import StudentCalendar from '../../components/student/StudentCalendar';
import FacultyDirectory from '../../components/student/FacultyDirectory';
import StudentAnnouncements from '../../components/student/StudentAnnouncements';
import ExamManagement from '../../components/exams/ExamManagement';
import StudentResults from '../../components/student/StudentResults';

export default function StudentDashboard({ activeTab = 'overview', setActiveTab }) {
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StudentHub onNavigateTab={setActiveTab} />;
      case 'attendance':
        return <AttendanceOverview />;
      case 'iamarks':
        return <IAMarksView />;
      case 'results':
        return <StudentResults />;
      case 'assignments':
        return <AssignmentSubmissionList />;
      case 'timetable':
        return <StudentTimetable />;
      case 'exam_seating':
        return <ExamManagement />;
      case 'calendar':
        return <StudentCalendar />;
      case 'directory':
        return <FacultyDirectory />;
      case 'announcements':
        return <StudentAnnouncements />;
      default:
        return <StudentHub onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {renderActiveTabContent()}
    </div>
  );
}
