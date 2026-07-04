# SDK versioning & documentation

How Brenox SDK versions are published, tracked, and shown in the developer console docs.

## Principles

| Rule | Why |
|------|-----|
| **package.json is source of truth** | npm/pnpm/yarn version comes from the SDK repo at publish time |
| **Docs catalog mirrors releases** | Console docs use a static catalog developers can browse by version |
| **Semver** | `MAJOR.MINOR.PATCH` — breaking changes bump major |
| **Pin in production** | Recommend `@brenox/sdk@0.1.1` not `@latest` in production apps |

## Where things live

| What | File |
|------|------|
| Published version | `brenox-sdk/package.json`, `brenox-sdk/react/package.json` |
| Docs version catalog | `brenox-web/lib/docs/sdk-versions.ts` |
| Engine version catalog | `brenox-web/lib/docs/engine-versions.ts` |
| Production API URL | `brenox-web/lib/docs/api-config.ts` (`https://api.breno-x.com`) |
| Per-SDK snippets | `brenox-web/lib/docs/sdk-snippets.ts` |
| SDK registry (languages) | `brenox-web/lib/docs/sdk-registry.ts` |
| Engine release semver | `brenox-engine/VERSION`, `GET /version` |

## Developer-facing URLs

```
/docs                           → default SDK (typescript) + current version
/docs?sdk=react                 → React SDK, current version
/docs?sdk=typescript&v=0.1.0    → TypeScript SDK v0.1.0 docs
/docs?sdk=react&v=0.1.0         → React hooks v0.1.0
```

Share these links in release notes, GitHub tags, and support tickets.

## Release checklist (maintainer)

When you publish **@brenox/sdk@0.2.0** (example):

1. **SDK repo**
   - [ ] Bump `package.json` version
   - [ ] Update `CHANGELOG.md` with highlights
   - [ ] Tag: `git tag sdk-v0.2.0 && git push --tags`
   - [ ] `npm publish` (or CI publish)

2. **Docs catalog** (`brenox-web/lib/docs/sdk-versions.ts`)
   - [ ] Add new entry at top of `typescript` array:
     ```ts
     {
       version: "0.2.0",
       status: "current",
       released: "2026-08-01",
       highlights: ["..."],
       installPackages: "@brenox/sdk@0.2.0",
     }
     ```
   - [ ] Change previous `0.1.0` status from `"current"` → `"supported"`
   - [ ] If breaking: mark old majors `"deprecated"` + `deprecationMessage`

3. **Snippets** (only if API changed)
   - [ ] Update `sdk-snippets.ts` for new/changed APIs
   - [ ] Optionally add version-specific snippet branches if old versions need different examples

4. **React / other packages**
   - [ ] Repeat for `@brenox/react` if peer dependency or hooks changed
   - [ ] Update `installPackages` to pin compatible pairs, e.g. `@brenox/react@0.2.0 @brenox/sdk@0.2.0`

5. **Verify**
   - [ ] Open `/docs?sdk=typescript&v=0.2.0` in console
   - [ ] Install command shows pinned version
   - [ ] Version picker lists changelog highlights

## Version statuses

| Status | Meaning in docs |
|--------|-----------------|
| `current` | Latest stable; default when no `?v=` param |
| `supported` | Still valid; receives bugfix docs if needed |
| `beta` | Preview; may change before stable |
| `deprecated` | Shown with upgrade warning |

## Multi-SDK versioning

Each SDK has its **own semver line**:

- `@brenox/sdk` — core (TypeScript)
- `@brenox/react` — separate version; docs pin both packages in `installPackages`

Future SDKs (Python, Go) add their own array in `SDK_VERSION_CATALOG` when they ship.

## Optional automation (later)

- CI job reads `package.json` and fails if catalog `current` ≠ published version
- Generate catalog from CHANGELOG on release
- Host versioned markdown in `brenox-sdk/docs/versions/v0.1.0/` for deep archives

For now, manual catalog updates keep docs explicit and reviewable.
