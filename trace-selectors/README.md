# Selector usage trace

Self-contained tools and prompts for tracing selector usage from one or more root files (e.g. `ui/selectors/assets.ts`) through layers of consumers into a single output document.

## Layout

- **prompts/** – Reusable prompt and instructions (`RULE.md`, `PROMPT.md`).
- **scripts/** – Node scripts: `list-exports.js`, `find-importers.js`, `classify-file.js`, `selector-deps.js`, `trace-usage.js`, `discover-assets-controllers-roots.js`. Run from repo root. Requires **ripgrep (`rg`)** on PATH. No install step.
- **output/** – Generated trace documents (e.g. `selector-usage-trace-assets.md`).
- **CONFIG.md** – Config file format for multi-root and per-root selector filters.
- **config.assets-controllers.json** – Cleanup config. The root is `shared/lib/selectors/assets-migration.ts`.

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

Config format: see [CONFIG.md](CONFIG.md). The checked-in config tracks every export of `shared/lib/selectors/assets-migration.ts`. Wrapper names such as `getAllTokens` stay in `selectors`. `migrationSelectors` is the assets-migration export they trace back to.

**Completion file (optional):** Add `"completionFile": "trace-selectors/completed.txt"` to your config. That file lists one migrated file path per line; those files are excluded from the report so re-runs show only remaining work. Completed non-terminal files stay in the walk, so their consumers are still reported. See [CONFIG.md](CONFIG.md#completion-file-migrated-files).

## Automation

From the repository root:

```bash
node --test trace-selectors/scripts/tooling.test.js
node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json
```

The trace writes four files next to the configured markdown output:

- `selector-usage-trace-assets-migration.md`
- `selector-usage-trace-assets-migration.json` (dashboard source, schema version 3)
- `selector-usage-trace-assets-migration.by-type.csv`
- `selector-usage-trace-assets-migration.by-selector.csv` (imported names)
- `selector-usage-trace-assets-migration.by-migration-selector.csv` (assets-migration exports)

A second run with the same inputs rewrites the same bytes. The JSON does not include a timestamp. Exit `0` when `status` in the JSON is `ok`. Exit `2` when `rg` is missing. Exit `3` when a configured selector is no longer exported or `TRACE_MAX_LAYERS` stops the walk early. Exit `3` still writes the summary so a dashboard can show the drift. Use `remaining` for totals and `edges` for the import tree (`from`, `to`, `selectors`, `migrationSelectors`, `lines`). `selectors` is the name in the import. `migrationSelectors` is the assets-migration export behind that name. `lines` are 1-based lines of the import keyword in the consumer. The markdown layer headers count non-terminal files only.

## Discovering roots that use @metamask/assets-controllers

To list UI selector files that import from `@metamask/assets-controllers` (for building a config):

```bash
node trace-selectors/scripts/discover-assets-controllers-roots.js
```

Output: one path per line (e.g. `ui/selectors/assets.ts`, `ui/selectors/multichain.ts`, `ui/selectors/nft.ts`). Optional argument: search directory (default `ui/selectors`).

## Reusing for another root

Replace `[ROOT_PATH]` in `trace-selectors/prompts/PROMPT.md` with the new file (e.g. `ui/selectors/accounts.ts`) when re-prompting. For multi-root or per-root selectors, use a config file and `--config`. Full instructions are in `trace-selectors/prompts/RULE.md`.
