import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  gender?: string;
  photo?: string | null;
  isProfileSetup: boolean;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (token: string, email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
};

const getNameFromEmail = (email: string) => {
  return email.split('@')[0];
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  updateProfile: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // 🔁 Restore auth + user on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('auth_user');

        if (token && storedUser) {
           const parsedUser: User = JSON.parse(storedUser);

  if (!parsedUser.name && parsedUser.email) {
    parsedUser.name = getNameFromEmail(parsedUser.email);
    await AsyncStorage.setItem('auth_user', JSON.stringify(parsedUser));
  }
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log('Auth restore error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 🔐 Login
  const login = async (token: string, email: string) => {
    const defaultName = getNameFromEmail(email);
    const newUser: User = {
      name: defaultName ,
      email,
      isProfileSetup: false,
    };

    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));

    setUser(newUser);
    setIsAuthenticated(true);
  };

  // ✏️ Update profile + persist
  const updateProfile = async (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;

      const updatedUser = { ...prev, ...data };
      AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // 🚪 Logout
  const logout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
