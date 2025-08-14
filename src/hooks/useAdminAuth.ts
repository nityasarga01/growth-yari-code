import { useState, useCallback, useEffect } from 'react';
import { adminApiClient } from '../config/adminApi';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check for existing admin token on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        setLoading(true);
        try {
          adminApiClient.setToken(token);
          const result = await adminApiClient.getCurrentAdmin();
          if (result.success && result.data) {
            setAdmin(result.data.admin);
          } else {
            // Token is invalid, clear it
            adminApiClient.clearToken();
          }
        } catch (error) {
          console.error('Admin auth check error:', error);
          adminApiClient.clearToken();
        }
        setLoading(false);
      }
      setInitialized(true);
    };

    checkAdminAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const result = await adminApiClient.login(email, password);
      if (result.success && result.data) {
        adminApiClient.setToken(result.data.token);
        setAdmin(result.data.admin);
        console.log('Admin login successful:', result.data.admin);
      } else {
        const errorMessage = result.error || 'Admin login failed';
        console.error('Admin login failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    adminApiClient.clearToken();
    setAdmin(null);
  }, []);

  return {
    admin,
    login,
    logout,
    loading,
    isAuthenticated: !!admin,
    initialized
  };
};