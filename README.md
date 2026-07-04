# @brenox/sdk

Official TypeScript SDK for [Brenox](https://brenox-web.vercel.app) — realtime messaging, presence, notifications, attachments, and WebRTC signaling.

- **Documentation:** [brenox-web.vercel.app/docs](https://brenox-web.vercel.app/docs?sdk=typescript&v=0.1.0)
- **Requires:** Node 18+ · browsers · bundlers

## Install

```bash
npm install @brenox/sdk
```

## Quick start

Create an app and API key in the [developer console](https://brenox-web.vercel.app), then:

```typescript
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: process.env.BRENOX_API_URL ?? "https://api.brenox.io",
  tokenStore: localStorageTokenStore(),
});

await client.auth.login({ email: "user@example.com", password: "secret" });

const [workspace] = await client.workspaces.list();
const channel = await client.channels.create(workspace.id, { name: "general" });

await client.messages.send(workspace.id, channel.ID, { content: "Hello!" });
```

### Realtime channel

```typescript
const conn = client.channel(workspace.id, channel.ID, {
  origin: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
});

conn.on("message.new", (event) => console.log(event.payload.content));
await conn.connect();
conn.sendMessage("Hello realtime!");
```

## Exports

| Import | Client | Use case |
|--------|--------|----------|
| `@brenox/sdk` | `BrenoxClient` | User-facing apps (browser, mobile, Node) |
| `@brenox/sdk/server` | `BrenoxServer` | Trusted backends with API keys (`bx_test_*` / `bx_live_*`) |

`BrenoxClient` covers auth, workspaces, channels, messages (REST + WebSocket), typing, presence, notifications, attachments, and call signaling.

`BrenoxServer` covers user provisioning, channels, and server-sent messages. See the [server integration guide](https://brenox-web.vercel.app/docs?sdk=typescript&v=0.1.0).

## React

For hooks (`BrenoxProvider`, `useMessages`, `useNotifications`, `useCallSignaling`):

```bash
npm install @brenox/react @brenox/sdk react
```

Docs: [@brenox/react on npm](https://www.npmjs.com/package/@brenox/react) · [React SDK guide](https://brenox-web.vercel.app/docs?sdk=react&v=0.1.0)

## Links

- [Documentation](https://brenox-web.vercel.app/docs?sdk=typescript&v=0.1.0)
- [Developer console](https://brenox-web.vercel.app)
- [GitHub](https://github.com/brainArt16/brenox-sdk)
- [Issues](https://github.com/brainArt16/brenox-sdk/issues)

## Development

```bash
npm ci
npm run build:all
npm test
npm run test:integration   # requires Brenox API on localhost:8080
```
