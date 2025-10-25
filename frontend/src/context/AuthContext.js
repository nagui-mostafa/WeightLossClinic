import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import api, { setAuthHeader } from '../services/api';
const AuthContext = createContext(undefined);
const storageKeys = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    user: 'authUser',
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [loading, setLoading] = useState(true);
    const persistAuth = useCallback((userData, tokenData) => {
        if (userData) {
            localStorage.setItem(storageKeys.user, JSON.stringify(userData));
        }
        else {
            localStorage.removeItem(storageKeys.user);
        }
        if (tokenData) {
            localStorage.setItem(storageKeys.accessToken, tokenData.accessToken);
            localStorage.setItem(storageKeys.refreshToken, tokenData.refreshToken);
            setAuthHeader(tokenData.accessToken);
        }
        else {
            localStorage.removeItem(storageKeys.accessToken);
            localStorage.removeItem(storageKeys.refreshToken);
            setAuthHeader(undefined);
        }
    }, []);
    const authenticate = useCallback((userData, tokenData) => {
        setUser(userData);
        setTokens(tokenData);
        persistAuth(userData, tokenData);
    }, [persistAuth]);
    const login = useCallback(async (payload) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', payload);
            const tokenData = data.tokens ?? {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
                refreshExpiresIn: data.refreshExpiresIn,
            };
            const userData = data.user ?? data;
            setTokens(tokenData);
            setUser(userData);
            persistAuth(userData, tokenData);
        }
        finally {
            setLoading(false);
        }
    }, [persistAuth]);
    const signup = useCallback(async (payload) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/signup', payload);
            if (data.requiresEmailVerification) {
                return { requiresEmailVerification: true };
            }
            const tokenData = data.tokens ?? {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
                refreshExpiresIn: data.refreshExpiresIn,
            };
            const userData = data.user ?? data;
            authenticate(userData, tokenData);
            return { requiresEmailVerification: false };
        }
        finally {
            setLoading(false);
        }
    }, [authenticate]);
    const refreshProfile = useCallback(async () => {
        const { data } = await api.get('/auth/me');
        setUser(data);
        localStorage.setItem(storageKeys.user, JSON.stringify(data));
    }, []);
    const logout = useCallback((soft = false) => {
        setUser(null);
        setTokens(null);
        persistAuth(null, null);
        if (!soft) {
            api.post('/auth/logout').catch(() => undefined);
        }
    }, [persistAuth]);
    useEffect(() => {
        const storedAccessToken = localStorage.getItem(storageKeys.accessToken);
        const storedRefreshToken = localStorage.getItem(storageKeys.refreshToken);
        const storedUser = localStorage.getItem(storageKeys.user);
        if (storedAccessToken && storedRefreshToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const tokenData = {
                    accessToken: storedAccessToken,
                    refreshToken: storedRefreshToken,
                };
                setTokens(tokenData);
                setUser(parsedUser);
                setAuthHeader(storedAccessToken);
            }
            catch {
                logout(true);
            }
        }
        setLoading(false);
    }, [logout]);
    const value = useMemo(() => ({
        user,
        tokens,
        loading,
        login,
        signup,
        logout,
        refreshProfile,
    }), [user, tokens, loading, login, signup, logout, refreshProfile]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
};
