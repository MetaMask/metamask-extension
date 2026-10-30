# Trace selectors config format

Config files are JSON. Use with:

```bash
node trace-selectors/scripts/trace-usage.js --config trace-selectors/config.assets-controllers.json
```

Optional env: `TRACE_MAX_LAYERS` — cap depth (e.g. `TRACE_MAX_LAYERS=4`) to keep runs fast when the graph is large; omit or `0` for no limit.

## Schema

| Field            | Type   | Required | Description |
|------------------|--------|----------|-------------|
| `output`         | string | No       | Path for the generated markdown document. Default: `trace-selectors/output/selector-usage-trace-<name>.md` derived from config filename or first root. |
| `roots`          | array  | Yes      | List of root entries (see below). |
| `completionFile` | string | No       | Path to a completion file: one migrated file path per line. Listed files are excluded from the report so re-runs show only remaining work. Lines starting with `#` and blank lines are ignored. |

### Root entry

| Field      | Type     | Required | Description |
|------------|----------|----------|-------------|
| `file`     | string   | Yes      | Path to the selector file (e.g. `ui/selectors/assets.ts`). |
| `selectors`| string[] | No       | If omitted or empty: track all exports from that file. If present: only these symbols are in scope; a file is included as an importer only if it uses at least one of these symbols. |

## Example

See `config.assets-controllers.json`. Its only root is `shared/lib/selectors/assets-migration.ts`, with every export tracked.

## Completion file (migrated files)

When running the trace repeatedly (e.g. automation that retriggers after migrations), set `completionFile` to a path like `trace-selectors/completed.txt`. That file lists one path per line (paths relative to repo root). Any file in that list is excluded from layer tables and the terminal summary, so the report shows only **remaining** files to migrate.

Example `trace-selectors/completed.txt`:

```
# Migrated files – one path per line
ui/components/app/alerts/unconnected-account-alert/unconnected-account-alert.js
ui/pages/confirmations/hooks/useCurrentConfirmation.ts
```

The markdown layer tables omit completed paths. A completed non-terminal file is still walked, so consumers that are not themselves completed stay in the report.

## Summary files

Every successful or attention run writes three files beside the markdown output (`output` with `.md` replaced):

| File | Purpose |
| --- | --- |
| `.json` | Dashboard payload, schema version 3. `status` is `ok` or `attention`. `remaining.files` is the cleanup total. `edges` is the import tree. |
| `.by-type.csv` | Columns `type,files`. |
| `.by-selector.csv` | Columns `selector,files`. These are the imported names. |
| `.by-migration-selector.csv` | Columns `selector,files`. These are the assets-migration exports. |

`importedSymbolSlots` counts distinct imported names on each file. It is not a count of call sites. `unresolvedSelectors` lists configured names that are not exported; those names are omitted from the trace until the config is updated.

Each `edges` item is one import relationship:

| Field | Meaning |
| --- | --- |
| `from` | File that was imported. A barrel with no `index` file is `ui/selectors` or `ui/ducks`. |
| `to` | Consumer file. Completed consumers are omitted. A completed file can still appear as `from` when its consumers remain. |
| `selectors` | Names imported by that consumer from `from`. |
| `migrationSelectors` | Exports from the root file that those imported names trace back to. An alias such as `getAllTokens` stays in `selectors`, and `getTokensControllerAllTokens` is listed here. |
| `lines` | 1-based lines in `to` where the `import` or `export ... from` keyword starts. |

`files[].lines` repeats those line numbers for the consumer. Both lists are sorted. A second run with the same tree rewrites the same bytes, so the JSON does not include a timestamp or duration.

Exit codes: `0` report is complete, `1` bad config or missing root, `2` `rg` is not on `PATH`, `3` the JSON `status` is `attention` (the summary files are still written).

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
