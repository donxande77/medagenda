import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import { NotificationItem } from '../types/index.ts';
import { api } from '../services/api.ts';

type RealtimeListener = (event: { type: string; payload: any }) => void;

interface RealtimeContextType {
  isConnected: boolean;
  subscribe: (listener: RealtimeListener) => () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllNotificationsAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  lastEventTime: string | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentPatient } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [listeners, setListeners] = useState<Set<RealtimeListener>>(new Set());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const params =
        currentUser?.role === 'admin'
          ? {}
          : { patientId: currentPatient?.id, userId: currentUser?.id };

      const list = await api.notifications.list(params);
      setNotifications(list);
      setUnreadCount(list.filter((n) => n.status !== 'read').length);
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  }, [currentUser?.role, currentUser?.id, currentPatient?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const url = `/api/realtime/stream?userId=${currentUser?.id || ''}&role=${currentUser?.role || ''}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    const handleEvent = (type: string, dataStr: string) => {
      try {
        const payload = JSON.parse(dataStr);
        setLastEventTime(new Date().toLocaleTimeString('pt-BR'));

        // If notification received, refresh notification list
        if (type === 'NOTIFICATION_RECEIVED') {
          fetchNotifications();
        }

        // Notify subscribers
        listeners.forEach((listener) => {
          try {
            listener({ type, payload });
          } catch (err) {
            console.error('Error in realtime listener:', err);
          }
        });
      } catch (e) {
        console.warn('Error parsing realtime event data:', e);
      }
    };

    eventSource.addEventListener('CONNECTED', (e: MessageEvent) => handleEvent('CONNECTED', e.data));
    eventSource.addEventListener('APPOINTMENT_BOOKED', (e: MessageEvent) =>
      handleEvent('APPOINTMENT_BOOKED', e.data)
    );
    eventSource.addEventListener('APPOINTMENT_CANCELLED', (e: MessageEvent) =>
      handleEvent('APPOINTMENT_CANCELLED', e.data)
    );
    eventSource.addEventListener('APPOINTMENT_RESCHEDULED', (e: MessageEvent) =>
      handleEvent('APPOINTMENT_RESCHEDULED', e.data)
    );
    eventSource.addEventListener('SCHEDULE_UPDATED', (e: MessageEvent) =>
      handleEvent('SCHEDULE_UPDATED', e.data)
    );
    eventSource.addEventListener('AVAILABILITY_CHANGED', (e: MessageEvent) =>
      handleEvent('AVAILABILITY_CHANGED', e.data)
    );
    eventSource.addEventListener('NOTIFICATION_RECEIVED', (e: MessageEvent) =>
      handleEvent('NOTIFICATION_RECEIVED', e.data)
    );

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [currentUser?.id, currentUser?.role, listeners, fetchNotifications]);

  const subscribe = useCallback((listener: RealtimeListener) => {
    setListeners((prev) => new Set(prev).add(listener));
    return () => {
      setListeners((prev) => {
        const next = new Set(prev);
        next.delete(listener);
        return next;
      });
    };
  }, []);

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: 'read' as const }))
    );
    setUnreadCount(0);
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        subscribe,
        notifications,
        unreadCount,
        markAllNotificationsAsRead,
        refreshNotifications: fetchNotifications,
        lastEventTime,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
