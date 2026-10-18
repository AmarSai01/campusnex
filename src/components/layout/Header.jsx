import React from 'react'
import {
  Bell,
  LogOut,
  Sparkles,
  ChevronDown,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  RotateCcw,
  Menu,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import Badge from '../common/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Header({
  onOpenNotifications,
  onToggleMobileSidebar,
  currentTabTitle = 'Dashboard',
}) {
  const { currentUser, logout, switchUser, isDemo } = useAuth()
  const { notifications, refreshData } = useData()

  const userNotifs = currentUser
    ? notifications.filter((n) => n.user_id === currentUser.id)
    : []
  const unreadCount = userNotifs.filter((n) => !n.read).length

  const roleBadges = {
    admin: { label: 'Administrator', variant: 'purple', icon: ShieldAlert },
    faculty: { label: 'Faculty', variant: 'primary', icon: Briefcase },
    student: { label: 'Student', variant: 'success', icon: GraduationCap },
  }

  const currentRoleInfo = currentUser ? roleBadges[currentUser.role] : null
  const avatarUrl =
    currentUser?.photo_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md transition-all sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobileSidebar}
          className="rounded-xl text-slate-500 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 text-xs font-semibold text-slate-400 sm:flex">
            <span>Campusnex</span>
            <span>/</span>
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {currentTabTitle}
          </h1>
          {currentRoleInfo && (
            <Badge variant={currentRoleInfo.variant} size="sm" className="hidden md:inline-flex">
              {currentRoleInfo.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isDemo && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-auto gap-1.5 rounded-xl border border-border bg-muted/80 px-2.5 py-1.5 text-xs font-bold text-foreground sm:px-3"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <span className="hidden md:inline">Demo Switcher:</span>
              <span className="font-extrabold text-brand-700 capitalize">
                {currentUser?.role || 'Guest'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Switch Test Account
              </p>
              <p className="text-xs font-normal text-slate-500">
                Signs in to a seeded demo account
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => switchUser('admin_1')}
              className="gap-2.5 rounded-xl px-3 py-2"
            >
              <div className="rounded-lg bg-purple-100 p-1.5 text-purple-700">
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-bold">Dr. Sarah Connor</div>
                <div className="text-[10px] text-slate-400">Admin (Dean / Registrar)</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => switchUser('faculty_1')}
              className="gap-2.5 rounded-xl px-3 py-2"
            >
              <div className="rounded-lg bg-brand-100 p-1.5 text-brand-700">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-bold">Dr. Alan Turing</div>
                <div className="text-[10px] text-slate-400">Faculty (CS301 & CS302)</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => switchUser('faculty_2')}
              className="gap-2.5 rounded-xl px-3 py-2"
            >
              <div className="rounded-lg bg-brand-100 p-1.5 text-brand-700">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-bold">Dr. Ada Lovelace</div>
                <div className="text-[10px] text-slate-400">Faculty (CS303 DBMS)</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => switchUser('student_1')}
              className="gap-2.5 rounded-xl px-3 py-2"
            >
              <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-bold">Alice Smith</div>
                <div className="text-[10px] text-slate-400">Student (Section A)</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => switchUser('student_2')}
              className="gap-2.5 rounded-xl px-3 py-2"
            >
              <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="font-bold">Bob Johnson</div>
                <div className="text-[10px] text-slate-400">Student (Section A)</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => refreshData()}
              className="justify-center gap-1.5 rounded-lg"
            >
              <RotateCcw className="h-3 w-3" />
              Refresh Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenNotifications}
          className="relative rounded-xl text-slate-600"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 animate-pulse-subtle items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto gap-2.5 rounded-2xl border border-transparent py-1.5 pr-3 pl-2 hover:border-slate-200 hover:bg-slate-100/80"
            >
              <Avatar className="ring-2 ring-brand-500/20">
                <AvatarImage src={avatarUrl} alt={currentUser?.name || 'Avatar'} />
                <AvatarFallback>
                  {(currentUser?.name || 'U').slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-left sm:flex">
                <span className="text-xs leading-tight font-bold text-slate-900">
                  {currentUser?.name || 'User'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 capitalize">
                  {currentUser?.role || 'Guest'}
                </span>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
              <p className="truncate text-[11px] font-normal text-slate-500">
                {currentUser?.email}
              </p>
              {currentUser?.designation && (
                <p className="mt-1 text-[10px] font-medium text-brand-600">
                  {currentUser.designation}
                </p>
              )}
              {currentUser?.roll_no && (
                <p className="text-[10px] font-medium text-slate-400">
                  Roll: {currentUser.roll_no} (Sec {currentUser.section})
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={logout}
              className="gap-2 rounded-xl px-3 py-2 font-bold"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
