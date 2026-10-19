import React, { lazy, Suspense, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider, useData } from './context/DataContext'
import SmoothScroll from './lib/smooth-scroll'
import LandingPage from './views/landing/LandingPage'

// Dev-only preview of the results screens with sample data: http://localhost:5173/?preview=results
const SHOW_RESULTS_PREVIEW =
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'results'

// Everything behind sign-in is downloaded only when it is needed, so the landing page stays light.
const ResultsPreview = lazy(() => import('./views/preview/ResultsPreview'))
const LoginView = lazy(() => import('./views/auth/LoginView'))
const ResetPasswordView = lazy(() => import('./views/auth/ResetPasswordView'))
const AdminDashboard = lazy(() => import('./views/admin/AdminDashboard'))
const FacultyDashboard = lazy(() => import('./views/faculty/FacultyDashboard'))
const StudentDashboard = lazy(() => import('./views/student/StudentDashboard'))
const Header = lazy(() => import('./components/layout/Header'))
const Sidebar = lazy(() => import('./components/layout/Sidebar'))
const MobileNav = lazy(() => import('./components/layout/MobileNav'))
const NotificationDrawer = lazy(() => import('./components/notifications/NotificationDrawer'))

// A visitor with no saved session (and not arriving from an email link) cannot be signed in,
// so the landing page can show at once instead of waiting for the sign-in check.
const MAY_HAVE_SESSION = (() => {
  try {
    if (/access_token|type=recovery|code=/.test(window.location.hash + window.location.search)) return true
    return Object.keys(window.localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
  } catch {
    return true
  }
})()

const Spinner = () => (
  <div className="bg-background">
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  </div>
)

function AppContent() {
  const { currentUser, isAuthenticated, authLoading, isHod, passwordRecovery } = useAuth()
  const { syncError, clearSyncError } = useData()
  const [authScreen, setAuthScreen] = useState('landing')
  const [activeTab, setActiveTab] = useState('overview')
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const landing = (
    <SmoothScroll>
      <LandingPage onSignIn={() => setAuthScreen('login')} />
    </SmoothScroll>
  )

  if (authLoading) {
    return MAY_HAVE_SESSION || authScreen !== 'landing' ? <Spinner /> : landing
  }

  if (SHOW_RESULTS_PREVIEW) return <ResultsPreview />

  if (passwordRecovery) {
    return <ResetPasswordView />
  }

  if (!isAuthenticated || !currentUser) {
    if (authScreen === 'login') {
      return <LoginView onBack={() => setAuthScreen('landing')} />
    }
    return landing
  }

  const getTabTitle = () => {
    const titles = {
      overview:
        currentUser.role === 'admin'
          ? 'Institution Analytics'
          : currentUser.role === 'faculty'
            ? 'Instructor Workspace'
            : 'Student Hub',
      students: 'Student Roster & USN Directory',
      departments: 'Academic Departments Directory',
      users: 'Institutional User Directory',
      courses: 'Department Courses & Faculty Allocation',
      timetable: 'Academic Timetable & Schedule',
      exam_seating: 'Exam Timetable & Seating Arrangement',
      calendar: 'Institutional Calendar & Events',
      semester_calendar: 'Semester Calendar',
      announcements: 'Campus Broadcasts & Circulars',
      attendance: 'Attendance Management',
      iamarks: 'Internal Assessment (IA) Marks',
      assignments: 'Coursework & Assignments',
      directory: 'Faculty Advisory Directory',
      hod_overview: 'Department Overview',
      results: currentUser.role === 'admin' ? 'Semester Results' : 'Results: SGPA and CGPA',
      hod_compliance: 'Faculty Compliance',
    }
    return titles[activeTab] || 'Workspace'
  }

  const handleNotificationNavigate = (notif) => {
    setIsNotifOpen(false)
    if (notif.type === 'result_published') {
      setActiveTab('results')
    } else if (notif.type === 'attendance_risk' || notif.type === 'marks_risk') {
      if (isHod) setActiveTab('hod_overview')
      else setActiveTab(notif.type === 'attendance_risk' ? 'attendance' : 'iamarks')
    } else if (notif.type === 'attendance_absent') {
      setActiveTab('attendance')
    } else if (notif.type === 'ia_published') {
      setActiveTab('iamarks')
    } else if (
      notif.type === 'assignment_due' ||
      notif.type === 'assignment_graded' ||
      notif.type === 'assignment_created' ||
      notif.type === 'assignment_submitted'
    ) {
      setActiveTab('assignments')
    } else if (
      notif.type === 'new_announcement' ||
      notif.type === 'admin_broadcast'
    ) {
      setActiveTab('announcements')
    } else if (notif.type === 'timetable_changed') {
      setActiveTab('timetable')
    } else if (notif.type === 'calendar_event_added') {
      setActiveTab('calendar')
    } else if (notif.type === 'semester_calendar_published') {
      setActiveTab('semester_calendar')
    } else if (
      notif.type === 'exam_scheduled' ||
      notif.type === 'seating_allocated'
    ) {
      setActiveTab('exam_seating')
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={isMobileSidebarOpen}
        setMobileOpen={setIsMobileSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-6 lg:pl-64">
        <Header
          currentTabTitle={getTabTitle()}
          onOpenNotifications={() => setIsNotifOpen(true)}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen(!isMobileSidebarOpen)
          }
        />

        <main className="flex-1">
          {syncError && (
            <div
              role="alert"
              className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-6"
            >
              <span>
                <strong>Changes not saved:</strong> {syncError} Your view has been
                reloaded from the server.
              </span>
              <button
                type="button"
                onClick={clearSyncError}
                className="shrink-0 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
          {currentUser.role === 'admin' && (
            <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {currentUser.role === 'faculty' && (
            <FacultyDashboard
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
          {currentUser.role === 'student' && (
            <StudentDashboard
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>

      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDrawer={() => setIsMobileSidebarOpen(true)}
      />

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={handleNotificationNavigate}
      />
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <Suspense fallback={<Spinner />}>
          <AppContent />
        </Suspense>
      </AuthProvider>
    </DataProvider>
  )
}
