import { describe, expect, it, vi } from "vitest";
import { BrenoxClient } from "../../src/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("NotificationsResource", () => {
  it("lists and marks notifications read", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/notifications") && !url.includes("/read")) {
        return jsonResponse({
          notifications: [
            {
              id: 1,
              type: "mention",
              title: "Mention",
              body: "hi",
              read: false,
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        });
      }
      if (url.includes("/api/notifications/") && url.endsWith("/read")) {
        return jsonResponse({
          id: 1,
          type: "mention",
          title: "Mention",
          body: "hi",
          read: true,
          created_at: "2026-01-01T00:00:00Z",
        });
      }
      throw new Error(`unexpected: ${url}`);
    });

    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      tokenStore: { getToken: () => "jwt", setToken: () => {} },
      fetch: fetchMock as typeof fetch,
    });

    const items = await client.notifications.list({ limit: 10 });
    expect(items).toHaveLength(1);

    const updated = await client.notifications.markRead(1);
    expect(updated.read).toBe(true);
  });
});

describe("AttachmentsResource", () => {
  it("uploads file via presigned URL", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/uploads")) {
        return jsonResponse({
          object_key: "uploads/1/file.pdf",
          upload_url: "http://minio/upload",
          expires_at: "2026-01-01T01:00:00Z",
        });
      }
      if (url === "http://minio/upload" && init?.method === "PUT") {
        return new Response(null, { status: 200 });
      }
      throw new Error(`unexpected: ${url}`);
    });

    const client = new BrenoxClient({
      baseUrl: "http://localhost:8080",
      tokenStore: { getToken: () => "jwt", setToken: () => {} },
      fetch: fetchMock as typeof fetch,
    });

    const file = new Blob(["pdf"], { type: "application/pdf" });
    const uploaded = await client.attachments.uploadFile(
      file,
      {
        fileName: "file.pdf",
        mimeType: "application/pdf",
      },
      { fetch: fetchMock as typeof fetch },
    );

    expect(uploaded.object_key).toBe("uploads/1/file.pdf");
    expect(uploaded.size_bytes).toBe(file.size);
  });
});
