// Notification Types
import type { Notification, NotificationType } from './database';

export interface NotificationWithActions extends Notification {
  actions?: {
    label: string;
    href: string;
  }[];
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  page?: number;
  perPage?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export type { Notification, NotificationType };
