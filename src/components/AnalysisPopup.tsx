import React from 'react';
import { MessageCircle, Loader2, X } from 'lucide-react';

interface AnalysisPopupProps {
  analysis: string;
  isAnalyzing: boolean;
  onClose: () => void;
  onStartChat: () => void;
}

export function AnalysisPopup({ analysis, isAnalyzing, onClose, onStartChat }: AnalysisPopupProps) {
  const formatAnalysis = (text: string) => {
    // Convert markdown-style formatting to HTML-like structure for display
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return `<h1 key="${index}">${line.substring(2)}</h1>`;
        } else if (line.startsWith('## ')) {
          return `<h2 key="${index}">${line.substring(3)}</h2>`;
        } else if (line.startsWith('### ')) {
          return `<h3 key="${index}">${line.substring(4)}</h3>`;
        } else if (line.startsWith('- ')) {
          return `<li key="${index}">${line.substring(2)}</li>`;
        }
        return line;
      })
      .join('\n');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="relative w-full max-w-4xl mx-4 mb-4 md:mb-0 bg-neutral-950/95 backdrop-blur-lg rounded-t-3xl md:rounded-3xl border border-neutral-800/50 shadow-2xl max-h-[85vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <img src="/bot.png" alt="Bot" className="w-6 h-6" />
            <h2 className="text-xl font-medium font-mono-bold">AI Analysis</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
          {analysis ? (
            <>
            <div className="prose prose-invert max-w-none">
              <div className="text-slate-100 font-mono-analysis text-sm leading-relaxed">
                {analysis.split('\n').map((line, index) => {
                  // Handle headers
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <h3 key={index} className="text-lg font-mono-bold text-emerald-300 mt-6 mb-3">
                        {line.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  
                  // Handle code blocks
                  if (line.startsWith('```') || line.endsWith('```')) {
                    return null; // Skip markdown indicators
                  }
                  
                  // Handle inline code
                  if (line.includes('`')) {
                    const parts = line.split('`');
                    return (
                      <p key={index} className="mb-2">
                        {parts.map((part, i) => 
                          i % 2 === 0 ? (
                            <span key={i}>{part}</span>
                          ) : (
                            <code key={i} className="bg-slate-800 px-2 py-1 rounded text-emerald-300 font-mono-bold">
                              {part}
                            </code>
                          )
                        )}
                      </p>
                    );
                  }
                  
                  // Handle bullet points
                  if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="flex items-start gap-2 mb-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{line.substring(2)}</span>
                      </div>
                    );
                  }
                  
                  // Handle numbered lists
                  if (/^\d+\./.test(line)) {
                    return (
                      <div key={index} className="flex items-start gap-2 mb-2">
                        <span className="text-emerald-400 font-mono-bold">{line.match(/^\d+\./)?.[0]}</span>
                        <span>{line.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    );
                  }
                  
                  // Regular paragraphs
                  if (line.trim()) {
                    return (
                      <p key={index} className="mb-3">
                        {line}
                      </p>
                    );
                  }
                  
                  return <br key={index} />;
                })}
              </div>
            </div>
            {isAnalyzing && (
              <div className="flex items-center justify-center mt-6">
                <Loader2 className="w-6 h-6 mr-2 text-emerald-400 animate-spin" />
                <span className="text-slate-400 text-sm font-mono-transcript">Analyzing…</span>
              </div>
            )}
            </>
          ) : isAnalyzing ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-400 animate-spin" />
                <p className="text-slate-300 font-mono-transcript">Analyzing your meeting...</p>
                <p className="text-sm text-slate-400 mt-2 font-mono-transcript">This may take a few moments</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <img src="/bot.png" alt="Bot" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-mono-transcript">Your AI analysis will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {analysis && !isAnalyzing && (
          <div className="p-6 pt-4 border-t border-neutral-800/50">
            <button
              onClick={onStartChat}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium font-mono-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Ask Follow-up Questions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}