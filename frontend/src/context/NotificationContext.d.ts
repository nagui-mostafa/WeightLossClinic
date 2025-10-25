import React from 'react';
type NotificationType = 'info' | 'success' | 'error' | 'warning';
interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    timeout?: number;
}
export declare const NotificationProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useNotification: () => (payload: Omit<Notification, "id">) => void;
export {};
