# Trace selectors config format

Config files are JSON. Use with:

```bash
node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json
```

Optional env: `TRACE_MAX_LAYERS` — cap depth (e.g. `TRACE_MAX_LAYERS=4`) to keep runs fast when the graph is large; omit or `0` for no limit.

## Schema

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `output`| string | No       | Path for the generated markdown document. Default: `trace-selectors/output/selector-usage-trace-<name>.md` derived from config filename or first root. |
| `roots` | array  | Yes      | List of root entries (see below). |

### Root entry

| Field      | Type     | Required | Description |
|------------|----------|----------|-------------|
| `file`     | string   | Yes      | Path to the selector file (e.g. `ui/selectors/assets.ts`). |
| `selectors`| string[] | No       | If omitted or empty: track all exports from that file. If present: only these symbols are in scope; a file is included as an importer only if it uses at least one of these symbols. |

## Example

See `config.assets-controllers.json`: one root with no filter (all of `assets.ts`), one root with a `selectors` list (only `getMultichainBalances` and `getMultichainNetwork` from `multichain.ts`).

## Discovering asset-controller roots

To find UI selector files that depend on `@metamask/assets-controllers` state (so you can add them as roots):

```bash
rg "from ['\"]@metamask/assets-controllers" ui/selectors --files-with-matches -l
```

Add each listed file to `roots` in your config. Optionally run `list-exports.js` on each file and set `selectors` to the subset you care about:

```bash
node trace-selectors/scripts/list-exports.js ui/selectors/assets.ts
node trace-selectors/scripts/list-exports.js ui/selectors/multichain.ts
```
