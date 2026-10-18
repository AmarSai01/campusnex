import React from 'react'
import {
  Bell,
  CheckCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Megaphone,
  Calendar,
  CalendarDays,
  Sparkles,
  X,
} from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export default function NotificationDrawer({ isOpen, onClose, onNavigate }) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } =
    useData()
  const { currentUser } = useAuth()

  if (!currentUser) return null

  const userNotifs = notifications
    .filter((n) => n.user_id === currentUser.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const unreadCount = userNotifs.filter((n) => !n.read).length

  const getIcon = (type) => {
    switch (type) {
      case 'ia_published':
      case 'result_published':
        return <Award className="h-4 w-4 text-purple-600" />
      case 'attendance_absent':
      case 'attendance_risk':
      case 'marks_risk':
        return <AlertTriangle className="h-4 w-4 text-rose-600" />
      case 'assignment_graded':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case 'assignment_due':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'assignment_submitted':
        return <FileText className="h-4 w-4 text-sky-600" />
      case 'new_announcement':
      case 'admin_broadcast':
        return <Megaphone className="h-4 w-4 text-brand-600" />
      case 'timetable_changed':
        return <Calendar className="h-4 w-4 text-indigo-600" />
      case 'calendar_event_added':
        return <CalendarDays className="h-4 w-4 text-teal-600" />
      default:
        return <Bell className="h-4 w-4 text-slate-600" />
    }
  }

  const getIconBg = (type) => {
    switch (type) {
      case 'ia_published':
      case 'result_published':
        return 'bg-purple-50 border-purple-100'
      case 'attendance_absent':
      case 'attendance_risk':
      case 'marks_risk':
        return 'bg-rose-50 border-rose-100'
      case 'assignment_graded':
        return 'bg-emerald-50 border-emerald-100'
      case 'assignment_due':
        return 'bg-amber-50 border-amber-100'
      case 'assignment_submitted':
        return 'bg-sky-50 border-sky-100'
      case 'new_announcement':
      case 'admin_broadcast':
        return 'bg-brand-50 border-brand-100'
      case 'timetable_changed':
        return 'bg-indigo-50 border-indigo-100'
      case 'calendar_event_added':
        return 'bg-teal-50 border-teal-100'
      default:
        return 'bg-slate-100 border-slate-200'
    }
  }

  const groupNotifications = () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }

    userNotifs.forEach((n) => {
      const nDate = n.created_at ? n.created_at.split('T')[0] : today
      if (nDate === today) {
        groups.Today.push(n)
      } else if (nDate === yesterday) {
        groups.Yesterday.push(n)
      } else {
        groups.Earlier.push(n)
      }
    })

    return groups
  }

  const grouped = groupNotifications()

  const handleItemClick = (notif) => {
    markNotificationAsRead(notif.id)
    if (onNavigate) {
      onNavigate(notif)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <SheetHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-2 text-brand-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-slate-900">
                  Notifications
                </SheetTitle>
                <SheetDescription className="text-xs font-medium text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread updates`
                    : 'All caught up!'}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllNotificationsAsRead(currentUser.id)}
                  className="h-auto gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-slate-400"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="space-y-6 p-4">
            {userNotifs.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">
                  No notifications yet
                </h4>
                <p className="mt-1 max-w-[200px] text-xs text-slate-400">
                  You&apos;ll receive alerts for IA marks, attendance, assignment
                  due dates, and announcements here.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([label, items]) => {
                if (items.length === 0) return null
                return (
                  <div key={label} className="space-y-2.5">
                    <h4 className="px-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      {label}
                    </h4>
                    <div className="space-y-2">
                      {items.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleItemClick(n)}
                          className={cn(
                            'flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                            n.read
                              ? 'border-slate-100 bg-white opacity-80 hover:border-slate-200'
                              : 'border-brand-100/80 bg-brand-50/30 shadow-xs hover:border-brand-200'
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 shrink-0 rounded-lg border p-2',
                              getIconBg(n.type)
                            )}
                          >
                            {getIcon(n.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-1">
                              <span className="truncate text-xs font-bold text-slate-900">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                              )}
                            </div>
                            <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                              {n.message}
                            </p>
                            <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
