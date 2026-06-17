import { describe, expect, it } from "vitest";
import WebSocket from "ws";
import { BrenoxClient } from "../../src/client";

const baseUrl = process.env.BRENOX_URL ?? "http://localhost:8080";

async function isApiUp(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

function waitFor<T>(
  fn: () => T | undefined,
  timeoutMs = 10_000,
  intervalMs = 50,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const value = fn();
      if (value !== undefined) {
        clearInterval(timer);
        resolve(value);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error("timeout waiting for condition"));
      }
    }, intervalMs);
  });
}

describe("integration websocket", () => {
  it("connects and receives message.new from WebSocket send", async () => {
    if (!(await isApiUp())) {
      console.warn(`Skipping: Brenox API not reachable at ${baseUrl}`);
      return;
    }

    const WebSocketImpl =
      typeof globalThis.WebSocket !== "undefined"
        ? globalThis.WebSocket
        : (WebSocket as unknown as typeof globalThis.WebSocket);

    const suffix = Date.now();
    const email = `sdk-ws-${suffix}@example.com`;

    const client = new BrenoxClient({ baseUrl });

    await client.auth.register({
      email,
      username: `sdk_ws_${suffix}`,
      password: "password123",
    });

    await client.auth.login({ email, password: "password123" });

    const workspace = await client.workspaces.create({
      name: `WS Workspace ${suffix}`,
      slug: `ws-${suffix}`,
    });

    const channel = await client.channels.create(workspace.id, {
      name: "general",
    });

    const conn = client.channel(workspace.id, channel.ID, {
      reconnect: { enabled: false },
      WebSocketImpl,
      origin: process.env.BRENOX_WS_ORIGIN ?? "http://localhost:3000",
    });

    let receivedContent: string | undefined;
    conn.on("message.new", (event) => {
      if (event.payload.content === "hello via websocket") {
        receivedContent = event.payload.content;
      }
    });

    await conn.connect();
    conn.sendMessage("hello via websocket");

    const content = await waitFor(() => receivedContent);
    expect(content).toBe("hello via websocket");

    conn.disconnect();
  });
});
