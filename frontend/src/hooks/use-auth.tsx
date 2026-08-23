'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authApi, LoginRequest, UserOut } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory token storage (secure against XSS, but lost on reload)
// We also export it so the axios client can access it if needed
let inMemoryToken: string | null = null;
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__PREDICTX_TOKEN__', {
    get: () => inMemoryToken,
    set: (val) => { inMemoryToken = val; }
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount, we just check if we have a token (we won't on a hard reload with in-memory)
  // If we had a cookie-based refresh token, we'd try to refresh here.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(data);
      if (result.access_token) {
        setTokenState(result.access_token);
        if (typeof window !== 'undefined') {
          (window as any).__PREDICTX_TOKEN__ = result.access_token;
        }
        // Ideally we'd fetch /users/me here, but Phase 3 doesn't have a /me endpoint explicitly yet.
        // We'll set a mock user object or decode the JWT for the role.
        try {
          const payload = JSON.parse(atob(result.access_token.split('.')[1]));
          setUser({
            id: payload.sub,
            email: data.username,
            role: payload.role,
            is_active: true,
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.error('Failed to parse JWT payload');
        }
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    if (typeof window !== 'undefined') {
      (window as any).__PREDICTX_TOKEN__ = null;
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
