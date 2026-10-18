import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  BookOpen,
  Building,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function CourseAnnouncementModal() {
  const { currentUser, isHod, hodDepartments } = useAuth();
  const { courses, announcements, createAnnouncement } = useData();

  const myCourses = courses.filter(c => c.faculty_id === currentUser?.id);
  const myCourseIds = myCourses.map(c => c.id);
  const headedDeptIds = hodDepartments.map(d => d.id);

  // Audience is "course:<id>" for a class notice or "dept:<id>" for an HOD department notice.
  const defaultAudience = myCourses[0]
    ? `course:${myCourses[0].id}`
    : hodDepartments[0] ? `dept:${hodDepartments[0].id}` : '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: defaultAudience,
    priority: 'normal'
  });

  const handleOpenModal = () => {
    setFormData({
      title: '',
      body: '',
      audience: defaultAudience,
      priority: 'normal'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    const [kind, targetId] = formData.audience.split(':');
    const dept = hodDepartments.find(d => d.id === targetId);

    createAnnouncement(
      kind === 'dept' && dept
        ? {
            author_id: currentUser.id,
            author_name: `${currentUser.name} (HOD, ${dept.code})`,
            author_role: 'faculty',
            scope: 'department',
            course_id: null,
            department_id: dept.id,
            title: formData.title,
            body: formData.body,
            priority: formData.priority
          }
        : {
            author_id: currentUser.id,
            author_name: currentUser.name,
            author_role: 'faculty',
            scope: 'course',
            course_id: targetId,
            department_id: currentUser.department_id,
            title: formData.title,
            body: formData.body,
            priority: formData.priority
          }
    );
    setIsModalOpen(false);
  };

  // Filter announcements: posted by this faculty or global/dept
  const relevantAnnouncements = announcements.filter(a =>
    a.author_id === currentUser?.id ||
    a.scope === 'global' ||
    (a.scope === 'department' &&
      (a.department_id === currentUser?.department_id || headedDeptIds.includes(a.department_id)))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            Class Bulletins & Course Circulars
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isHod
              ? 'Post notices to your classes, or to your whole department as HOD.'
              : 'Publish syllabus handouts, lab reminders, and exam revision guides to your enrolled classes.'}
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          disabled={!defaultAudience}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isHod ? 'Post Notice' : 'Post Class Notice'}</span>
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantAnnouncements.map((ann) => {
          const course = courses.find(c => c.id === ann.course_id);
          const isOwn = ann.author_id === currentUser?.id;

          return (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-card transition-all flex flex-col justify-between ${
                isOwn ? 'border-brand-200 ring-1 ring-brand-500/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={ann.scope === 'global' ? 'purple' : ann.scope === 'department' ? 'info' : 'primary'} dot>
                    {course ? `${course.code} Class Notice` : ann.scope === 'global' ? 'Global Circular' : 'Dept Notice'}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {ann.body}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">By {ann.author_name}</span>
                {isOwn && <span className="text-brand-600 font-extrabold text-[11px]">Your Post</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isHod ? 'Post a Notice' : 'Post Notice to Enrolled Students'}
        subtitle={isHod
          ? 'Class notices reach enrolled students; department notices reach everyone in the department.'
          : 'Students enrolled in the selected course will receive an immediate notification.'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isHod ? 'Send To *' : 'Select Course *'}
            </label>
            <select
              value={formData.audience}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {isHod && (
                <optgroup label="Whole department (HOD)">
                  {hodDepartments.map(d => (
                    <option key={d.id} value={`dept:${d.id}`}>{d.code} - all students and faculty</option>
                  ))}
                </optgroup>
              )}
              {myCourses.length > 0 && (
                <optgroup label="My classes">
                  {myCourses.map(c => (
                    <option key={c.id} value={`course:${c.id}`}>
                      {c.code} - {c.name}{c.section && !/\bsec\b/i.test(c.name) ? ` (Sec ${c.section})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Lab Viva Schedule & Question Bank"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Content *
            </label>
            <textarea
              rows={4}
              required
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Full details, instructions, room allocations..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
