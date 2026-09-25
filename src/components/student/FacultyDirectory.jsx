import React from 'react';
import {
  Contact,
  Mail,
  MapPin,
  Phone,
  BookOpen,
  Building,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';

export default function FacultyDirectory() {
  const { currentUser } = useAuth();
  const { courses, enrollments, users, departments } = useData();

  const myEnrollments = enrollments.filter(e => e.student_id === currentUser?.id);
  const myCourseIds = myEnrollments.map(e => e.course_id);
  const myCourses = courses.filter(c => myCourseIds.includes(c.id));

  // Find all faculty assigned to the student's enrolled courses
  const facultyIds = [...new Set(myCourses.map(c => c.faculty_id).filter(Boolean))];
  const myFaculty = users.filter(u => facultyIds.includes(u.id));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Contact className="w-5 h-5 text-brand-600" />
            Course Faculty & Advisory Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Direct institutional contact channels and office hours for your appointed subject professors.
          </p>
        </div>

        <Badge variant="primary" size="lg">
          {myFaculty.length} Appointed Instructors
        </Badge>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myFaculty.map((faculty) => {
          const dept = departments.find(d => d.id === faculty.department_id);
          const taughtCourses = myCourses.filter(c => c.faculty_id === faculty.id);

          return (
            <div
              key={faculty.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4">
                  <img
                    src={faculty.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${faculty.name}`}
                    alt={faculty.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500/20 shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {faculty.name}
                    </h3>
                    <p className="text-xs font-semibold text-brand-600">
                      {faculty.designation || 'Professor'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {dept?.name || 'Department of Computer Science'}
                    </p>
                  </div>
                </div>

                {/* Courses Taught Pill List */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Courses Instructed:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {taughtCourses.map(c => (
                      <span
                        key={c.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#4f46e5' }} />
                        {c.code}: {c.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Information List */}
                <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{faculty.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Office: <strong>{faculty.office || 'CSE Tech Tower 304'}</strong></span>
                  </div>

                  {faculty.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{faculty.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`mailto:${faculty.email}`}
                  className="w-full text-center py-2 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors"
                >
                  Send Academic Query via Email
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
