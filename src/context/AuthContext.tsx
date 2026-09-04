import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Patient, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  currentPatient: Patient | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medagenda_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const storedToken = localStorage.getItem('medagenda_token');
      if (!storedToken) {
        // Default to demo patient on initial load for instant seamless exploration!
        await autoLoginDemo('patient');
        return;
      }

      const res = await api.auth.me();
      setCurrentUser(res.user);
      setCurrentPatient(res.patient || null);
    } catch (err) {
      console.warn('Session expired or invalid, loading demo patient...');
      await autoLoginDemo('patient');
    } finally {
      setIsLoading(false);
    }
  };

  const autoLoginDemo = async (role: UserRole) => {
    try {
      const email = role === 'admin' ? 'admin@medagenda.com.br' : 'paciente@medagenda.com.br';
      const password = role === 'admin' ? 'Admin@123' : 'Paciente@123';
      const res = await api.auth.login({ email, password });
      localStorage.setItem('medagenda_token', res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      setCurrentPatient(res.patient || null);
    } catch (e) {
      console.error('Failed to auto login demo user:', e);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('medagenda_token', res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      setCurrentPatient(res.patient || null);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      localStorage.setItem('medagenda_token', res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      setCurrentPatient(res.patient);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (currentUser) {
      api.auth.logout(currentUser.id).catch(() => {});
    }
    localStorage.removeItem('medagenda_token');
    setToken(null);
    setCurrentUser(null);
    setCurrentPatient(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    await autoLoginDemo(role);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentPatient,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
