import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Bell,
  Globe,
  Building,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function BroadcastModal() {
  const { announcements, departments, createAnnouncement, pushManualBroadcast } = useData();
  const { currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirectPushOpen, setIsDirectPushOpen] = useState(false);

  // Announcement Form
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    scope: 'global', // 'global' | 'department'
    department_id: 'dept_cse',
    priority: 'normal'
  });

  // Direct Push Form
  const [pushData, setPushData] = useState({
    title: '',
    message: '',
    targetRole: 'all' // 'all' | 'student' | 'faculty'
  });

  const handleOpenAnnouncement = () => {
    setFormData({
      title: '',
      body: '',
      scope: 'global',
      department_id: departments[0]?.id || 'dept_cse',
      priority: 'normal'
    });
    setIsModalOpen(true);
  };

  const handleAnnouncementSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    createAnnouncement({
      author_id: currentUser?.id,
      author_name: currentUser?.name || 'Administrator',
      author_role: 'admin',
      scope: formData.scope,
      course_id: null,
      department_id: formData.scope === 'department' ? formData.department_id : null,
      title: formData.title,
      body: formData.body,
      priority: formData.priority
    });
    setIsModalOpen(false);
  };

  const handlePushSubmit = (e) => {
    e.preventDefault();
    if (!pushData.title.trim() || !pushData.message.trim()) return;

    pushManualBroadcast(pushData);
    setIsDirectPushOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-600" />
            Institutional Broadcasts & Circulars
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Publish official announcements and push urgent real-time notification alerts.
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
            <span>Create Broadcast</span>
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((ann) => {
          const isGlobal = ann.scope === 'global';
          const isDept = ann.scope === 'department';

          return (
            <div
              key={ann.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={isGlobal ? 'purple' : isDept ? 'primary' : 'neutral'} dot>
                    {isGlobal ? 'Global Broadcast' : isDept ? 'Department Circular' : 'Course Scoped'}
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
        title="Publish Institutional Broadcast"
        subtitle="Deliver official news and circulars to students and faculty."
      >
        <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Broadcast Scope *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="global">Global (All Students & Faculty)</option>
              <option value="department">Department-Specific</option>
            </select>
          </div>

          {formData.scope === 'department' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Department *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          )}

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
              <span>Publish Circular</span>
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
    </div>
  );
}
