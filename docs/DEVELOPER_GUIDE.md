# Brenox Developer Guide

Build realtime chat into your product using **@brenox/sdk** and **@brenox/react**. This guide is for third-party developers — integrate through our SDKs only; the underlying platform API is not part of the public integration surface.

---

## Table of contents

1. [Overview](#1-overview)
2. [Getting started](#2-getting-started)
3. [Developer console workflow](#3-developer-console-workflow)
4. [Authentication](#4-authentication)
5. [BrenoxClient — user-facing chat](#5-brenoxclient--user-facing-chat)
6. [BrenoxServer — backend integration](#6-brenoxserver--backend-integration)
7. [Webhooks](#7-webhooks)
8. [Realtime events](#8-realtime-events)
9. [React hooks (@brenox/react)](#9-react-hooks-brenoxreact)
10. [Best practices](#10-best-practices)
11. [SDK packages](#11-sdk-packages)

---

## 1. Overview

Brenox gives you SDKs to add chat, presence, notifications, and voice/video signaling to your app. You manage your integration from the **developer console** (create apps, API keys, webhooks).

```
┌─────────────────────┐                         ┌──────────────────┐
│  Your frontend      │   BrenoxClient (SDK)    │                  │
│  (React, mobile…)   │ ◄──────────────────────►│  Brenox platform │
└─────────────────────┘                         │  (managed)       │
                                                │                  │
┌─────────────────────┐   BrenoxServer (SDK)    │                  │
│  Your backend       │ ◄──────────────────────►│                  │
└─────────────────────┘                         └──────────────────┘

┌─────────────────────┐
│  Developer console  │  ← create apps, keys, webhooks, sandbox
└─────────────────────┘
```

| What you build | SDK | Purpose |
|----------------|-----|---------|
| Frontend / mobile app | `BrenoxClient` | User login, chat, realtime |
| Backend services | `BrenoxServer` | Provision users, send messages |
| React UI | `@brenox/react` | Hooks for messages, notifications, calls |

Each **app** in the console maps to an isolated workspace. API keys belong to one app.

---

## 2. Getting started

### Install

```bash
npm install @brenox/sdk

# Optional React hooks
npm install @brenox/react
```

### Configure (your app)

```env
# Server-side — from Developer Console → App → API Keys
BRENOX_API_KEY=bx_test_your_sandbox_key

# Optional — SDK picks a sensible default if omitted
BRENOX_API_URL=https://api.brenox.io
```

### First message (browser)

```typescript
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: process.env.BRENOX_API_URL ?? "https://api.brenox.io",
  tokenStore: localStorageTokenStore(),
});

await client.auth.login({ email: "user@example.com", password: "secret" });

const workspaces = await client.workspaces.list();
const channel = await client.channels.create(workspaces[0].id, { name: "general" });

await client.messages.send(workspaces[0].id, channel.ID, {
  content: "Hello from my app!",
});
```

---

## 3. Developer console workflow

| Step | Where | What to do |
|------|-------|------------|
| 1 | Register / Login | Access the developer console |
| 2 | **Apps → New app** | Create your integration |
| 3 | **App → API Keys** | Create a sandbox key (`bx_test_…`); copy secret once |
| 4 | **App → Sandbox** | Try BrenoxServer operations |
| 5 | **App → Webhooks** | Register your HTTPS endpoint |
| 6 | Your codebase | Install and wire `@brenox/sdk` |

---

## 4. Authentication

### End users — BrenoxClient

Users sign in through the SDK. Tokens are stored and refreshed automatically.

```typescript
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: process.env.BRENOX_API_URL,
  tokenStore: localStorageTokenStore(),
});

await client.auth.register({
  email: "you@example.com",
  username: "you",
  password: "secret123",
});

await client.auth.login({ email: "you@example.com", password: "secret123" });
```

### Your server — BrenoxServer

Use API keys from the console. **Never** put keys in frontend or mobile apps.

```typescript
import { BrenoxServer } from "@brenox/sdk/server";

const server = new BrenoxServer({
  baseUrl: process.env.BRENOX_API_URL,
  apiKey: process.env.BRENOX_API_KEY!,
});
```

| Key prefix | Use |
|------------|-----|
| `bx_test_*` | Development and sandbox |
| `bx_live_*` | Production server integrations |

---

## 5. BrenoxClient — user-facing chat

### Workspaces, channels, messages

```typescript
const workspace = await client.workspaces.create({
  name: "My Team",
  slug: "my-team",
});

const channel = await client.channels.create(workspace.id, { name: "general" });

await client.messages.send(workspace.id, channel.ID, { content: "Hello!" });

const { messages } = await client.messages.list(workspace.id, channel.ID);
```

### Realtime channel

```typescript
const conn = client.channel(workspace.id, channel.ID, {
  origin: window.location.origin,
});

conn.on("message.new", (event) => {
  console.log(event.payload.content);
});

conn.on("typing.start", (event) => {
  console.log(`${event.payload.user_id} is typing`);
});

await conn.connect();
conn.sendMessage("Hello realtime!");
conn.sendTyping(true);
```

### Profile, presence, notifications

```typescript
const me = await client.users.getMe();
await client.users.updateMe({ username: "new_name" });
await client.users.updateStatus({ status: "away" }); // online | away | offline

const { notifications } = await client.notifications.list({ limit: 50 });
await client.notifications.markRead(notifications[0].id);
```

### Attachments

```typescript
const file = new File(["hello"], "doc.txt", { type: "text/plain" });
const uploaded = await client.attachments.uploadFile(file);

await client.messages.send(workspace.id, channel.ID, {
  content: "See file",
  attachments: [uploaded],
});
```

---

## 6. BrenoxServer — backend integration

Map your auth users to Brenox and automate messaging from your backend.

```typescript
import { BrenoxServer } from "@brenox/sdk/server";

const server = new BrenoxServer({
  baseUrl: process.env.BRENOX_API_URL,
  apiKey: process.env.BRENOX_API_KEY!,
});

await server.users.provision({
  external_id: "your-auth-user-123",
  username: "alice",
});

const channel = await server.channels.create({ name: "support" });

await server.messages.send({
  channel_id: channel.id,
  external_id: "your-auth-user-123",
  content: "Ticket opened",
});

const history = await server.messages.list({
  channel_id: channel.id,
  limit: 50,
});
```

---

## 7. Webhooks

Register HTTPS endpoints in **App → Webhooks**. Events:

- `message.created`
- `user.provisioned`
- `channel.created`

Each endpoint receives a signing secret once at creation. Verify signatures on your server before processing payloads. Return `2xx` quickly and handle work asynchronously.

---

## 8. Realtime events

Connect with `client.channel()` or use `@brenox/react` hooks. Common event types:

| Event | Description |
|-------|-------------|
| `message.new` | New message |
| `message.updated` | Message edited |
| `typing.start` / `typing.stop` | Typing indicators |
| `presence.online` / `presence.offline` / `presence.status` | Presence |
| `notification.new` | In-app notification |
| `call.offer` / `call.answer` / `call.ice` | WebRTC signaling |

The SDK handles reconnect, sequence tracking, and REST backfill on gaps.

---

## 9. React hooks (@brenox/react)

```bash
npm install @brenox/react @brenox/sdk
```

```tsx
import { BrenoxClient } from "@brenox/sdk";
import { BrenoxProvider, useMessages } from "@brenox/react";

const client = new BrenoxClient({ baseUrl: process.env.NEXT_PUBLIC_BRENOX_API_URL! });

function App() {
  return (
    <BrenoxProvider client={client}>
      <Chat workspaceId={1} channelId={1} />
    </BrenoxProvider>
  );
}

function Chat({ workspaceId, channelId }: { workspaceId: number; channelId: number }) {
  const { messages, loading, sendMessage, connectionState } = useMessages(
    workspaceId,
    channelId,
    { channel: { origin: window.location.origin } },
  );

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <p>Connected: {connectionState}</p>
      <ul>{messages.map((m) => <li key={m.id}>{m.content}</li>)}</ul>
      <button onClick={() => void sendMessage("Hi!")}>Send</button>
    </div>
  );
}
```

| Hook | Purpose |
|------|---------|
| `useMessages` | History + live messages + send |
| `useChannel` | Low-level WebSocket events |
| `useNotifications` | Poll + mark read |
| `useCallSignaling` | Voice/video WebRTC signaling |

See [react/README.md](../react/README.md).

---

## 10. Best practices

### Security

- Never embed API keys in frontend or mobile code.
- Use `BrenoxClient` for users; `BrenoxServer` + keys only on trusted servers.
- Rotate compromised keys in the console.
- Webhook URLs must be HTTPS in production.

### Token storage

- Browser: `localStorageTokenStore()` or your secure storage wrapper.
- Mobile: platform secure storage.
- The SDK refreshes tokens automatically on expiry.

### Sandbox before production

1. Create a sandbox key (`bx_test_*`).
2. Exercise flows in the console Sandbox.
3. Switch to a live key when deploying.

---

## 11. SDK packages

| Package | Export | Use for |
|---------|--------|---------|
| `@brenox/sdk` | `BrenoxClient` | User-facing chat |
| `@brenox/sdk/server` | `BrenoxServer` | Backend integration |
| `@brenox/react` | `BrenoxProvider`, hooks | React apps |

Further reading:

- [SDK README](../README.md)
- [React hooks](../react/README.md)
