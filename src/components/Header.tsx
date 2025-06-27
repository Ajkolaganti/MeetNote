import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
}

export function Header({ onBack }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-6 pb-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex items-center gap-3">
          <img src="/MeetTalkLogo.png" alt="MeetTalk logo" className="w-8 h-8 rounded" />
          <h1 className="text-xl font-light tracking-wide">
            MeetTalk
          </h1>
        </div>
      </div>
    </header>
  );
}