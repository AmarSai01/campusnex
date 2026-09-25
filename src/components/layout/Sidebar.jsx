import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CalendarDays,
  Megaphone,
  CheckSquare,
  Award,
  FileText,
  Clock,
  Contact,
  BarChart3,
  Layers,
  GraduationCap,
  Sparkles,
  LogOut,
  ChevronRight,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen
}) {
  const { currentUser, logout } = useAuth();

  const role = currentUser?.role || 'student';

  const navConfigs = {
    admin: [
      { id: 'overview', label: 'Analytics & Insights', icon: LayoutDashboard },
      { id: 'students', label: 'Manage Students', icon: GraduationCap, badge: 'USN Roster' },
      { id: 'departments', label: 'Manage Departments', icon: Building2, badge: 'Programs' },
      { id: 'users', label: 'User Directory', icon: Users, badge: 'Staff & Roles' },
      { id: 'courses', label: 'Curriculum & Courses', icon: BookOpen },
      { id: 'timetable', label: 'Timetable Builder', icon: Clock, badge: 'Conflict Check' },
      { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers, badge: 'Rooms & Halls' },
      { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
      { id: 'announcements', label: 'Global Broadcasts', icon: Megaphone }
    ],
    faculty: [
      { id: 'overview', label: 'Teaching Overview', icon: LayoutDashboard },
      { id: 'students', label: 'Manage Students', icon: GraduationCap, badge: 'Dept Roster' },
      { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare, badge: 'Bulk' },
      { id: 'iamarks', label: 'IA Marks Entry', icon: Award, badge: 'Publish' },
      { id: 'assignments', label: 'Assignments & Grading', icon: FileText },
      { id: 'timetable', label: 'My Teaching Schedule', icon: Clock },
      { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers, badge: 'Dept Exams' },
      { id: 'announcements', label: 'Class Announcements', icon: Megaphone }
    ],
    student: [
      { id: 'overview', label: 'Student Hub', icon: LayoutDashboard },
      { id: 'attendance', label: 'My Attendance', icon: CheckSquare },
      { id: 'iamarks', label: 'IA Marks & Trends', icon: Award },
      { id: 'assignments', label: 'Assignments & Submissions', icon: FileText },
      { id: 'timetable', label: 'Class Timetable', icon: Clock },
      { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers, badge: 'Hall Ticket' },
      { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
      { id: 'directory', label: 'Faculty Directory', icon: Contact },
      { id: 'announcements', label: 'Campus Bulletins', icon: Megaphone }
    ]
  };

  const navItems = navConfigs[role] || navConfigs.student;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Campusnex
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                PRO
              </span>
            </span>
            <p className="text-[10px] font-semibold text-slate-400 capitalize">
              {role} Workspace
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`}
                alt={currentUser?.name || 'Avatar'}
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
              />
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Academic User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
