import React, { createContext, useContext, useEffect, useState } from 'react';
import { useData } from './DataContext';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext(null);

const friendlyAuthError = (error) => {
  if (!error) return null;
  if (error.message === 'Invalid login credentials') return 'Incorrect email or password.';
  if (error.message === 'Email not confirmed') return 'Please confirm your email address first. Check your inbox.';
  if (/database error/i.test(error.message)) {
    return 'No Campusnex account is registered for this email. Contact your administrator.';
  }
  if (/rate limit/i.test(error.message)) {
    return 'Too many emails sent. Please wait a few minutes and try again.';
  }
  return error.message;
};

// Email links (confirmation, password reset) return the user to this site.
const redirectUrl = () => window.location.origin;

export function AuthProvider({ children }) {
  const { users, departments, session, loading } = useData();
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const currentUser = session ? users.find((u) => u.auth_id === session.user.id) || null : null;

  // A faculty member is HOD of every department an admin assigned them to head.
  const hodDepartments =
    currentUser?.role === 'faculty'
      ? departments.filter((d) => d.head_faculty_id === currentUser.id)
      : [];

  // Signed in but no active profile (deactivated or removed): end the session.
  const profileMissing = !!session && !loading && !currentUser;
  useEffect(() => {
    if (profileMissing) supabase.auth.signOut();
  }, [profileMissing]);

  // Opening a password-reset link signs the user in and asks for a new password.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
      password,
      options: { emailRedirectTo: redirectUrl() }
    });
    if (error) throw new Error(friendlyAuthError(error));
    return data.session ? 'signed_in' : 'confirm_email';
  };

  const requestPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl()
    });
    if (error) throw new Error(friendlyAuthError(error));
  };

  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(friendlyAuthError(error));
    setPasswordRecovery(false);
  };

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        activateAccount,
        requestPasswordReset,
        updatePassword,
        passwordRecovery,
        logout,
        isHod: hodDepartments.length > 0,
        hodDepartments,
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
