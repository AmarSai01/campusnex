import React from 'react';
import { Award, BookCheck, GraduationCap, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import StatCard from '../common/StatCard';
import EmptyState from '../common/EmptyState';
import { cgpa, semesterSummaries } from '../../utils/results';

// Student: SGPA per semester and overall CGPA, from published results only.
export default function StudentResults() {
  const { currentUser } = useAuth();
  const { results = [] } = useData();

  const mine = results.filter((r) => r.student_id === currentUser?.id && r.published);
  const semesters = semesterSummaries(mine);

  if (!semesters.length) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Your results will appear here"
        description="Semester results show up as soon as your college publishes them. You'll also get a notification."
      />
    );
  }

  const overall = cgpa(mine);
  const latest = semesters[semesters.length - 1];
  const earned = semesters.reduce((s, x) => s + x.earnedCredits, 0);
  const total = semesters.reduce((s, x) => s + x.credits, 0);
  const chart = semesters.map((s) => ({ name: `Sem ${s.semester}`, sgpa: s.sgpa }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="CGPA"
          value={overall.toFixed(2)}
          subtitle={`Across ${semesters.length} semester${semesters.length === 1 ? '' : 's'}, out of 10`}
          icon={Award}
          iconBg="bg-brand-50 text-brand-600 border-brand-100"
        />
        <StatCard
          title={`Latest SGPA, Sem ${latest.semester}`}
          value={latest.sgpa.toFixed(2)}
          subtitle={semesters.length > 1
            ? `${latest.sgpa >= semesters[semesters.length - 2].sgpa ? 'Up' : 'Down'} from ${semesters[semesters.length - 2].sgpa.toFixed(2)} in Sem ${semesters[semesters.length - 2].semester}`
            : 'Your first published semester'}
          icon={TrendingUp}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <StatCard
          title="Credits earned"
          value={`${earned} / ${total}`}
          subtitle={earned === total ? 'All registered credits cleared' : `${total - earned} credits still to clear`}
          icon={BookCheck}
          iconBg="bg-sky-50 text-sky-600 border-sky-100"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">SGPA by semester</h3>
          <p className="text-xs text-slate-500">The dashed line is your CGPA.</p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [Number(v).toFixed(2), 'SGPA']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <ReferenceLine y={overall} stroke="#ff5c00" strokeDasharray="4 4" label={{ value: `CGPA ${overall.toFixed(2)}`, position: 'insideTopRight', fontSize: 11, fill: '#c03f00' }} />
                <Line type="monotone" dataKey="sgpa" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Semester by semester</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {[...semesters].reverse().map((s) => (
              <li key={s.semester} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Semester {s.semester}</p>
                  <p className="text-xs text-slate-500">
                    {s.subjects} subjects · {s.earnedCredits}/{s.credits} credits earned
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">SGPA</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{s.sgpa.toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
