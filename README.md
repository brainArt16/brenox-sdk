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

## Scripts

```bash
npm run build              # compile to dist/
npm test                   # unit tests
npm run test:integration   # smoke test against localhost:8080
BRENOX_URL=https://staging.example.com npm run test:integration
```

## Status

**v0.1.0 — Milestone 1:** REST + auth (register, login, refresh, workspaces, channels, messages, profile).

Coming next: WebSocket channel client, reconnect, and gap fill (see Brenox `docs/SDK_INTEGRATION.md`).

## Backend docs

- [SDK Integration Guide](https://github.com/brainArt16/brenox/blob/main/docs/SDK_INTEGRATION.md)
- [WebSocket Events](https://github.com/brainArt16/brenox/blob/main/docs/WEBSOCKET_EVENTS.md)
