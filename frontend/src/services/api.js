import axios from 'axios';

/**
 * Axios API Client
 * Configured with withCredentials: true so httpOnly session cookies
 * are automatically included on every request without storing JWT in localStorage.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
