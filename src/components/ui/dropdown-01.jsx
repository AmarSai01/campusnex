import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
 * Animated single-choice dropdown.
 *
 *   <Dropdown
 *     value={type}
 *     onChange={setType}
 *     placeholder="Choose a type"
 *     options={[{ value: 'holiday', label: 'Holiday', description: 'Campus closed' }]}
 *   />
 *
 * The list opens below the field, or above it when there is not enough room below (near the
 * bottom of a phone screen). It is drawn on top of the page, so dialogs that scroll do not cut
 * it off. Keyboard: Enter / Space / arrows open, arrows move, Enter picks, Escape closes.
 */
export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
}) {
  const reduce = useReducedMotion()
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const listId = React.useId()
  const listRef = React.useRef(null)
  const selected = options.find((o) => o.value === value)

  const setOpenState = (next) => {
    if (next) setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(next)
  }
  const pick = (option) => {
    onChange?.(option.value)
    setOpen(false)
  }

  // Keep the highlighted option in view while moving with the arrow keys.
  React.useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`#${CSS.escape(`${listId}-${active}`)}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  const onKeyDown = (e) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        setOpenState(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : options.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (options[active]) pick(options[active])
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpenState}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          onKeyDown={onKeyDown}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm outline-none transition-colors',
            'hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50',
            open && 'border-brand-400 ring-2 ring-brand-500/20',
            className,
          )}
        >
          <span className={cn('truncate', selected ? 'font-medium text-slate-900' : 'text-slate-400')}>
            {selected ? selected.label : placeholder}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="shrink-0 text-slate-400"
          >
            <ChevronDown className="size-4" />
          </motion.span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          // Focus stays on the field, so the arrow keys keep working there.
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            'z-[60] w-(--radix-popover-trigger-width) outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            'data-[side=bottom]:slide-in-from-top-1.5 data-[side=top]:slide-in-from-bottom-1.5 motion-reduce:animate-none',
          )}
        >
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="max-h-[min(18rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value
              return (
                <motion.li
                  key={option.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.16, delay: reduce ? 0 : Math.min(i, 8) * 0.03 }}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(option)}
                  // The row under the pointer (or reached with the arrow keys) gets an orange bar on
                  // the left and its text nudges right.
                  className={cn(
                    'relative flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150',
                    "before:absolute before:top-1/2 before:left-[3px] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-brand-500 before:content-['']",
                    'before:transition-[height] before:duration-200 before:ease-out motion-reduce:before:transition-none',
                    i === active ? 'bg-slate-50 before:h-3/5' : 'before:h-0',
                  )}
                >
                  <span
                    className={cn(
                      'min-w-0 transition-transform duration-200 ease-out motion-reduce:transition-none',
                      i === active && 'translate-x-[5px]',
                    )}
                  >
                    <span
                      className={cn(
                        'block truncate text-sm transition-colors',
                        isSelected ? 'font-semibold text-brand-700' : i === active ? 'font-medium text-brand-700' : 'font-medium text-slate-800',
                      )}
                    >
                      {option.label}
                    </span>
                    {option.description && <span className="block truncate text-xs text-slate-500">{option.description}</span>}
                  </span>
                  {isSelected && (
                    <motion.span
                      initial={reduce ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="shrink-0 text-brand-600"
                    >
                      <Check className="size-4" />
                    </motion.span>
                  )}
                </motion.li>
              )
            })}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export default Dropdown
