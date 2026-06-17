import { useCallback, useEffect, useRef, useState } from "react";
import type { ChannelOptions, ConnectionState } from "@brenox/sdk";
import type { ChannelConnection } from "@brenox/sdk";
import { useBrenoxClient } from "../context";

export interface UseChannelResult {
  connection: ChannelConnection | null;
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
}

export function useChannel(
  workspaceId: number,
  channelId: number,
  options?: ChannelOptions,
): UseChannelResult {
  const client = useBrenoxClient();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [connection, setConnection] = useState<ChannelConnection | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  useEffect(() => {
    const conn = client.channel(workspaceId, channelId, optionsRef.current);
    setConnection(conn);

    const unsubscribe = conn.onConnectionChange(setConnectionState);
    return () => {
      unsubscribe();
      conn.disconnect();
      setConnection(null);
      setConnectionState("disconnected");
    };
  }, [client, workspaceId, channelId]);

  const connect = useCallback(async () => {
    if (!connection) {
      return;
    }
    await connection.connect();
  }, [connection]);

  const disconnect = useCallback(() => {
    connection?.disconnect();
  }, [connection]);

  const sendMessage = useCallback(
    (content: string) => {
      connection?.sendMessage(content);
    },
    [connection],
  );

  const startTyping = useCallback(() => {
    connection?.startTyping();
  }, [connection]);

  const stopTyping = useCallback(() => {
    connection?.stopTyping();
  }, [connection]);

  return {
    connection,
    connectionState,
    connect,
    disconnect,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
