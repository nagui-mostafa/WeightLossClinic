import React from 'react';
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
    login: (payload: {
        email: string;
        password: string;
    }) => Promise<void>;
    signup: (payload: Record<string, unknown>) => Promise<{
        requiresEmailVerification: boolean;
    }>;
    logout: (soft?: boolean) => void;
    refreshProfile: () => Promise<void>;
}
export declare const AuthProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useAuth: () => AuthContextValue;
export {};
