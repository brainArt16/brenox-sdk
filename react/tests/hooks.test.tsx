import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { BrenoxClient } from "@brenox/sdk";
import { BrenoxProvider } from "../src/context";
import { useMessages } from "../src/hooks/useMessages";
import { useNotifications } from "../src/hooks/useNotifications";

function createWrapper(client: BrenoxClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <BrenoxProvider client={client}>{children}</BrenoxProvider>;
  };
}

describe("useNotifications", () => {
  it("loads notifications from the client", async () => {
    const client = {
      notifications: {
        list: vi.fn(async () => [
          {
            id: 1,
            type: "mention",
            title: "Ping",
            body: "hello",
            read: false,
            created_at: "2026-01-01T00:00:00Z",
          },
        ]),
        markRead: vi.fn(),
        markAllRead: vi.fn(),
      },
    } as unknown as BrenoxClient;

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(1);
  });
});

describe("useMessages", () => {
  it("loads message history", async () => {
    const client = {
      messages: {
        list: vi.fn(async () => [
          {
            id: 1,
            channel_id: 2,
            sender_id: 3,
            username: "alice",
            content: "hi",
            created_at: "2026-01-01T00:00:00Z",
          },
        ]),
        send: vi.fn(),
      },
      channel: vi.fn(() => ({
        onConnectionChange: () => () => undefined,
        on: () => () => undefined,
        disconnect: vi.fn(),
        connect: vi.fn(async () => undefined),
      })),
    } as unknown as BrenoxClient;

    const { result } = renderHook(
      () => useMessages(1, 2, { autoConnect: false }),
      { wrapper: createWrapper(client) },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages[0]?.content).toBe("hi");
  });
});
