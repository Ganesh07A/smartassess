import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Clerk JWT to every request
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
    const token = await (window as any).Clerk.session.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors and surface error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
    }
    // Surface structured error messages from the backend
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    error.displayMessage = message;
    return Promise.reject(error);
  }
);