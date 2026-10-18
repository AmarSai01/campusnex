import React from 'react'
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function Skeleton({ className = '', variant = 'rect' }) {
  return (
    <ShadcnSkeleton
      className={cn(
        variant === 'circle' && 'rounded-full',
        variant === 'card' && 'rounded-2xl',
        variant === 'rect' && 'rounded-lg',
        className
      )}
    />
  )
}
