import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Paperclip,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import SubmissionGraderModal from './SubmissionGraderModal';

export default function AssignmentManager() {
  const { currentUser } = useAuth();
  const { courses, assignments, submissions, users, enrollments, createAssignment, gradeSubmission } = useData();

  // Scoped to courses assigned to this faculty
  const myCourses = courses.filter(c => c.faculty_id === currentUser?.id);
  const myCourseIds = myCourses.map(c => c.id);

  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'submissions'
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [gradingModalData, setGradingModalData] = useState(null);

  // New Assignment Form State
  const [formData, setFormData] = useState({
    course_id: myCourses[0]?.id || '',
    title: '',
    description: '',
    due_date: '2026-09-10T23:59',
    max_marks: 30,
    attachment_name: 'assignment_brief.pdf',
    attachment_url: 'https://raw.githubusercontent.com/campusnex/docs/main/sample-spec.pdf'
  });

  const [formError, setFormError] = useState('');

  const handleOpenCreateModal = () => {
    setFormData({
      course_id: myCourses[0]?.id || '',
      title: '',
      description: '',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      max_marks: 30,
      attachment_name: 'lab_problem_statement.pdf',
      attachment_url: 'https://raw.githubusercontent.com/campusnex/docs/main/problem-statement.pdf'
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Please enter an assignment title.');
      return;
    }

    createAssignment({
      ...formData,
      max_marks: Number(formData.max_marks)
    });
    setIsCreateModalOpen(false);
  };

  // Filter assignments
  const myAssignments = assignments.filter(a => {
    if (!myCourseIds.includes(a.course_id)) return false;
    if (selectedCourseFilter !== 'all' && a.course_id !== selectedCourseFilter) return false;
    return true;
  });

  // Filter submissions
  const relevantAssignmentIds = myAssignments.map(a => a.id);
  const mySubmissions = submissions.filter(s => relevantAssignmentIds.includes(s.assignment_id));

  const handleSaveGrade = (submissionId, marks, feedback) => {
    gradeSubmission(submissionId, marks, feedback, currentUser?.id || 'faculty_1');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Assignment Studio & Evaluation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create lab tasks, review student submissions, provide rubric grading and automated feedback alerts.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          disabled={myCourses.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </button>
      </div>

      {/* Tabs and Course Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'assignments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assignments ({myAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'submissions' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Submissions ({mySubmissions.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Course Filter:</span>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="all">All My Courses</option>
            {myCourses.map(c => (
              <option key={c.id} value={c.id}>{c.code} (Sec {c.section})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'assignments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAssignments.map((asg) => {
            const course = courses.find(c => c.id === asg.course_id);
            const asgSubs = submissions.filter(s => s.assignment_id === asg.id);
            const gradedCount = asgSubs.filter(s => s.graded).length;
            const dueDate = new Date(asg.due_date);

            return (
              <div
                key={asg.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="primary" size="sm">
                      {course?.code} • Sec {course?.section}
                    </Badge>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Max {asg.max_marks} Pts
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-3 line-clamp-1">
                    {asg.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {asg.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Due Date:
                      </span>
                      <span className="font-bold text-slate-800">
                        {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Submissions:
                      </span>
                      <span className="font-bold text-slate-800">
                        {asgSubs.length} received ({gradedCount} graded)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    View {asgSubs.length} Submissions →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Submissions Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Assignment Task</th>
                  <th className="px-6 py-3.5">Artifact File</th>
                  <th className="px-6 py-3.5">Submission Time</th>
                  <th className="px-6 py-3.5">Grading & Score</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {mySubmissions.map((sub) => {
                  const student = users.find(u => u.id === sub.student_id);
                  const asg = assignments.find(a => a.id === sub.assignment_id);
                  const course = courses.find(c => c.id === asg?.course_id);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.name}`}
                            alt={student?.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{student?.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{student?.roll_no}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 line-clamp-1">{asg?.title}</p>
                        <p className="text-[10px] text-slate-400">{course?.code} (Sec {course?.section})</p>
                      </td>

                      <td className="px-6 py-4 font-bold text-brand-600">
                        <span className="flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          {sub.file_name || 'submission.zip'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {new Date(sub.submitted_at).toLocaleDateString()} {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-6 py-4">
                        {sub.graded ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {sub.marks} / {asg?.max_marks || 30}
                            </span>
                            {sub.feedback && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">"{sub.feedback}"</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setGradingModalData({ submission: sub, assignment: asg, student })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            sub.graded
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-xs'
                          }`}
                        >
                          {sub.graded ? 'Edit Grade' : 'Grade Submission'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Course Assignment"
        subtitle="Enrolled students will receive immediate deadline and specification alerts."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course *
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {myCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name} (Sec {c.section})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Marks (Points) *
              </label>
              <input
                type="number"
                min={5}
                max={100}
                required
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assignment Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Assignment 4: Distributed Consensus Simulation"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Due Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Rubric Criteria
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deliverables, benchmarking guidelines, programming constraints..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attachment File Name
              </label>
              <input
                type="text"
                value={formData.attachment_name}
                onChange={(e) => setFormData({ ...formData, attachment_name: e.target.value })}
                placeholder="e.g. consensus_specification.pdf"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              Post Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Grading Modal */}
      {gradingModalData && (
        <SubmissionGraderModal
          isOpen={Boolean(gradingModalData)}
          onClose={() => setGradingModalData(null)}
          submission={gradingModalData.submission}
          assignment={gradingModalData.assignment}
          student={gradingModalData.student}
          onSaveGrade={handleSaveGrade}
        />
      )}
    </div>
  );
}
