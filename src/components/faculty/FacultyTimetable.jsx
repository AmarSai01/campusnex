import React from 'react';
import { Clock, Calendar, Building, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { formatTimeRange } from '../../utils/time';
import BatchTag from '../common/BatchTag';

export default function FacultyTimetable() {
  const { currentUser } = useAuth();
  const { timetable, courses } = useData();

  // Scoped to slots assigned to this faculty
  const mySlots = timetable.filter(t => t.faculty_id === currentUser?.id);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            My Weekly Teaching Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Assigned lecture halls, laboratory sessions, and teaching hours for the current semester.
          </p>
        </div>

        <Badge variant="primary" size="lg">
          {mySlots.length} Weekly Sessions
        </Badge>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 gap-6">
        {daysOfWeek.map((day) => {
          const daySessions = mySlots
            .filter(s => s.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">{day}</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {daySessions.length} Classes
                </span>
              </div>

              <div className="p-4 sm:p-6">
                {daySessions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No teaching sessions scheduled for {day}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {daySessions.map((slot) => {
                      const course = courses.find(c => c.id === slot.course_id);

                      return (
                        <div
                          key={slot.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-300 hover:shadow-card transition-all"
                        >
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 whitespace-nowrap tabular-nums">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTimeRange(slot.start_time, slot.end_time)}
                            </span>
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 whitespace-nowrap">
                              {slot.room}
                            </span>
                            <BatchTag batch={slot.batch} />
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: course?.color || '#4f46e5' }}
                            />
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                                {course?.code}: {course?.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                Section {slot.section} • Semester {course?.semester || 5}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
