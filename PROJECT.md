# Devitri Obsidian Plugin

TypeScript plugin for Obsidian — syncs a vault with a self-hosted [Devitri](https://github.com/rigter/devitri) server.

## Documentation

| File | Description |
|------|-------------|
| [`README.md`](README.md) | User-facing overview and Obsidian store submission docs |
| [`INSTALL.md`](INSTALL.md) | Build and install steps |

## Layout

```
devitri-obsidian-plugin/
├── src/
│   ├── main.ts             # Plugin entry, vault listeners, sync lifecycle
│   ├── index.ts
│   ├── global.d.ts
│   ├── styles.css          # Settings tab styles
│   ├── types/index.ts
│   ├── sync/
│   │   ├── api.ts          # REST client (requestUrl, binary-safe)
│   │   ├── engine.ts       # Scan → Negotiate → Pull → Push
│   │   ├── manifest.ts     # Vault scan and SHA-256 hashing
│   │   ├── conflicts.ts    # Markdown merge and conflict copies
│   │   └── notify.ts       # Status bar and notice formatting
│   └── ui/SettingsTab.ts
├── manifest.json           # id must match install folder name (devitri-sync)
├── esbuild.config.mjs
├── tsconfig.json
├── package.json
├── .github/workflows/ci.yml
└── dist/                   # build output (gitignored)
```

## Sync pipeline

1. **Scan** — build local manifest from vault files (all types except `.obsidian/`); incremental updates via dirty/deleted path tracking.
2. **Negotiate** — three-way compare (local, base, remote) using SHA-256 hashes.
3. **Pull** — download remote changes with binary-safe `writeBinary`.
4. **Push** — upload local changes and apply deletes (with bulk-delete guard).

Markdown conflicts attempt automatic merge; binary files (images, PDFs, etc.) get conflict copies.

## Features (implementation)

- SHA-256 manifests and 3-way sync decisions
- Full vault scan on first sync and after **Reset Local Sync State**
- Bulk-delete guard with **Confirm once** UI
- `onExternalSettingsChange` reloads credentials when `data.json` syncs across devices
- Default sync interval **900 s** (`syncInterval` in plugin data)
- Mobile-safe HTTP via Obsidian `requestUrl` only

## Development

```bash
npm install
npm run check   # TypeScript
npm run build   # esbuild → dist/main.js
```

CI runs the same checks on push and pull requests (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Related

| Repository | Role |
| ---------- | ---- |
| [rigter/devitri](https://github.com/rigter/devitri) | Self-hosted API, sync engine, and web dashboard |
| [rigter/devitri-obsidian-plugin](https://github.com/rigter/devitri-obsidian-plugin) | This plugin |

## License

MIT — [Rigter](https://rigter.me)
