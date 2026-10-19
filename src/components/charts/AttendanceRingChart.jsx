import React from 'react';
import { RISK_RULES } from '../../utils/risk';

export default function AttendanceRingChart({
  percentage = 0,
  size = 110,
  strokeWidth = 10,
  label,
  sublabel,
  showThreshold = true,
  className = ''
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // null means no classes have been marked yet: grey ring, no eligibility badge.
  const empty = percentage === null || percentage === undefined;
  const clamped = empty ? 0 : Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  // Red below the SEE minimum, amber in the warning band just above it.
  let strokeColor = '#10b981'; // emerald-500
  let bgColor = 'text-emerald-50';
  let badgeColor = 'text-emerald-700 bg-emerald-100';

  if (empty) {
    badgeColor = 'text-slate-600 bg-slate-100';
  } else if (clamped < RISK_RULES.attendance.shortage) {
    strokeColor = '#f43f5e'; // rose-500
    bgColor = 'text-rose-50';
    badgeColor = 'text-rose-700 bg-rose-100';
  } else if (clamped < RISK_RULES.attendance.warning) {
    strokeColor = '#f59e0b'; // amber-500
    bgColor = 'text-amber-50';
    badgeColor = 'text-amber-700 bg-amber-100';
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-100"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="ring-chart-circle transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
            {empty ? '—' : `${Math.round(clamped)}%`}
          </span>
          {sublabel && (
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {label && (
        <div className="mt-2 text-center">
          <p className="text-xs font-bold text-slate-800 line-clamp-1">{label}</p>
          {showThreshold && (
            <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeColor}`}>
              {empty ? 'No classes yet' : clamped >= RISK_RULES.attendance.shortage ? 'Eligible' : 'Shortage Alert'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
