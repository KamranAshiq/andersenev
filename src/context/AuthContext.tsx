import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService, { User } from '../services/DatabaseService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize database
        await DatabaseService.initialize();
        
        const savedUserId = await AsyncStorage.getItem('user_id');
        if (savedUserId) {
          const userId = parseInt(savedUserId, 10);
          const savedUser = await DatabaseService.getUserById(userId);
          if (savedUser) {
            setUser(savedUser);
          } else {
            await AsyncStorage.removeItem('user_id');
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Clear any corrupted session data
        await AsyncStorage.removeItem('user_id');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await DatabaseService.getUserByUsername(username);
      if (foundUser && foundUser.password === password) {
        setUser(foundUser);
        // Save user session to AsyncStorage
        await AsyncStorage.setItem('user_id', foundUser.id.toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const existingUser = await DatabaseService.getUserByUsername(username);
      if (existingUser) {
        return false; 
      }

      const newUser = await DatabaseService.createUser(username, email, password);
      setUser(newUser);
      await AsyncStorage.setItem('user_id', newUser.id.toString());
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user_id');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
