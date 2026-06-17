import { describe, expect, it, vi } from "vitest";
import { BrenoxServer } from "../../src/server";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BrenoxServer", () => {
  it("sends API key as Bearer token", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer bx_test_secret");

      if (url.endsWith("/v1/users")) {
        return jsonResponse(
          { id: 1, external_id: "u1", username: "bot" },
          201,
        );
      }
      throw new Error(`unexpected: ${url}`);
    });

    const server = new BrenoxServer({
      baseUrl: "http://localhost:8080",
      apiKey: "bx_test_secret",
      fetch: fetchMock as typeof fetch,
    });

    const user = await server.users.provision({ external_id: "u1" });
    expect(user.external_id).toBe("u1");
  });

  it("supports X-API-Key auth style", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("X-API-Key")).toBe("bx_test_key");
      return jsonResponse({ id: 1, name: "general", workspace_id: 2, is_read_only: false }, 201);
    });

    const server = new BrenoxServer({
      baseUrl: "http://localhost:8080",
      apiKey: "bx_test_key",
      authStyle: "x-api-key",
      fetch: fetchMock as typeof fetch,
    });

    const channel = await server.channels.create({ name: "general" });
    expect(channel.name).toBe("general");
  });

  it("sends idempotency key on writes", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Idempotency-Key")).toBe("msg-1");
      return jsonResponse(
        {
          id: 9,
          channel_id: 1,
          sender_id: 2,
          content: "hi",
          created_at: "2026-01-01T00:00:00Z",
        },
        201,
      );
    });

    const server = new BrenoxServer({
      baseUrl: "http://localhost:8080",
      apiKey: "bx_test_key",
      fetch: fetchMock as typeof fetch,
    });

    const message = await server.messages.send(
      { channel_id: 1, external_id: "u1", content: "hi" },
      "msg-1",
    );
    expect(message.id).toBe(9);
  });
});
