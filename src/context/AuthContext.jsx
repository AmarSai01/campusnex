import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'campusnex_current_user_v1';

export function AuthProvider({ children }) {
  const { users } = useData();

  // Initialize with saved user or default to Admin (Dr. Sarah Connor) or null
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading auth state:', e);
    }
    // Default initial user for instant showcase: Admin
    return null;
  });

  // Keep currentUser in sync if updated in DataContext (e.g. user details edited)
  useEffect(() => {
    if (currentUser) {
      const freshUser = users.find(u => u.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));
      }
    }
  }, [users]);

  // Login handler
  const login = async (email, password) => {
    const matchedUser = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.status !== 'inactive'
    );

    if (!matchedUser) {
      throw new Error('Invalid email address or account has been deactivated.');
    }

    // In demo / client auth, accept any standard password for seed accounts
    setCurrentUser(matchedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
    return matchedUser;
  };

  // Quick switch user for testing and evaluator convenience
  const switchUser = (userId) => {
    const matchedUser = users.find(u => u.id === userId);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedUser));
    }
  };

  // Quick switch by role
  const switchRole = (role) => {
    const candidate = users.find(u => u.role === role && u.status !== 'inactive');
    if (candidate) {
      switchUser(candidate.id);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchUser,
        switchRole,
        isAuthenticated: !!currentUser,
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
