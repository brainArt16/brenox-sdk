# @brenox/sdk

Official TypeScript SDK for [Brenox](https://www.breno-x.com) — realtime messaging, presence, notifications, attachments, and WebRTC signaling.

- **Documentation:** [www.breno-x.com/docs](https://www.breno-x.com/docs?sdk=typescript&v=0.1.1)
- **Requires:** Node 18+ · browsers · bundlers

## Install

```bash
# npm
npm install @brenox/sdk

# pnpm
pnpm add @brenox/sdk

# yarn
yarn add @brenox/sdk
```

## Quick start

Create an app and API key in the [developer console](https://www.breno-x.com), then:

```typescript
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: process.env.BRENOX_API_URL ?? "https://api.breno-x.com",
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

`BrenoxServer` covers user provisioning, channels, and server-sent messages. See the [server integration guide](https://www.breno-x.com/docs?sdk=typescript&v=0.1.1).

## React

For hooks (`BrenoxProvider`, `useMessages`, `useNotifications`, `useCallSignaling`):

```bash
# npm
npm install @brenox/react @brenox/sdk react

# pnpm
pnpm add @brenox/react @brenox/sdk react

# yarn
yarn add @brenox/react @brenox/sdk react
```

Docs: [@brenox/react on npm](https://www.npmjs.com/package/@brenox/react) · [React SDK guide](https://www.breno-x.com/docs?sdk=react&v=0.1.1)

## Links

- [Documentation](https://www.breno-x.com/docs?sdk=typescript&v=0.1.1)
- [Developer console](https://www.breno-x.com)
- [GitHub](https://github.com/brainArt16/brenox-sdk)
- [Issues](https://github.com/brainArt16/brenox-sdk/issues)

## Development

```bash
npm ci
npm run build:all
npm test
npm run test:integration   # requires Brenox API on localhost:8080
```
