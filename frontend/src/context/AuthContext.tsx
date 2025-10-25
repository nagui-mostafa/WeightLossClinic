import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, { setAuthHeader } from '../services/api';

export type Role = 'ADMIN' | 'PATIENT';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string | null;
  isEmailVerified?: boolean;
  isActive?: boolean;
  currentWeight?: number | null;
  goalWeight?: number | null;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  tokens: Tokens | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  signup: (payload: Record<string, unknown>) => Promise<{ requiresEmailVerification: boolean }>;
  logout: (soft?: boolean) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const storageKeys = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'authUser',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((userData: AuthUser | null, tokenData: Tokens | null) => {
    if (userData) {
      localStorage.setItem(storageKeys.user, JSON.stringify(userData));
    } else {
      localStorage.removeItem(storageKeys.user);
    }

    if (tokenData) {
      localStorage.setItem(storageKeys.accessToken, tokenData.accessToken);
      localStorage.setItem(storageKeys.refreshToken, tokenData.refreshToken);
      setAuthHeader(tokenData.accessToken);
    } else {
      localStorage.removeItem(storageKeys.accessToken);
      localStorage.removeItem(storageKeys.refreshToken);
      setAuthHeader(undefined);
    }
  }, []);

  const authenticate = useCallback(
    (userData: AuthUser, tokenData: Tokens) => {
      setUser(userData);
      setTokens(tokenData);
      persistAuth(userData, tokenData);
    },
    [persistAuth],
  );

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      setLoading(true);
      try {
        const { data } = await api.post('/auth/login', payload);
        const tokenData: Tokens = data.tokens ?? {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          refreshExpiresIn: data.refreshExpiresIn,
        };
        const userData: AuthUser = data.user ?? data;

        setTokens(tokenData);
        setUser(userData);
        persistAuth(userData, tokenData);
      } finally {
        setLoading(false);
      }
    },
    [persistAuth],
  );

  const signup = useCallback(async (payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', payload);

      if (data.requiresEmailVerification) {
        return { requiresEmailVerification: true };
      }

      const tokenData: Tokens = data.tokens ?? {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        refreshExpiresIn: data.refreshExpiresIn,
      };
      const userData: AuthUser = data.user ?? data;
      authenticate(userData, tokenData);
      return { requiresEmailVerification: false };
    } finally {
      setLoading(false);
    }
  }, [authenticate]);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data);
    localStorage.setItem(storageKeys.user, JSON.stringify(data));
  }, []);

  const logout = useCallback(
    (soft = false) => {
      setUser(null);
      setTokens(null);
      persistAuth(null, null);
      if (!soft) {
        api.post('/auth/logout').catch(() => undefined);
      }
    },
    [persistAuth],
  );

  useEffect(() => {
    const storedAccessToken = localStorage.getItem(storageKeys.accessToken);
    const storedRefreshToken = localStorage.getItem(storageKeys.refreshToken);
    const storedUser = localStorage.getItem(storageKeys.user);

    if (storedAccessToken && storedRefreshToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        const tokenData: Tokens = {
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
        };
        setTokens(tokenData);
        setUser(parsedUser);
        setAuthHeader(storedAccessToken);
      } catch {
        logout(true);
      }
    }
    setLoading(false);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      loading,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [user, tokens, loading, login, signup, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
