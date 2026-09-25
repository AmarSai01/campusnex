import React from 'react';
import ClassAnalytics from '../../components/faculty/ClassAnalytics';
import ManageStudents from '../../components/shared/ManageStudents';
import BulkAttendanceMarker from '../../components/faculty/BulkAttendanceMarker';
import IAMarksEntry from '../../components/faculty/IAMarksEntry';
import AssignmentManager from '../../components/faculty/AssignmentManager';
import FacultyTimetable from '../../components/faculty/FacultyTimetable';
import CourseAnnouncementModal from '../../components/faculty/CourseAnnouncementModal';
import ExamManagement from '../../components/exams/ExamManagement';

export default function FacultyDashboard({ activeTab = 'overview', setActiveTab }) {
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ClassAnalytics onNavigateTab={setActiveTab} />;
      case 'students':
        return <ManageStudents />;
      case 'attendance':
        return <BulkAttendanceMarker />;
      case 'iamarks':
        return <IAMarksEntry />;
      case 'assignments':
        return <AssignmentManager />;
      case 'timetable':
        return <FacultyTimetable />;
      case 'exam_seating':
        return <ExamManagement />;
      case 'announcements':
        return <CourseAnnouncementModal />;
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
