import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  detailItems?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  detailItems,
  confirmLabel = 'Confirm & Proceed',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 text-stone-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isDestructive ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="modal-headline" className="text-lg font-bold text-stone-900 leading-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-stone-600 leading-relaxed">{message}</p>

        {detailItems && detailItems.length > 0 && (
          <div className="mt-3 max-h-36 overflow-y-auto bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-700 space-y-1">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#0284c7] hover:bg-[#0369a1]'
            }`}
          >
            {isLoading ? 'Updating...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
