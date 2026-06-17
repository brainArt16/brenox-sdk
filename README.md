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

**v0.2.0:** REST + WebSocket (channel connect, `message.send` / `message.new`, typing, reconnect, gap backfill).

**v0.1.0:** REST + auth (register, login, refresh, workspaces, channels, messages, profile).

## Backend docs

- [SDK Integration Guide](https://github.com/brainArt16/brenox/blob/main/docs/SDK_INTEGRATION.md)
- [WebSocket Events](https://github.com/brainArt16/brenox/blob/main/docs/WEBSOCKET_EVENTS.md)
