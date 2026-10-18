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
        return <TimetableBuilder />;
      case 'exam_seating':
        return <ExamManagement />;
      case 'results':
        return <ResultsManager />;
      case 'calendar':
        return <CalendarManager />;
      case 'announcements':
        return <BroadcastModal />;
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
