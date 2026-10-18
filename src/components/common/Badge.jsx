import React from 'react'
import { Badge as ShadcnBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const VARIANT_STYLES = {
  primary: 'border-brand-200/60 bg-brand-50 text-brand-700 ring-1 ring-brand-500/10',
  success: 'border-emerald-200/60 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/10',
  warning: 'border-amber-200/60 bg-amber-50 text-amber-700 ring-1 ring-amber-500/10',
  danger: 'border-rose-200/60 bg-rose-50 text-rose-700 ring-1 ring-rose-500/10',
  info: 'border-sky-200/60 bg-sky-50 text-sky-700 ring-1 ring-sky-500/10',
  neutral: 'border-slate-200/60 bg-slate-100 text-slate-700',
  purple: 'border-purple-200/60 bg-purple-50 text-purple-700 ring-1 ring-purple-500/10',
}

const SIZE_STYLES = {
  sm: 'h-auto px-2 py-0.5 text-xs font-medium',
  md: 'h-auto px-2.5 py-1 text-xs font-semibold',
  lg: 'h-auto px-3 py-1.5 text-sm font-semibold',
}

const DOT_COLORS = {
  primary: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  purple: 'bg-purple-500',
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
}) {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        VARIANT_STYLES[variant] || VARIANT_STYLES.neutral,
        SIZE_STYLES[size] || SIZE_STYLES.md,
        'rounded-full shadow-xs',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            DOT_COLORS[variant] || 'bg-slate-400'
          )}
        />
      )}
      {children}
    </ShadcnBadge>
  )
}
