import React, { useState } from 'react';
import {
  Megaphone,
  Globe,
  Building,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';

export default function StudentAnnouncements() {
  const { currentUser } = useAuth();
  const { announcements, courses, enrollments } = useData();

  const myEnrollments = enrollments.filter(e => e.student_id === currentUser?.id);
  const myCourseIds = myEnrollments.map(e => e.course_id);

  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'global' | 'department' | 'course'

  // Filter announcements for this student
  const studentAnnouncements = announcements.filter(a => {
    if (a.scope === 'global') return true;
    if (a.scope === 'department' && a.department_id === currentUser?.department_id) return true;
    if (a.scope === 'course' && myCourseIds.includes(a.course_id)) return true;
    return false;
  }).filter(a => {
    if (scopeFilter === 'all') return true;
    return a.scope === scopeFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            Campus Bulletins & Notices
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Institutional announcements, department technical symposiums, and course study materials.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              scopeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setScopeFilter('global')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              scopeFilter === 'global' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setScopeFilter('department')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              scopeFilter === 'department' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Department
          </button>
          <button
            onClick={() => setScopeFilter('course')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              scopeFilter === 'course' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Courses
          </button>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studentAnnouncements.map((ann) => {
          const course = courses.find(c => c.id === ann.course_id);

          return (
            <div
              key={ann.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant={
                      ann.scope === 'global' ? 'purple' : ann.scope === 'department' ? 'info' : 'primary'
                    }
                    dot
                  >
                    {course ? `${course.code} Course Notice` : ann.scope === 'global' ? 'Global Circular' : 'Department Notice'}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-3">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {ann.body}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Posted by {ann.author_name}</span>
                <span className="text-[10px] text-slate-400 capitalize">{ann.author_role}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
