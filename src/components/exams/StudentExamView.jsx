import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Building2,
  Printer,
  Search,
  CheckCircle2,
  Calendar,
  QrCode,
  ShieldCheck,
  Award,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { formatTimeRange } from '../../utils/time';

export default function StudentExamView() {
  const { currentUser } = useAuth();
  const {
    exam_timetables = [],
    exam_rooms = [],
    exam_seatings = [],
    departments = []
  } = useData();

  const [isHallTicketModalOpen, setIsHallTicketModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const myDeptId = currentUser?.department_id;
  const mySem = Number(currentUser?.semester) || 5;
  const myDept = departments.find(d => d.id === myDeptId);

  // Filter exams relevant to this student (by department & semester)
  const myExams = exam_timetables
    .filter(exam => {
      const matchesDept = !exam.department_id || exam.department_id === myDeptId;
      const matchesSem = !exam.semester || Number(exam.semester) === mySem;
      return matchesDept && matchesSem;
    })
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());

  // Match student's personal seat for each exam
  const examsWithSeats = myExams.map(exam => {
    // Look up personal seating record where student_id == currentUser.id
    const seatRecord = exam_seatings.find(
      s => s.exam_id === exam.id && s.student_id === currentUser?.id
    );

    // If not found in explicit seatings, check if there's any seating plan with matching usn or student_id
    const assignedRoom = exam_rooms.find(r => r.id === seatRecord?.room_id) ||
      exam_rooms.find(r => (exam.room_ids || []).includes(r.id)) ||
      null;

    return {
      ...exam,
      seatRecord,
      assignedRoomName: seatRecord?.room_name || assignedRoom?.name || (exam.rooms && exam.rooms[0]) || 'Hall TBD',
      seatNumber: seatRecord?.seat_number || 'Allotted at Hall',
      benchPosition: seatRecord ? `Row ${seatRecord.bench_row}, Desk ${seatRecord.bench_col}` : 'Assigned at Venue',
      isSeatAssigned: Boolean(seatRecord)
    };
  });

  const filteredExams = examsWithSeats.filter(exam => {
    return (
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.exam_date.includes(searchQuery) ||
      exam.assignedRoomName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalExams = myExams.length;
  const nextExam = myExams[0];

  const getDaysRemaining = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Completed';
    return `In ${diffDays} days`;
  };

  const handlePrintHallTicket = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Welcome & Admit Card Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-brand-500/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Official Examination Portal
              </span>
              <span className="text-xs text-slate-300">
                Semester {currentUser?.semester || 5} • Section {currentUser?.section || 'A'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              My Examination Schedule & Seat Allotment
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Welcome, <strong className="text-white">{currentUser?.name}</strong> (USN: <span className="font-mono text-brand-300">{currentUser?.usn || currentUser?.roll_no || '1MS22CS101'}</span>).
              Review your personalized hall venue and desk numbers below. View-only access is strictly scoped to your individual candidate record.
            </p>
          </div>

          <button
            onClick={() => setIsHallTicketModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-500/30 transition-all hover:scale-102 shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            View & Print Hall Ticket
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Papers</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalExams}</p>
          <span className="text-[11px] text-slate-500">Scheduled for this term</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Next Upcoming Paper</span>
          <p className="text-sm font-black text-brand-600 mt-1 truncate">
            {nextExam ? nextExam.subject.split('-')[0].trim() : 'None Scheduled'}
          </p>
          <span className="text-[11px] text-slate-500">
            {nextExam ? getDaysRemaining(nextExam.exam_date) : 'All complete'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Candidate USN</span>
          <p className="text-sm font-mono font-black text-slate-900 mt-1 truncate">
            {currentUser?.usn || currentUser?.roll_no || '1MS22CS101'}
          </p>
          <span className="text-[11px] text-slate-500">Department of {myDept?.code || 'CSE'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Admit Status</span>
          <p className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Verified & Ready
          </p>
          <span className="text-[11px] text-slate-500">Authorized for examination</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your exams by subject code, date, or hall..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Student's Personal Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredExams.map((exam) => {
          const daysLeft = getDaysRemaining(exam.exam_date);
          const isUrgent = daysLeft === 'Today' || daysLeft === 'Tomorrow';

          return (
            <div
              key={exam.id}
              className={`bg-white rounded-3xl p-6 border shadow-xs hover:shadow-card transition-all flex flex-col justify-between ${
                isUrgent ? 'border-brand-300 ring-2 ring-brand-500/10' : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={isUrgent ? 'danger' : 'primary'} size="sm" dot>
                    {daysLeft}
                  </Badge>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {exam.exam_type || 'Theory Exam'}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {exam.subject}
                </h3>

                {/* Timing & Date Box */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Calendar className="w-4 h-4 text-brand-600" />
                      {new Date(exam.exam_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {formatTimeRange(exam.start_time, exam.end_time)}
                    </span>
                  </div>
                </div>

                {/* Dedicated Venue & Seat Number Container */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {/* Venue / Room */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Examination Venue
                    </span>
                    <p className="text-base font-black text-indigo-950 mt-1 truncate">
                      {exam.assignedRoomName}
                    </p>
                    <span className="text-[10px] text-indigo-600 font-medium">Main Block</span>
                  </div>

                  {/* Seat Number */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      Allocated Seat No
                    </span>
                    <p className="text-base font-black text-emerald-950 mt-1">
                      {exam.seatNumber}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-medium truncate block">
                      {exam.benchPosition}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Seat Verified
                </span>

                <button
                  onClick={() => setIsHallTicketModalOpen(true)}
                  className="font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 cursor-pointer"
                >
                  Hall Ticket Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredExams.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Scheduled Examinations</p>
            <p className="text-xs text-slate-400 mt-1">
              You currently have no upcoming exam timetables published for your semester.
            </p>
          </div>
        )}
      </div>

      {/* Official Examination Hall Ticket Modal */}
      <Modal
        isOpen={isHallTicketModalOpen}
        onClose={() => setIsHallTicketModalOpen(false)}
        title="Official Examination Hall Ticket & Admit Card"
        subtitle="Bring this document along with your Institution Identity Card to every examination."
        maxWidth="max-w-3xl"
      >
        <div id="printable-hall-ticket" className="space-y-6 print:p-0">
          {/* Institution Header */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white flex items-center justify-between border border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
                Campusnex University Examination Board
              </span>
              <h3 className="text-xl font-black tracking-tight mt-0.5">
                Mid-Semester Examination Admit Card (2026-27)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Office of the Controller of Examinations • Central Academic Registry
              </p>
            </div>

            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/20">
              <QrCode className="w-9 h-9" />
            </div>
          </div>

          {/* Student Profile Row */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Examinee Name</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{currentUser?.name}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">University Seat No (USN)</span>
              <p className="font-mono font-black text-brand-700 text-sm mt-0.5">
                {currentUser?.usn || currentUser?.roll_no || '1MS22CS101'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Department / Branch</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{myDept?.name || 'Computer Science'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Semester & Section</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                Semester {currentUser?.semester || 5} (Sec {currentUser?.section || 'A'})
              </p>
            </div>
          </div>

          {/* Examination Paper Schedule & Seat Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-black text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Timing</th>
                  <th className="py-2.5 px-3">Subject / Paper</th>
                  <th className="py-2.5 px-3">Exam Hall</th>
                  <th className="py-2.5 px-3 text-center">Seat No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {examsWithSeats.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold">{exam.exam_date}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatTimeRange(exam.start_time, exam.end_time)}</td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900">{exam.subject}</td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">{exam.assignedRoomName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-md">
                        {exam.seatNumber}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rules & Signatures */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-2">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Instructions to the Candidates:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Candidates must occupy their designated seats 15 minutes before the commencement of the exam.</li>
              <li>Candidates must not exchange seats or occupy adjacent seats assigned to other branches.</li>
              <li>Possession of mobile phones, smartwatches, or unauthorized study material is strictly prohibited.</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200 text-xs">
            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Candidate Signature</span>
            </div>

            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1" />
              <span className="text-[10px] text-slate-600 font-black uppercase">Controller of Examinations</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setIsHallTicketModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrintHallTicket}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Admit Card
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
