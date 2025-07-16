import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface HistoryItem {
  id: string;
  timestamp: string;
  transcript: string;
  analysis: string;
}

interface MeetingHistoryPopupProps {
  history: HistoryItem[];
  onClose: () => void;
}

export function MeetingHistoryPopup({ history, onClose }: MeetingHistoryPopupProps) {
  const [activeTabById, setActiveTabById] = useState<Record<string, 'transcript' | 'analysis'>>({});

  const toggleTab = (id: string, tab: 'transcript' | 'analysis') => {
    setActiveTabById((prev) => ({ ...prev, [id]: tab }));
  };

  const getActive = (id: string) => activeTabById[id] || 'transcript';

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative w-full max-w-5xl mx-4 mb-4 md:mb-0 bg-neutral-950/95 backdrop-blur-lg rounded-t-3xl md:rounded-3xl border border-neutral-800/50 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-800/50">
          <h2 className="text-xl font-medium font-mono-bold">Meeting History</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {history.length === 0 ? (
            <p className="text-slate-400 text-center font-mono-transcript">No past meetings stored.</p>
          ) : (
            history
              .slice()
              .reverse()
              .map((item, idx) => {
                const active = getActive(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-neutral-900/60 border border-neutral-800/50 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-mono-bold text-emerald-300">Meeting {history.length - idx}</h3>
                      <span className="text-xs text-slate-400 font-mono-transcript">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Tabs & copy */}
                    <div className="flex gap-3 mt-2 items-center">
                      {(['transcript', 'analysis'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => toggleTab(item.id, tab)}
                          className={`px-3 py-1 rounded-full text-sm font-mono-bold transition-colors ${
                            active === tab ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {tab === 'transcript' ? 'Transcript' : 'Analysis'}
                        </button>
                      ))}

                      {/* Copy button */}
                      <button
                        onClick={() => handleCopy(`${item.id}-${active}`, active === 'transcript' ? item.transcript : item.analysis)}
                        title={copiedKey === `${item.id}-${active}` ? 'Copied!' : 'Copy'}
                        className="ml-2 p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                        disabled={!(active === 'transcript' ? item.transcript : item.analysis)}
                      >
                        {copiedKey === `${item.id}-${active}` ? (
                          <Check className="w-4 h-4 text-emerald-400 animate-ping-slow" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {/* Panel */}
                    <div className="mt-3 max-h-60 overflow-y-auto scrollbar-thin">
                      {active === 'transcript' ? (
                        <pre className="whitespace-pre-wrap text-slate-100 font-mono-transcript text-sm leading-relaxed">
                          {item.transcript}
                        </pre>
                      ) : (
                        <pre className="whitespace-pre-wrap text-slate-100 font-mono-analysis text-sm leading-relaxed">
                          {item.analysis}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
} 