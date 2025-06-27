import React from 'react';
import { X } from 'lucide-react';

interface HistoryPopupProps {
  analyses: string[];
  onClose: () => void;
}

export function HistoryPopup({ analyses, onClose }: HistoryPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popup Content */}
      <div className="relative w-full max-w-4xl mx-4 mb-4 md:mb-0 bg-neutral-950/95 backdrop-blur-lg rounded-t-3xl md:rounded-3xl border border-neutral-800/50 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-800/50">
          <h2 className="text-xl font-medium font-mono-bold">Previous Analyses</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {analyses.length === 0 ? (
            <p className="text-slate-400 text-center font-mono-transcript">No analyses yet.</p>
          ) : (
            analyses.map((analysis, idx) => (
              <div key={idx} className="bg-neutral-900/60 border border-neutral-800/50 rounded-2xl p-4">
                <h3 className="text-lg font-mono-bold mb-3 text-emerald-300">Analysis {idx + 1}</h3>
                <p className="text-slate-100 font-mono-analysis text-sm whitespace-pre-wrap leading-relaxed">
                  {analysis}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 