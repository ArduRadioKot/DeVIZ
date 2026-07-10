import { useCallback, useMemo, useState } from "react";
import * as meApi from "../api/me";
import type { NotificationItem } from "../types";
import type { Notification as ApiNotification } from "../api/types";

function apiNotificationToNotification(n: ApiNotification): NotificationItem {
  return {
    id: n.id,
    title: n.title,
    body: n.body || "",
    time: new Date(n.created_at).toLocaleDateString("ru-RU", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    read: n.read_at !== null,
    type: (n.type as NotificationItem["type"]) || "system",
  };
}

export function useNotifications(isApiAvailable: boolean) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const page = await meApi.listNotifications({ limit: 50 });
      setNotifications(page.items.map(apiNotificationToNotification));
    } catch {}
  }, []);

  const handleMarkNotificationRead = useCallback(
    async (id: string) => {
      if (isApiAvailable) {
        try { await meApi.markNotificationRead(id); } catch {}
      }
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [isApiAvailable],
  );

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (isApiAvailable) {
      try { await meApi.markAllNotificationsRead(); } catch {}
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [isApiAvailable]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return {
    notifications,
    setNotifications,
    loadNotifications,
    unreadNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
  };
}
