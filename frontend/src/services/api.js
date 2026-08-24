import axios from 'axios';

/**
 * Axios API Client
 * Configured with withCredentials: true (for httpOnly session cookies)
 * and an Authorization header request interceptor for robust dual-layer auth persistence.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer token from localStorage if present
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // localStorage may be inaccessible in some private browsing modes
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 token invalidation cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      // If a protected request fails with 401, remove the stale token
      if (!isAuthCheck) {
        try {
          localStorage.removeItem('auth_token');
        } catch (e) {}
      }
    }
    return Promise.reject(error);
  }
);

export default api;
