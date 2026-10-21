import React from 'react';
import { AlertCircle, FileText, ArrowRight, X } from 'lucide-react';
import { ContestSongEntry } from '../types/contest';

interface DuplicateUploadModalProps {
  isOpen: boolean;
  duplicateSong: ContestSongEntry | null;
  uploadedFileName?: string;
  onConfirmGrade: (song: ContestSongEntry) => void;
  onClose: () => void;
}

export const DuplicateUploadModal: React.FC<DuplicateUploadModalProps> = ({
  isOpen,
  duplicateSong,
  uploadedFileName,
  onConfirmGrade,
  onClose,
}) => {
  if (!isOpen || !duplicateSong) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-sky-200 shadow-2xl p-6 text-stone-900">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
            <AlertCircle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Duplicate Entry Detected
          </span>
          <h3 className="text-xl font-bold text-stone-900">
            Song Already Uploaded!
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            The submission you uploaded{uploadedFileName ? ` ("${uploadedFileName}")` : ''} matches a song that has already been registered in the contest system.
          </p>
        </div>

        {/* Existing Song Card */}
        <div className="mt-4 p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-left">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-sky-800 font-semibold">Registered Contest Entry</div>
              <div className="text-base font-bold text-stone-900 truncate">
                {duplicateSong.songTitle}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">
                Artist: <span className="font-semibold text-stone-800">{duplicateSong.alias || 'Unknown'}</span>
                {duplicateSong.discordUsername && (
                  <span className="text-stone-500 ml-1.5 font-mono text-[11px]">
                    (@{duplicateSong.discordUsername})
                  </span>
                )}
              </div>
            </div>
          </div>

          {duplicateSong.storyConcept && (
            <div className="mt-2.5 text-[11px] text-stone-500 bg-white/70 rounded-lg p-2 border border-sky-100 line-clamp-2">
              <span className="font-bold text-stone-700">Concept:</span> {duplicateSong.storyConcept}
            </div>
          )}
        </div>

        <p className="text-xs text-stone-500 mt-3 text-center">
          To prevent duplicate entries and score splitting, you will now score this registered entry instead.
        </p>

        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmGrade(duplicateSong);
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <span>Grade This Song</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
