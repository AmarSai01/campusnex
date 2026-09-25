import React from 'react';

const VARIANT_STYLES = {
  primary: 'bg-brand-50 text-brand-700 border-brand-200/60 ring-1 ring-brand-500/10',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-1 ring-emerald-500/10',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-1 ring-amber-500/10',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-1 ring-rose-500/10',
  info: 'bg-sky-50 text-sky-700 border-sky-200/60 ring-1 ring-sky-500/10',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/60',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/60 ring-1 ring-purple-500/10',
};

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-xs font-medium',
  md: 'px-2.5 py-1 text-xs font-semibold',
  lg: 'px-3 py-1.5 text-sm font-semibold',
};

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;

  const dotColors = {
    primary: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs transition-colors ${variantClass} ${sizeClass} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`}
        />
      )}
      {children}
    </span>
  );
}
