import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const MAX_WIDTH_MAP = {
  'max-w-sm': 'sm:max-w-sm',
  'max-w-md': 'sm:max-w-md',
  'max-w-lg': 'sm:max-w-lg',
  'max-w-xl': 'sm:max-w-xl',
  'max-w-2xl': 'sm:max-w-2xl',
  'max-w-3xl': 'sm:max-w-3xl',
  'max-w-4xl': 'sm:max-w-4xl',
  'max-w-5xl': 'sm:max-w-5xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  showClose = true,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={showClose}
        className={cn(
          'flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl',
          MAX_WIDTH_MAP[maxWidth] || maxWidth
        )}
      >
        <DialogHeader className="border-b border-border bg-muted/40 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          {subtitle ? (
            <DialogDescription className="text-sm text-muted-foreground">
              {subtitle}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Dialog content
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
