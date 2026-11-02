import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import {
  ANNOUNCEMENT_AUDIENCES,
  announcementTag,
  canSeeAnnouncement,
  isAddressedTo
} from '../../utils/announcements';

export default function CourseAnnouncementModal() {
  const { currentUser, isHod, hodDepartments } = useAuth();
  const {
    courses, announcements, createAnnouncement, departments, users, enrollments,
    class_roles: classRoles = []
  } = useData();

  const myCourses = courses.filter(c => c.faculty_id === currentUser?.id);
  // Classes this teacher is Class CC of.
  const myCcClasses = classRoles.filter(r => r.faculty_id === currentUser?.id && r.role === 'class_coordinator');
  const deptCode = (id) => departments.find(d => d.id === id)?.code || '—';
  const classKey = (r) => `class:${r.department_id}|${r.semester}|${r.section}`;

  // Audience is "course:<id>" (subject), "class:<dept>|<sem>|<sec>" (Class CC) or "dept:<id>" (HOD).
  const defaultAudience = myCourses[0]
    ? `course:${myCourses[0].id}`
    : myCcClasses[0] ? classKey(myCcClasses[0])
      : hodDepartments[0] ? `dept:${hodDepartments[0].id}` : '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: defaultAudience,
    deptAudience: 'all',
    priority: 'normal'
  });

  const handleOpenModal = () => {
    setFormData({
      title: '',
      body: '',
      audience: defaultAudience,
      deptAudience: 'all',
      priority: 'normal'
    });
    setIsModalOpen(true);
  };

  // The notice the form would send, without its text.
  const target = (() => {
    const [kind, rest = ''] = formData.audience.split(':');
    if (kind === 'dept') {
      return { scope: 'department', department_id: rest, audience: formData.deptAudience, course_id: null };
    }
    if (kind === 'class') {
      const [department_id, semester, section] = rest.split('|');
      return { scope: 'class', department_id, semester: Number(semester), section, audience: 'students', course_id: null };
    }
    const course = courses.find(c => c.id === rest);
    return { scope: 'course', course_id: rest, department_id: course?.department_id || currentUser?.department_id, audience: 'students' };
  })();
  const reach = users.filter(u => isAddressedTo({ ...target, author_id: currentUser?.id }, u, { enrollments })).length;
  const reachWho = target.audience === 'faculty' ? (reach === 1 ? 'teacher' : 'teachers')
    : target.audience === 'all' ? (reach === 1 ? 'person' : 'students and teachers')
      : (reach === 1 ? 'student' : 'students');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    const signature = target.scope === 'department'
      ? `${currentUser.name} (HOD, ${deptCode(target.department_id)})`
      : target.scope === 'class'
        ? `${currentUser.name} (CC, ${deptCode(target.department_id)} ${target.semester}${target.section})`
        : currentUser.name;

    createAnnouncement({
      author_id: currentUser.id,
      author_name: signature,
      author_role: 'faculty',
      ...target,
      title: formData.title.trim(),
      body: formData.body.trim(),
      priority: formData.priority
    });
    setIsModalOpen(false);
  };

  // Notices this teacher may see: theirs, ones addressed to them, and ones they oversee.
  const visibilityContext = { departments, courses, enrollments, classRoles };
  const relevantAnnouncements = announcements
    .filter(a => canSeeAnnouncement(a, currentUser, visibilityContext))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            Announcements
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {(() => {
              const targets = [
                myCourses.length > 0 && 'the students of your subjects',
                myCcClasses.length > 0 && 'your class as Class CC',
                isHod && 'your department as HOD'
              ].filter(Boolean);
              const list = targets.length > 1 ? `${targets.slice(0, -1).join(', ')} or ${targets[targets.length - 1]}` : targets[0];
              return list ? `Send notices to ${list}. Notices meant for you show here too.` : 'Notices meant for you show here.';
            })()}
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          disabled={!defaultAudience}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New notice</span>
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantAnnouncements.map((ann) => {
          const tag = announcementTag(ann, { departments, courses });
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
                  <Badge variant={tag.variant} dot>
                    {tag.label}
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
        title="New notice"
        subtitle="Only the people you send it to can see it."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Send to *
            </label>
            <select
              value={formData.audience}
              onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {myCourses.length > 0 && (
                <optgroup label="My subject">
                  {myCourses.map(c => (
                    <option key={c.id} value={`course:${c.id}`}>
                      {c.code} - {c.name}{c.section && !/\bsec\b/i.test(c.name) ? ` (Sec ${c.section})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {myCcClasses.length > 0 && (
                <optgroup label="My class (Class CC)">
                  {myCcClasses.map(r => (
                    <option key={r.id} value={classKey(r)}>
                      {deptCode(r.department_id)} Sem {r.semester} Sec {r.section} - all students of the class
                    </option>
                  ))}
                </optgroup>
              )}
              {isHod && (
                <optgroup label="My department (HOD)">
                  {hodDepartments.map(d => (
                    <option key={d.id} value={`dept:${d.id}`}>{d.code} - {d.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {target.scope === 'department' && (
            <fieldset>
              <legend className="block text-xs font-bold text-slate-700 mb-1.5">Who in {deptCode(target.department_id)}?</legend>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ANNOUNCEMENT_AUDIENCES).map(([value, label]) => {
                  const on = formData.deptAudience === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFormData(prev => ({ ...prev, deptAudience: value }))}
                      className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                        on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      {value === 'all' ? `Everyone in ${deptCode(target.department_id)}` : label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800" aria-live="polite">
            This goes to {reach} {reachWho}. Nobody else can see it.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
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
              <span>Send</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
