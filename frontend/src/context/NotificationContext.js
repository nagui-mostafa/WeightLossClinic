import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useState, } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Info, ShieldAlert, XCircle } from 'lucide-react';
const NotificationContext = createContext(undefined);
const iconMap = {
    success: _jsx(CheckCircle, { size: 18 }),
    error: _jsx(XCircle, { size: 18 }),
    warning: _jsx(ShieldAlert, { size: 18 }),
    info: _jsx(Info, { size: 18 }),
};
const NotificationPortal = ({ notifications }) => {
    return createPortal(_jsx("div", { className: "notification-stack", children: notifications.map((notification) => (_jsxs("div", { className: `toast toast-${notification.type}`, children: [_jsx("div", { className: "toast-icon", children: iconMap[notification.type] }), _jsxs("div", { className: "toast-content", children: [_jsx("strong", { children: notification.title }), notification.message ? _jsx("span", { children: notification.message }) : null] })] }, notification.id))) }), document.body);
};
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const notify = useCallback((payload) => {
        const id = crypto.randomUUID();
        const timeout = payload.timeout ?? 4500;
        const notification = { ...payload, id };
        setNotifications((prev) => [...prev, notification]);
        window.setTimeout(() => {
            setNotifications((prev) => prev.filter((item) => item.id !== id));
        }, timeout);
    }, []);
    const value = useMemo(() => ({ notify }), [notify]);
    return (_jsxs(NotificationContext.Provider, { value: value, children: [children, _jsx(NotificationPortal, { notifications: notifications })] }));
};
export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return ctx.notify;
};
