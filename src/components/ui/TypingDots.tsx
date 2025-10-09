"use client";

import React from 'react';

export default function TypingDots({ size = 'md', color = 'green' }: { size?: 'sm' | 'md' | 'lg'; color?: 'green' | 'blue' | 'white' }) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  const gap = size === 'sm' ? 'gap-1' : 'gap-2';
  const bg = color === 'blue' ? 'bg-blue-600' : color === 'white' ? 'bg-white' : 'bg-green-500';

  return (
    <div className="inline-flex items-center px-3 py-2 rounded-2xl bg-white shadow-sm">
      <div className={`flex items-center ${gap}`}>
        <span className={`${dotSize} ${bg} rounded-full animate-bounce`} style={{ animationDelay: '0s' }} />
        <span className={`${dotSize} ${bg} rounded-full animate-bounce`} style={{ animationDelay: '0.12s' }} />
        <span className={`${dotSize} ${bg} rounded-full animate-bounce`} style={{ animationDelay: '0.24s' }} />
      </div>
    </div>
  );
}
