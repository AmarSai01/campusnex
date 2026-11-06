import React, { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  Briefcase,
  CalendarRange,
  CalendarCog,
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
  TrendingUp,
  UserRound,
  LifeBuoy,
  MessageSquareHeart,
  History,
  FileSpreadsheet,
  Search,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { nowHHMM, todayISO, unmarkedClasses } from '../../utils/classSessions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Each role's menu, split into labelled groups.
function menuFor(role, { pendingBadge }) {
  const menus = {
    admin: [
      { label: 'Overview', items: [{ id: 'overview', label: 'Analytics & Insights', icon: LayoutDashboard }] },
      {
        label: 'People',
        items: [
          { id: 'students', label: 'Manage Students', icon: GraduationCap },
          { id: 'faculty', label: 'Manage Faculty', icon: Briefcase },
          { id: 'departments', label: 'Manage Departments', icon: Building2 },
          { id: 'users', label: 'User Directory', icon: Users },
        ],
      },
      {
        label: 'Academics',
        items: [
          { id: 'courses', label: 'Curriculum & Courses', icon: BookOpen },
          { id: 'timetable', label: 'Timetable Builder', icon: Clock },
          { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
          { id: 'results', label: 'Semester Results', icon: Trophy },
        ],
      },
      {
        label: 'Calendars',
        items: [
          { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
          { id: 'semester_calendar', label: 'Semester Calendar', icon: CalendarRange },
        ],
      },
      {
        label: 'Communication',
        items: [
          { id: 'announcements', label: 'Global Broadcasts', icon: Megaphone },
          { id: 'requests', label: 'Student Requests', icon: LifeBuoy },
          { id: 'feedback_results', label: 'Course Feedback', icon: MessageSquareHeart },
        ],
      },
      { label: 'System', items: [{ id: 'activity', label: 'Activity Log', icon: History }] },
    ],
    faculty: [
      { label: 'Overview', items: [{ id: 'overview', label: 'Teaching Overview', icon: LayoutDashboard }] },
      {
        label: 'Teaching',
        items: [
          { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare, badge: pendingBadge, alert: !!pendingBadge },
          { id: 'iamarks', label: 'IA Marks Entry', icon: Award },
          { id: 'assignments', label: 'Assignments & Grading', icon: FileText },
          { id: 'class_sheets', label: 'Class Sheets', icon: FileSpreadsheet },
        ],
      },
      {
        label: 'Analytics',
        items: [
          { id: 'student_analytics', label: 'Student Analytics', icon: UserRoundSearch },
          { id: 'class_analytics', label: 'Class Analytics', icon: ChartColumn },
        ],
      },
      {
        label: 'Schedule',
        items: [
          { id: 'timetable', label: 'My Teaching Schedule', icon: Clock },
          { id: 'timetable_edit', label: 'Edit Class Timetables', icon: CalendarCog },
          { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
          { id: 'semester_calendar', label: 'Semester Calendar', icon: CalendarRange },
        ],
      },
      {
        label: 'Communication',
        items: [
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'requests', label: 'Student Requests', icon: LifeBuoy },
          { id: 'feedback_results', label: 'Course Feedback', icon: MessageSquareHeart },
        ],
      },
    ],
    student: [
      { label: 'Overview', items: [{ id: 'overview', label: 'Student Hub', icon: LayoutDashboard }] },
      {
        label: 'Academics',
        items: [
          { id: 'attendance', label: 'My Attendance', icon: CheckSquare },
          { id: 'iamarks', label: 'IA Marks & Trends', icon: Award },
          { id: 'performance', label: 'My Performance', icon: TrendingUp },
          { id: 'assignments', label: 'Assignments & Submissions', icon: FileText },
          { id: 'results', label: 'Results', icon: Trophy },
        ],
      },
      {
        label: 'Schedule',
        items: [
          { id: 'timetable', label: 'Class Timetable', icon: Clock },
          { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
          { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
          { id: 'semester_calendar', label: 'Semester Calendar', icon: CalendarRange },
        ],
      },
      {
        label: 'Campus',
        items: [
          { id: 'directory', label: 'Faculty Directory', icon: Contact },
          { id: 'announcements', label: 'Campus Bulletins', icon: Megaphone },
          { id: 'feedback', label: 'Course Feedback', icon: MessageSquareHeart },
          { id: 'requests', label: 'Requests & Grievances', icon: LifeBuoy },
        ],
      },
      { label: 'Account', items: [{ id: 'profile', label: 'My Profile', icon: UserRound }] },
    ],
    hod: [
      {
        label: 'Department',
        items: [
          { id: 'hod_overview', label: 'Department Overview', icon: ShieldCheck },
          { id: 'students', label: 'Manage Students', icon: GraduationCap },
          { id: 'hod_student_analytics', label: 'Student Analytics', icon: UserRoundSearch },
          { id: 'hod_class_analytics', label: 'Class Analytics', icon: ChartColumn },
          { id: 'hod_compliance', label: 'Faculty Compliance', icon: ClipboardCheck },
        ],
      },
    ],
  }
  return menus[role] || menus.student
}

function NavButton({ item, active, collapsed, onClick }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? `${item.label}${item.badge ? `, ${item.badge}` : ''}` : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-brand-500/50',
        active ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-brand-500/[0.07] hover:text-slate-900',
        collapsed && 'lg:justify-center lg:px-0',
      )}
    >
      <Icon
        className={cn(
          'size-[18px] shrink-0 transition-transform motion-safe:group-hover:scale-110',
          !active && 'text-slate-400 group-hover:text-brand-600',
        )}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
      {item.badge && (
        <span
          className={cn(
            'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            active ? 'bg-white/25 text-white' : item.alert ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500',
            collapsed && 'lg:hidden',
          )}
        >
          {item.badge}
        </span>
      )}
      {item.alert && collapsed && <span className="absolute right-2 top-2 hidden size-1.5 rounded-full bg-brand-500 lg:block" />}
    </button>
  )
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  hodView,
  onSwitchView,
  mobileOpen,
  setMobileOpen,
  collapsed = false,
}) {
  const { currentUser, logout, isHod, hodDepartments } = useAuth()
  const data = useData()
  const [query, setQuery] = useState('')

  // Classes from the last 7 days a teacher still has to mark.
  const pending =
    currentUser?.role === 'faculty'
      ? unmarkedClasses(currentUser.id, data, { date: todayISO(), time: nowHHMM() }).length
      : 0
  const pendingBadge = pending ? `${pending} pending` : undefined
  const role = currentUser?.role || 'student'

  // An HOD sees either the department tools or their teaching tools, never both.
  const groups = menuFor(hodView ? 'hod' : role, { pendingBadge })
  const q = query.trim().toLowerCase()
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !q || i.label.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length)

  const workspaceLabel = hodView
    ? `HOD · ${hodDepartments.map((d) => d.code).join(', ')}`
    : `${role} workspace`

  const closeMobile = () => setMobileOpen?.(false)
  const handleSwitchView = (toHodPanel) => {
    onSwitchView(toHodPanel)
    setQuery('')
    closeMobile()
  }
  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    setQuery('')
    closeMobile()
  }

  // On phones the drawer is always full width; "collapsed" only applies from lg up.
  const hideWhenCollapsed = collapsed && 'lg:hidden'
  const avatarUrl =
    currentUser?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={closeMobile} />}

      <aside
        aria-label="Main menu"
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white',
          'transition-[transform,width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none lg:translate-x-0',
          collapsed && 'lg:w-[76px]',
          mobileOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className={cn('border-b border-slate-100 px-5 py-4', collapsed && 'lg:px-3')}>
          <div className={cn('flex items-center justify-between gap-2', collapsed && 'lg:justify-center')}>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                <GraduationCap className="size-5" />
              </span>
              <div className={cn('min-w-0 leading-tight', hideWhenCollapsed)}>
                <p className="text-sm font-bold text-slate-900">Campusnex</p>
                <p className="truncate text-[11px] capitalize text-slate-500">{workspaceLabel}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMobile}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X className="size-4" />
            </button>
          </div>

          <label className={cn('relative mt-4 block', hideWhenCollapsed)}>
            <span className="sr-only">Search menu</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs outline-none transition-colors hover:bg-white focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
        </div>

        {/* HOD workspace switch */}
        {isHod && (
          <div className={cn('border-b border-slate-100 px-3 py-3', collapsed && 'lg:px-2')}>
            <div
              role="group"
              aria-label="Switch workspace"
              className={cn('grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1', collapsed && 'lg:grid-cols-1')}
            >
              {[
                { toHodPanel: true, label: 'HOD Panel', icon: ShieldCheck },
                { toHodPanel: false, label: 'Teaching', icon: BookOpen },
              ].map(({ toHodPanel, label, icon: Icon }) => {
                const isActive = hodView === toHodPanel
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={isActive}
                    title={collapsed ? label : undefined}
                    onClick={() => !isActive && handleSwitchView(toHodPanel)}
                    className={cn(
                      'flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors',
                      isActive ? 'bg-white font-bold text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className={cn(hideWhenCollapsed)}>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className={cn('flex-1 overflow-y-auto overscroll-contain px-3 py-3', collapsed && 'lg:px-2')}>
          {shown.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-slate-400">No menu item matches “{query}”.</p>
          )}
          {shown.map((g, gi) => (
            <div key={g.label} className={cn(gi > 0 && 'mt-4')}>
              <p
                className={cn(
                  'mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400',
                  hideWhenCollapsed,
                )}
              >
                {g.label}
              </p>
              {collapsed && gi > 0 && <div className="mx-2 mb-3 hidden h-px bg-slate-100 lg:block" />}
              <ul className="space-y-1">
                {g.items.map((item) => (
                  <li key={item.id}>
                    <NavButton
                      item={item}
                      collapsed={collapsed}
                      active={activeTab === item.id}
                      onClick={() => handleTabClick(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Signed-in user */}
        <div className={cn('flex items-center gap-3 border-t border-slate-100 p-3', collapsed && 'lg:flex-col lg:gap-2')}>
          <Avatar className="size-9 shrink-0" title={collapsed ? currentUser?.name : undefined}>
            <AvatarImage src={avatarUrl} alt="" />
            <AvatarFallback>{(currentUser?.name || 'U').slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className={cn('min-w-0 flex-1', hideWhenCollapsed)}>
            <p className="truncate text-sm font-semibold text-slate-900">{currentUser?.name || 'Academic User'}</p>
            <p className="truncate text-[11px] text-slate-500">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>
    </>
  )
}
