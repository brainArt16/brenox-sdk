# @brenox/react

React hooks for [@brenox/sdk](https://www.npmjs.com/package/@brenox/sdk).

- **Documentation:** [www.breno-x.com/docs](https://www.breno-x.com/docs?sdk=react&v=0.1.1)
- **Requires:** React 18+ · `@brenox/sdk` >= 0.1.0

## Install

```bash
npm install @brenox/react @brenox/sdk react
```

## Quick start

```tsx
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";
import { BrenoxProvider, useMessages } from "@brenox/react";

const client = new BrenoxClient({
  baseUrl: process.env.NEXT_PUBLIC_BRENOX_API_URL ?? "https://api.breno-x.com",
  tokenStore: localStorageTokenStore(),
});

function App() {
  return (
    <BrenoxProvider client={client}>
      <Chat workspaceId={1} channelId={1} />
    </BrenoxProvider>
  );
}

function Chat({ workspaceId, channelId }: { workspaceId: number; channelId: number }) {
  const { messages, sendMessage, connectionState } = useMessages(workspaceId, channelId, {
    channel: { origin: window.location.origin },
  });

  return (
    <div>
      <p>{connectionState}</p>
      <ul>{messages.map((m) => <li key={m.id}>{m.content}</li>)}</ul>
      <button onClick={() => void sendMessage("Hello!")}>Send</button>
    </div>
  );
}
```

## Hooks

| Hook | Purpose |
|------|---------|
| `useMessages` | Message history, live updates, send |
| `useChannel` | Low-level WebSocket events |
| `useNotifications` | Poll and mark notifications read |
| `useCallSignaling` | Voice/video call signaling |

Full API reference: [React SDK docs](https://www.breno-x.com/docs?sdk=react&v=0.1.1)

## Links

- [Documentation](https://www.breno-x.com/docs?sdk=react&v=0.1.1)
- [@brenox/sdk](https://www.npmjs.com/package/@brenox/sdk)
- [GitHub](https://github.com/brainArt16/brenox-sdk)
- [Issues](https://github.com/brainArt16/brenox-sdk/issues)
