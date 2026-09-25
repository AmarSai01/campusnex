import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Sparkles,
  MapPin
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import StatCard from '../common/StatCard';

export default function RoomManagement() {
  const { currentUser } = useAuth();
  const {
    exam_rooms = [],
    exam_seating_plans = [],
    createExamRoom,
    updateExamRoom,
    deleteExamRoom
  } = useData();

  const isAdmin = currentUser?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    capacity: 30,
    building: 'Main Academic Block',
    floor: '1st Floor',
    status: 'active'
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Extract unique buildings for filter
  const buildings = ['All', ...Array.from(new Set(exam_rooms.map(r => r.building).filter(Boolean)))];

  const filteredRooms = exam_rooms.filter(room => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.room_number && room.room_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (room.building && room.building.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBuilding = filterBuilding === 'All' || room.building === filterBuilding;
    return matchesSearch && matchesBuilding;
  });

  const totalCapacity = exam_rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
  const avgCapacity = exam_rooms.length > 0 ? Math.round(totalCapacity / exam_rooms.length) : 0;
  const activeRoomsCount = exam_rooms.filter(r => r.status === 'active').length;

  const handleOpenCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      room_number: '',
      capacity: 30,
      building: 'Main Academic Block',
      floor: '1st Floor',
      status: 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      room_number: room.room_number || room.name,
      capacity: room.capacity || 30,
      building: room.building || 'Main Academic Block',
      floor: room.floor || '1st Floor',
      status: room.status || 'active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!formData.name.trim()) {
        throw new Error('Room name / number is required.');
      }
      const cap = Number(formData.capacity);
      if (isNaN(cap) || cap <= 0) {
        throw new Error('Capacity must be a positive number (e.g. 30, 35, 40).');
      }

      if (editingRoom) {
        updateExamRoom(editingRoom.id, formData, currentUser?.id);
        setSuccessToast(`Room "${formData.name}" successfully updated.`);
      } else {
        createExamRoom(formData, currentUser?.id);
        setSuccessToast(`Exam Hall "${formData.name}" (Capacity: ${formData.capacity}) added successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = () => {
    if (!deleteConfirmRoom) return;
    try {
      deleteExamRoom(deleteConfirmRoom.id, currentUser?.role);
      setSuccessToast(`Room "${deleteConfirmRoom.name}" has been deleted.`);
      setDeleteConfirmRoom(null);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message);
    }
  };

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

      {/* Admin vs Faculty banner */}
      {!isAdmin && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-amber-900">Shared Infrastructure Notice</p>
            <p className="text-amber-700">
              Exam halls and rooms are central institutional facilities managed by the Administrator. Faculty can view available halls and variable capacities when planning department seating.
            </p>
          </div>
        </div>
      )}

      {/* Header and Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Exam Halls"
          value={exam_rooms.length}
          subtitle="Registered test centers"
          icon={Building2}
          iconBg="bg-brand-50 text-brand-600 border-brand-100"
        />
        <StatCard
          title="Aggregate Capacity"
          value={totalCapacity}
          subtitle="Total examinee seats"
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600 border-indigo-100"
        />
        <StatCard
          title="Average Hall Capacity"
          value={`${avgCapacity} Seats`}
          subtitle="Variable sizing (30–60)"
          icon={Layers}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <StatCard
          title="Active Centers"
          value={activeRoomsCount}
          subtitle="Ready for exam seating"
          icon={Sparkles}
          iconBg="bg-sky-50 text-sky-600 border-sky-100"
        />
      </div>

      {/* Control Bar: Search, Filters & Add Room Button */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by hall name, number, building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Building:</span>
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            >
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all duration-150 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Exam Hall
          </button>
        )}
      </div>

      {/* Rooms Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const capacity = Number(room.capacity) || 30;
          const assignedPlans = exam_seating_plans.filter(p => p.room_id === room.id);

          return (
            <div
              key={room.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card transition-all duration-200 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                      {room.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        {room.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        Hall No: {room.room_number || room.name}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={room.status === 'active' ? 'success' : 'neutral'}
                    size="sm"
                    dot
                  >
                    {room.status === 'active' ? 'Operational' : 'Maintenance'}
                  </Badge>
                </div>

                {/* Capacity Visual Box */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Variable Hall Capacity
                    </span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {capacity} <span className="text-xs font-semibold text-slate-500">Desks / Seats</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                      Split: {Math.ceil(capacity / 2)} + {Math.floor(capacity / 2)}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Group 1 & 2 quota</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{room.building} • {room.floor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Assigned to {assignedPlans.length} active seating plan(s)</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Audit metadata & actions */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400">
                <span title={`Updated: ${new Date(room.updated_at || room.created_at || '2026-08-01').toLocaleString()}`}>
                  Updated: {new Date(room.updated_at || room.created_at || '2026-08-01').toLocaleDateString()}
                </span>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                      title="Edit Room"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setFormError('');
                        setDeleteConfirmRoom(room);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredRooms.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Examination Halls Found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'Try matching another search term or filter.' : 'Add your first exam hall to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Exam Hall: ${editingRoom.name}` : 'Add New Examination Room / Hall'}
        subtitle="Configure hall number, variable capacity, and venue location for exam scheduling."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hall Name / Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. LH-101, Audi-1, Exam Hall 3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Number / Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. LH-101, Room 304"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hall Capacity (Variable Desks) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="e.g. 30, 35, 40"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Auto-splits proportionally between 2 branches during seating (e.g. 30 → 15+15, 35 → 18+17).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="active">Active (Available for exams)</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Building / Block
              </label>
              <input
                type="text"
                placeholder="e.g. Main Academic Block, Tech Tower"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Floor / Wing
              </label>
              <input
                type="text"
                placeholder="e.g. 1st Floor, North Wing"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              {editingRoom ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmRoom)}
        onClose={() => setDeleteConfirmRoom(null)}
        title="Confirm Hall Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete exam hall <strong className="text-slate-900">{deleteConfirmRoom?.name}</strong> (Capacity: {deleteConfirmRoom?.capacity})?
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setDeleteConfirmRoom(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              Yes, Delete Hall
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
