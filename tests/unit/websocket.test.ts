import { describe, expect, it, vi } from "vitest";
import { buildChannelWebSocketUrl, httpToWebSocketBase } from "../../src/websocket/url";

describe("websocket url", () => {
  it("converts http to ws", () => {
    expect(httpToWebSocketBase("http://localhost:8080")).toBe(
      "ws://localhost:8080",
    );
    expect(httpToWebSocketBase("https://api.example.com/v1")).toBe(
      "wss://api.example.com",
    );
  });

  it("builds channel websocket url with token query", () => {
    const url = buildChannelWebSocketUrl("http://localhost:8080", 1, 2, "jwt");
    expect(url).toBe(
      "ws://localhost:8080/api/ws?workspace_id=1&channel_id=2&token=jwt",
    );
  });
});

type WsListener = (event?: Event) => void;

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;
  private readonly listeners = new Map<string, Set<WsListener>>();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      if (!this.failOpen) {
        this.open();
      } else {
        this.emit("error");
        this.emit("close", { code: 1006 } as CloseEvent);
      }
    });
  }

  static instances: MockWebSocket[] = [];
  static failOpen = false;

  addEventListener(type: string, listener: WsListener): void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: WsListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  send = vi.fn((data: string) => {
    this.sent.push(data);
  });

  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.emit("close", { code: 1000 } as CloseEvent);
  });

  sent: string[] = [];

  open(): void {
    this.readyState = MockWebSocket.OPEN;
    this.emit("open");
  }

  emit(type: string, event?: Event): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  receive(data: string): void {
    this.emit("message", { data } as MessageEvent);
  }
}

import { BrenoxClient } from "../../src/client";
import { memoryTokenStore } from "../../src/token-store";

describe("ChannelConnection", () => {
  it("connects and receives message.new with sequence tracking", async () => {
    MockWebSocket.instances = [];
    MockWebSocket.failOpen = false;

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/messages")) {
        return new Response(JSON.stringify({ messages: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      tokenStore: memoryTokenStore("jwt"),
      fetch: fetchMock as typeof fetch,
    });

    const conn = client.channel(1, 2, {
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
      reconnect: { enabled: false },
    });

    const events: unknown[] = [];
    conn.on("message.new", (event) => {
      events.push(event);
    });

    await conn.connect();

    const ws = MockWebSocket.instances[0];
    expect(ws.url).toContain("workspace_id=1");
    expect(ws.url).toContain("channel_id=2");
    expect(ws.url).toContain("token=jwt");

    ws.receive(
      JSON.stringify({
        type: "message.new",
        workspace_id: 1,
        channel_id: 2,
        event_id: "evt-1",
        sequence: 1,
        timestamp: "2026-01-01T00:00:00Z",
        payload: {
          id: 10,
          sender_id: 3,
          content: "hello",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    await vi.waitFor(() => expect(events).toHaveLength(1));
    expect(await conn.getLastSequence()).toBe(1);

    ws.receive(
      JSON.stringify({
        type: "message.new",
        workspace_id: 1,
        channel_id: 2,
        event_id: "evt-1",
        sequence: 1,
        timestamp: "2026-01-01T00:00:00Z",
        payload: {
          id: 10,
          sender_id: 3,
          content: "hello",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    expect(events).toHaveLength(1);

    conn.sendMessage("via ws");
    expect(ws.sent.at(-1)).toBe(
      JSON.stringify({ type: "message.send", payload: { content: "via ws" } }),
    );

    conn.disconnect();
  });

  it("deduplicates message.new by message id after backfill", async () => {
    MockWebSocket.instances = [];
    MockWebSocket.failOpen = false;

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/messages")) {
        return new Response(
          JSON.stringify({
            messages: [
              {
                id: 5,
                channel_id: 2,
                sender_id: 1,
                username: "alice",
                content: "backfilled",
                created_at: "2026-01-01T00:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      tokenStore: memoryTokenStore("jwt"),
      fetch: fetchMock as typeof fetch,
    });

    const conn = client.channel(1, 2, {
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
      reconnect: { enabled: false },
    });

    const events: unknown[] = [];
    conn.on("message.new", (event) => {
      events.push(event);
    });

    await conn.connect();
    await vi.waitFor(() => expect(events).toHaveLength(1));

    const ws = MockWebSocket.instances[0];
    ws.receive(
      JSON.stringify({
        type: "message.new",
        workspace_id: 1,
        channel_id: 2,
        event_id: "evt-live",
        sequence: 2,
        timestamp: "2026-01-01T00:00:01Z",
        payload: {
          id: 5,
          sender_id: 1,
          content: "backfilled",
          created_at: "2026-01-01T00:00:00Z",
        },
      }),
    );

    await vi.waitFor(() => expect(events).toHaveLength(1));
    conn.disconnect();
  });
});
