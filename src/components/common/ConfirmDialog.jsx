import React from 'react'
import Modal from './Modal'

// Asks before an action that is hard to undo. `request` is null when closed,
// or { title, message, confirmLabel, tone, onConfirm }.
export default function ConfirmDialog({ request, onClose }) {
  const danger = request?.tone !== 'neutral'

  const handleConfirm = () => {
    request.onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={Boolean(request)}
      onClose={onClose}
      title={request?.title || 'Are you sure?'}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-slate-600">{request?.message}</p>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`cursor-pointer rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition-colors ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {request?.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
