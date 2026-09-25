import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Megaphone,
  Calendar,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

export default function NotificationDrawer({ isOpen, onClose, onNavigate }) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const { currentUser } = useAuth();

  if (!isOpen || !currentUser) return null;

  // Filter notifications for current user
  const userNotifs = notifications
    .filter(n => n.user_id === currentUser.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const unreadCount = userNotifs.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'ia_published':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'attendance_absent':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'assignment_graded':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'assignment_due':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'assignment_submitted':
        return <FileText className="w-4 h-4 text-sky-600" />;
      case 'new_announcement':
      case 'admin_broadcast':
        return <Megaphone className="w-4 h-4 text-brand-600" />;
      case 'timetable_changed':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'calendar_event_added':
        return <CalendarDays className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'ia_published': return 'bg-purple-50 border-purple-100';
      case 'attendance_absent': return 'bg-rose-50 border-rose-100';
      case 'assignment_graded': return 'bg-emerald-50 border-emerald-100';
      case 'assignment_due': return 'bg-amber-50 border-amber-100';
      case 'assignment_submitted': return 'bg-sky-50 border-sky-100';
      case 'new_announcement':
      case 'admin_broadcast': return 'bg-brand-50 border-brand-100';
      case 'timetable_changed': return 'bg-indigo-50 border-indigo-100';
      case 'calendar_event_added': return 'bg-teal-50 border-teal-100';
      default: return 'bg-slate-100 border-slate-200';
    }
  };

  // Group notifications by date
  const groupNotifications = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    userNotifs.forEach(n => {
      const nDate = n.created_at ? n.created_at.split('T')[0] : today;
      if (nDate === today) {
        groups.Today.push(n);
      } else if (nDate === yesterday) {
        groups.Yesterday.push(n);
      } else {
        groups.Earlier.push(n);
      }
    });

    return groups;
  };

  const grouped = groupNotifications();

  const handleItemClick = (notif) => {
    markNotificationAsRead(notif.id);
    if (onNavigate) {
      onNavigate(notif);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform animate-slide-up">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Notifications</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsAsRead(currentUser.id)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {userNotifs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">No notifications yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  You'll receive alerts for IA marks, attendance, assignment due dates, and announcements here.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([label, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={label} className="space-y-2.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      {label}
                    </h4>
                    <div className="space-y-2">
                      {items.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleItemClick(n)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                            n.read
                              ? 'bg-white border-slate-100 hover:border-slate-200 opacity-80'
                              : 'bg-brand-50/30 border-brand-100/80 shadow-xs hover:border-brand-200'
                          }`}
                        >
                          <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${getIconBg(n.type)}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] font-medium text-slate-400 mt-1.5 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
