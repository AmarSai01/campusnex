import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-brand-50 text-brand-600 border-brand-100',
  trend,
  trendLabel,
  trendType = 'up',
  badgeText,
  badgeVariant = 'primary',
  onClick,
  className = '',
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'shadow-xs transition-all duration-200 hover:shadow-card',
        onClick && 'cursor-pointer hover:border-brand-300 group',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-0">
        <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </CardDescription>
        {Icon && (
          <div className={cn('rounded-xl border p-2.5', iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-3">
        <div className="flex items-baseline gap-2">
          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </CardTitle>
          {badgeText && (
            <Badge variant="secondary" className="rounded-full text-xs font-semibold">
              {badgeText}
            </Badge>
          )}
        </div>

        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-bold',
                  trendType === 'up' && 'text-emerald-600',
                  trendType === 'down' && 'text-rose-600',
                  trendType === 'neutral' && 'text-slate-600'
                )}
              >
                {trendType === 'up' && <ArrowUpRight className="h-3.5 w-3.5" />}
                {trendType === 'down' && <ArrowDownRight className="h-3.5 w-3.5" />}
                {trend}
              </span>
            )}
            {trendLabel && <span>{trendLabel}</span>}
            {subtitle && !trend && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
