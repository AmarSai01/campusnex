import React from 'react'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  CalendarRange,
  Megaphone,
  CheckSquare,
  Award,
  FileText,
  Clock,
  Contact,
  Layers,
  GraduationCap,
  LogOut,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  Trophy,
  UserRoundSearch,
  ChartColumn,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export default function Sidebar({
  activeTab,
  setActiveTab,
  hodView,
  onSwitchView,
  mobileOpen,
  setMobileOpen,
}) {
  const { currentUser, logout, isHod, hodDepartments } = useAuth()
  const role = currentUser?.role || 'student'

  const navConfigs = {
    admin: [
      { id: 'overview', label: 'Analytics & Insights', icon: LayoutDashboard },
      { id: 'students', label: 'Manage Students', icon: GraduationCap, badge: 'USN' },
      { id: 'departments', label: 'Manage Departments', icon: Building2, badge: 'Programs' },
      { id: 'users', label: 'User Directory', icon: Users, badge: 'Staff' },
      { id: 'courses', label: 'Curriculum & Courses', icon: BookOpen },
      { id: 'timetable', label: 'Timetable Builder', icon: Clock, badge: 'Conflicts' },
      { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers, badge: 'Halls' },
      { id: 'results', label: 'Semester Results', icon: Trophy, badge: 'Publish' },
      { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
      { id: 'semester_calendar', label: 'Semester Calendar', icon: CalendarRange, badge: 'COE' },
      { id: 'announcements', label: 'Global Broadcasts', icon: Megaphone },
    ],
    faculty: [
      { id: 'overview', label: 'Teaching Overview', icon: LayoutDashboard },
      { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare, badge: 'Bulk' },
      { id: 'iamarks', label: 'IA Marks Entry', icon: Award, badge: 'Publish' },
      { id: 'student_analytics', label: 'Student Analytics', icon: UserRoundSearch },
      { id: 'class_analytics', label: 'Class Analytics', icon: ChartColumn },
      { id: 'assignments', label: 'Assignments & Grading', icon: FileText },
      { id: 'timetable', label: 'My Teaching Schedule', icon: Clock },
      { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
      { id: 'semester_calendar', label: 'Semester Calendar', icon: CalendarRange, badge: 'COE' },
      { id: 'announcements', label: 'Class Announcements', icon: Megaphone },
    ],
    student: [
      { id: 'overview', label: 'Student Hub', icon: LayoutDashboard },
      { id: 'attendance', label: 'My Attendance', icon: CheckSquare },
      { id: 'iamarks', label: 'IA Marks & Trends', icon: Award },
      { id: 'results', label: 'Results', icon: Trophy, badge: 'SGPA' },
      { id: 'assignments', label: 'Assignments & Submissions', icon: FileText },
      { id: 'timetable', label: 'Class Timetable', icon: Clock },
      { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
      { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
      { id: 'semester_calendar', label: 'Semester Calendar', icon: CalendarRange, badge: 'COE' },
      { id: 'directory', label: 'Faculty Directory', icon: Contact },
      { id: 'announcements', label: 'Campus Bulletins', icon: Megaphone },
    ],
  }

  const hodItems = isHod
    ? [
        { id: 'hod_overview', label: 'Department Overview', icon: ShieldCheck, badge: 'HOD' },
        { id: 'students', label: 'Manage Students', icon: GraduationCap, badge: 'HOD' },
        { id: 'hod_student_analytics', label: 'Student Analytics', icon: UserRoundSearch, badge: 'HOD' },
        { id: 'hod_class_analytics', label: 'Class Analytics', icon: ChartColumn, badge: 'HOD' },
        { id: 'hod_compliance', label: 'Faculty Compliance', icon: ClipboardCheck, badge: 'HOD' },
      ]
    : []
  // An HOD sees either the department tools or their teaching tools, never both.
  const navItems = hodView ? hodItems : navConfigs[role] || navConfigs.student
  const workspaceLabel = hodView
    ? `HOD · ${hodDepartments.map((d) => d.code).join(', ')}`
    : `${role} Workspace`

  const handleSwitchView = (toHodPanel) => {
    onSwitchView(toHodPanel)
    if (setMobileOpen) setMobileOpen(false)
  }

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    if (setMobileOpen) setMobileOpen(false)
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-glow">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-foreground">
              Campusnex
              <span className="rounded-md border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                PRO
              </span>
            </span>
            <p className="text-[10px] font-semibold text-muted-foreground capitalize">
              {workspaceLabel}
            </p>
          </div>
        </div>

        {isHod && (
          <div className="border-b border-sidebar-border px-3 py-3">
            <div
              role="group"
              aria-label="Switch workspace"
              className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
            >
              {[
                { toHodPanel: true, label: 'HOD Panel', icon: ShieldCheck },
                { toHodPanel: false, label: 'Teaching', icon: BookOpen },
              ].map(({ toHodPanel, label, icon: Icon }) => {
                const isActive = hodView === toHodPanel
                return (
                  <Button
                    key={label}
                    variant="ghost"
                    aria-pressed={isActive}
                    onClick={() => !isActive && handleSwitchView(toHodPanel)}
                    className={cn(
                      'h-8 gap-1.5 rounded-lg px-2 text-xs font-semibold',
                      isActive
                        ? 'bg-background font-bold text-foreground shadow-sm hover:bg-background'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Navigation Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleTabClick(item.id)}
                  className={cn(
                    'group h-auto w-full justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold',
                    isActive
                      ? 'bg-brand-500 font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-500 hover:text-white'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? 'text-white' : 'text-muted-foreground'
                      )}
                    />
                    <span className="text-left">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="ring-1 ring-border">
                <AvatarImage
                  src={
                    currentUser?.photo_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`
                  }
                  alt={currentUser?.name || 'Avatar'}
                />
                <AvatarFallback>
                  {(currentUser?.name || 'U').slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="truncate">
                <p className="truncate text-xs font-bold text-foreground">
                  {currentUser?.name || 'Academic User'}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={logout}
              title="Sign Out"
              className="text-muted-foreground hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
