'use client';

import { create } from 'zustand';
import type { Notification } from '@/types/database';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearError: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      const notifications = data.notifications || [];
      set({
        notifications,
        unreadCount: notifications.filter((n: Notification) => !n.read).length,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');

      const state = get();
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark all as read');

      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: true,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');

      const notification = get().notifications.find((n) => n.id === id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          notification && !notification.read ? state.unreadCount - 1 : state.unreadCount,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  clearAll: async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear notifications');
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));

// Selector hooks
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useNotificationLoading = () => useNotificationStore((state) => state.loading);
