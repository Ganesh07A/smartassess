import axios from 'axios';

// Dynamically determine the API base URL based on the window location to support LAN testing
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // If running in browser on LAN, replace the Next.js port (usually 3000) with the backend port (4000)
    const { hostname, protocol } = window.location;
    return `${protocol}//${hostname}:4000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export const api = axios.create({
  baseURL: getBaseURL(),
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
        // Prevent infinite redirect loops: if we're already on a protected page
        // and Clerk hasn't logged us out yet, redirecting to sign-in will just
        // bounce us back here.
        const path = window.location.pathname;
        if (!path.startsWith('/sign-in') && !path.startsWith('/sign-up') && path !== '/') {
          // If we are at the root or sign-in, don't redirect.
          // In a real app, you might want to force a Clerk sign-out here if the backend is consistently failing.
          window.location.href = '/sign-in';
        }
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