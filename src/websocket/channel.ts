import type { HttpClient } from "../http";
import type { MessagesResource } from "../resources/messages";
import type {
  ChannelServerEventMap,
  ClientOutboundEvent,
  ClientOutboundEventType,
  ConnectionState,
  ServerEvent,
} from "../types/events";
import { TypedEmitter } from "./emitter";
import { buildChannelWebSocketUrl } from "./url";

export interface SequenceStore {
  get(workspaceId: number, channelId: number): number | Promise<number>;
  set(
    workspaceId: number,
    channelId: number,
    sequence: number,
  ): void | Promise<void>;
}

export function memorySequenceStore(
  initial = new Map<string, number>(),
): SequenceStore {
  const key = (workspaceId: number, channelId: number) =>
    `${workspaceId}:${channelId}`;

  return {
    get(workspaceId, channelId) {
      return initial.get(key(workspaceId, channelId)) ?? 0;
    },
    set(workspaceId, channelId, sequence) {
      initial.set(key(workspaceId, channelId), sequence);
    },
  };
}

export interface ReconnectOptions {
  enabled?: boolean;
  initialDelayMs?: number;
  maxDelayMs?: number;
  multiplier?: number;
}

export interface ChannelConnectionOptions {
  workspaceId: number;
  channelId: number;
  http: HttpClient;
  messages: MessagesResource;
  reconnect?: ReconnectOptions;
  backfillOnReconnect?: boolean;
  backfillPageSize?: number;
  sequenceStore?: SequenceStore;
  WebSocketImpl?: typeof WebSocket;
  /**
   * Origin header for non-browser WebSocket clients (Node `ws`).
   * Required when the server sets `WS_ALLOWED_ORIGINS` (default dev: localhost:3000).
   */
  origin?: string;
}

type WsLike = Pick<
  WebSocket,
  "close" | "send" | "readyState" | "addEventListener" | "removeEventListener"
>;

const WS_OPEN = 1;

export class ChannelConnection {
  readonly workspaceId: number;
  readonly channelId: number;

  private readonly http: HttpClient;
  private readonly messages: MessagesResource;
  private readonly reconnect: Required<ReconnectOptions>;
  private readonly backfillOnReconnect: boolean;
  private readonly backfillPageSize: number;
  private readonly sequenceStore: SequenceStore;
  private readonly WebSocketImpl: typeof WebSocket;
  private readonly wsOrigin?: string;
  private readonly emitter = new TypedEmitter<ChannelServerEventMap>();
  private readonly connectionListeners = new Set<
    (state: ConnectionState) => void
  >();

  private ws: WsLike | null = null;
  private state: ConnectionState = "disconnected";
  private manualClose = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromise: Promise<void> | null = null;
  private seenEventIds = new Set<string>();
  private seenMessageIds = new Set<number>();
  private backfillInFlight: Promise<void> | null = null;

  constructor(options: ChannelConnectionOptions) {
    this.workspaceId = options.workspaceId;
    this.channelId = options.channelId;
    this.http = options.http;
    this.messages = options.messages;
    this.backfillOnReconnect = options.backfillOnReconnect ?? true;
    this.backfillPageSize = options.backfillPageSize ?? 50;
    this.sequenceStore = options.sequenceStore ?? memorySequenceStore();
    this.WebSocketImpl = options.WebSocketImpl ?? globalThis.WebSocket;
    this.wsOrigin = options.origin;

    const reconnect = options.reconnect ?? {};
    this.reconnect = {
      enabled: reconnect.enabled ?? true,
      initialDelayMs: reconnect.initialDelayMs ?? 1_000,
      maxDelayMs: reconnect.maxDelayMs ?? 30_000,
      multiplier: reconnect.multiplier ?? 2,
    };
  }

  get connectionState(): ConnectionState {
    return this.state;
  }

  async getLastSequence(): Promise<number> {
    return this.sequenceStore.get(this.workspaceId, this.channelId);
  }

  onConnectionChange(listener: (state: ConnectionState) => void): () => void {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  on<K extends keyof ChannelServerEventMap>(
    type: K,
    listener: (event: ChannelServerEventMap[K]) => void,
  ): () => void {
    return this.emitter.on(type, listener);
  }

  off<K extends keyof ChannelServerEventMap>(
    type: K,
    listener: (event: ChannelServerEventMap[K]) => void,
  ): void {
    this.emitter.off(type, listener);
  }

  async connect(): Promise<void> {
    if (this.state === "connected" && this.ws?.readyState === WS_OPEN) {
      return;
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.manualClose = false;
    this.clearReconnectTimer();
    this.connectPromise = this.openSocket().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  disconnect(): void {
    this.manualClose = true;
    this.clearReconnectTimer();
    this.closeSocket();
    this.setState("disconnected");
  }

  send(type: ClientOutboundEventType, payload?: unknown): void {
    if (!this.ws || this.ws.readyState !== WS_OPEN) {
      throw new Error("WebSocket is not connected");
    }

    const event: ClientOutboundEvent = { type, payload };
    this.ws.send(JSON.stringify(event));
  }

  sendMessage(content: string): void {
    this.send("message.send", { content });
  }

  startTyping(): void {
    this.send("typing.start");
  }

  stopTyping(): void {
    this.send("typing.stop");
  }

  private async openSocket(): Promise<void> {
    this.setState(this.reconnectAttempt > 0 ? "reconnecting" : "connecting");

    let token = await this.http.getToken();
    if (!token) {
      throw new Error("missing auth token — call auth.login() first");
    }

    try {
      await this.connectSocket(token);
    } catch (error) {
      const refreshed = await this.http.refreshToken();
      if (!refreshed) {
        throw error;
      }
      await this.connectSocket(refreshed);
    }
  }

  private createWebSocket(url: string): WsLike {
    if (this.wsOrigin) {
      const Ctor = this.WebSocketImpl as new (
        address: string,
        protocols?: string | string[],
        options?: { headers?: Record<string, string> },
      ) => WsLike;
      return new Ctor(url, undefined, {
        headers: { Origin: this.wsOrigin },
      });
    }

    return new this.WebSocketImpl(url) as WsLike;
  }

  private async connectSocket(token: string): Promise<void> {
    const url = buildChannelWebSocketUrl(
      this.http.getBaseUrl(),
      this.workspaceId,
      this.channelId,
      token,
    );

    const ws = this.createWebSocket(url);
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
        this.reconnectAttempt = 0;
        this.setState("connected");
        void this.handleOpen();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("WebSocket connection failed"));
      };

      const onClose = (event: Event) => {
        const closeEvent = event as CloseEvent;
        cleanup();

        if (this.ws === ws) {
          this.ws = null;
        }

        if (!this.manualClose) {
          this.setState("disconnected");
          void this.handleUnexpectedClose(closeEvent.code);
        }

        if (this.state === "connecting" || this.state === "reconnecting") {
          reject(new Error(`WebSocket closed before open (${closeEvent.code})`));
        }
      };

      const onMessage = (event: MessageEvent) => {
        void this.handleMessage(String(event.data));
      };

      const cleanup = () => {
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
        ws.removeEventListener("close", onClose);
        ws.removeEventListener("message", onMessage);
      };

      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
      ws.addEventListener("close", onClose);
      ws.addEventListener("message", onMessage);
    });
  }

  private async handleOpen(): Promise<void> {
    if (!this.backfillOnReconnect) {
      return;
    }
    await this.backfillHistory();
  }

  private async handleUnexpectedClose(code: number): Promise<void> {
    if (!this.reconnect.enabled || this.manualClose) {
      return;
    }

    if (code === 1008 || code === 4001) {
      const refreshed = await this.http.refreshToken();
      if (!refreshed) {
        return;
      }
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.manualClose) {
      return;
    }

    const delay = Math.min(
      this.reconnect.initialDelayMs *
        this.reconnect.multiplier ** this.reconnectAttempt,
      this.reconnect.maxDelayMs,
    );
    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private closeSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    for (const listener of this.connectionListeners) {
      listener(state);
    }
  }

  private async handleMessage(raw: string): Promise<void> {
    let event: ServerEvent;
    try {
      event = JSON.parse(raw) as ServerEvent;
    } catch {
      return;
    }

    if (!event?.type) {
      return;
    }

    if (await this.shouldSkipEvent(event)) {
      return;
    }

    if (event.type === "message.new") {
      const payload = event.payload as { id?: number };
      if (typeof payload?.id === "number") {
        this.seenMessageIds.add(payload.id);
      }
    }

    this.emitter.emit(
      event.type as keyof ChannelServerEventMap,
      event as ChannelServerEventMap[keyof ChannelServerEventMap],
    );

    if (typeof event.sequence === "number" && event.sequence > 0) {
      const last = await this.sequenceStore.get(
        this.workspaceId,
        this.channelId,
      );
      if (event.sequence > last + 1) {
        void this.backfillHistory();
      }
    }
  }

  private async shouldSkipEvent(event: ServerEvent): Promise<boolean> {
    if (event.type === "message.new") {
      const payload = event.payload as { id?: number };
      if (typeof payload?.id === "number" && this.seenMessageIds.has(payload.id)) {
        if (typeof event.sequence === "number" && event.sequence > 0) {
          const last = await this.sequenceStore.get(
            this.workspaceId,
            this.channelId,
          );
          if (event.sequence > last) {
            await this.sequenceStore.set(
              this.workspaceId,
              this.channelId,
              event.sequence,
            );
          }
        }
        return true;
      }
    }

    if (event.event_id) {
      if (this.seenEventIds.has(event.event_id)) {
        return true;
      }
      this.seenEventIds.add(event.event_id);
    }

    if (typeof event.sequence === "number" && event.sequence > 0) {
      const last = await this.sequenceStore.get(
        this.workspaceId,
        this.channelId,
      );
      if (event.sequence <= last) {
        return true;
      }
      await this.sequenceStore.set(
        this.workspaceId,
        this.channelId,
        event.sequence,
      );
    }

    return false;
  }

  private async backfillHistory(): Promise<void> {
    if (this.backfillInFlight) {
      return this.backfillInFlight;
    }

    this.backfillInFlight = this.doBackfill().finally(() => {
      this.backfillInFlight = null;
    });
    return this.backfillInFlight;
  }

  private async doBackfill(): Promise<void> {
    let offset = 0;

    while (true) {
      const page = await this.messages.list(
        this.workspaceId,
        this.channelId,
        {
          limit: this.backfillPageSize,
          offset,
        },
      );

      if (page.length === 0) {
        break;
      }

      for (const message of page) {
        if (this.seenMessageIds.has(message.id)) {
          continue;
        }
        this.seenMessageIds.add(message.id);

        const replay: ServerEvent = {
          type: "message.new",
          workspace_id: this.workspaceId,
          channel_id: this.channelId,
          event_id: `backfill-${message.id}`,
          timestamp: message.created_at,
          payload: {
            id: message.id,
            sender_id: message.sender_id,
            content: message.content,
            created_at: message.created_at,
          },
        };

        if (replay.event_id && !this.seenEventIds.has(replay.event_id)) {
          this.seenEventIds.add(replay.event_id);
          this.emitter.emit("message.new", replay as ChannelServerEventMap["message.new"]);
        }
      }

      if (page.length < this.backfillPageSize) {
        break;
      }
      offset += page.length;
    }
  }
}
