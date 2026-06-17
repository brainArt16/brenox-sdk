import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Call,
  CallMode,
  CallSignaling,
  ChannelOptions,
  ConnectionState,
} from "@brenox/sdk";
import { useBrenoxClient } from "../context";

export interface UseCallSignalingOptions {
  channel?: ChannelOptions;
  autoConnect?: boolean;
}

export interface UseCallSignalingResult {
  signaling: CallSignaling | null;
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  initiate: (mode?: CallMode) => Promise<Call>;
  join: (callId: number) => Promise<Call>;
  leave: (callId: number) => Promise<Call>;
}

export function useCallSignaling(
  workspaceId: number,
  channelId: number,
  options: UseCallSignalingOptions = {},
): UseCallSignalingResult {
  const client = useBrenoxClient();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [signaling, setSignaling] = useState<CallSignaling | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  useEffect(() => {
    const channelOptions = optionsRef.current;
    const instance = client.callSignaling(
      workspaceId,
      channelId,
      channelOptions.channel,
    );
    setSignaling(instance);

    const unsubscribe = instance.channel.onConnectionChange(setConnectionState);

    if (channelOptions.autoConnect !== false) {
      void instance.connect();
    }

    return () => {
      unsubscribe();
      instance.disconnect();
      setSignaling(null);
      setConnectionState("disconnected");
    };
  }, [client, workspaceId, channelId]);

  const connect = useCallback(async () => {
    await signaling?.connect();
  }, [signaling]);

  const disconnect = useCallback(() => {
    signaling?.disconnect();
  }, [signaling]);

  const initiate = useCallback(
    async (mode: CallMode = "voice") => {
      if (!signaling) {
        throw new Error("call signaling is not ready");
      }
      return signaling.initiate(mode);
    },
    [signaling],
  );

  const join = useCallback(
    async (callId: number) => {
      if (!signaling) {
        throw new Error("call signaling is not ready");
      }
      return signaling.join(callId);
    },
    [signaling],
  );

  const leave = useCallback(
    async (callId: number) => {
      if (!signaling) {
        throw new Error("call signaling is not ready");
      }
      return signaling.leave(callId);
    },
    [signaling],
  );

  return useMemo(
    () => ({
      signaling,
      connectionState,
      connect,
      disconnect,
      initiate,
      join,
      leave,
    }),
    [
      signaling,
      connectionState,
      connect,
      disconnect,
      initiate,
      join,
      leave,
    ],
  );
}
