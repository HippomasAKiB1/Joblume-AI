import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { authAPI, userAPI, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  const handleAuth = useCallback((data: AuthResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    // In-memory token management only - never store access_token in localStorage
    setAuthToken(data.access_token);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  // Silent session restoration on app mount via HTTP-only refresh cookie
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const res = await authAPI.refresh();
        if (isMounted && res.data?.access_token) {
          handleAuth(res.data);
        }
      } catch {
        // Silently fail if no valid cookie exists; user remains unauthenticated
        if (isMounted) {
          clearAuth();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    // Listen for auth expiration events emitted by api interceptor
    const handleAuthExpired = () => {
      clearAuth();
    };
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [handleAuth, clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    handleAuth(res.data);
  }, [handleAuth]);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const res = await authAPI.register({ full_name: fullName, email, password });
    handleAuth(res.data);
  }, [handleAuth]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Continue clearing client state even if network fails
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await userAPI.getProfile();
      setUser(res.data);
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
