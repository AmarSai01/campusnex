import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  Search,
  PanelLeft,
  Bell,
  ChevronDown,
  RotateCcw,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Building2,
  Users,
  BookOpen,
  Clock,
  Layers,
  Trophy,
  CalendarDays,
  CalendarRange,
  Megaphone,
  LifeBuoy,
  MessageSquareHeart,
  History,
  Settings2,
  ArrowRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Demo of the grouped sidebar style for the admin workspace: open /?sidebar-demo
const groups = [
  {
    label: 'Overview',
    items: [{ id: 'overview', label: 'Analytics & Insights', icon: LayoutDashboard }],
  },
  {
    label: 'People',
    items: [
      { id: 'students', label: 'Students', icon: GraduationCap },
      { id: 'faculty', label: 'Faculty', icon: Briefcase },
      { id: 'departments', label: 'Departments', icon: Building2 },
      { id: 'users', label: 'User Directory', icon: Users },
    ],
  },
  {
    label: 'Academics',
    items: [
      { id: 'courses', label: 'Curriculum & Courses', icon: BookOpen },
      { id: 'timetable', label: 'Timetable Builder', icon: Clock },
      { id: 'exam_seating', label: 'Exams & Seating', icon: Layers },
      { id: 'results', label: 'Semester Results', icon: Trophy },
      { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
      { id: 'semester_calendar', label: 'Semester Calendar', icon: CalendarRange },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'announcements', label: 'Broadcasts', icon: Megaphone },
      { id: 'requests', label: 'Student Requests', icon: LifeBuoy },
      { id: 'feedback', label: 'Course Feedback', icon: MessageSquareHeart },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'activity', label: 'Activity Log', icon: History }],
  },
]

const allItems = groups.flatMap((g) => g.items)

function NavButton({ item, active, collapsed, onClick }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-primary/50',
        active ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-primary/[0.07] hover:text-slate-900',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon
        className={cn('size-[18px] shrink-0 transition-transform motion-safe:group-hover:scale-110', !active && 'text-slate-400 group-hover:text-primary')}
        strokeWidth={active ? 2.2 : 1.8}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {item.badge && !collapsed && (
        <span
          className={cn(
            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            active ? 'bg-white/25 text-white' : item.alert ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500',
          )}
        >
          {item.badge}
        </span>
      )}
      {item.alert && collapsed && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />}
    </button>
  )
}

function SidebarBody({ collapsed, active, setActive, query, setQuery, onNavigate }) {
  const q = query.trim().toLowerCase()
  const shown = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, items: g.items.filter((i) => !q || i.label.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length),
    [q],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn('border-b border-slate-100 py-4', collapsed ? 'px-3' : 'px-5')}>
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            {!collapsed && (
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900">Campusnex</p>
                <p className="text-[11px] text-slate-500">Admin workspace</p>
              </div>
            )}
          </div>
        </div>
        {!collapsed && (
          <label className="relative mt-4 block">
            <span className="sr-only">Search menu</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs outline-none transition-colors hover:bg-white focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20"
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
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Admin" className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        {shown.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-400">No menu item matches “{query}”.</p>}
        {shown.map((g, gi) => (
          <div key={g.label} className={cn(gi > 0 && 'mt-4')}>
            {collapsed ? (
              gi > 0 && <div className="mx-2 mb-3 h-px bg-slate-100" />
            ) : (
              <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{g.label}</p>
            )}
            <ul className="space-y-1">
              {g.items.map((item) => (
                <li key={item.id}>
                  <NavButton
                    item={item}
                    collapsed={collapsed}
                    active={active === item.id}
                    onClick={() => {
                      setActive(item.id)
                      onNavigate?.()
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Highlight card */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3.5">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              <p className="text-xs font-bold text-slate-900">Semester 6 results</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Partly published. 42 students are still waiting.</p>
            <button
              type="button"
              onClick={() => setActive('results')}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              Review and publish <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* User */}
      <div className={cn('border-t border-slate-100 p-3', collapsed && 'flex justify-center')}>
        <button
          type="button"
          title={collapsed ? 'Meera Kulkarni' : undefined}
          className={cn('flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-50', collapsed && 'w-auto justify-center')}
        >
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=faces"
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
          />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">Meera Kulkarni</span>
                <span className="block truncate text-[11px] text-slate-500">meera.tt@campusnex.test</span>
              </span>
              <Settings2 className="size-4 shrink-0 text-slate-400" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default function SidebarDemo() {
  const reduce = useReducedMotion()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState('overview')
  const [query, setQuery] = useState('')
  const current = allItems.find((i) => i.id === active)
  const body = { active, setActive, query, setQuery }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 288 }}
        transition={{ duration: reduce ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="hidden shrink-0 overflow-hidden border-r border-slate-200 bg-white md:block"
      >
        <SidebarBody collapsed={collapsed} {...body} />
      </motion.aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <motion.aside
            initial={{ x: reduce ? 0 : -288 }}
            animate={{ x: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="relative h-full w-72 bg-white shadow-xl"
          >
            <SidebarBody collapsed={false} {...body} onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => (window.matchMedia('(min-width: 768px)').matches ? setCollapsed((c) => !c) : setMobileOpen(true))}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <PanelLeft className="size-[18px]" />
            </button>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <span className="hidden text-xs font-semibold text-slate-400 sm:inline">Campusnex /</span>
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">{current?.label}</h1>
            <span className="hidden rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 md:inline">Administrator</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Bell className="size-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-2.5 rounded-2xl py-1.5 pl-2 pr-3 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=faces"
                    alt=""
                    className="size-8 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <span className="hidden text-left sm:block">
                    <span className="block text-xs font-bold leading-tight text-slate-900">Meera Kulkarni</span>
                    <span className="block text-[10px] font-medium text-slate-500">Admin</span>
                  </span>
                  <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-xs font-bold text-slate-900">Meera Kulkarni</p>
                  <p className="truncate text-[11px] font-normal text-slate-500">meera.tt@campusnex.test</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 rounded-xl px-3 py-2">
                  <RotateCcw className="size-3.5" />
                  Refresh data
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" className="gap-2 rounded-xl px-3 py-2 font-bold">
                  <LogOut className="size-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-slate-900">{current?.label}</p>
            <p className="mt-1 text-xs text-slate-500">
              Page content goes here. Try the search box, the panel button at the top left, or a narrow window.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
