import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current session via httpOnly cookie on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.data?.user) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: receivedUser } = response.data.data;
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { user: receivedUser } = response.data.data;
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
