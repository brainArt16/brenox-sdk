import { describe, expect, it, vi } from "vitest";
import { BrenoxClient } from "../../src/client";

type WsListener = (event?: Event) => void;

class MockWebSocket {
  static readonly OPEN = 1;
  static instances: MockWebSocket[] = [];
  readyState = MockWebSocket.OPEN;
  sent: string[] = [];
  private readonly listeners = new Map<string, Set<WsListener>>();

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
    queueMicrotask(() => this.emit("open"));
  }

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

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {}

  emit(type: string, event?: Event): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("CallSignaling", () => {
  it("delegates REST initiate and WS offer", async () => {
    MockWebSocket.instances = [];

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/calls")) {
        return new Response(
          JSON.stringify({
            id: 5,
            channel_id: 2,
            workspace_id: 1,
            initiator_id: 3,
            status: "ringing",
            mode: "voice",
            created_at: "2026-01-01T00:00:00Z",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("/messages")) {
        return new Response(JSON.stringify({ messages: [] }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`unexpected: ${url}`);
    });

    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      tokenStore: { getToken: () => "jwt", setToken: () => {} },
      fetch: fetchMock as typeof fetch,
    });

    const signaling = client.callSignaling(1, 2, {
      WebSocketImpl: MockWebSocket as unknown as typeof WebSocket,
      reconnect: { enabled: false },
    });

    await signaling.connect();

    const call = await signaling.initiate("voice");
    expect(call.id).toBe(5);

    signaling.sendOffer({
      call_id: 5,
      to_user_id: 9,
      sdp: "v=0",
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.sent.some((line) => line.includes("call.offer"))).toBe(true);
    signaling.disconnect();
  });
});
