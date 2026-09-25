import React from 'react';

export default function Skeleton({ className = '', variant = 'rect' }) {
  const base = 'animate-pulse bg-slate-200/80';
  const rounded = variant === 'circle' ? 'rounded-full' : variant === 'card' ? 'rounded-2xl' : 'rounded-lg';

  return <div className={`${base} ${rounded} ${className}`} />;
}
