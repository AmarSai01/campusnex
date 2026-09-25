import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldAlert,
  Briefcase,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function LoginView() {
  const { login, switchUser } = useAuth();
  const { users } = useData();

  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const rolePresets = {
    student: {
      defaultEmail: 'student1@campusnex.edu',
      defaultName: 'Alice Smith (CS22B101)',
      title: 'Student Portal',
      description: 'Access attendance, published IA marks, submit assignments & view schedules.',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    faculty: {
      defaultEmail: 'faculty1@campusnex.edu',
      defaultName: 'Dr. Alan Turing (Prof & HOD)',
      title: 'Faculty Workspace',
      description: 'Mark session attendance, publish IA marks, manage assignments & grade submissions.',
      badgeColor: 'bg-brand-50 text-brand-700 border-brand-200'
    },
    admin: {
      defaultEmail: 'admin@campusnex.edu',
      defaultName: 'Dr. Sarah Connor (Dean & Registrar)',
      title: 'Administrative Console',
      description: 'Manage users, assign course faculty, configure timetables & post campus broadcasts.',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  };

  const handleRoleTabChange = (role) => {
    setActiveRoleTab(role);
    setEmail(rolePresets[role].defaultEmail);
    setPassword('password123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Please enter your institutional email address.');
      }
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoAccounts = [
    { id: 'admin_1', name: 'Dr. Sarah Connor', role: 'admin', desc: 'Dean / Registrar' },
    { id: 'faculty_1', name: 'Dr. Alan Turing', role: 'faculty', desc: 'Faculty (CS301/302)' },
    { id: 'faculty_2', name: 'Dr. Ada Lovelace', role: 'faculty', desc: 'Faculty (CS303 DBMS)' },
    { id: 'student_1', name: 'Alice Smith', role: 'student', desc: 'Student Sec A' },
    { id: 'student_2', name: 'Bob Johnson', role: 'student', desc: 'Student Sec A' },
    { id: 'student_4', name: 'David Lee', role: 'student', desc: 'Student Sec B' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-glow mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Campusnex
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Next-Generation Academic Management & ERP
          </p>
        </div>

        {/* Card Container */}
        <div className="mt-8 bg-white rounded-3xl shadow-2xl border border-slate-100/90 overflow-hidden">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-3 p-2 bg-slate-100/80 border-b border-slate-200/80 gap-1.5">
            <button
              type="button"
              onClick={() => handleRoleTabChange('student')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                activeRoleTab === 'student'
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('faculty')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                activeRoleTab === 'faculty'
                  ? 'bg-white text-brand-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('admin')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                activeRoleTab === 'admin'
                  ? 'bg-white text-purple-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header info for selected role */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {rolePresets[activeRoleTab].title}
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${rolePresets[activeRoleTab].badgeColor}`}>
                  Role: {activeRoleTab}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {rolePresets[activeRoleTab].description}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={rolePresets[activeRoleTab].defaultEmail}
                    className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 shadow-md shadow-brand-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter {rolePresets[activeRoleTab].title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Public Signup Restriction Notice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Institutional Security Policy:</strong> No public signup available. Faculty and Administrator credentials are strictly provisioned by the Central Registrar.
              </span>
            </div>

            {/* Quick 1-Click Evaluation Switcher */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Instant 1-Click Demo Logins:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickDemoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => switchUser(acc.id)}
                    className="p-2 rounded-xl text-left border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all text-xs group"
                  >
                    <div className="font-bold text-slate-800 group-hover:text-brand-700 truncate">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {acc.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Campusnex Academic Cloud • Protected by Firestore Security Hierarchy
        </p>
      </div>
    </div>
  );
}
