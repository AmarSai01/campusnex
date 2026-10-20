import React, { useState } from 'react';
import InstitutionAnalytics from '../../components/admin/InstitutionAnalytics';
import UserManagement from '../../components/admin/UserManagement';
import ManageStudents from '../../components/shared/ManageStudents';
import DepartmentManagement from '../../components/admin/DepartmentManagement';
import CourseManagement from '../../components/admin/CourseManagement';
import TimetableBuilder from '../../components/admin/TimetableBuilder';
import CalendarManager from '../../components/admin/CalendarManager';
import BroadcastModal from '../../components/admin/BroadcastModal';
import ExamManagement from '../../components/exams/ExamManagement';
import ResultsManager from '../../components/admin/ResultsManager';
import RequestsInbox from '../../components/shared/RequestsInbox';
import FeedbackResults from '../../components/shared/FeedbackResults';
import SemesterCalendarManager from '../../components/admin/SemesterCalendarManager';
import PilotRequests from '../../components/admin/PilotRequests';

export default function AdminDashboard({ activeTab = 'overview', setActiveTab }) {
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <InstitutionAnalytics onNavigateTab={setActiveTab} />;
      case 'students':
        return <ManageStudents />;
      case 'departments':
        return <DepartmentManagement />;
      case 'users':
        return <UserManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'timetable':
        return <TimetableBuilder onNavigateTab={setActiveTab} />;
      case 'exam_seating':
        return <ExamManagement />;
      case 'results':
        return <ResultsManager />;
      case 'calendar':
        return <CalendarManager />;
      case 'semester_calendar':
        return <SemesterCalendarManager />;
      case 'announcements':
        return <BroadcastModal />;
      case 'requests':
        return <RequestsInbox />;
      case 'feedback_results':
        return <FeedbackResults />;
      case 'pilot_requests':
        return <PilotRequests />;
      default:
        return <InstitutionAnalytics onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {renderActiveTabContent()}
    </div>
  );
}
