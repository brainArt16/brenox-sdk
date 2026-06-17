# @brenox/sdk

TypeScript client for the [Brenox](https://github.com/brainArt16/brenox) realtime communication platform.

This is a **library**, not a React/Next app. Use it from Node 18+, browsers, or bundlers.

## Install

```bash
npm install @brenox/sdk
# local dev while unpublished:
npm link /path/to/brenox-sdk
```

## Quick start

Start the Brenox API (`make dev-up` in the backend repo), then:

```typescript
import { BrenoxClient } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: "http://localhost:8080",
});

await client.auth.register({
  email: "you@example.com",
  username: "you",
  password: "secret123",
});

await client.auth.login({
  email: "you@example.com",
  password: "secret123",
});

const workspaces = await client.workspaces.list();
const workspace = await client.workspaces.create({ name: "My Team", slug: "my-team" });
const channel = await client.channels.create(workspace.id, { name: "general" });

await client.messages.send(workspace.id, channel.ID, { content: "Hello!" });
const messages = await client.messages.list(workspace.id, channel.ID);
```

## Browser token storage

```typescript
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: "http://localhost:8080",
  tokenStore: localStorageTokenStore(),
});
```

**v0.2.0 — Milestone 2:** WebSocket channel client with reconnect, sequence tracking, and REST backfill.

```typescript
const conn = client.channel(workspace.id, channel.ID);
conn.on("message.new", (event) => {
  console.log(event.payload.content);
});
await conn.connect();
conn.sendMessage("Hello realtime!");
```

**Node.js:** pass an `origin` matching the server's `WS_ALLOWED_ORIGINS` (dev default `http://localhost:3000`):

```typescript
const conn = client.channel(workspace.id, channel.ID, {
  origin: "http://localhost:3000",
});
```

## Scripts

```bash
npm run build              # compile to dist/
npm test                   # unit tests
npm run test:integration   # smoke test against localhost:8080
BRENOX_URL=https://staging.example.com npm run test:integration
BRENOX_WS_ORIGIN=https://app.example.com npm run test:integration   # match WS_ALLOWED_ORIGINS
```

## Status

**v0.4.0:** Notifications API, attachments/uploads (presigned URL flow), `@brenox/react` hooks package.

**v0.3.0:** Developer API (`BrenoxServer`), app management, call signaling helper.

**v0.2.0:** REST + WebSocket (channel connect, `message.send` / `message.new`, typing, reconnect, gap backfill).

**v0.1.0:** REST + auth (register, login, refresh, workspaces, channels, messages, profile).

## BrenoxServer (API key / backend integrations)

```typescript
import { BrenoxServer } from "@brenox/sdk";
// or: import { BrenoxServer } from "@brenox/sdk/server";

const server = new BrenoxServer({
  baseUrl: "http://localhost:8080",
  apiKey: process.env.BRENOX_API_KEY!,
});

const user = await server.users.provision({ external_id: "user-42" });
const channel = await server.channels.create({ name: "general" });
await server.messages.send({
  channel_id: channel.id,
  external_id: "user-42",
  content: "Hello from server",
});
```

Create apps and keys with JWT `client.apps.create()` / `client.apps.createKey()`.

## Call signaling (WebRTC)

```typescript
const signaling = client.callSignaling(workspace.id, channel.ID, {
  origin: "http://localhost:3000",
});

signaling.on("call.offer", (event) => { /* handle SDP */ });

await signaling.connect();
const call = await signaling.initiate("video");
signaling.sendOffer({ call_id: call.id, to_user_id: 2, sdp: "..." });
```

## Notifications

```typescript
const items = await client.notifications.list({ limit: 50 });
await client.notifications.markRead(items[0].id);
await client.notifications.markAllRead();
```

## Attachments / uploads

```typescript
const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
const uploaded = await client.attachments.uploadFile(file, {
  fileName: file.name,
  mimeType: file.type,
});

await client.messages.send(workspace.id, channel.ID, {
  content: "See attached",
  attachments: [uploaded],
});

// Or attach after send:
const message = await client.messages.send(workspace.id, channel.ID, { content: "hi" });
await client.attachments.attachToMessage(workspace.id, channel.ID, message.id, [uploaded]);
```

## React hooks (`@brenox/react`)

```bash
npm install @brenox/react
```

See [react/README.md](react/README.md) for `BrenoxProvider`, `useMessages`, `useNotifications`, `useCallSignaling`.

## Backend docs

- [SDK Integration Guide](https://github.com/brainArt16/brenox/blob/main/docs/SDK_INTEGRATION.md)
- [WebSocket Events](https://github.com/brainArt16/brenox/blob/main/docs/WEBSOCKET_EVENTS.md)
