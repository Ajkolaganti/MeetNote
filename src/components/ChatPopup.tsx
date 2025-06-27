import React, { useState, useRef, useEffect } from 'react';
import { Send, User, X, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPopupProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  isRecording: boolean;
}

export function ChatPopup({ messages, onSendMessage, onClose, isRecording }: ChatPopupProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => {
      // Handle code blocks
      if (line.includes('`')) {
        const parts = line.split('`');
        return (
          <div key={index} className="mb-2">
            {parts.map((part, i) => 
              i % 2 === 0 ? (
                <span key={i}>{part}</span>
              ) : (
                <code key={i} className="bg-neutral-800 px-2 py-1 rounded text-emerald-300 font-mono-bold text-sm">
                  {part}
                </code>
              )
            )}
          </div>
        );
      }
      
      // Handle bullet points
      if (line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-1">
            <span className="text-emerald-400 mt-1">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      
      // Regular lines
      if (line.trim()) {
        return <div key={index} className="mb-2">{line}</div>;
      }
      
      return <br key={index} />;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Popup Content */}
      <div className="relative w-full max-w-4xl mx-4 mb-4 md:mb-0 bg-neutral-950/95 backdrop-blur-lg rounded-t-3xl md:rounded-3xl border border-neutral-800/50 shadow-2xl max-h-[85vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-neutral-800/50">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-medium font-mono-bold">Ask Questions</h2>
            {isRecording && (
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono-bold">Recording</span>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin min-h-0">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-neutral-400">
                <img src="/bot.png" alt="Bot" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-mono-transcript">Ask me anything about your meeting!</p>
                <p className="text-sm mt-2 font-mono-transcript">I can explain technical details, provide code examples, or clarify any concepts.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <img src="/bot.png" alt="Bot" className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-900 text-neutral-100 border border-neutral-800'
                    }`}
                  >
                    <div className="font-mono-analysis text-sm leading-relaxed">
                      {formatMessage(message.content)}
                    </div>
                    <div className="text-xs opacity-70 mt-2 font-mono-transcript">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 pt-0 border-t border-neutral-800/50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about the meeting..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono-transcript"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}