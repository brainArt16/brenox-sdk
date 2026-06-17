import { describe, expect, it, vi } from "vitest";
import { BrenoxClient } from "../../src/client";
import { BrenoxError } from "../../src/errors";
import { memoryTokenStore } from "../../src/token-store";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BrenoxClient", () => {
  it("logs in and stores the token", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/login")) {
        return jsonResponse({ token: "jwt-123" });
      }
      throw new Error(`unexpected request: ${url}`);
    });

    const store = memoryTokenStore();
    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      tokenStore: store,
      fetch: fetchMock as typeof fetch,
    });

    const { token } = await client.auth.login({
      email: "a@b.com",
      password: "secret",
    });

    expect(token).toBe("jwt-123");
    expect(await client.getToken()).toBe("jwt-123");
  });

  it("refreshes on 401 and retries once", async () => {
    let messagesCalls = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/auth/refresh")) {
        return jsonResponse({ token: "jwt-new" });
      }

      if (url.includes("/messages")) {
        messagesCalls += 1;
        const auth = (init?.headers as Record<string, string>)?.Authorization
          ?? new Headers(init?.headers).get("Authorization");

        if (messagesCalls === 1) {
          expect(auth).toBe("Bearer jwt-old");
          return jsonResponse({ error: "unauthorized" }, 401);
        }

        expect(auth).toBe("Bearer jwt-new");
        return jsonResponse({
          messages: [
            {
              id: 1,
              channel_id: 2,
              sender_id: 3,
              username: "alice",
              content: "hi",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        });
      }

      throw new Error(`unexpected request: ${url}`);
    });

    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      tokenStore: memoryTokenStore("jwt-old"),
      fetch: fetchMock as typeof fetch,
    });

    const messages = await client.messages.list(1, 2);
    expect(messages).toHaveLength(1);
    expect(await client.getToken()).toBe("jwt-new");
    expect(messagesCalls).toBe(2);
  });

  it("maps API errors to BrenoxError", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "invalid request" }, 400),
    );

    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      fetch: fetchMock as typeof fetch,
    });

    await expect(
      client.auth.register({
        email: "bad",
        username: "x",
        password: "y",
      }),
    ).rejects.toMatchObject({
      name: "BrenoxError",
      status: 400,
      message: "invalid request",
    } satisfies Partial<BrenoxError>);
  });
});

describe("memoryTokenStore", () => {
  it("reads and writes tokens", async () => {
    const store = memoryTokenStore();
    expect(await store.getToken()).toBeNull();
    await store.setToken("abc");
    expect(await store.getToken()).toBe("abc");
    await store.setToken(null);
    expect(await store.getToken()).toBeNull();
  });
});
