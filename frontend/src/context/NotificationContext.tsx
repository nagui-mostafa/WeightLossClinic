import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Info, ShieldAlert, XCircle } from 'lucide-react';

type NotificationType = 'info' | 'success' | 'error' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timeout?: number;
}

interface NotificationContextValue {
  notify: (payload: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <ShieldAlert size={18} />,
  info: <Info size={18} />,
};

const NotificationPortal: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  return createPortal(
    <div className="notification-stack">
      {notifications.map((notification) => (
        <div key={notification.id} className={`toast toast-${notification.type}`}>
          <div className="toast-icon">{iconMap[notification.type]}</div>
          <div className="toast-content">
            <strong>{notification.title}</strong>
            {notification.message ? <span>{notification.message}</span> : null}
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((payload: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    const timeout = payload.timeout ?? 4500;
    const notification: Notification = { ...payload, id };

    setNotifications((prev) => [...prev, notification]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, timeout);
  }, []);

  const value = useMemo<NotificationContextValue>(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationPortal notifications={notifications} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx.notify;
};
