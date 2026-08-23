import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Get base URL from environment or default to same host/port if served together
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000, // 10 second default timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure different timeouts for specific endpoints
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // If it's a prediction request, give it more time
  if (config.url?.includes('/predictions')) {
    config.timeout = 30000;
  }
  
  // Inject token if we have it in memory/storage (Phase 3 currently uses Bearer)
  // We will adapt this based on final auth strategy, but for now we look in localStorage
  // per the previous instructions, but wait, the instructions said:
  // "Do NOT store authentication tokens in localStorage as the default secure strategy."
  // If Phase 3 uses HttpOnly cookies, we don't need to inject it here.
  // But Phase 3 currently returns JSON with `access_token`. 
  // We can inject it here if we store it securely in memory or a worker, but since this is 
  // standard SPA auth, we will pull it from memory state (or zustand/context) if available.
  // For this client, we'll expose a setter:
  
  if (typeof window !== 'undefined') {
      const token = (window as any).__PREDICTX_TOKEN__;
      if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
      }
  }

  return config;
});

// Error Normalization
export type NormalizedError = {
  code: string;
  message: string;
  status?: number;
};

export const normalizeError = (error: unknown): NormalizedError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;
    
    if (status === 401) return { code: 'UNAUTHORIZED', message: 'Please log in to continue.', status };
    if (status === 403) return { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.', status };
    if (status === 404) return { code: 'NOT_FOUND', message: 'The requested resource was not found.', status };
    if (status === 422) return { code: 'VALIDATION_ERROR', message: data?.detail || 'Invalid data provided.', status };
    if (status === 429) return { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.', status };
    if (status && status >= 500) return { code: 'SERVER_ERROR', message: 'The server encountered an error. Please try again.', status };
    
    if (error.code === 'ECONNABORTED') {
      return { code: 'TIMEOUT', message: 'The request timed out. Please check your connection.' };
    }
    
    return { code: 'NETWORK_ERROR', message: error.message || 'Network error occurred.', status };
  }
  
  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' };
};
