import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current session on mount or token change
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.data?.user) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
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
      const { token: receivedToken, user: receivedUser } = response.data.data;

      if (receivedToken) {
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
      }
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { token: receivedToken, user: receivedUser } = response.data.data;

      if (receivedToken) {
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
      }
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed:', err.message);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
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
