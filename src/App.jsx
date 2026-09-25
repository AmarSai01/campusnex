import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import LoginView from './views/auth/LoginView';
import AdminDashboard from './views/admin/AdminDashboard';
import FacultyDashboard from './views/faculty/FacultyDashboard';
import StudentDashboard from './views/student/StudentDashboard';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import NotificationDrawer from './components/notifications/NotificationDrawer';

function AppContent() {
  const { currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If not authenticated, render Login View
  if (!isAuthenticated || !currentUser) {
    return <LoginView />;
  }

  const getTabTitle = () => {
    const titles = {
      overview: currentUser.role === 'admin' ? 'Institution Analytics' : currentUser.role === 'faculty' ? 'Instructor Workspace' : 'Student Hub',
      students: 'Student Roster & USN Directory',
      departments: 'Academic Departments Directory',
      users: 'Institutional User Directory',
      courses: 'Department Courses & Faculty Allocation',
      timetable: 'Academic Timetable & Schedule',
      exam_seating: 'Exam Timetable & Seating Arrangement',
      calendar: 'Institutional Calendar & Events',
      announcements: 'Campus Broadcasts & Circulars',
      attendance: 'Attendance Management',
      iamarks: 'Internal Assessment (IA) Marks',
      assignments: 'Coursework & Assignments',
      directory: 'Faculty Advisory Directory'
    };
    return titles[activeTab] || 'Workspace';
  };

  const handleNotificationNavigate = (notif) => {
    setIsNotifOpen(false);
    if (notif.type === 'attendance_absent') {
      setActiveTab('attendance');
    } else if (notif.type === 'ia_published') {
      setActiveTab('iamarks');
    } else if (notif.type === 'assignment_due' || notif.type === 'assignment_graded' || notif.type === 'assignment_created' || notif.type === 'assignment_submitted') {
      setActiveTab('assignments');
    } else if (notif.type === 'new_announcement' || notif.type === 'admin_broadcast') {
      setActiveTab('announcements');
    } else if (notif.type === 'timetable_changed') {
      setActiveTab('timetable');
    } else if (notif.type === 'calendar_event_added') {
      setActiveTab('calendar');
    } else if (notif.type === 'exam_scheduled' || notif.type === 'seating_allocated') {
      setActiveTab('exam_seating');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={isMobileSidebarOpen}
        setMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main App Content Layout */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 pb-16 lg:pb-6">
        {/* Top Header */}
        <Header
          currentTabTitle={getTabTitle()}
          onOpenNotifications={() => setIsNotifOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Dashboard View according to Role Hierarchy */}
        <main className="flex-1">
          {currentUser.role === 'admin' && (
            <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {currentUser.role === 'faculty' && (
            <FacultyDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {currentUser.role === 'student' && (
            <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDrawer={() => setIsMobileSidebarOpen(true)}
      />

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={handleNotificationNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
}
