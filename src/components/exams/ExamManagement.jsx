import React, { useState } from 'react';
import {
  Layers,
  Building2,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RoomManagement from './RoomManagement';
import ExamTimetableManager from './ExamTimetableManager';
import SeatingArrangementManager from './SeatingArrangementManager';
import StudentExamView from './StudentExamView';

export default function ExamManagement({ initialTab = 'seating' }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'student';

  const [activeSubTab, setActiveSubTab] = useState(
    role === 'student' ? 'student_view' : initialTab
  );

  // For students, directly render the personalized view
  if (role === 'student') {
    return <StudentExamView />;
  }

  const tabs = [
    {
      id: 'seating',
      label: 'Seating Arrangements',
      icon: Layers,
      description: 'Alternating branch allocation & hall desk maps'
    },
    {
      id: 'timetable',
      label: 'Exam Timetable',
      icon: CalendarDays,
      description: 'Department & semester examination schedules'
    },
    {
      id: 'rooms',
      label: role === 'admin' ? 'Room Management' : 'Room Capacities',
      icon: Building2,
      description: role === 'admin' ? 'Add, edit, delete examination halls' : 'View hall availability and capacities'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/60">
              Exam Administration Suite
            </span>
            <span className="text-xs text-slate-400 capitalize">
              {role} Level Control
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Exam Timetable & Seating Arrangement
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive examination hall scheduling, room capacity management, and automatic alternating seating plans.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shrink-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="transition-all duration-200">
        {activeSubTab === 'seating' && <SeatingArrangementManager />}
        {activeSubTab === 'timetable' && <ExamTimetableManager />}
        {activeSubTab === 'rooms' && <RoomManagement />}
      </div>
    </div>
  );
}
