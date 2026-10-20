import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList
} from 'recharts';
import { RISK_RULES } from '../../utils/risk';
import { STATUS_COLORS, fmtMarks } from '../../utils/analytics';

// Chart pieces shared by the student and class analytics boards.

const BAR = '#2a78d6';
const BAR_UNPUBLISHED = '#9cc3ef';

const ChartTooltip = ({ active, payload, render }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl">{render(payload[0].payload)}</div>
  );
};

// `unit` names what is counted: a student's classes, or a whole class's attendance entries.
export function AttendanceDonut({ counts, pct, held, attended, unit = 'classes' }) {
  const data = [
    { key: 'present', label: 'Present', value: counts.present },
    { key: 'late', label: 'Late', value: counts.late },
    { key: 'absent', label: 'Absent', value: counts.absent }
  ];
  const slices = data.filter((d) => d.value > 0);

  if (!held) return <p className="py-10 text-center text-xs text-slate-500">No classes marked yet.</p>;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={56}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((d) => (
                <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  render={(d) => (
                    <p>
                      {d.label}: <span className="font-extrabold">{d.value}</span> of {held} {unit}
                    </p>
                  )}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{pct}%</span>
          <span className="text-[11px] font-semibold text-slate-500">
            min {RISK_RULES.attendance.shortage}%
          </span>
        </div>
      </div>
      <div className="w-full space-y-2 text-xs">
        {data.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[d.key] }} aria-hidden="true" />
              {d.label}
            </span>
            <span className="font-bold text-slate-900 tabular-nums">{d.value}</span>
          </div>
        ))}
        <p className="border-t border-slate-100 pt-2 text-slate-500">
          {unit === 'classes'
            ? `${fmtMarks(attended)} of ${held} classes attended.`
            : `${held} attendance entries.`}{' '}
          A late counts as half a class.
        </p>
      </div>
    </div>
  );
}

// One bar per IA test, in marks out of the test maximum. `data`: [{ name, score, max, published }].
export function IAMarksBars({ data, max, emptyText = 'No IA marks entered yet.' }) {
  if (!data.length || !max) return <p className="py-10 text-center text-xs text-slate-500">{emptyText}</p>;

  const minMark = Math.round((max * RISK_RULES.marks.fail) / 100);
  const hasUnpublished = data.some((d) => !d.published);

  return (
    <>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 22, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis
              domain={[0, max]}
              ticks={Array.from({ length: 6 }, (_, i) => Math.round((max * i) / 5))}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              content={
                <ChartTooltip
                  render={(d) => (
                    <>
                      <p className="font-semibold text-slate-300">
                        {d.name}
                        {d.published ? '' : ' · unpublished'}
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold">
                        {fmtMarks(d.score)} / {d.max}
                      </p>
                    </>
                  )}
                />
              }
            />
            <ReferenceLine
              y={minMark}
              stroke="#f43f5e"
              strokeDasharray="4 3"
              label={{ value: `Min ${minMark}`, position: 'insideTopRight', fontSize: 10, fill: '#be123c' }}
            />
            <Bar dataKey="score" maxBarSize={44} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.published ? BAR : BAR_UNPUBLISHED} />
              ))}
              <LabelList
                dataKey="score"
                position="top"
                formatter={(v) => fmtMarks(v)}
                style={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-600">
        <span>Marks out of {max}</span>
        {hasUnpublished && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_UNPUBLISHED }} aria-hidden="true" />
            Unpublished
          </span>
        )}
      </div>
    </>
  );
}
