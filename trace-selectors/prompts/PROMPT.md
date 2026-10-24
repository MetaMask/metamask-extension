# Selector usage trace – reusable prompt

Use this prompt to trace selector usage from one or more root files. Replace `[ROOT_PATH]` with the file you want to trace (e.g. `ui/selectors/accounts.ts`), or use a **config file** for multiple roots and per-root selector filters.

---

Trace selector usage from root selector file(s) and produce a single output document.

1. **Root file(s)**
   - **Single root**: `[ROOT_PATH]` – list all exported selectors and related functions as Layer 1.
   - **Config**: use `--config <path>` with a JSON config that has `output` and `roots` (each root: `file`, optional `selectors` array). When `selectors` is set for a root, only those symbols are tracked (only files that use at least one of them are included).

2. **Layer 2**
   - Find every non-test file (exclude `*.test.*`, `*.spec.*`, `*.stories.*`, `__tests__`, `__snapshots__`) that imports from the root file(s).
   - For each file record: path, which root (or intermediate) symbols it uses, and type (`selector` | `duck` | `hook` | `component` | `util` | `other`).
   - If type is React component or React hook, mark as **terminal** and do not recurse into its importers.

3. **Layers 3..N**
   - For each non-terminal file from the previous layer, find all non-test files that import from it.
   - **As soon as a layer is computed**, append it to the output document (path | uses | type | terminal). When a file is classified as terminal, append it to the "Terminal nodes" section immediately. Do not accumulate layers in context.
   - Replace "files to trace next" with the non-terminal files of this layer; repeat until there are no more non-terminal consumers.

4. **Output**
   - Single Markdown document in `trace-selectors/output/` (or path from config). **Write incrementally**: open the file at the start, write Layer 1, then after each subsequent layer is discovered append that layer (and any new terminals) to the document.
   - Do not add any comments or annotations in the source code; all information stays in the document only.

---

## Quick run with scripts

**Single root:**

```bash
node trace-selectors/scripts/trace-usage.js [ROOT_PATH]
```

Example: `node trace-selectors/scripts/trace-usage.js ui/selectors/assets.ts`

**Config (multi-root, optional per-root selectors):**

```bash
node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json
```

**Assets-controllers roots:** run the discovery script to list candidate roots, then add them to a config:

```bash
node trace-selectors/scripts/discover-assets-controllers-roots.js
```

Requires **ripgrep (`rg`)** on PATH.
