import React, { createContext, useContext, useEffect } from 'react';
import { useData } from './DataContext';
import { supabase, DEMO_PASSWORD } from '../lib/supabase';

const AuthContext = createContext(null);

// Seeded demo accounts, used by the one-click demo logins before any data is loaded.
const DEMO_ACCOUNTS = {
  admin_1: 'admin@campusnex.edu',
  faculty_1: 'faculty1@campusnex.edu',
  faculty_2: 'faculty2@campusnex.edu',
  student_1: 'student1@campusnex.edu',
  student_2: 'student2@campusnex.edu',
  student_4: 'student4@campusnex.edu'
};

const friendlyAuthError = (error) => {
  if (!error) return null;
  if (error.message === 'Invalid login credentials') return 'Incorrect email or password.';
  if (error.message === 'Email not confirmed') return 'Please confirm your email address first. Check your inbox.';
  if (/database error/i.test(error.message)) {
    return 'No Campusnex account is registered for this email. Contact your administrator.';
  }
  return error.message;
};

export function AuthProvider({ children }) {
  const { users, session, loading } = useData();

  const currentUser = session ? users.find((u) => u.auth_id === session.user.id) || null : null;

  // Signed in but no active profile (deactivated or removed): end the session.
  const profileMissing = !!session && !loading && !currentUser;
  useEffect(() => {
    if (profileMissing) supabase.auth.signOut();
  }, [profileMissing]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) throw new Error(friendlyAuthError(error));
  };

  // First sign-in for a profile an admin created: sets the password and links the account.
  const activateAccount = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) throw new Error(friendlyAuthError(error));
    return data.session ? 'signed_in' : 'confirm_email';
  };

  // One-click demo login; only available when VITE_DEMO_PASSWORD is set.
  const switchUser = async (userId) => {
    const email = users.find((u) => u.id === userId)?.email || DEMO_ACCOUNTS[userId];
    if (!email || !DEMO_PASSWORD) return;
    await login(email, DEMO_PASSWORD);
  };

  const switchRole = (role) => {
    const candidate = users.find((u) => u.role === role && u.status !== 'inactive');
    if (candidate) switchUser(candidate.id);
  };

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        activateAccount,
        logout,
        switchUser,
        switchRole,
        isDemo: !!DEMO_PASSWORD,
        isAuthenticated: !!currentUser,
        authLoading: loading,
        role: currentUser?.role || null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
