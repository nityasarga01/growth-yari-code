import { useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../config/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        setLoading(true);
        try {
          const result = await apiClient.getCurrentUser();
          if (result.success && result.data) {
            setUser(result.data.user);
          } else {
            // Token is invalid, clear it
            apiClient.clearToken();
          }
        } catch (error) {
          console.error('Auth check error:', error);
          apiClient.clearToken();
        }
        setLoading(false);
      }
      setInitialized(true);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const result = await apiClient.login(email, password);
      if (result.success && result.data) {
        apiClient.setToken(result.data.token);
        setUser(result.data.user);
        console.log('Login successful:', result.data.user);
      } else {
        const errorMessage = result.error || 'Login failed';
        console.error('Login failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const signupExtended = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
    profession: string;
    industry: string;
    experience: string;
    skills: string[];
    objectives: string[];
    location: string;
    field: string;
    mentorshipGoals: string[];
    availabilityStatus: string;
  }) => {
    setLoading(true);
    
    try {
      const result = await apiClient.signup(userData);
      if (result.success && result.data) {
        apiClient.setToken(result.data.token);
        setUser(result.data.user);
        console.log('Signup successful:', result.data.user);
      } else {
        const errorMessage = result.error || 'Signup failed';
        console.error('Signup failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiClient.clearToken();
    setUser(null);
  }, []);

  return {
    user,
    login,
    signup: signupExtended,
    signupExtended,
    updateUser,
    logout,
    loading,
    isAuthenticated: !!user,
    initialized
  };
};