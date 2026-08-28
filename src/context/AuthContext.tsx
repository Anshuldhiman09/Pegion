import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../api';
import SocketService from '../services/SocketService';

export type User = {
  id?: number | string;
  name: string;
  username: string;
  email: string;
  bio?: string | null;
  dob?: string | null;
  gender?: string | null;
  photo?: string | null;
  profileImageUrl?: string | null;
  isProfileSetup: boolean;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (
    token: string,
    email: string,
    newUser?: boolean,
    username?: string | null,
    name?: string | null,
  ) => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  logout: () => Promise<void>;
};

const getNameFromEmail = (email: string) => email.split('@')[0];

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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token =
          (await AsyncStorage.getItem('auth_token')) ||
          (await AsyncStorage.getItem('authToken'));
        const email = await AsyncStorage.getItem('auth_email');

        if (token && email) {
          try {
            const result = await userService.getProfileInfo(email);
            const data = result?.data;

            if (result?.success && data) {
              const isProfileComplete = Boolean(data.name && data.username);
              const userData: User = {
                id: data.id,
                name: data.name || getNameFromEmail(email),
                username: data.username || '',
                email: data.email || email,
                bio: data.description || data.bio || null,
                dob: data.dateOfBirth || data.dob || null,
                gender: data.gender || null,
                photo: data.profileImageUrl || data.photo || null,
                profileImageUrl: data.profileImageUrl || data.photo || null,
                isProfileSetup: isProfileComplete,
              };

              if (data.id) {
                await AsyncStorage.setItem('userId', String(data.id));
              }
              await AsyncStorage.setItem('authToken', token);
              await AsyncStorage.setItem('auth_token', token);

              setUser(userData);
              setIsAuthenticated(true);
            } else {
              SocketService.disconnect();
              await AsyncStorage.multiRemove([
                'auth_token',
                'authToken',
                'auth_email',
                'userId',
                'profile_setup_shown',
              ]);
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (fetchErr: any) {
            console.log(
              'Profile restore error:',
              fetchErr?.message || fetchErr,
            );
            const errMsg = String(fetchErr?.message || '');
            if (
              errMsg.toLowerCase().includes('token') ||
              errMsg.toLowerCase().includes('401') ||
              errMsg.toLowerCase().includes('403') ||
              errMsg.toLowerCase().includes('unauthorized') ||
              errMsg.toLowerCase().includes('forbidden')
            ) {
              SocketService.disconnect();
              await AsyncStorage.multiRemove([
                'auth_token',
                'authToken',
                'auth_email',
                'userId',
                'profile_setup_shown',
              ]);
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (err) {
        console.log('Auth restore error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login
  const login = async (
    token: string,
    email: string,
    newUser: boolean = false,
    username?: string | null,
    name?: string | null,
  ) => {
    // Teardown any previous user socket session
    SocketService.disconnect();

    const base = name || getNameFromEmail(email);
    const hasUsername = Boolean(username && username.trim().length > 0);

    const userData: User = {
      name: base,
      username: username || '',
      email,
      isProfileSetup: !newUser && hasUsername,
    };

    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('auth_email', email);

    try {
      const profileResult = await userService.getProfileInfo(email);
      if (profileResult?.data?.id) {
        userData.id = profileResult.data.id;
        await AsyncStorage.setItem('userId', String(profileResult.data.id));
      }
    } catch {
      // Ignored if profile fetch fails
    }

    setUser(userData);
    setIsAuthenticated(true);
  };

  // Update profile
  const updateProfile = (data: Partial<User>) => {
    if (!user) {
      return;
    }

    setUser({
      ...user,
      ...data,
      isProfileSetup: true,
    });
  };

  // Logout
  const logout = async () => {
    // Teardown socket connection immediately
    SocketService.disconnect();

    await AsyncStorage.multiRemove([
      'auth_token',
      'authToken',
      'auth_email',
      'userId',
      'profile_setup_shown',
      'search_history',
    ]);
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

export const useAuth = () => React.useContext(AuthContext);

