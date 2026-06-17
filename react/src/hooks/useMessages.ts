import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChannelOptions, MessageListItem } from "@brenox/sdk";
import { useBrenoxClient } from "../context";
import { useChannel } from "./useChannel";

export interface UseMessagesOptions {
  channel?: ChannelOptions;
  autoConnect?: boolean;
  limit?: number;
}

export interface UseMessagesResult {
  messages: MessageListItem[];
  loading: boolean;
  error: Error | null;
  connectionState: ReturnType<typeof useChannel>["connectionState"];
  refresh: () => Promise<void>;
  sendMessage: (content: string) => Promise<void | MessageListItem>;
  connect: () => Promise<void>;
  disconnect: () => void;
}

function toListItem(
  payload: {
    id: number;
    sender_id: number;
    content: string;
    created_at: string;
  },
  channelId: number,
  username = "",
): MessageListItem {
  return {
    id: payload.id,
    channel_id: channelId,
    sender_id: payload.sender_id,
    username,
    content: payload.content,
    created_at: payload.created_at,
  };
}

export function useMessages(
  workspaceId: number,
  channelId: number,
  options: UseMessagesOptions = {},
): UseMessagesResult {
  const client = useBrenoxClient();
  const { connection, connectionState, connect, disconnect } = useChannel(
    workspaceId,
    channelId,
    options.channel,
  );

  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const limit = options.limit ?? 50;

  const refresh = useCallback(async () => {
    const items = await client.messages.list(workspaceId, channelId, { limit });
    setMessages(items);
  }, [client, workspaceId, channelId, limit]);

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
    if (!connection) {
      return;
    }

    if (options.autoConnect !== false) {
      void connect();
    }

    const offNew = connection.on("message.new", (event) => {
      setMessages((prev) => {
        if (prev.some((message) => message.id === event.payload.id)) {
          return prev;
        }
        return [
          ...prev,
          toListItem(event.payload, channelId),
        ];
      });
    });

    const offUpdated = connection.on("message.updated", (event) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === event.payload.id
            ? {
                ...message,
                content: event.payload.content,
              }
            : message,
        ),
      );
    });

    return () => {
      offNew();
      offUpdated();
    };
  }, [connection, channelId, connect, options.autoConnect]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (connection && connectionState === "connected") {
        connection.sendMessage(content);
        return;
      }
      const message = await client.messages.send(workspaceId, channelId, {
        content,
      });
      return toListItem(message, channelId);
    },
    [client, workspaceId, channelId, connection, connectionState],
  );

  return useMemo(
    () => ({
      messages,
      loading,
      error,
      connectionState,
      refresh,
      sendMessage,
      connect,
      disconnect,
    }),
    [
      messages,
      loading,
      error,
      connectionState,
      refresh,
      sendMessage,
      connect,
      disconnect,
    ],
  );
}
