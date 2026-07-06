# AGENTS.md — obsidian-extract-pdf-annotations

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | esbuild watch mode (no typecheck) |
| `npm test` | Jest (ts-jest, covers only `extractHighlight`) |
| `npm run build` | `tsc -noEmit -skipLibCheck && node esbuild.config.mjs production` |
| `npm version <patch\|minor\|major>` then `npm run version` | Bump version in manifest.json + versions.json (no "v" prefix, set via `.npmrc`) |

## Build quirks

- **Two-phase build**: `tsc` (type-check only) then esbuild (bundle to `main.js`).
- `obsidian`, `electron`, `@codemirror/*`, and node builtins are **externed** — not bundled.
- Output `main.js` is **gitignored**; attach to GitHub releases.
- Plugin entrypoint: `src/main.ts` → default export `PDFAnnotationPlugin`.

## Testing

- Jest with `ts-jest` preset; `obsidian` module mapped to `test/mocks/obsidian.ts`.
- Tests only the `extractHighlight` function from `src/extractHighlight.ts`.
- `ANNOTS_TREATED_AS_HIGHLIGHTS` is mocked in test setup.
- Run `npm test` (no watch by default).

## Source layout (flat, not a monorepo)

```
src/
  main.ts             — Plugin class, 3 commands, settings load/save
  extractHighlight.ts — PDF text extraction via pdfjs-dist
  formatter.ts        — Handlebars template rendering
  settings.ts         — Settings class + settings tab UI
  types.ts            — PDFFile type, IIndexable helper
test/
  extractHighlight.test.ts
  mocks/obsidian.ts
```

## Release

1. `npm version <bump>` — updates `package.json` version
2. `npm run version` — syncs `manifest.json` + `versions.json`
3. `npm run build` — produces `main.js`
4. Attach `main.js`, `manifest.json`, `versions.json` to GitHub release

## Style

- `.editorconfig`: tabs, indent 4, UTF-8, final newline.
- ESLint with `@typescript-eslint/recommended`; `no-unused-vars` on (args: none), `ban-ts-comment` off.
- No CI workflows in this repo.
