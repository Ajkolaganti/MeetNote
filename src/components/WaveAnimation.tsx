import React from 'react';

// Large ribbon-style sine waves that subtly move horizontally
export function WaveAnimation() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none">
      <img
        src="/ribbon-wave.svg"
        alt="background ribbon"
        className="w-[140vw] max-w-none animate-ringSpinPulse"
      />
    </div>
  );
}