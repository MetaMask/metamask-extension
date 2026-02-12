# Selector usage trace

Self-contained tools and prompts for tracing selector usage from one or more root files (e.g. `ui/selectors/assets.ts`) through layers of consumers into a single output document.

## Layout

- **prompts/** – Reusable prompt and instructions (`RULE.md`, `PROMPT.md`).
- **scripts/** – Node scripts: `list-exports.js`, `find-importers.js`, `classify-file.js`, `trace-usage.js`, `discover-assets-controllers-roots.js`. Run from repo root. Requires **ripgrep (`rg`)** on PATH.
- **output/** – Generated trace documents (e.g. `selector-usage-trace-assets.md`).
- **CONFIG.md** – Config file format for multi-root and per-root selector filters.
- **config.assets-controllers.json** – Example config (assets + multichain asset selectors only).

## Quick run

**Single root** (backward compatible):

```bash
node trace-selectors/scripts/trace-usage.js ui/selectors/assets.ts
```

Output: `trace-selectors/output/selector-usage-trace-assets.md`

**Config-driven (multiple roots, optional per-root selector filter):**

```bash
node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json
```

Config format: see [CONFIG.md](CONFIG.md). You can track only specific selectors from a file (e.g. only `getMultichainBalances` from `multichain.ts`).

## Discovering roots that use @metamask/assets-controllers

To list UI selector files that import from `@metamask/assets-controllers` (for building a config):

```bash
node trace-selectors/scripts/discover-assets-controllers-roots.js
```

Output: one path per line (e.g. `ui/selectors/assets.ts`, `ui/selectors/multichain.ts`, `ui/selectors/nft.ts`). Optional argument: search directory (default `ui/selectors`).

## Reusing for another root

Replace `[ROOT_PATH]` in `trace-selectors/prompts/PROMPT.md` with the new file (e.g. `ui/selectors/accounts.ts`) when re-prompting. For multi-root or per-root selectors, use a config file and `--config`. Full instructions are in `trace-selectors/prompts/RULE.md`.
