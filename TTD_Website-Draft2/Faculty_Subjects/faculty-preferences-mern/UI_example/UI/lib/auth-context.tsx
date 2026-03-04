'use client';

import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUsers: Record<string, User> = {
      'admin@university.edu': {
        id: '1',
        name: 'Dr. Admin User',
        email: 'admin@university.edu',
        role: 'admin',
        department: 'Administration',
      },
      'teacher@university.edu': {
        id: '2',
        name: 'Prof. John Doe',
        email: 'teacher@university.edu',
        role: 'teacher',
        department: 'Computer Science',
      },
    };

    const foundUser = mockUsers[email];
    if (!foundUser) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    
    if (foundUser.role !== role) {
      setIsLoading(false);
      throw new Error(`This email is registered as ${foundUser.role}, not ${role}`);
    }

    if (password !== 'password') {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    
    setUser(foundUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
