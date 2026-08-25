'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  auth_provider: 'email' | 'google';
  resume_text?: string | null;
  created_at?: string;
}

export interface Subscription {
  id?: string;
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  gateway?: string | null;
  current_period_start?: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}

export interface Usage {
  sessionsThisMonth: number;
  sessionLimit: number | 'unlimited';
  canStartNewSession: boolean;
}

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  usage: Usage | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  googleLogin: (email: string, fullName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { full_name?: string; resume_text?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('intervuai_token');
      if (!storedToken) {
        setUser(null);
        setSubscription(null);
        setUsage(null);
        setIsLoading(false);
        return;
      }

      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
      setSubscription(res.data.subscription);
      setUsage(res.data.usage);
    } catch (err) {
      console.warn('[AuthContext] Session expired or server unavailable');
      localStorage.removeItem('intervuai_token');
      setUser(null);
      setSubscription(null);
      setUsage(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('intervuai_token') : null;
    if (storedToken) {
      setToken(storedToken);
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser, subscription: receivedSub } = res.data;
    localStorage.setItem('intervuai_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    setSubscription(receivedSub);
    await refreshUser();
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    const res = await api.post('/api/auth/signup', { email, password, full_name: fullName });
    const { token: receivedToken, user: receivedUser, subscription: receivedSub } = res.data;
    localStorage.setItem('intervuai_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    setSubscription(receivedSub);
    await refreshUser();
  };

  const googleLogin = async (email: string, fullName?: string) => {
    const res = await api.post('/api/auth/google', { email, full_name: fullName });
    const { token: receivedToken, user: receivedUser, subscription: receivedSub } = res.data;
    localStorage.setItem('intervuai_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    setSubscription(receivedSub);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('intervuai_token');
    setToken(null);
    setUser(null);
    setSubscription(null);
    setUsage(null);
  };

  const updateProfile = async (data: { full_name?: string; resume_text?: string }) => {
    const res = await api.patch('/api/auth/profile', data);
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        usage,
        token,
        isLoading,
        login,
        signup,
        googleLogin,
        logout,
        updateProfile,
        refreshUser,
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
