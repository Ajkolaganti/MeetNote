import React from 'react';

export function WaveAnimation() {
  return (
    <div className="relative w-full max-w-md h-32 flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-green-600/20 animate-pulse"></div>
        
        {/* Wave bars */}
        <div className="flex items-center justify-center h-full gap-1 px-8">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-green-400 to-emerald-400 rounded-full animate-pulse"
              style={{
                width: '2px',
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${1.5 + Math.random()}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}