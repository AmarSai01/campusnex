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
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav({ activeTab, setActiveTab, onOpenDrawer }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'student';

  const getMobileTabs = () => {
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'text-brand-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px]">More</span>
      </button>
    </div>
  );
}
