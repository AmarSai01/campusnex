import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Calendar,
  Award,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import SubmitAssignmentModal from './SubmitAssignmentModal';
import Badge from '../common/Badge';

export default function AssignmentSubmissionList() {
  const { currentUser } = useAuth();
  const { courses, assignments, submissions, enrollments, users, submitAssignment } = useData();

  const myEnrollments = enrollments.filter(e => e.student_id === currentUser?.id);
  const myCourseIds = myEnrollments.map(e => e.course_id);
  const myAssignments = assignments.filter(a => myCourseIds.includes(a.course_id));

  // My submissions
  const mySubmissions = submissions.filter(s => s.student_id === currentUser?.id);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'submitted' | 'graded'
  const [activeModalAssignment, setActiveModalAssignment] = useState(null);

  // Helper to get remaining time string
  const getDueCountdown = (dueDateStr) => {
    const due = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diff = due - now;

    if (diff <= 0) return { text: 'Overdue', isUrgent: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return { text: `Due in ${days}d ${hours}h`, isUrgent: days <= 1 };
    }
    return { text: `Due in ${hours} hours`, isUrgent: true };
  };

  const handleOpenSubmitModal = (asg) => {
    setActiveModalAssignment(asg);
  };

  const handleProcessSubmit = async (submissionPayload) => {
    await submitAssignment({
      ...submissionPayload,
      student_id: currentUser?.id
    });
  };

  // Grouped datasets
  const assignmentCards = myAssignments.map(asg => {
    const course = courses.find(c => c.id === asg.course_id);
    const faculty = users.find(u => u.id === course?.faculty_id);
    const submission = mySubmissions.find(s => s.assignment_id === asg.id);
    const countdown = getDueCountdown(asg.due_date);

    let status = 'pending';
    if (submission) {
      status = submission.graded ? 'graded' : 'submitted';
    }

    return {
      ...asg,
      course,
      faculty,
      submission,
      countdown,
      status
    };
  });

  const filteredCards = assignmentCards.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Coursework & Assignment Studio
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit coding exercises, download task specifications, and inspect faculty feedback and grades.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({assignmentCards.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({assignmentCards.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'submitted' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submitted ({assignmentCards.filter(c => c.status === 'submitted').length})
          </button>
          <button
            onClick={() => setActiveTab('graded')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'graded' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Graded ({assignmentCards.filter(c => c.status === 'graded').length})
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredCards.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-semibold">
            No assignments found in this category.
          </div>
        ) : (
          filteredCards.map((item) => {
            const dueDate = new Date(item.due_date);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left side details */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {item.course?.code} (Sec {item.course?.section})
                    </Badge>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Max {item.max_marks} Marks
                    </span>

                    {/* Status Badge */}
                    {item.status === 'graded' ? (
                      <Badge variant="success" dot>Graded</Badge>
                    ) : item.status === 'submitted' ? (
                      <Badge variant="info" dot>Submitted & Awaiting Grade</Badge>
                    ) : (
                      <Badge variant={item.countdown.isUrgent ? 'danger' : 'warning'} dot>
                        {item.countdown.text}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Due {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>Instructor: {item.faculty?.name || 'Faculty'}</span>
                  </div>

                  {/* If Graded: Show Marks and Written Teacher Feedback */}
                  {item.submission?.graded && (
                    <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Faculty Grade Awarded:
                        </span>
                        <span className="text-sm font-extrabold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {item.submission.marks} / {item.max_marks} Pts ({Math.round((item.submission.marks / item.max_marks) * 100)}%)
                        </span>
                      </div>
                      {item.submission.feedback && (
                        <p className="text-xs text-emerald-800 italic mt-1 bg-white/60 p-2 rounded-lg">
                          💬 "{item.submission.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side actions */}
                <div className="flex md:flex-col items-center justify-end gap-2.5 shrink-0">
                  {item.status === 'pending' ? (
                    <button
                      onClick={() => handleOpenSubmitModal(item)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Submit Solution</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenSubmitModal(item)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Resubmit Solution</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Solution Modal */}
      {activeModalAssignment && (
        <SubmitAssignmentModal
          isOpen={Boolean(activeModalAssignment)}
          onClose={() => setActiveModalAssignment(null)}
          assignment={activeModalAssignment}
          course={activeModalAssignment.course}
          onSubmit={handleProcessSubmit}
        />
      )}
    </div>
  );
}
