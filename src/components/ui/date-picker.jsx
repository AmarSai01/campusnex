import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

/*
 * Date field that opens the shared Calendar in a popover.
 * Works with the same 'YYYY-MM-DD' strings a native <input type="date"> uses,
 * so it drops in where those were: value + onChange(string).
 *
 *   <DatePicker value={day} onChange={setDay} min="2026-11-01" />
 */

export function parseISODate(value) {
  if (!value) return undefined
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

export function toISODate(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatLabel = (date) =>
  date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disableDate,
  placeholder = 'Pick a date',
  required,
  disabled: isDisabled,
  className,
  id,
  name,
  weekStartsOn = 1,
  events,
  align = 'start',
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseISODate(value)
  const minDate = parseISODate(min)
  const maxDate = parseISODate(max)

  const outOfBounds = (date) =>
    (minDate && date < minDate) || (maxDate && date > maxDate) || (disableDate?.(date) ?? false)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <span className="relative block">
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            id={id}
            disabled={isDisabled}
            aria-label={ariaLabel ? `${ariaLabel}${selected ? `: ${formatLabel(selected)}` : ''}` : undefined}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs outline-none transition-colors',
              'hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
              open && 'border-brand-400 ring-2 ring-brand-500/30',
              className,
            )}
          >
            <CalendarDays className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className={cn('truncate', selected ? 'text-slate-900' : 'text-slate-400')}>
              {selected ? formatLabel(selected) : placeholder}
            </span>
          </button>
        </PopoverPrimitive.Trigger>
        {/* Keeps native form validation for required fields. */}
        {required && (
          <input
            tabIndex={-1}
            aria-hidden="true"
            name={name}
            required
            value={value || ''}
            onChange={() => {}}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
          />
        )}
      </span>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] rounded-2xl shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          <Calendar
            selected={selected}
            defaultMonth={selected ?? minDate}
            weekStartsOn={weekStartsOn}
            disabled={outOfBounds}
            events={events}
            onSelect={(date) => {
              if (!date) return // clicking the chosen day again keeps it
              onChange?.(toISODate(date))
              setOpen(false)
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

/*
 * Date + time field for 'YYYY-MM-DDTHH:mm' strings (what <input type="datetime-local"> uses).
 */
export function DateTimePicker({ value, onChange, min, required, className, timeClassName }) {
  const [datePart = '', timePart = ''] = (value || '').split('T')
  const emit = (d, t) => onChange?.(d ? `${d}T${t || '23:59'}` : '')
  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        <DatePicker value={datePart} min={min} required={required} className={className} onChange={(d) => emit(d, timePart)} />
      </div>
      <input
        type="time"
        aria-label="Time"
        value={timePart}
        onChange={(e) => emit(datePart, e.target.value)}
        className={cn(
          'w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500',
          timeClassName,
        )}
      />
    </div>
  )
}
