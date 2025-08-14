import React, { useState } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export const AdminApp: React.FC = () => {
  const { admin, login, logout, loading, isAuthenticated } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      await login(email, password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLogin={handleLogin}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <AdminDashboard
      admin={admin!}
      onLogout={logout}
    />
  );
};