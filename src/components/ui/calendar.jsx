import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
 * Calendar with single / range / multiple selection, booked (struck-through) dates,
 * event dots and a quick month/year jump view.
 *
 * Props:
 *   mode            'single' | 'range' | 'multiple' (default 'single')
 *   selected        Date | Date[] | { from, to }  (controlled)
 *   defaultSelected same shapes (uncontrolled)
 *   onSelect        (value) => void
 *   month / defaultMonth / onMonthChange
 *   weekStartsOn    0 (Sunday) | 1 (Monday)
 *   disabled        (date) => boolean
 *   bookedDates     Date[]
 *   events          { date, label }[]
 *   quickNav        boolean (default true)
 */

const EASE_OUT = [0.23, 1, 0.32, 1]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_LABELS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAY_LABELS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const HOVER = 'hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
const SELECTED_SOFT = 'bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]'
const RING = 'focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_55%,transparent)]'

function isSameDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function isBefore(a, b) {
  return startOfDay(a).getTime() < startOfDay(b).getTime()
}
function isWithinRange(date, range) {
  if (!range?.from || !range?.to) return false
  const t = startOfDay(date).getTime()
  const from = startOfDay(range.from).getTime()
  const to = startOfDay(range.to).getTime()
  return t > Math.min(from, to) && t < Math.max(from, to)
}
function buildMonthGrid(month, weekStartsOn) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const weekday = first.getDay()
  const leading = weekStartsOn === 1 ? (weekday + 6) % 7 : weekday
  const start = new Date(first)
  start.setDate(start.getDate() - leading)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function QuickNavTooltip({ label, disabled, children }) {
  if (disabled) return children
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap',
          'rounded-md bg-foreground px-1.5 py-0.5 text-[10.5px] font-medium text-background',
          'origin-top scale-95 opacity-0 transition-[opacity,transform] delay-0 duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
          'group-hover/tip:scale-100 group-hover/tip:opacity-100 group-hover/tip:delay-300',
          'group-active/tip:!opacity-0 group-active/tip:!delay-0 group-active/tip:!duration-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}

const NavArrow = ({ label, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={cn(
      'flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground',
      HOVER,
      RING,
    )}
  >
    {children}
  </button>
)

export const Calendar = React.forwardRef(function Calendar(props, ref) {
  const {
    mode = 'single',
    month: controlledMonth,
    defaultMonth,
    onMonthChange,
    weekStartsOn = 0,
    disabled,
    bookedDates,
    events,
    quickNav = true,
    className,
    selected,
    defaultSelected,
    onSelect,
  } = props

  const prefersReducedMotion = useReducedMotion()
  const today = React.useMemo(() => startOfDay(new Date()), [])

  const [internalMonth, setInternalMonth] = React.useState(() =>
    startOfDay(defaultMonth ?? controlledMonth ?? new Date()),
  )
  const isMonthControlled = controlledMonth !== undefined
  const displayedMonth = isMonthControlled ? controlledMonth : internalMonth

  const [navView, setNavView] = React.useState('days')
  const [direction, setDirection] = React.useState(1)
  const [yearAnchor, setYearAnchor] = React.useState(() => displayedMonth.getFullYear())

  function openYearsView() {
    setYearAnchor(displayedMonth.getFullYear())
    setNavView('years')
  }

  // Keyboard nav across a month boundary remounts the grid; focus the target once it exists.
  const dayGridRef = React.useRef(null)
  const pendingFocusDateRef = React.useRef(null)
  React.useEffect(() => {
    if (!pendingFocusDateRef.current) return
    const key = pendingFocusDateRef.current.toDateString()
    pendingFocusDateRef.current = null
    dayGridRef.current?.querySelector(`[data-date-key="${key}"]`)?.focus()
  }, [displayedMonth])

  const setMonth = React.useCallback(
    (next, dir) => {
      setDirection(dir)
      if (!isMonthControlled) setInternalMonth(next)
      onMonthChange?.(next)
    },
    [isMonthControlled, onMonthChange],
  )

  const [internalSingle, setInternalSingle] = React.useState(mode === 'single' ? defaultSelected : undefined)
  const [internalMultiple, setInternalMultiple] = React.useState(mode === 'multiple' ? defaultSelected ?? [] : [])
  const [internalRange, setInternalRange] = React.useState(mode === 'range' ? defaultSelected : undefined)

  const isSelectedControlled = selected !== undefined
  const currentSingle = mode === 'single' ? (isSelectedControlled ? selected : internalSingle) : undefined
  const currentMultiple = mode === 'multiple' ? (isSelectedControlled ? selected : internalMultiple) : []
  const currentRange = mode === 'range' ? (isSelectedControlled ? selected : internalRange) : undefined

  const isBooked = (date) => bookedDates?.some((b) => isSameDay(b, date)) ?? false
  const isDisabled = (date) => isBooked(date) || (disabled?.(date) ?? false)
  const eventFor = (date) => events?.find((e) => isSameDay(e.date, date))

  function handleSelectDay(date) {
    if (isDisabled(date)) return
    if (mode === 'single') {
      const next = isSameDay(currentSingle, date) ? undefined : date
      if (!isSelectedControlled) setInternalSingle(next)
      onSelect?.(next)
      return
    }
    if (mode === 'multiple') {
      const exists = currentMultiple.some((d) => isSameDay(d, date))
      const next = exists ? currentMultiple.filter((d) => !isSameDay(d, date)) : [...currentMultiple, date]
      if (!isSelectedControlled) setInternalMultiple(next)
      onSelect?.(next)
      return
    }
    const from = currentRange?.from
    const to = currentRange?.to
    let next
    if (!from || (from && to)) next = { from: date, to: undefined }
    else if (isBefore(date, from)) next = { from: date, to: from }
    else next = { from, to: date }
    if (!isSelectedControlled) setInternalRange(next)
    onSelect?.(next)
  }

  const goToMonth = (offset) => setMonth(addMonths(displayedMonth, offset), offset >= 0 ? 1 : -1)

  const weekdayLabels = weekStartsOn === 1 ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN
  const grid = React.useMemo(() => buildMonthGrid(displayedMonth, weekStartsOn), [displayedMonth, weekStartsOn])
  const weeks = React.useMemo(() => {
    const rows = []
    for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7))
    return rows
  }, [grid])

  // Roving tabindex target.
  const focusableDate = React.useMemo(() => {
    if (mode === 'single' && currentSingle && isSameMonth(currentSingle, displayedMonth)) return currentSingle
    if (isSameMonth(today, displayedMonth)) return today
    return new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1)
  }, [mode, currentSingle, displayedMonth, today])

  function cellState(date) {
    let isSelected = false
    let isRangeStart = false
    let isRangeEnd = false
    let isInRange = false
    if (mode === 'single') isSelected = isSameDay(currentSingle, date)
    else if (mode === 'multiple') isSelected = currentMultiple.some((d) => isSameDay(d, date))
    else if (currentRange) {
      isRangeStart = isSameDay(currentRange.from, date)
      isRangeEnd = isSameDay(currentRange.to, date)
      isInRange = isWithinRange(date, currentRange)
      isSelected = isRangeStart || isRangeEnd
    }
    return {
      outsideMonth: !isSameMonth(date, displayedMonth),
      isToday: isSameDay(date, today),
      isBookedDay: isBooked(date),
      event: eventFor(date),
      isDayDisabled: isDisabled(date),
      isSelected,
      isRangeStart,
      isRangeEnd,
      isInRange,
    }
  }

  function handleGridKeyDown(e) {
    const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const current = new Date(e.target.dataset.date ?? '')
    if (Number.isNaN(current.getTime())) return
    let target
    if (e.key in deltas) {
      target = new Date(current)
      target.setDate(current.getDate() + deltas[e.key])
    } else if (e.key === 'Home' || e.key === 'End') {
      const weekday = weekStartsOn === 1 ? (current.getDay() + 6) % 7 : current.getDay()
      target = new Date(current)
      target.setDate(current.getDate() + (e.key === 'Home' ? -weekday : 6 - weekday))
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      target = addMonths(current, e.key === 'PageUp' ? -1 : 1)
      const days = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
      target.setDate(Math.min(current.getDate(), days))
    }
    if (!target) return
    e.preventDefault()
    if (!isSameMonth(target, displayedMonth)) {
      pendingFocusDateRef.current = target
      setMonth(new Date(target.getFullYear(), target.getMonth(), 1), isBefore(target, displayedMonth) ? -1 : 1)
      return
    }
    dayGridRef.current?.querySelector(`[data-date-key="${target.toDateString()}"]`)?.focus()
  }

  const monthLabel = `${MONTH_NAMES[displayedMonth.getMonth()]} ${displayedMonth.getFullYear()}`
  const fade = { duration: prefersReducedMotion ? 0.12 : 0.15, ease: EASE_OUT }
  const headerBtn = cn(
    'rounded-md px-1.5 py-1 text-[13px] font-medium tracking-[-0.01em] text-foreground outline-none transition-colors duration-150',
    RING,
  )

  return (
    <div
      ref={ref}
      data-slot="calendar"
      data-mode={mode}
      className={cn('w-full max-w-[300px] select-none rounded-2xl border border-border bg-background p-3', className)}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {monthLabel}
      </div>

      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-1">
        <NavArrow label="Previous month" onClick={() => goToMonth(-1)}>
          <ChevronLeft className="size-4" strokeWidth={1.9} />
        </NavArrow>

        <div className="flex items-center gap-0.5">
          <QuickNavTooltip label="Jump to month" disabled={!quickNav}>
            <button
              type="button"
              disabled={!quickNav}
              aria-label="Show month picker"
              onClick={() => setNavView('months')}
              className={cn(headerBtn, quickNav && HOVER, navView === 'months' && SELECTED_SOFT)}
            >
              {MONTH_NAMES[displayedMonth.getMonth()]}
            </button>
          </QuickNavTooltip>
          <QuickNavTooltip label="Jump to year" disabled={!quickNav}>
            <button
              type="button"
              disabled={!quickNav}
              aria-label="Show year picker"
              onClick={openYearsView}
              className={cn(headerBtn, quickNav && HOVER, navView === 'years' && SELECTED_SOFT)}
            >
              {displayedMonth.getFullYear()}
            </button>
          </QuickNavTooltip>
        </div>

        <NavArrow label="Next month" onClick={() => goToMonth(1)}>
          <ChevronRight className="size-4" strokeWidth={1.9} />
        </NavArrow>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          {navView === 'days' && (
            <motion.div
              key={`${displayedMonth.getFullYear()}-${displayedMonth.getMonth()}`}
              custom={direction}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: direction * -12 }}
              transition={{ duration: prefersReducedMotion ? 0.12 : 0.18, ease: EASE_OUT }}
            >
              <div className="mb-1 grid grid-cols-7">
                {weekdayLabels.map((label) => (
                  <div key={label} className="flex h-7 items-center justify-center text-[11px] font-medium text-muted-foreground">
                    {label}
                  </div>
                ))}
              </div>

              <div ref={dayGridRef} role="grid" aria-label={monthLabel} className="grid grid-cols-7 gap-y-0.5" onKeyDown={handleGridKeyDown}>
                {weeks.map((week, wi) => (
                  <div key={wi} role="row" className="contents">
                    {week.map((date) => {
                      const s = cellState(date)
                      const showBand =
                        mode === 'range' &&
                        currentRange?.from &&
                        currentRange?.to &&
                        !isSameDay(currentRange.from, currentRange.to) &&
                        (s.isInRange || s.isRangeStart || s.isRangeEnd)
                      return (
                        <div
                          key={date.toISOString()}
                          role="gridcell"
                          aria-selected={s.isSelected || undefined}
                          className="relative flex h-9 items-center justify-center"
                        >
                          {showBand && (
                            <div
                              className={cn(
                                'absolute inset-y-0.5',
                                SELECTED_SOFT,
                                s.isRangeStart ? 'left-1/2 right-0' : s.isRangeEnd ? 'left-0 right-1/2' : 'inset-x-0',
                              )}
                            />
                          )}
                          <button
                            type="button"
                            disabled={s.isDayDisabled}
                            aria-label={`${date.toDateString()}${s.event?.label ? `, ${s.event.label}` : ''}${s.isBookedDay ? ', unavailable' : ''}`}
                            title={s.event?.label}
                            data-date={date.toISOString()}
                            data-date-key={date.toDateString()}
                            tabIndex={isSameDay(date, focusableDate) ? 0 : -1}
                            onClick={() => handleSelectDay(date)}
                            className={cn(
                              'relative z-10 flex size-8 items-center justify-center rounded-full text-[13px] tabular-nums outline-none transition-colors duration-150',
                              RING,
                              s.outsideMonth ? 'text-muted-foreground/45' : 'text-foreground',
                              !s.isSelected && !s.isDayDisabled && HOVER,
                              s.isSelected && 'bg-primary font-medium text-primary-foreground hover:bg-primary/90',
                              s.isToday && !s.isSelected && 'border border-primary/50 font-semibold',
                              s.isDayDisabled && !s.isBookedDay && 'pointer-events-none text-muted-foreground opacity-30',
                              s.isBookedDay && 'pointer-events-none text-muted-foreground/60 line-through',
                            )}
                          >
                            {date.getDate()}
                            {s.event && !s.isSelected && (
                              <span className="absolute bottom-0.5 size-1 rounded-full bg-primary" />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {navView === 'months' && (
            <motion.div
              key="months"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade}
              className="grid grid-cols-3 gap-1 py-1"
            >
              {MONTH_NAMES.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setMonth(new Date(displayedMonth.getFullYear(), i, 1), 1)
                    setNavView('days')
                  }}
                  className={cn(
                    'flex h-11 items-center justify-center rounded-md text-[13px] text-foreground outline-none transition-colors duration-150',
                    HOVER,
                    RING,
                    i === displayedMonth.getMonth() && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </motion.div>
          )}

          {navView === 'years' && (
            <motion.div key="years" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
              <div className="mb-1 flex items-center justify-between px-0.5">
                <NavArrow label="Previous years" onClick={() => setYearAnchor((y) => y - 12)}>
                  <ChevronLeft className="size-4" strokeWidth={1.9} />
                </NavArrow>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {yearAnchor - 5} – {yearAnchor + 6}
                </span>
                <NavArrow label="Next years" onClick={() => setYearAnchor((y) => y + 12)}>
                  <ChevronRight className="size-4" strokeWidth={1.9} />
                </NavArrow>
              </div>
              <div className="grid grid-cols-3 gap-1 py-1">
                {Array.from({ length: 12 }, (_, i) => yearAnchor - 5 + i).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setMonth(new Date(year, displayedMonth.getMonth(), 1), 1)
                      setNavView('months')
                    }}
                    className={cn(
                      'flex h-11 items-center justify-center rounded-md text-[13px] tabular-nums text-foreground outline-none transition-colors duration-150',
                      HOVER,
                      RING,
                      year === displayedMonth.getFullYear() && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
