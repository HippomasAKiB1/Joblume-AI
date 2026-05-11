import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { authAPI, userAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('joblume_token');
    const savedUser = localStorage.getItem('joblume_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const handleAuth = useCallback((data: AuthResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('joblume_token', data.access_token);
    localStorage.setItem('joblume_user', JSON.stringify(data.user));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    handleAuth(res.data);
  }, [handleAuth]);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const res = await authAPI.register({ full_name: fullName, email, password });
    handleAuth(res.data);
  }, [handleAuth]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('joblume_token');
    localStorage.removeItem('joblume_user');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await userAPI.getProfile();
      setUser(res.data);
      localStorage.setItem('joblume_user', JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
