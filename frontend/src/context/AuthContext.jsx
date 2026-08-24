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
      const { user: receivedUser, token } = response.data.data;
      if (token) {
        try {
          localStorage.setItem('auth_token', token);
        } catch (e) {}
      }
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

  const requestOtp = async (phone) => {
    setError(null);
    try {
      const res = await api.post('/auth/otp/request', { phone });
      return { success: true, data: res.data.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send OTP';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const verifyOtp = async (phoneOrPayload, otpArg, nameArg) => {
    setError(null);
    let payload = {};
    if (typeof phoneOrPayload === 'object' && phoneOrPayload !== null) {
      payload = phoneOrPayload;
    } else {
      payload = { phone: phoneOrPayload, otp: otpArg, name: nameArg };
    }

    try {
      const res = await api.post('/auth/otp/verify', payload);
      const token = res.data.data?.token;
      if (token) {
        try {
          localStorage.setItem('auth_token', token);
        } catch (e) {}
      }
      if (res.data.success && res.data.data?.user) {
        setUser(res.data.data.user);
      }
      return {
        success: true,
        data: res.data.data,
        user: res.data.data?.user,
        message: res.data.message,
      };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'OTP verification failed';
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
      try {
        localStorage.removeItem('auth_token');
      } catch (e) {}
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
        return response.data.data.user;
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err.message);
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await api.patch('/auth/profile', profileData);
      if (res.data.success && res.data.data?.user) {
        setUser(res.data.data.user);
      }
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update profile';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/account');
    } catch (err) {
      console.warn('Delete account error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    requestOtp,
    verifyOtp,
    updateProfile,
    refreshUser,
    deleteAccount,
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
