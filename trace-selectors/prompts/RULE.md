# Selector usage trace

Instructions for tracing selector usage from one or more root files and producing a single output document. Use this when you need to list all direct and indirect usages of a selector module (e.g. `ui/selectors/assets.ts`).

## Goal

Produce **one Markdown document** that:

- Lists the root file(s) and their (optionally filtered) exported symbols (Layer 1).
- Lists each layer of consumers (Layer 2, 3, … N): path, what they use, type, and whether they are terminal (React component/hook).
- Stops recursing at React components and React hooks but records them in the document.
- **Writes incrementally**: append each layer and each terminal to the document as soon as it is discovered. Do not accumulate all layers in context.

Do **not** add any comments or annotations in source files; all information stays in the document only.

## Tools (scripts)

Located in `trace-selectors/scripts/`:

1. **list-exports.js** – List exported selector/function symbols from a file (Layer 1).
   - `node trace-selectors/scripts/list-exports.js <path-to-file>`

2. **find-importers.js** – Find non-test files that import from a module path.
   - `node trace-selectors/scripts/find-importers.js <module-path> [search-root] [--with-symbols] [--symbols sym1,sym2]`
   - `--symbols`: only list files that import at least one of these symbols from the module.
   - Example: `node trace-selectors/scripts/find-importers.js "selectors/assets" . --with-symbols`

3. **classify-file.js** – Classify paths as type (selector | duck | hook | component | util | other) and terminal (true/false).
   - `node trace-selectors/scripts/classify-file.js <path> [path ...]`

4. **trace-usage.js** – Full recursion driver; writes the document incrementally.
   - **Single root**: `node trace-selectors/scripts/trace-usage.js <root-file> [output-doc]`
   - **Config (multi-root, per-root selector filter)**: `node trace-selectors/scripts/trace-usage.js --config <config.json>`
   - Config format: see `trace-selectors/CONFIG.md`.

5. **discover-assets-controllers-roots.js** – List `ui/selectors` files that import from `@metamask/assets-controllers` (one path per line). Use to build a config.
   - `node trace-selectors/scripts/discover-assets-controllers-roots.js [search-root]`
   - Default search root: `ui/selectors`.

Requires **ripgrep (`rg`)** on PATH.

## Multi-root and per-root selectors

When using `--config`, the config has `roots`: an array of `{ "file": "path/to/file.ts", "selectors": ["sym1", "sym2"] }`. If `selectors` is omitted for a root, all exports are tracked. If `selectors` is present, only files that use at least one of those symbols are included as importers of that root. The BFS merges all roots: each file is expanded at most once.

## Reusable prompt (for a new root)

When re-running for a **different root file** (e.g. `ui/selectors/accounts.ts`), use the prompt in `trace-selectors/prompts/PROMPT.md` and replace `[ROOT_PATH]`. For multiple roots or per-root selectors, use a config file and `--config`.

## Conventions

- **Exclude**: `*.test.*`, `*.spec.*`, `*.stories.*`, `__tests__`, snapshot files.
- **React component**: file that renders JSX (e.g. `.tsx`/`.jsx` under `ui/components/` or `ui/pages/`).
- **React hook**: function/file under `ui/hooks/` or filename `use*.ts(x)`.
- **Terminal**: React component or hook → do not recurse into its importers; still list it in the document.

## Output document location

- Single root: default `trace-selectors/output/selector-usage-trace-<basename>.md`; or pass the output path as the second argument.
- Config: use `output` in the config, or default `selector-usage-trace-<config-basename>.md` in `trace-selectors/output/`.
