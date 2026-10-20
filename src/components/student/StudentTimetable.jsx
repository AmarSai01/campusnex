import React, { useState } from 'react';
import { Clock, Calendar, Building, User, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { formatTimeRange } from '../../utils/time';
import BatchTag from '../common/BatchTag';
import { slotVisibleToStudent } from '../../utils/batches';

export default function StudentTimetable() {
  const { currentUser } = useAuth();
  const { timetable, courses, enrollments, users } = useData();

  const myEnrollments = enrollments.filter(e => e.student_id === currentUser?.id);
  const myCourseIds = myEnrollments.map(e => e.course_id);

  // Filter slots for student's enrolled courses and section
  const mySlots = timetable.filter(
    t => myCourseIds.includes(t.course_id) &&
      (!currentUser?.section || t.section === currentUser?.section) &&
      slotVisibleToStudent(t, currentUser)
  );

  // Saturday is a teaching day in most Indian colleges; it only shows when it has classes.
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].filter(
    (d) => d !== 'Saturday' || mySlots.some((s) => s.day_of_week === 'Saturday')
  );
  const todayName = new Date().toLocaleDateString('en-IN', { weekday: 'long' });

  const [activeDay, setActiveDay] = useState('All'); // 'All' or specific day

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            Weekly Academic Class Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lectures, tutorial sessions, and laboratory slots for Section {currentUser?.section || 'A'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="lg">
            Section {currentUser?.section || 'A'} • Sem {currentUser?.semester || 5}
          </Badge>
        </div>
      </div>

      {/* Day Selector Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveDay('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeDay === 'All'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Entire Week
        </button>

        {daysOfWeek.map((day) => {
          const isToday = day === todayName;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDay === day
                  ? 'bg-brand-600 text-white shadow-xs'
                  : isToday
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{day}</span>
              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </button>
          );
        })}
      </div>

      {/* Timetable Weekly Cards */}
      <div className="space-y-5">
        {(activeDay === 'All' ? daysOfWeek : [activeDay]).map((day) => {
          const isToday = day === todayName;
          const daySessions = mySlots
            .filter(s => s.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div
              key={day}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
                isToday ? 'border-brand-300 ring-2 ring-brand-500/10 shadow-card' : 'border-slate-200'
              }`}
            >
              <div className={`px-6 py-3.5 flex items-center justify-between border-b ${
                isToday ? 'bg-brand-50/60 border-brand-100' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isToday ? 'text-brand-600' : 'text-slate-500'}`} />
                  <h3 className="font-extrabold text-sm text-slate-900">{day}</h3>
                  {isToday && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-600 text-white">
                      Today
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-slate-500">
                  {daySessions.length} Scheduled Classes
                </span>
              </div>

              <div className="p-4 sm:p-6">
                {daySessions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No classes scheduled for {day}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {daySessions.map((slot) => {
                      const course = courses.find(c => c.id === slot.course_id);
                      const faculty = users.find(u => u.id === slot.faculty_id);

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
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 whitespace-nowrap flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
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
                              <p className="text-[11px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {faculty?.name || 'Assigned Faculty'}
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
