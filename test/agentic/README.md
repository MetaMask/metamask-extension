# test/agentic/ — Agentic Recipe Runner

Automated validation toolkit for MetaMask Extension. Drives the unpacked extension on an isolated Chromium over CDP (Chrome DevTools Protocol) — no manual clicking, no Playwright spec authoring. Companion implementation of ADR #0058 (https://github.com/MetaMask/decisions/pull/173).

New here? Read [GETTING_STARTED.md](./GETTING_STARTED.md) first.

## Scope

Lives under `test/agentic/` and is owned by `@MetaMask/perps` while the toolkit incubates. The infrastructure (`lib/`, validators, `domains/` layout) is team-agnostic by design. Once a second team adopts it, ownership broadens.

## Layout

```
test/agentic/
  GETTING_STARTED.md         onboarding (start here)
  README.md                  this file
  wallet-fixture.example.json wallet template
  .env.example               sandbox config template (CDP_PORT, etc.)
  sandbox.sh                 lifecycle entrypoint — up | down | clean | status | reload | preflight
  validate-recipe.sh         recipe runner entrypoint (live)
  validate-recipe.js         recipe runner core
  validate-flow-schema.js    offline schema validator for recipes/flows
  validate-pre-conditions.js offline pre-condition validator
  status.ts                  CDP + extension state probe
  soft-refresh.js            reload extension after a code change
  reload-extension.ts        targeted SW restart
  check-extension.ts         smoke test for extension liveness
  debug-cdp.ts               CDP exploratory tool
  fix-extension-tabs.ts      cleans up orphan extension tabs
  setup/
    generate-fixture.cjs     turn wallet-fixture.json into fixture-state.json
                             (builds vault on the fly from srp + password)
    launch-sandbox.js        Node implementation behind sandbox.sh up
  lib/                       runtime: action mapper, CDP session, assertion engine,
                             workflow graph normalization, route map, etc.
  schemas/flow.schema.json   JSON Schema for flow + recipe authoring
  domains/                   recipes + flows + evals, organized by feature area
    browser-features/recipes/  smoke tests for browser primitives
    extension-core/            wallet/account/network flows + recipes
    perps/                     perps domain (mobile parity flows + degraded scenarios)
```

`domains/<name>/` is the canonical layout. The legacy `teams/` alias has been dropped — every recipe lives under `domains/`.

## Sandbox model

Each Chromium instance the runner spawns is fully isolated by `--user-data-dir`. Defaults are repo-local (`<repo>/temp/runtime/chrome-profile-pw`), so multiple worktrees never share state. Override these env vars (in `test/agentic/.env` or your shell) to run several sandboxes concurrently:

| Variable | Default | Purpose |
|---|---|---|
| `CDP_PORT` | `9222` (with warning) | Remote debugging port. Default collides across sandboxes — **always export a unique port per worktree**. |
| `SANDBOX_LABEL` | `agentic` | Window-title prefix for visual disambiguation |
| `RUNTIME_DIR` | `temp/runtime` | Resolved relative to repo root unless absolute |
| `RUNTIME_DIR_OVERRIDE` | unset | Absolute path override (wins over `RUNTIME_DIR`) |
| `AGENT_DIR` | `$REPO/$RUNTIME_DIR` | PIDs, fixture-state, logs (overrides RUNTIME_DIR) |
| `PROFILE_NAME` | `chrome-profile-pw` | Profile dir name (under `$AGENT_DIR`) |
| `PROFILE_DIR` | `$AGENT_DIR/$PROFILE_NAME` | Chrome user-data-dir (idempotent across runs) |
| `WALLET_FIXTURE` | `$AGENT_DIR/wallet-fixture.json` | Wallet seed for state injection |
| `EXTENSION_DIR` | `<repo>/dist/chrome` | Unpacked extension Chromium loads |
| `LAUNCH_MODE` | `fullscreen` | `fullscreen` or `sidepanel` |
| `CHROME_BIN` | Playwright bundled | Override Chromium binary |
| `BUILD_TIMEOUT` | `180` | Seconds preflight waits for the build to finish |

`sandbox.sh up` refuses an already-running sandbox unless `--force`; an mkdir-atomic lockfile under `$AGENT_DIR/.sandbox.lock` blocks concurrent invocations. `sandbox.sh clean` requires `--yes` (or an interactive TTY) before deleting the profile dir. `sandbox.sh down` SIGTERMs the launcher + browser PIDs, waits up to 5s, then SIGKILLs and sweeps any chromium still bound to the profile dir.

### Per-stream logs

Tailing each stream independently mirrors mobile's metro / simulator / wallet split:

```bash
tail -f $AGENT_DIR/launcher.log $AGENT_DIR/watcher.log \
        $AGENT_DIR/extension-console.log $AGENT_DIR/sw-console.log
```

| File | Source |
|---|---|
| `launcher.log` | `sandbox.sh up` stdout + stderr |
| `watcher.log` | `yarn start` output (only when sandbox auto-started it) |
| `extension-console.log` | `console.*` + `pageerror` from every extension page |
| `sw-console.log` | `console.*` from the extension service worker |

## Wallet seeding

Pre-populate the extension's `chrome.storage.local` (LevelDB) **before** the service worker boots, so MetaMask reads the seeded state on first init instead of running through onboarding:

1. Copy `wallet-fixture.example.json` to a private location (e.g. `temp/runtime/wallet-fixture.json` or `.agent/wallet-fixture.json`) and edit `password` + `srp` (testnet only).
2. `generate-fixture.cjs` reads `test/e2e/fixtures/default-fixture.json` (post-migration baseline), builds a fresh vault from `srp` + `password` using `@metamask/eth-hd-keyring` + `@metamask/browser-passworder`, and patches the fixture with the new keyring, address, network selection, and feature flags. Output: `fixture-state.json`.
3. `launch-sandbox.js` writes `fixture-state.json` into the profile's LevelDB for the canonical extension ID, then launches Chromium.
4. After the SW comes up, the launcher unlocks the vault using the password from `wallet-fixture.json`.

Backwards compatible: if a pre-built `vault` is already present in the fixture, `generate-fixture.cjs` decrypts it instead of rebuilding from `srp`.

## Concepts

### Flows

Parameterized, reusable UI sequences. Live in `domains/<name>/flows/<file>.json`. Declare `inputs` (with defaults) and a `validate.workflow` graph. `{{param}}` tokens resolve at runtime.

```json
{
  "title": "Unlock wallet",
  "inputs": {
    "password": { "type": "string", "default": "{{env.WALLET_PASSWORD}}" }
  },
  "validate": {
    "workflow": {
      "pre_conditions": ["wallet.is_locked"],
      "entry": "fill",
      "nodes": {
        "fill":   { "action": "set_input", "test_id": "unlock-password", "value": "{{password}}", "next": "submit" },
        "submit": { "action": "press",     "test_id": "unlock-submit", "next": "done" },
        "done":   { "action": "end",       "status": "pass" }
      }
    }
  }
}
```

### Recipes

Directed graph that composes flows and inline steps. Live in `domains/<name>/recipes/`. Nodes keyed by ID; most have a `next` pointer. `switch` branches on assertions. `end` terminates.

```json
{
  "entry": "setup",
  "nodes": {
    "setup":  { "action": "flow_ref", "ref": "ensure-perps-network", "next": "open" },
    "open":   { "action": "flow_ref", "ref": "open-long-position", "params": { "symbol": "ETH" }, "next": "verify" },
    "verify": { "action": "eval_ref", "ref": "perps/positions", "assert": { "operator": "length_gt", "value": 0 }, "next": "close" },
    "close":  { "action": "flow_ref", "ref": "close-position", "params": { "symbol": "ETH" }, "next": "done" },
    "done":   { "action": "end", "status": "pass" }
  }
}
```

### Branching — `switch`

Cases evaluate against `env`, `inputs`, `vars`, `last`; `default` catches unmatched.

```json
{
  "decide": {
    "action": "switch",
    "cases": [
      { "when": { "operator": "length_gt", "field": "vars.positions.length", "value": 0 }, "next": "close-first" },
      { "when": { "operator": "length_eq", "field": "vars.positions.length", "value": 0 }, "next": "open-new" }
    ],
    "default": "open-new"
  }
}
```

### Guards — `when` / `unless`

Any executable node can guard on the same condition language; skipped nodes fall through to `next`.

```json
{
  "maybe-close": {
    "action": "flow_ref",
    "ref": "close-position",
    "when": { "operator": "gt", "field": "vars.positionCount", "value": 0 },
    "next": "done"
  }
}
```

Context available to guards and switch: `env` (appRoot, recipePath, domain), `inputs` (templated params), `vars` (via `save_as`), `last` (most recent result), `nodes` (per-node records).

### Setup / teardown

Linear arrays before/after the workflow graph. Teardown runs on both pass and fail.

```json
{
  "setup":    [{ "id": "ensure-mainnet", "action": "toggle_testnet", "enabled": false }],
  "teardown": [{ "id": "close-all", "action": "eval_async", "expression": "Engine.context.PerpsController.closeAllPositions().then(function(r){return JSON.stringify(r)})", "assert": { "operator": "not_null" } }]
}
```

### Eval refs

Named CDP eval expressions. Two homes:
- `domains/<name>/evals.json` — quick refs (`perps/positions`)
- `domains/<name>/evals/<file>.json` — grouped refs (`perps/core/tpsl-orders`)

Recipes invoke them via `{ "action": "eval_ref", "ref": "perps/positions", "assert": { ... } }`.

### Pre-conditions

Gate checks that must pass before a flow runs. Defined in `domains/<name>/pre-conditions.js`.

| Field | Description |
| --- | --- |
| `description` | human-readable label |
| `async` | whether expression returns a Promise |
| `expression` | CDP eval (string, or function for parameterized) |
| `assert` | `{ operator, field, value }` |
| `hint` | actionable failure message |
| `fixtures` | `{ pass, fail }` JSON strings for offline validation |

```js
'wallet.is_unlocked': {
  description: 'Wallet vault is unlocked and home is reachable',
  async: false,
  expression: '(function(){ var v=Engine.context.KeyringController.state; return JSON.stringify({hasVault:!!v.vault, isUnlocked:v.isUnlocked}); })()',
  assert: { operator: 'eq', field: 'isUnlocked', value: true },
  hint: 'Unlock the wallet first (sandbox.sh up handles this automatically).',
  fixtures: {
    pass: '{"hasVault":true,"isUnlocked":true}',
    fail: '{"hasVault":true,"isUnlocked":false}',
  },
},
```

## Actions

| Action | Required | Purpose |
| --- | --- | --- |
| `navigate` | `target` | go to a screen via the route map |
| `press` | `test_id` | click a component by `data-testid` |
| `set_input` | `test_id`, `value` | type into an `<input>` |
| `type_keypad` | `value` | type digits via on-screen keypad |
| `clear_keypad` | — | press delete N times (default 8) |
| `scroll` | — | scroll a region (optional `test_id`, `offset`) |
| `eval_sync` | `expression`, `assert` | sync CDP eval against the active page |
| `eval_async` | `expression`, `assert` | promise-based CDP eval |
| `eval_ref` | `ref`, `assert` | run a named eval ref |
| `flow_ref` | `ref` | invoke another flow (workflow only) |
| `wait` | — | pause N ms |
| `wait_for` | condition | poll until route / test_id / expression matches. Timing fields: `timeout_ms`, `poll_ms` |
| `log_watch` | `watch_for` / `must_not_appear` | scan watcher log |
| `screenshot` | `note` | capture page (test_id-scoped optional) |
| `manual` | — | human intervention point |
| `select_account` | `address` | switch Ethereum account |
| `toggle_testnet` | `enabled` | enable/disable testnet networks |
| `switch_provider` | `provider` | switch perps provider |
| `ext_navigate_hash` | `path` | extension-specific: navigate via `home.html#/<path>` |
| `ext_wait_for_screen` | `route` | wait until URL hash matches a registered route |
| `ext_switch_tab` | `target` | switch active Chromium tab to extension page / dapp / new |
| `ext_check_dom` | `selector`, `assert` | DOM assertion against the active extension page |
| `switch` | `cases` | branch on assertions (workflow only) |
| `end` | — | terminal node (workflow only) |

## Assertion operators

Used in `assert` blocks on steps and pre-conditions:

| Operator | Meaning |
| --- | --- |
| `exists` | field not undefined |
| `not_null` | value not null/undefined |
| `truthy` / `falsy` | boolean truthiness |
| `eq` / `neq` | strict equality |
| `gt` / `lt` / `gte` / `lte` | numeric comparison |
| `deep_eq` | deep strict equality |
| `length_eq` / `length_gt` / `length_gte` | array/string length |
| `contains` / `not_contains` | array or string includes |
| `matches` | regex match (`/pattern/flags` or string) |
| `one_of` | value in `values` array |

Compound: `{ all: [...] }`, `{ any: [...] }`, `{ none: [...] }`.

## CLI

```bash
# Lifecycle
bash test/agentic/sandbox.sh up                     # preflight + launch
bash test/agentic/sandbox.sh up --force             # kill running + relaunch
bash test/agentic/sandbox.sh status                 # CDP + extension probe
bash test/agentic/sandbox.sh reload                 # soft SW restart
bash test/agentic/sandbox.sh down                   # stop + clean PIDs
bash test/agentic/sandbox.sh clean --yes            # down + wipe profile

# Run a recipe (live)
bash test/agentic/validate-recipe.sh \
  test/agentic/domains/browser-features/recipes/page-reload-smoke.json \
  --cdp-port "$CDP_PORT"

# --dry-run prints the workflow graph + Mermaid, no browser actions
bash test/agentic/validate-recipe.sh <recipe.json> --dry-run

# Offline validators
node test/agentic/validate-flow-schema.js                                        # all
node test/agentic/validate-flow-schema.js test/agentic/domains/perps/flows/<file>.json
node test/agentic/validate-pre-conditions.js
```

## Adding a new domain

1. `domains/<name>/pre-conditions.js` exporting `Record<string, PreCondition>`.
2. Key convention: `<domain>.<check>` (e.g. `swap.has_quote`).
3. Include `fixtures: { pass, fail }` on every entry.
4. Optionally add `flows/`, `recipes/`, `evals/`, `evals.json`.
5. Run both validators:

```bash
node test/agentic/validate-pre-conditions.js
node test/agentic/validate-flow-schema.js
```

## CDP eval rules

All `eval_sync` / `eval_async` / `eval_ref` expressions run inside the extension service worker or an extension page via `Runtime.evaluate`. Keep them **ES5** for portability with mobile (which runs Hermes) — no arrow functions, `const`/`let`, template literals, top-level `await`.

```js
// OK
var x = Engine.context.PerpsController.state;
JSON.stringify({ count: x.positions.length });

// Not OK in shared evals
const x = Engine.context.PerpsController.state;
`count: ${x.positions.length}`;
```

Async via `.then()`:

```js
Engine.context.PerpsController.getPositions().then(function(ps) {
  return JSON.stringify({ count: ps.length });
});
```

## Run artifacts

Every recipe run writes to `domains/artifacts/` (gitignored):

- `summary.json`, `workflow.json`, `workflow.mmd`, `trace.json`
- `screenshots/`
- `recipe-issues.json` + `console-warnings.json` + `console-errors.json` + `runtime-exceptions.json`
- `recipe-issues-review.json` + `recipe-issues-review.md`

`summary.json.recipeIssues` is automatic and aligned with the contract used by mobile. See ADR #0058 for the review vocabulary and opt-in `fail_on_unexpected` gating.

## Known issues

- **Stale builds on out-of-date branches.** If you're on a branch that hasn't merged recent `main` you may hit upstream bugs that have since been fixed (e.g. `PerpsController` `getItemSync` crash, malformed JA locale placeholders). Rebase onto `main` and rebuild before reporting sandbox issues.
- **Webpack races during launch.** `yarn start` continuously rewrites `dist/chrome` while the launcher prepares the unpacked extension; partial bundles can crash the SW boot. The launcher does not try to manage your watcher (auto-pause attempts proved fragile across worktrees). If you hit a flaky boot:
  1. Stop `yarn start` (`Ctrl-C` in the watcher terminal).
  2. Wait for `dist/chrome/scripts/app-init.js` to be present and stable.
  3. Run `bash test/agentic/sandbox.sh up`.
  4. Restart `yarn start` once you see `[ready]` from the launcher.

## Reference

- ADR #0058 — recipe format, security boundary, schema (https://github.com/MetaMask/decisions/pull/173)
- Mobile counterpart — `metamask-mobile/scripts/perps/agentic/` (different layout: `teams/`, `app-state.sh`, etc., but same recipe semantics)
