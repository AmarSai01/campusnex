import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Award,
  FileText,
  Clock,
  CalendarDays,
  Layers,
  Menu,
  ShieldCheck,
  GraduationCap,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function MobileNav({ activeTab, setActiveTab, hodView, onOpenDrawer }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'student';

  const getMobileTabs = () => {
    if (hodView) {
      return [
        { id: 'hod_overview', label: 'Department', icon: ShieldCheck },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'hod_compliance', label: 'Compliance', icon: ClipboardCheck },
      ];
    }
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', label: 'Home', icon: LayoutDashboard },
          { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'timetable', label: 'Schedule', icon: Clock },
        ];
      case 'faculty':
        return [
          { id: 'overview', label: 'Home', icon: LayoutDashboard },
          { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'iamarks', label: 'Marks', icon: Award },
        ];
      case 'student':
      default:
        return [
          { id: 'overview', label: 'Home', icon: LayoutDashboard },
          { id: 'exam_seating', label: 'Exam Timetable & Seating', icon: Layers },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'iamarks', label: 'Marks', icon: Award },
        ];
    }
  };

  const tabs = getMobileTabs();

  return (
    <div className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'h-auto flex-col gap-1 rounded-xl px-3 py-1 text-xs font-bold',
              isActive
                ? 'text-brand-600 hover:text-brand-600'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
            <span className="text-[10px]">{tab.label}</span>
          </Button>
        )
      })}

      <Button
        variant="ghost"
        onClick={onOpenDrawer}
        className="h-auto flex-col gap-1 rounded-xl px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-900"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px]">More</span>
      </Button>
    </div>
  )
}
