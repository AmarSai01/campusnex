import React, { useState } from 'react';
import {
  Bell,
  Search,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  RotateCcw,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';

export default function Header({
  onOpenNotifications,
  onToggleMobileSidebar,
  currentTabTitle = 'Dashboard'
}) {
  const { currentUser, logout, switchUser, switchRole } = useAuth();
  const { notifications, users, resetToSeedData } = useData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const userNotifs = currentUser
    ? notifications.filter(n => n.user_id === currentUser.id)
    : [];
  const unreadCount = userNotifs.filter(n => !n.read).length;

  const roleBadges = {
    admin: { label: 'Administrator', variant: 'purple', icon: ShieldAlert },
    faculty: { label: 'Faculty', variant: 'primary', icon: Briefcase },
    student: { label: 'Student', variant: 'success', icon: GraduationCap }
  };

  const currentRoleInfo = currentUser ? roleBadges[currentUser.role] : null;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left section: Mobile menu button & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span>Campusnex</span>
            <span>/</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {currentTabTitle}
          </h1>
        </div>
      </div>

      {/* Right section: Quick role switcher, Notification Bell, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100/90 text-slate-700 hover:bg-slate-200/70 border border-slate-200 transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden md:inline">Demo Switcher:</span>
            <span className="capitalize text-brand-700 font-extrabold">{currentUser?.role || 'Guest'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-slide-up">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Account
                  </p>
                  <p className="text-xs text-slate-500">Instant login without credentials</p>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => { switchUser('admin_1'); setShowRoleMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">Dr. Sarah Connor</div>
                      <div className="text-[10px] text-slate-400">Admin (Dean / Registrar)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { switchUser('faculty_1'); setShowRoleMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-brand-50 text-slate-700 hover:text-brand-700 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">Dr. Alan Turing</div>
                      <div className="text-[10px] text-slate-400">Faculty (CS301 & CS302)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { switchUser('faculty_2'); setShowRoleMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-brand-50 text-slate-700 hover:text-brand-700 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-brand-100 text-brand-700">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">Dr. Ada Lovelace</div>
                      <div className="text-[10px] text-slate-400">Faculty (CS303 DBMS)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { switchUser('student_1'); setShowRoleMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">Alice Smith</div>
                      <div className="text-[10px] text-slate-400">Student (Section A)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { switchUser('student_2'); setShowRoleMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold">Bob Johnson</div>
                      <div className="text-[10px] text-slate-400">Student (Section A)</div>
                    </div>
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (window.confirm('Reset all marks, attendance, and records to original seed data?')) {
                        resetToSeedData();
                        setShowRoleMenu(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset All Demo Data
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-white animate-pulse-subtle">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200"
          >
            <img
              src={currentUser?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`}
              alt={currentUser?.name || 'Avatar'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/20"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-[10px] font-medium text-slate-500 capitalize">
                {currentUser?.role || 'Guest'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-slide-up">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                  {currentUser?.designation && (
                    <p className="text-[10px] font-medium text-brand-600 mt-1">{currentUser.designation}</p>
                  )}
                  {currentUser?.roll_no && (
                    <p className="text-[10px] font-medium text-slate-400">Roll: {currentUser.roll_no} (Sec {currentUser.section})</p>
                  )}
                </div>

                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
