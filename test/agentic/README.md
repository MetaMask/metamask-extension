# test/agentic/ — Agentic Recipe Runner

Isolated sandbox + recipe runner for MetaMask Extension. Companion implementation of ADR #0058 (https://github.com/MetaMask/decisions/pull/173).

New here? Read [GETTING_STARTED.md](./GETTING_STARTED.md) first.

## Layout

```
test/agentic/
  GETTING_STARTED.md         onboarding (start here)
  README.md                  this file
  qa-agentic.md              manual QA walkthrough
  wallet-fixture.example.json wallet template
  .env.example               sandbox config template (CDP_PORT, etc.)
  sandbox.sh                 lifecycle entrypoint — up / down / status / reload / preflight
  validate-recipe.sh         recipe runner entrypoint
  validate-recipe.js         recipe runner core
  validate-flow-schema.js    schema validator for recipes/flows
  validate-pre-conditions.js pre-condition runner
  status.ts                  CDP + extension state probe
  soft-refresh.js            reload extension after code change
  reload-extension.ts        targeted SW restart
  check-extension.ts         smoke test for extension liveness
  debug-cdp.ts               CDP exploratory tool
  fix-extension-tabs.ts      cleans up orphan extension tabs
  setup/
    generate-fixture.cjs     turn wallet-fixture.json into fixture-state.json
                             (builds vault on the fly from srp + password)
    launch-sandbox.js        Node implementation behind sandbox.sh up
  lib/                       runtime support (action mapper, CDP session, evaluator, ...)
  schemas/                   JSON schemas (flow.schema.json)
  domains/                   recipes + flows + evals, organized by feature area
    browser-features/recipes/  smoke tests for browser primitives
    extension-core/            wallet/account/network flows + recipes
    perps/                     perps domain (mobile parity flows + degraded scenarios)
```

`domains/<name>/` is the canonical layout. The legacy `teams/` alias is gone — every recipe lives under `domains/`.

## Sandbox model

Each Chromium instance the runner spawns is fully isolated by `--user-data-dir`. Defaults are repo-local (`<repo>/temp/runtime/chrome-profile`), so multiple worktrees never share state. Override these env vars to run several sandboxes concurrently:

| Variable | Default | Purpose |
|---|---|---|
| `CDP_PORT` | `9222` (with warning) | Remote debugging port. Default collides across sandboxes — **always export a unique port per worktree** (e.g. `9223`, `9224`, …). The launcher warns when the default is used. |
| `SANDBOX_LABEL` | `$SESSION` / `$SLOT_ID` / `agentic` | Window-title prefix for visual disambiguation |
| `RUNTIME_DIR` | `temp/runtime` | Resolved relative to repo root unless absolute |
| `RUNTIME_DIR_OVERRIDE` | unset | Absolute override (matches farmslot semantics) |
| `AGENT_DIR` | `$REPO/$RUNTIME_DIR` | PIDs, fixture-state, logs (overrides RUNTIME_DIR) |
| `PROFILE_NAME` | `chrome-profile-pw` | Profile dir name (under `$AGENT_DIR`) |
| `PROFILE_DIR` | `$AGENT_DIR/$PROFILE_NAME` | Chrome user-data-dir (idempotent across runs) |
| `WALLET_FIXTURE` | `$AGENT_DIR/wallet-fixture.json` | Wallet seed + vault for state injection |
| `EXTENSION_DIR` | `<repo>/dist/chrome` | Unpacked extension Chromium loads |
| `LAUNCH_MODE` | `fullscreen` | `fullscreen` or `sidepanel` |
| `CHROME_BIN` | Playwright bundled | Override Chromium binary |

**Farmslot compatibility.** When invoked from a farmslot worker the env already
exports `RUNTIME_DIR=.agent`, `CDP_PORT=<slot port>`, `SLOT_ID=<slot id>`. The
sandbox scripts honor those without further config so a slot's
`sandbox.sh up` lands at `${REPO}/.agent/chrome-profile-pw` with the slot's
CDP port and a window labeled by the slot id — same paths farmslot's own
launcher uses.

`sandbox.sh up` is **idempotent**: re-running it kills the previous instance (via `AGENT_DIR/launcher.pid` and `browser.pid`), regenerates fixture state, prefills LevelDB, and relaunches.

## Wallet seeding

`sandbox.sh up` uses the same approach as farmslot's per-slot launcher: pre-populate the extension's `chrome.storage.local` (LevelDB) **before** the service worker boots, so MetaMask reads the seeded state on first init instead of running through onboarding.

Pipeline:
1. Copy `wallet-fixture.example.json` → your private location (e.g. `temp/runtime/wallet-fixture.json` or `.agent/wallet-fixture.json`) and edit `password` + `srp` (testnet only).
2. `generate-fixture.cjs` reads `test/e2e/fixtures/default-fixture.json` (post-migration baseline), builds a fresh vault from `srp` + `password` using `@metamask/eth-hd-keyring` + `@metamask/browser-passworder`, and patches the fixture with the new keyring, address, network selection, and feature flags. Output: `fixture-state.json`.
3. `launch-sandbox.js` writes `fixture-state.json` into the profile's LevelDB for the extension's known ID, then launches Chromium.
4. After the SW comes up, the launcher unlocks the vault using the password from `wallet-fixture.json`.

If a `vault` field is already present in the fixture (farmslot historically generates one), `generate-fixture.cjs` decrypts it instead of rebuilding from `srp` — so existing farmslot fixtures keep working unchanged.

The first run does not yet know the extension ID, so it falls back to injecting via `chrome.storage.local.set()` from a foreground page after Chromium boots — slower but recovers cleanly.

## Recipes + flows

Recipes are JSON workflow graphs. Each recipe file defines `validate.workflow.entry` + `nodes`; nodes have an `action` (`navigate`, `eval_sync`, `wait_for`, `page`, `screenshot`, ...) and assertions. See `domains/browser-features/recipes/page-reload-smoke.json` for the canonical smoke recipe and `lib/action-mapper.ts` for the full action catalog.

Flows are reusable building blocks recipes can `flow:`-reference. They live under `domains/<name>/flows/`. Schema is enforced by `validate-flow-schema.js` (`schemas/flow.schema.json`).

`evals.json` per domain holds named eval expressions reusable by recipes. Pre-conditions per domain live in `pre-conditions.js` and run before a recipe starts (e.g. "wallet must be unlocked").

## Running a recipe

```bash
bash test/agentic/validate-recipe.sh \
  test/agentic/domains/browser-features/recipes/page-reload-smoke.json
```

Useful flags (forwarded to `validate-recipe.js`):

- `--dry-run` — print the workflow graph + Mermaid, no browser actions
- `--step` — pause for keypress between nodes
- `--slow <ms>` — delay between nodes (helpful for debugging)
- `--cdp-port <port>` — override CDP_PORT
- `--param key=val` — inject template values
- `--artifacts-dir <dir>` — override artifact output

## Schema validation

Strict by default. Run before opening a PR:

```bash
node test/agentic/validate-flow-schema.js \
  test/agentic/domains/<domain>/<recipes-or-flows>/<file>.json
```

Many existing perps flows currently fail strict validation (pre-existing — not introduced by this directory's promotion). Recipe authoring should follow the schema; treat new violations as bugs.

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
- Farmslot per-slot launcher — `farmslot/projects/metamask-extension-farm/setup/launch-browser.sh` (reference for the multi-slot orchestrator)
