import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-brand-50 text-brand-600 border-brand-100',
  trend,
  trendLabel,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  badgeText,
  badgeVariant = 'primary',
  onClick,
  className = ''
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-card transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-brand-300 group' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {badgeText && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trendType === 'up'
                  ? 'text-emerald-600'
                  : trendType === 'down'
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              {trendType === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trendType === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend}
            </span>
          )}
          {trendLabel && <span>{trendLabel}</span>}
          {subtitle && !trend && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
