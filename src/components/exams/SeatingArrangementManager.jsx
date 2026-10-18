import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Printer,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Maximize2,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

export default function SeatingArrangementManager() {
  const { currentUser } = useAuth();
  const {
    departments = [],
    exam_rooms = [],
    exam_timetables = [],
    exam_seating_plans = [],
    generateExamSeatingPlan,
    deleteExamSeatingPlan
  } = useData();

  const isAdmin = currentUser?.role === 'admin';
  const isFaculty = currentUser?.role === 'faculty';
  const facultyDeptId = currentUser?.department_id;
  // Faculty can only arrange seating for their own department's exams.
  const schedulableExams = isFaculty
    ? exam_timetables.filter(e => e.department_id === facultyDeptId)
    : exam_timetables;

  const [selectedPlanId, setSelectedPlanId] = useState(
    exam_seating_plans[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'roster'
  const [filterExamId, setFilterExamId] = useState('All');

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState(null);
  const [selectedSeatDetail, setSelectedSeatDetail] = useState(null);

  // Form State for Generating Seating
  const [formData, setFormData] = useState({
    exam_id: exam_timetables[0]?.id || '',
    room_ids: exam_rooms[0]?.id ? [exam_rooms[0].id] : [],
    multiRoomMode: false,
    group1_dept: isFaculty && facultyDeptId ? facultyDeptId : (departments[0]?.id || 'dept_cse'),
    group1_section: 'A',
    group1_sem: 5,
    group2_dept: departments[1]?.id || 'dept_cd',
    group2_section: 'A',
    group2_sem: 5
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Selected seating plan
  const currentPlan =
    exam_seating_plans.find(p => p.id === selectedPlanId) ||
    exam_seating_plans[0] ||
    null;

  const currentExam = exam_timetables.find(e => e.id === currentPlan?.exam_id);

  // Filter plans based on role & filter
  const visiblePlans = exam_seating_plans.filter(plan => {
    const matchesExam = filterExamId === 'All' || plan.exam_id === filterExamId;
    if (isFaculty && facultyDeptId) {
      const isDeptInvolved =
        plan.department_id === facultyDeptId ||
        (plan.department_ids && plan.department_ids.includes(facultyDeptId)) ||
        plan.group1?.department_id === facultyDeptId ||
        plan.group2?.department_id === facultyDeptId;
      return matchesExam && isDeptInvolved;
    }
    return matchesExam;
  });

  const handleOpenGenerateModal = () => {
    const defaultExam = schedulableExams[0];
    const initialDept1 = isFaculty && facultyDeptId ? facultyDeptId : (departments[0]?.id || 'dept_cse');
    const initialDept2 = departments.find(d => d.id !== initialDept1)?.id || initialDept1;

    setFormData({
      exam_id: defaultExam?.id || '',
      room_ids: defaultExam?.room_ids?.length ? defaultExam.room_ids : (exam_rooms[0]?.id ? [exam_rooms[0].id] : []),
      multiRoomMode: (defaultExam?.room_ids?.length || 0) > 1,
      group1_dept: initialDept1,
      group1_section: 'A',
      group1_sem: defaultExam?.semester || 5,
      group2_dept: initialDept2,
      group2_section: initialDept1 === initialDept2 ? 'B' : 'A',
      group2_sem: defaultExam?.semester || 5
    });
    setFormError('');
    setIsGenerateModalOpen(true);
  };

  const handleExamChangeInModal = (examId) => {
    const exam = exam_timetables.find(e => e.id === examId);
    if (exam) {
      setFormData(prev => ({
        ...prev,
        exam_id: examId,
        room_ids: exam.room_ids?.length ? exam.room_ids : prev.room_ids,
        multiRoomMode: (exam.room_ids?.length || 0) > 1,
        group1_dept: isFaculty && facultyDeptId ? facultyDeptId : (exam.department_id || prev.group1_dept),
        group1_sem: exam.semester || prev.group1_sem,
        group2_sem: exam.semester || prev.group2_sem
      }));
    }
  };

  const handleToggleRoomInModal = (roomId) => {
    setFormData(prev => {
      if (!prev.multiRoomMode) {
        return { ...prev, room_ids: [roomId] };
      }
      const exists = prev.room_ids.includes(roomId);
      const updated = exists
        ? prev.room_ids.filter(id => id !== roomId)
        : [...prev.room_ids, roomId];
      return { ...prev, room_ids: updated };
    });
  };

  const handleGenerateSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!formData.exam_id) throw new Error('Please select an examination.');
      if (!formData.room_ids || formData.room_ids.length === 0) {
        throw new Error('Please select at least one examination hall.');
      }
      if (!formData.group1_dept || !formData.group2_dept) {
        throw new Error('Please choose two groups (branches/sections) to combine.');
      }
      if (
        formData.group1_dept === formData.group2_dept &&
        formData.group1_section === formData.group2_section
      ) {
        throw new Error('Group 1 and Group 2 cannot be identical (e.g. CSE-A and CSE-A). Choose different sections or branches.');
      }

      const dept1 = departments.find(d => d.id === formData.group1_dept);
      const dept2 = departments.find(d => d.id === formData.group2_dept);

      const plans = generateExamSeatingPlan(
        {
          exam_id: formData.exam_id,
          room_ids: formData.room_ids,
          group1: {
            department_id: formData.group1_dept,
            branch: dept1?.code || 'BR1',
            semester: formData.group1_sem,
            section: formData.group1_section
          },
          group2: {
            department_id: formData.group2_dept,
            branch: dept2?.code || 'BR2',
            semester: formData.group2_sem,
            section: formData.group2_section
          }
        },
        currentUser?.id,
        currentUser?.role,
        facultyDeptId
      );

      if (plans && plans.length > 0) {
        setSelectedPlanId(plans[0].id);
      }

      setIsGenerateModalOpen(false);
      setSuccessToast(
        `Seating arrangement generated for ${formData.room_ids.length} room(s) with alternating branch placement!`
      );
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeletePlan = () => {
    if (!deleteConfirmPlan) return;
    try {
      deleteExamSeatingPlan(deleteConfirmPlan.id, currentUser?.role);
      setSuccessToast(`Seating arrangement for "${deleteConfirmPlan.room_name}" deleted.`);
      setDeleteConfirmPlan(null);
      if (selectedPlanId === deleteConfirmPlan.id) {
        setSelectedPlanId(exam_seating_plans.find(p => p.id !== deleteConfirmPlan.id)?.id || '');
      }
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Preview calculations for the modal
  const selectedRoomsList = exam_rooms.filter(r => formData.room_ids.includes(r.id));
  const totalModalCapacity = selectedRoomsList.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            Exam Hall Seating Plan & Visual Arrangement
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Combines two branch groups per room, proportionally splits capacity, and alternates desks to prevent adjacent same-branch seating.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Print Official Examination Hall Door Roster"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Door Chart
          </button>

          {(isAdmin || isFaculty) && (
            <button
              onClick={handleOpenGenerateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Generate Seating Plan
            </button>
          )}
        </div>
      </div>

      {/* Plans Navigation Bar: Horizontal Room / Exam Switcher */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <select
            value={filterExamId}
            onChange={(e) => {
              setFilterExamId(e.target.value);
              const firstMatching = exam_seating_plans.find(
                p => e.target.value === 'All' || p.exam_id === e.target.value
              );
              if (firstMatching) setSelectedPlanId(firstMatching.id);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All Exams</option>
            {exam_timetables.map(e => (
              <option key={e.id} value={e.id}>{e.subject}</option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
            Halls:
          </span>

          {visiblePlans.map(plan => {
            const isSelected = plan.id === selectedPlanId;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{plan.room_name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {plan.capacity} Seats
                </span>
              </button>
            );
          })}

          {visiblePlans.length === 0 && (
            <span className="text-xs text-slate-400 italic px-2">
              No seating arrangements found. Click "Generate Seating Plan" to create one.
            </span>
          )}
        </div>

        {/* View Toggle */}
        {currentPlan && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Visual Grid
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Seat Roster
            </button>
          </div>
        )}
      </div>

      {/* Main Display for Selected Seating Plan */}
      {currentPlan ? (
        <div className="space-y-6">
          {/* Hall Meta Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-lg font-black text-slate-900">
                  {currentPlan.room_name}
                </span>
                <Badge variant="primary" size="sm">
                  Variable Capacity: {currentPlan.capacity} Seats
                </Badge>
                {currentExam && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {currentExam.subject}
                  </span>
                )}
              </div>

              {currentExam && (
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    {new Date(currentExam.exam_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {currentExam.start_time} – {currentExam.end_time}
                  </span>
                </div>
              )}
            </div>

            {/* Alternating Groups Legend */}
            <div className="flex items-center gap-3">
              {/* Group 1 Tag */}
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Group 1: {currentPlan.group1?.branch} - Sec {currentPlan.group1?.section}</span>
                </div>
                <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                  Quota: {currentPlan.group1?.allocated_count || Math.ceil(currentPlan.capacity / 2)} Seats
                </p>
              </div>

              {/* Group 2 Tag */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Group 2: {currentPlan.group2?.branch} - Sec {currentPlan.group2?.section}</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  Quota: {currentPlan.group2?.allocated_count || Math.floor(currentPlan.capacity / 2)} Seats
                </p>
              </div>

              {/* Admin delete plan */}
              {isAdmin && (
                <button
                  onClick={() => setDeleteConfirmPlan(currentPlan)}
                  className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Delete this seating arrangement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: Visual Hall Grid */}
          {activeTab === 'grid' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-brand-600" />
                    Examination Hall Seating Layout (Alternating Branches)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Front of Hall / Invigilator Podium is at the top. Desks alternate between {currentPlan.group1?.branch} and {currentPlan.group2?.branch}.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-blue-600" />
                    <span>{currentPlan.group1?.branch}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-600" />
                    <span>{currentPlan.group2?.branch}</span>
                  </div>
                </div>
              </div>

              {/* Podium Indicator */}
              <div className="w-full py-2 mb-6 bg-slate-100 rounded-xl border border-slate-200 text-center text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                — INVIGILATOR STAGE / BLACKBOARD —
              </div>

              {/* Desks Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {(currentPlan.seats || []).map((seat) => {
                  const isGrp1 = seat.group === 1;
                  return (
                    <div
                      key={seat.seat_number}
                      onClick={() => setSelectedSeatDetail(seat)}
                      className={`relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-left hover:scale-[1.02] shadow-2xs ${
                        isGrp1
                          ? 'bg-blue-50/60 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                          : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                    >
                      {/* Seat Top Bar */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            isGrp1
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-emerald-600 text-white shadow-2xs'
                          }`}
                        >
                          {seat.seat_number}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                            isGrp1
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {seat.branch} • {seat.section}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="mt-2 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {seat.student_name}
                        </p>
                        <p className="text-[11px] font-mono font-semibold text-slate-500 mt-0.5 truncate">
                          {seat.usn}
                        </p>
                      </div>

                      {/* Coordinate */}
                      <div className="mt-2.5 pt-1.5 border-t border-slate-200/40 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Row {seat.bench_row}, Desk {seat.bench_col}</span>
                        <span className="font-semibold">{isGrp1 ? 'Left Desk' : 'Right Desk'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Notice */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  Adjacent desks strictly alternate branches to maintain examination integrity.
                </span>
                <span className="font-bold text-slate-700">
                  Total Allocated: {currentPlan.seats?.length || 0} / {currentPlan.capacity} Seats
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Table Roster */}
          {activeTab === 'roster' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Examination Attendance & Seating Roster
                </h4>
                <Badge variant="primary" size="md">
                  {currentPlan.seats?.length || 0} Examinees Registered
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Seat No</th>
                      <th className="py-3 px-4">Student USN</th>
                      <th className="py-3 px-4">Candidate Name</th>
                      <th className="py-3 px-4">Branch & Sec</th>
                      <th className="py-3 px-4">Bench Position</th>
                      <th className="py-3 px-4">Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(currentPlan.seats || []).map((seat) => {
                      const isGrp1 = seat.group === 1;
                      return (
                        <tr key={seat.seat_number} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-900">
                            {seat.seat_number}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-brand-700">
                            {seat.usn}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {seat.student_name}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                isGrp1
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {seat.branch} (Sec {seat.section})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            Row {seat.bench_row}, Col {seat.bench_col}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            Group {seat.group}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">No Seating Plans Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Choose an exam and select a room with two branch groups to generate a synchronized seating arrangement.
          </p>
          {(isAdmin || isFaculty) && (
            <button
              onClick={handleOpenGenerateModal}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Generate First Plan
            </button>
          )}
        </div>
      )}

      {/* Generate Seating Arrangement Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Examination Seating Arrangement"
        subtitle="Select a room and choose two branch+section groups. Capacity will be split proportionally with alternating seat numbers."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Step 1: Select Exam */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Scheduled Exam <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.exam_id}
              onChange={(e) => handleExamChangeInModal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20"
              required
            >
              <option value="">-- Choose Exam --</option>
              {schedulableExams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.subject} ({exam.exam_date} • {exam.start_time}-{exam.end_time})
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Room Mode Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Support Multiple Rooms per Exam</p>
              <p className="text-[11px] text-slate-500">
                Enable if total examinees exceed a single room's capacity.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.multiRoomMode}
                onChange={(e) => {
                  const isMulti = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    multiRoomMode: isMulti,
                    room_ids: isMulti ? prev.room_ids : (prev.room_ids.slice(0, 1))
                  }));
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Step 2: Choose Room(s) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Select Exam Room(s) / Hall(s) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Selected Capacity: {totalModalCapacity} Seats
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
              {exam_rooms.map(room => {
                const isSelected = formData.room_ids.includes(room.id);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleToggleRoomInModal(room.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs">{room.name}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        Cap: {room.capacity}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Choose 2 Branch+Section Groups */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-brand-600" />
              Choose Two Branch + Section Groups to Combine
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Group 1 */}
              <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2">
                <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Group 1 (Primary Branch)
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Department</label>
                  <select
                    value={formData.group1_dept}
                    onChange={(e) => setFormData({ ...formData, group1_dept: e.target.value })}
                    disabled={isFaculty}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Section</label>
                    <select
                      value={formData.group1_section}
                      onChange={(e) => setFormData({ ...formData, group1_section: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Semester</label>
                    <select
                      value={formData.group1_sem}
                      onChange={(e) => setFormData({ ...formData, group1_sem: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2 */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Group 2 (Paired Branch)
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Department</label>
                  <select
                    value={formData.group2_dept}
                    onChange={(e) => setFormData({ ...formData, group2_dept: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Section</label>
                    <select
                      value={formData.group2_section}
                      onChange={(e) => setFormData({ ...formData, group2_section: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Semester</label>
                    <select
                      value={formData.group2_sem}
                      onChange={(e) => setFormData({ ...formData, group2_sem: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Split breakdown banner */}
            <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
              <div>
                <span className="font-extrabold">Proportional Quota Breakdown:</span>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Alternating desk order: S-01 (Grp 1), S-02 (Grp 2), S-03 (Grp 1)...
                </p>
              </div>
              <div className="text-right">
                <span className="font-black text-sm">
                  {Math.ceil(totalModalCapacity / 2)} + {Math.floor(totalModalCapacity / 2)}
                </span>
                <p className="text-[10px] text-indigo-600">Total: {totalModalCapacity} Seats</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 cursor-pointer"
            >
              Generate & Publish Seating
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmPlan)}
        onClose={() => setDeleteConfirmPlan(null)}
        title="Confirm Seating Plan Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete the seating arrangement for <strong className="text-slate-900">{deleteConfirmPlan?.room_name}</strong>?
            Students allotted seats in this hall will be unassigned.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setDeleteConfirmPlan(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeletePlan}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              Yes, Delete Seating Plan
            </button>
          </div>
        </div>
      </Modal>

      {/* Desk Details Inspect Modal */}
      <Modal
        isOpen={Boolean(selectedSeatDetail)}
        onClose={() => setSelectedSeatDetail(null)}
        title={`Seat Allocation: ${selectedSeatDetail?.seat_number}`}
        subtitle="Detailed candidate examination profile"
      >
        {selectedSeatDetail && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white ${
                  selectedSeatDetail.group === 1 ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {selectedSeatDetail.branch}
              </div>
              <div>
                <h5 className="font-bold text-slate-900 text-sm">{selectedSeatDetail.student_name}</h5>
                <p className="font-mono text-slate-500 font-semibold">{selectedSeatDetail.usn}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Exam Seat Number</span>
                <p className="text-base font-black text-brand-600 mt-0.5">{selectedSeatDetail.seat_number}</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bench Grid Coordinates</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  Row {selectedSeatDetail.bench_row}, Column {selectedSeatDetail.bench_col}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Branch</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {selectedSeatDetail.branch} (Section {selectedSeatDetail.section})
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Group</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  Group {selectedSeatDetail.group}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedSeatDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
