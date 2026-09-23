import { StateCreator } from 'zustand';
import { Notification } from '../../types';
import { api } from '../../lib/api';

export interface NotificationSlice {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createNotificationSlice: StateCreator<NotificationSlice & any, [], [], NotificationSlice> = (set, get) => ({
  notifications: [],

  addNotification: async (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: `n${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    set((state) => ({
      notifications: [notification, ...state.notifications]
    }));
    await api.post('/notifications', notification).catch(console.error);
  },

  markNotificationAsRead: async (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    }));
    const updated = get().notifications.find(n => n.id === notificationId);
    if (updated) {
      await api.put(`/notifications/${notificationId}`, updated).catch(console.error);
    }
  },

  markAllNotificationsAsRead: async () => {
    const updatedNotifications = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updatedNotifications });
    
    // Batch update (simple loop for now)
    for (const n of updatedNotifications) {
      if (!n.isRead) continue; // Only those we just changed
      api.put(`/notifications/${n.id}`, n).catch(console.error);
    }
  }
});
