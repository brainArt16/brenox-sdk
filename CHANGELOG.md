# Changelog

## 0.1.4 - 2026-07-31

- `attachments.fetchContent()` — download attachment bytes through the authenticated API (`GET .../attachments/:id/content`), keeping object-storage paths hidden from browsers.
- `attachments.createObjectUrl()` — fetch content and return a short-lived `blob:` URL for `<img>`/`window.open` (revoke when done).
- `attachments.contentUrl()` — absolute API URL for streaming attachment bytes.
- `Attachment.url` now carries the API content path returned by engine ≥ 1.1.0 instead of a presigned storage URL.
- `HttpClient.requestBlob()` — binary responses with the same auth/refresh behavior as JSON requests.

Requires brenox-engine ≥ 1.1.0 for the attachment content endpoint; older engines still work with presigned URLs.

## 0.1.3 - 2026-07-05

- `BrenoxServer.sessions.create()` — issue embed JWTs via `POST /v1/sessions`.
- `CreateSessionInput` and `DeveloperSession` types on `@brenox/sdk/server`.
- Embed-first flow: backend provisions users, frontend receives session tokens.

## 0.1.1 - 2026-07-04

- npm README and package metadata with live documentation links.

## 0.1.0 - 2026-07-04

- Initial public release — `BrenoxClient` for browsers and Node.
- Auth, workspaces, channels, messaging (REST + WebSocket).
- Typing, presence, notifications, and attachments.
- `BrenoxServer` for backend / API key integrations.
- Call signaling helper (WebRTC SDP & ICE).
