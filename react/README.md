# @brenox/react

React hooks for [@brenox/sdk](../README.md).

## Install

```bash
npm install @brenox/react @brenox/sdk react
```

## Setup

```tsx
import { BrenoxClient } from "@brenox/sdk";
import { BrenoxProvider } from "@brenox/react";

const client = new BrenoxClient({
  baseUrl: "http://localhost:8080",
});

export function App() {
  return (
    <BrenoxProvider client={client}>
      <Chat />
    </BrenoxProvider>
  );
}
```

## Hooks

### `useMessages(workspaceId, channelId)`

Loads history via REST and merges live `message.new` / `message.updated` from the channel WebSocket.

```tsx
import { useMessages } from "@brenox/react";

function Chat({ workspaceId, channelId }: { workspaceId: number; channelId: number }) {
  const { messages, loading, sendMessage, connectionState } = useMessages(
    workspaceId,
    channelId,
    { channel: { origin: "http://localhost:3000" } },
  );

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <p>Status: {connectionState}</p>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>{message.content}</li>
        ))}
      </ul>
      <button onClick={() => void sendMessage("Hello!")}>Send</button>
    </div>
  );
}
```

### `useChannel(workspaceId, channelId)`

Lower-level WebSocket access when you manage events yourself.

### `useNotifications()`

```tsx
const { notifications, markRead, markAllRead, refresh } = useNotifications({
  pollIntervalMs: 30_000,
});
```

### `useCallSignaling(workspaceId, channelId)`

Wraps `CallSignaling` with auto-connect and cleanup.

```tsx
const { signaling, initiate, connectionState } = useCallSignaling(workspaceId, channelId);

await initiate("video");
signaling?.on("call.offer", (event) => { /* SDP */ });
```

## Build

```bash
npm run build
npm test
```
