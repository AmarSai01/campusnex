import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Radio,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import {
  ANNOUNCEMENT_AUDIENCES,
  announcementGroup,
  announcementTag,
  isAddressedTo
} from '../../utils/announcements';

const SHOW_GROUPS = [
  ['all', 'All'],
  ['students', 'Students'],
  ['faculty', 'Faculty'],
  ['everyone', 'Everyone'],
  ['class', 'Class notices']
];
const selectClass = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none';

export default function BroadcastModal() {
  const { announcements, departments, users, courses, enrollments, createAnnouncement, pushManualBroadcast } = useData();
  const [show, setShow] = useState('all');
  const [deptFilter, setDeptFilter] = useState('');
  const [confirmRequest, setConfirmRequest] = useState(null);
  const [notice, setNotice] = useState('');

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 5000);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const { currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirectPushOpen, setIsDirectPushOpen] = useState(false);

  // Announcement Form: audience is all | students | faculty; an empty department_id means every department.
  const blankForm = { title: '', body: '', audience: 'all', department_id: '', priority: 'normal' };
  const [formData, setFormData] = useState(blankForm);

  // Direct Push Form
  const [pushData, setPushData] = useState({
    title: '',
    message: '',
    targetRole: 'all' // 'all' | 'student' | 'faculty'
  });

  const handleOpenAnnouncement = () => {
    setFormData(blankForm);
    setIsModalOpen(true);
  };

  const draft = {
    scope: formData.department_id ? 'department' : 'global',
    audience: formData.audience,
    department_id: formData.department_id || null
  };
  const draftReach = users.filter(u => isAddressedTo(draft, u, { enrollments })).length;
  const draftDept = departments.find(d => d.id === formData.department_id);
  const draftWho = formData.audience === 'students' ? 'students' : formData.audience === 'faculty' ? 'teachers' : 'students and teachers';

  const visible = sortedAnnouncements.filter(a =>
    (show === 'all' || announcementGroup(a) === show) && (!deptFilter || a.department_id === deptFilter));
  const groupCount = (key) => sortedAnnouncements.filter(a =>
    (key === 'all' || announcementGroup(a) === key) && (!deptFilter || a.department_id === deptFilter)).length;

  const handleAnnouncementSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    createAnnouncement({
      author_id: currentUser?.id,
      author_name: currentUser?.name || 'Administrator',
      author_role: 'admin',
      ...draft,
      course_id: null,
      title: formData.title.trim(),
      body: formData.body.trim(),
      priority: formData.priority
    });
    setIsModalOpen(false);
    showNotice(`"${formData.title.trim()}" was sent to ${draftReach} ${draftReach === 1 ? 'person' : 'people'}.`);
  };

  const handlePushSubmit = (e) => {
    e.preventDefault();
    if (!pushData.title.trim() || !pushData.message.trim()) return;

    const recipients = users.filter(u =>
      u.status !== 'inactive' && (pushData.targetRole === 'all' || u.role === pushData.targetRole)
    ).length;
    const audience = pushData.targetRole === 'all' ? 'everyone' : pushData.targetRole === 'student' ? 'all students' : 'all faculty';
    setIsDirectPushOpen(false);
    setConfirmRequest({
      title: `Send this alert to ${audience}?`,
      message: `"${pushData.title}" goes to ${recipients} ${recipients === 1 ? 'person' : 'people'} straight away. Alerts can't be recalled.`,
      confirmLabel: 'Send alert',
      onConfirm: () => {
        pushManualBroadcast(pushData);
        setPushData({ title: '', message: '', targetRole: 'all' });
        showNotice(`Alert sent to ${recipients} ${recipients === 1 ? 'person' : 'people'}.`);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            Global Broadcasts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Send announcements to the whole college, a department or a class. Urgent ones also go out as notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDirectPushOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <Radio className="w-4 h-4 text-rose-600" />
            <span>Push Urgent Alert</span>
          </button>
          <button
            onClick={handleOpenAnnouncement}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New broadcast</span>
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {sortedAnnouncements.length === 0 && (
        <EmptyState
          icon={Megaphone}
          title="No circulars yet"
          description="Send a notice to everyone, only students or only faculty, in every department or one. Only they can see it."
          actionLabel="New broadcast"
          onAction={handleOpenAnnouncement}
        />
      )}

      {sortedAnnouncements.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Show:</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show">
            {SHOW_GROUPS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={show === key}
                onClick={() => setShow(key)}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  show === key ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label} · {groupCount(key)}
              </button>
            ))}
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            aria-label="Department"
            className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="">All departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
          </select>
        </div>
      )}

      {sortedAnnouncements.length > 0 && visible.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          No broadcasts match this filter.
        </p>
      )}

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((ann) => {
          const tag = announcementTag(ann, { departments, courses });

          return (
            <div
              key={ann.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
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
                <span className="text-[10px] text-slate-400 capitalize">{ann.author_role}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Broadcast Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New broadcast"
        subtitle="Only the people you choose can see it."
      >
        <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
          <fieldset>
            <legend className="block text-xs font-bold text-slate-700 mb-1.5">Who should receive it?</legend>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ANNOUNCEMENT_AUDIENCES).map(([value, label]) => {
                const on = formData.audience === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFormData({ ...formData, audience: value })}
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block text-xs font-bold text-slate-700">
            From which department?
            <select
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              className={`mt-1 ${selectClass}`}
            >
              <option value="">All departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </label>

          <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800" aria-live="polite">
            This goes to {draftReach} {draftWho}{draftDept ? ` in ${draftDept.code}` : ''}. Nobody else can see it.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Headline Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. End Semester Examination Time Table & Admit Cards Released"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Announcement Message Body *
            </label>
            <textarea
              rows={4}
              required
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Full text of the circular, deadlines, guidelines..."
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

      {/* Direct Push Modal */}
      <Modal
        isOpen={isDirectPushOpen}
        onClose={() => setIsDirectPushOpen(false)}
        title="Push Direct Notification Alert"
        subtitle="Immediately dispatches high-priority notification badges to user inboxes."
      >
        <form onSubmit={handlePushSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Audience *
            </label>
            <select
              value={pushData.targetRole}
              onChange={(e) => setPushData({ ...pushData, targetRole: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">Everyone (All Students & Faculty)</option>
              <option value="student">All Students Only</option>
              <option value="faculty">All Faculty Members Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={pushData.title}
              onChange={(e) => setPushData({ ...pushData, title: e.target.value })}
              placeholder="e.g. Urgent: Severe Weather Alert"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notification Message *
            </label>
            <textarea
              rows={3}
              required
              value={pushData.message}
              onChange={(e) => setPushData({ ...pushData, message: e.target.value })}
              placeholder="Brief message sent directly to user notification drawers..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDirectPushOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Push Notification Now</span>
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  );
}
