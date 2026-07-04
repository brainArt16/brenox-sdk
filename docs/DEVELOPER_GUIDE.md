# Brenox Developer Guide

Build realtime chat, voice, and video into your product with **@brenox/sdk** and **@brenox/react**. Integrate exclusively through our SDKs — no direct platform API required.

---

## What the SDK covers

| Feature | Package | Status |
|---------|---------|--------|
| Auth, workspaces, channels | `BrenoxClient` | Ready |
| Messaging (REST + live) | `BrenoxClient` | Ready |
| Typing & presence | `BrenoxClient` | Ready |
| Notifications | `BrenoxClient` | Ready |
| File attachments | `BrenoxClient` | Ready |
| Backend user provisioning | `BrenoxServer` | Ready |
| Voice & video calls | `CallSignaling` | Signaling only* |
| React hooks | `@brenox/react` | Ready |
| Webhooks | Console | Ready |

\*The SDK handles call lifecycle and WebRTC **signaling** (SDP, ICE). You implement `RTCPeerConnection`, media capture, and STUN/TURN.

---

## Versioned documentation

Developers can open docs for a **specific SDK version**:

```
/docs?sdk=typescript&v=0.1.0
/docs?sdk=react&v=0.1.0
```

Version catalog is maintained in the developer console (`brenox-web/lib/docs/sdk-versions.ts`). See [VERSIONING.md](VERSIONING.md) for the release checklist.

---

Brenox ships official SDKs per language and framework. Pick the one that matches your stack:

| SDK | Package | Status | Best for |
|-----|---------|--------|----------|
| **JavaScript / TypeScript** | `@brenox/sdk` | Available | Web, Node, Electron |
| **React** | `@brenox/react` | Available | Next.js, Vite, CRA |
| **Python** | `brenox-sdk` | Coming soon | FastAPI, Django |
| **Go** | `brenox-go` | Coming soon | Microservices, CLI |
| **Flutter** | `brenox_sdk` | Coming soon | iOS, Android |
| **Vue** | `@brenox/vue` | Coming soon | Vue 3, Nuxt |
| **React Native** | `@brenox/react-native` | Coming soon | Expo, native mobile |

Use the developer console **Documentation** page to switch SDKs — examples and sections update automatically (`/docs?sdk=react`).

When adding a new SDK, register it in `lib/docs/sdk-registry.ts` (console) and add snippet files alongside.

---

## Quick start (~5 minutes)

### 1. Create an app

Use the **developer console** → Apps → New app → API Keys. Copy your sandbox key (`bx_test_*`).

### 2. Install

```bash
npm install @brenox/sdk
# or: pnpm add @brenox/sdk
# or: yarn add @brenox/sdk

npm install @brenox/react   # optional, same with pnpm/yarn
```

### 3. Configure

```env
BRENOX_API_KEY=bx_test_your_sandbox_key
BRENOX_API_URL=https://api.brenox.io
NEXT_PUBLIC_BRENOX_API_URL=https://api.brenox.io
```

### 4. Send your first message

```typescript
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: process.env.NEXT_PUBLIC_BRENOX_API_URL ?? "https://api.brenox.io",
  tokenStore: localStorageTokenStore(),
});

await client.auth.login({ email: "user@example.com", password: "secret" });

const [workspace] = await client.workspaces.list();
const channel = await client.channels.create(workspace.id, { name: "general" });

await client.messages.send(workspace.id, channel.ID, {
  content: "Hello from my app!",
});
```

---

## Architecture

```
Your frontend  ── BrenoxClient ──►  Brenox platform
Your backend   ── BrenoxServer ──►  Brenox platform
Developer console ── apps, keys, webhooks, sandbox
```

- **BrenoxClient** — user-facing chat in browsers, mobile, Node
- **BrenoxServer** — trusted server automation with API keys
- **Console** — manage integrations (not part of your app code)

---

## Authentication

### Users (BrenoxClient)

```typescript
import { BrenoxClient, localStorageTokenStore } from "@brenox/sdk";

const client = new BrenoxClient({
  baseUrl: process.env.BRENOX_API_URL,
  tokenStore: localStorageTokenStore(),
});

await client.auth.register({ email, username, password });
await client.auth.login({ email, password });
// Tokens stored and refreshed automatically
```

### Server (BrenoxServer)

```typescript
import { BrenoxServer } from "@brenox/sdk/server";

const server = new BrenoxServer({
  baseUrl: process.env.BRENOX_API_URL,
  apiKey: process.env.BRENOX_API_KEY!,
});
```

| Key prefix | Use |
|------------|-----|
| `bx_test_*` | Development / sandbox |
| `bx_live_*` | Production |

**Never** expose API keys in frontend or mobile apps.

---

## Messaging

```typescript
// History
const messages = await client.messages.list(workspaceId, channelId, { limit: 50 });

// Send
await client.messages.send(workspaceId, channelId, { content: "Hello!" });

// Presence
await client.users.updateStatus({ status: "away" });
```

### Attachments

```typescript
const uploaded = await client.attachments.uploadFile(file);
await client.messages.send(workspaceId, channelId, {
  content: "See attached",
  attachments: [uploaded],
});
```

### Realtime

```typescript
const conn = client.channel(workspaceId, channelId, {
  origin: window.location.origin,
});

conn.on("message.new", (e) => console.log(e.payload.content));
conn.on("typing.start", (e) => showTyping(e.payload.user_id));

await conn.connect();
conn.sendMessage("Hello realtime!");
conn.sendTyping(true);
```

---

## Voice & video calls

```typescript
const signaling = client.callSignaling(workspaceId, channelId, {
  origin: window.location.origin,
});

signaling.on("call.offer", async (event) => {
  const pc = new RTCPeerConnection({ iceServers: [...] });
  await pc.setRemoteDescription(JSON.parse(event.payload.sdp));
  // Create answer, send via signaling.sendAnswer()
});

await signaling.connect();
const call = await signaling.initiate("video"); // or "voice"
signaling.sendOffer({ call_id: call.id, to_user_id: 2, sdp: localSdp });

signaling.videoOn(call.id);
signaling.screenStart(call.id);
await signaling.leave(call.id);
```

**You implement:** `RTCPeerConnection`, `getUserMedia`, STUN/TURN, call UI.

**SDK provides:** initiate/join/leave, SDP/ICE exchange, video/screen signaling events.

---

## BrenoxServer (backend)

```typescript
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
```

---

## React hooks (@brenox/react)

```tsx
import { BrenoxProvider, useMessages, useCallSignaling } from "@brenox/react";

function App() {
  return (
    <BrenoxProvider client={client}>
      <Chat workspaceId={1} channelId={1} />
    </BrenoxProvider>
  );
}

function Chat({ workspaceId, channelId }) {
  const { messages, sendMessage, connectionState } = useMessages(
    workspaceId,
    channelId,
    { channel: { origin: window.location.origin } },
  );
  // ...
}
```

| Hook | Purpose |
|------|---------|
| `useMessages` | History + live messages + send |
| `useChannel` | Low-level WebSocket events |
| `useNotifications` | Poll + mark read |
| `useCallSignaling` | Voice/video signaling |

See [react/README.md](../react/README.md).

---

## Webhooks

Register HTTPS endpoints in **App → Webhooks**.

| Event | When |
|-------|------|
| `message.created` | New message in your app |
| `user.provisioned` | User provisioned via BrenoxServer |
| `channel.created` | New channel created |

Verify signatures with the secret provided at endpoint creation.

---

## Realtime event catalog

**Messaging:** `message.new`, `message.updated`, `typing.start`, `typing.stop`

**Presence:** `presence.online`, `presence.offline`, `presence.status`

**Calls:** `call.join`, `call.leave`, `call.end`, `call.offer`, `call.answer`, `call.ice`, `call.video.on`, `call.video.off`

**Other:** `notification.new`

---

## Best practices

1. **SDK-only** — never call the platform HTTP API directly from your app
2. **Keys on server only** — `BRENOX_API_KEY` in backend env, never in client bundles
3. **Sandbox first** — use `bx_test_*` until production
4. **Token storage** — `localStorageTokenStore()` in browsers; secure storage on mobile
5. **Calls** — configure STUN/TURN for production WebRTC

---

## Packages

| npm package | Export | Use for |
|-------------|--------|---------|
| `@brenox/sdk` | `BrenoxClient` | User-facing chat |
| `@brenox/sdk/server` | `BrenoxServer` | Backend automation |
| `@brenox/react` | hooks + provider | React apps |

Further reading: [README](../README.md) · [React hooks](../react/README.md)
