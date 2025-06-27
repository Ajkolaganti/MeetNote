import React, { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

interface TranscriptDisplayProps {
  transcript: string;
  isRecording: boolean;
  audioLevel: number;
}

export function TranscriptDisplay({ transcript, isRecording, audioLevel }: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 mb-4">
        <Volume2 className="w-5 h-5 text-emerald-400" />
        <span className="text-sm text-slate-300 font-mono-bold">Live Transcript</span>
        
        {/* Audio level indicator */}
        <div className="flex-1 flex items-center gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-4 rounded-full transition-colors ${
                i < audioLevel * 20 
                  ? 'bg-emerald-400' 
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-neutral-900/60 rounded-2xl p-6 overflow-y-auto border border-neutral-800/50 backdrop-blur-sm scrollbar-thin min-h-0"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {transcript ? (
          <div className="space-y-4">
            <div className="text-slate-100 leading-relaxed whitespace-pre-wrap font-mono-transcript text-base">
              {transcript}
            </div>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono-bold">Listening...</span>
                <div className="typing-indicator ml-2">
                  <span className="inline-block w-1 h-1 bg-emerald-400 rounded-full"></span>
                  <span className="inline-block w-1 h-1 bg-emerald-400 rounded-full ml-1"></span>
                  <span className="inline-block w-1 h-1 bg-emerald-400 rounded-full ml-1"></span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-mono-transcript">Start speaking to see live transcript...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}