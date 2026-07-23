'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee } from '@/lib/types';

interface AuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  isLeader: boolean;
  login: (employeeId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('qa-session');
    if (stored) {
      try {
        setEmployee(JSON.parse(stored));
      } catch {
        localStorage.removeItem('qa-session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (employeeId: string, pin: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setEmployee(data.employee);
      localStorage.setItem('qa-session', JSON.stringify(data.employee));
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setEmployee(null);
    localStorage.removeItem('qa-session');
    window.location.href = '/';
  }, []);

  const isLeader = employee?.role === 'leader';

  return (
    <AuthContext.Provider value={{ employee, isLoading, isLeader, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
