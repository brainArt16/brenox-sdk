import { useCallback, useEffect, useMemo, useState } from "react";
import type { Notification } from "@brenox/sdk";
import { useBrenoxClient } from "../context";

export interface UseNotificationsOptions {
  limit?: number;
  pollIntervalMs?: number;
}

export interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  markRead: (notificationId: number) => Promise<Notification>;
  markAllRead: () => Promise<number>;
}

export function useNotifications(
  options: UseNotificationsOptions = {},
): UseNotificationsResult {
  const client = useBrenoxClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const limit = options.limit ?? 50;

  const refresh = useCallback(async () => {
    const items = await client.notifications.list({ limit });
    setNotifications(items);
  }, [client, limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    refresh()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (!options.pollIntervalMs) {
      return;
    }

    const timer = setInterval(() => {
      void refresh().catch(() => undefined);
    }, options.pollIntervalMs);

    return () => clearInterval(timer);
  }, [options.pollIntervalMs, refresh]);

  const markRead = useCallback(
    async (notificationId: number) => {
      const updated = await client.notifications.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      return updated;
    },
    [client],
  );

  const markAllRead = useCallback(async () => {
    const result = await client.notifications.markAllRead();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true })),
    );
    return result.marked_read;
  }, [client]);

  return useMemo(
    () => ({
      notifications,
      loading,
      error,
      refresh,
      markRead,
      markAllRead,
    }),
    [notifications, loading, error, refresh, markRead, markAllRead],
  );
}
