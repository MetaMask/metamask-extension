# QA — Agentic Sandbox + Recipe Runner

Step-by-step manual validation of every script. Run top-to-bottom, copy/paste each command, compare output to the snippet under it. Each step is independent — if one fails, fix it before moving on.

Two run modes are covered:
- **Standalone** — single worktree, fixture under `temp/runtime/`.
- **Farmslot slot** — env vars exported by the slot wrapper (`RUNTIME_DIR=.agent`, slot `CDP_PORT`, `SLOT_ID`).

Switch mode by exporting the env vars at the top of your shell session. Every script below honors both.

**Always export `CDP_PORT` before the first launcher call.** Default is `9222` (the launcher warns about it), which collides with any other sandbox on the same machine. Pick a unique port per worktree:

```bash
# Pick once per shell session — every step below depends on it.
export CDP_PORT=9222   # standalone, single sandbox
# or
export CDP_PORT=6663   # farmslot slot mme-3
```

---

## 0. One-time prep

```bash
yarn install
cp -n .metamaskrc.dist .metamaskrc
```

Expected: `node_modules/` populated, `.metamaskrc` exists.

**You do NOT need to run `yarn start` in a second terminal.** `sandbox.sh up` auto-starts the watcher in the background (log: `$AGENT_DIR/watcher.log`) if `dist/chrome/scripts/app-init.js` is missing, and preflight waits for the build to finish. Run a separate terminal only if you want to watch webpack output live, e.g.:

```bash
# Optional — only if you prefer foreground webpack
yarn start
```

---

## 1. One-shot orchestration (optional fast path)

Before walking the granular checks, sanity-test the one-shot orchestrator:

```bash
bash test/agentic/sandbox.sh up
```

Expected:
- If `yarn start` isn't running yet, it gets backgrounded with a log under `$AGENT_DIR/watcher.log` (default `temp/runtime/watcher.log`, or `.agent/watcher.log` on a farmslot slot).
- Preflight waits for the build to finish (manifest + SW bundle).
- Launcher boots Chromium and ends with `[ready] agentic (CDP:9222)`.

If this passes, the granular steps below are still useful for debugging individual stages but optional for green-path QA.

Tear down before the granular steps:

```bash
bash test/agentic/sandbox.sh down
```

---

## 2. Wallet fixture

Standalone — copy the template and edit it (testnet SRP only, never mainnet):

```bash
mkdir -p temp/runtime
cp test/agentic/wallet-fixture.example.json temp/runtime/wallet-fixture.json
$EDITOR temp/runtime/wallet-fixture.json   # replace password + srp
```

Farmslot slot — `.agent/wallet-fixture.json` is already present, skip this step.

Validate JSON shape:

```bash
jq '{password,srp_words: (.srp|split(" ")|length),name,settings}' temp/runtime/wallet-fixture.json
```

Expected: `password` non-empty, `srp_words` is `12` (or `15`/`18`/`21`/`24`), `settings` present.

---

## 3. Preflight

Standalone:

```bash
bash test/agentic/sandbox.sh preflight
```

Farmslot slot:

```bash
RUNTIME_DIR=.agent CDP_PORT=6663 SLOT_ID=mme-3 bash test/agentic/sandbox.sh preflight
```

Expected (last line):

```
=== Preflight OK ===
```

If you see `MISS:`, follow the printed remediation command and re-run.

---

## 4. Launch the sandbox

Standalone:

```bash
bash test/agentic/sandbox.sh up
```

Farmslot slot:

```bash
RUNTIME_DIR=.agent CDP_PORT=6663 SLOT_ID=mme-3 SESSION=mme-3 bash test/agentic/sandbox.sh up
```

Expected (last line; the port reflects whatever you exported in `CDP_PORT` or set in `test/agentic/.env`):

```
[ready] agentic (CDP:9222)        # standalone, first run
[ready] mme-3 (CDP:6663)          # farmslot slot
```

A Chromium window opens with MetaMask loaded. Idempotency check — re-run the same command:

```bash
bash test/agentic/sandbox.sh up
```

Expected: prints `[cleanup] Killing stale launcher.pid (...)` then re-launches cleanly on the same port.

CDP probe:

```bash
curl -s http://localhost:"$CDP_PORT"/json/version | jq '.Browser'
```

Expected: `"Chrome/<version>"`.

---

## 5. Per-stream logs

The launcher writes one log per stream so you can tail each independently (mirrors mobile's metro / simulator / wallet split):

```bash
tail -f .agent/launcher.log .agent/watcher.log .agent/extension-console.log .agent/sw-console.log
```

| File | Source |
|---|---|
| `launcher.log` | `sandbox.sh up` stdout + stderr (preflight + fixture + launch) |
| `watcher.log` | `yarn start` output (only when `sandbox.sh` auto-started it) |
| `extension-console.log` | `console.*` + `pageerror` from every extension page |
| `sw-console.log` | `console.*` from the extension service worker |

Truncate each on every `up` (a header `--- new run <iso-timestamp> ---` separates runs in the console logs).

---

## 6. Status check

```bash
npx tsx test/agentic/status.ts --cdp-port "$CDP_PORT"
```

Expected: `Connected`, extension ID printed, `Wallet: UNLOCKED` (after unlock completes), at least one extension page in `Targets`.

If wallet shows `LOCKED`, the unlock step in `launch-sandbox.js` didn't complete — check `[wallet]` lines in the launcher output.

---

## 7. Schema validation (one per domain)

```bash
node test/agentic/validate-flow-schema.js test/agentic/domains/browser-features/recipes/page-reload-smoke.json
node test/agentic/validate-flow-schema.js test/agentic/domains/extension-core/flows/unlock-wallet.json
node test/agentic/validate-flow-schema.js test/agentic/domains/perps/flows/navigate-to-market-detail.json
```

Each expected to end with:

```
All 1 scenario file(s) pass schema validation.
```

Note: several perps flows fail schema validation — pre-existing, not introduced by this change. Do not block QA on those.

---

## 8. Smoke recipe (live)

```bash
bash test/agentic/validate-recipe.sh \
  test/agentic/domains/browser-features/recipes/page-reload-smoke.json \
  --cdp-port "$CDP_PORT"
```

Expected (last line):

```
4/4 passed in <ms>ms
```

Always pass `--cdp-port` so the runner connects to the sandbox you launched (without it, the runner tries to launch its own session via the `mcp-server` codepath, which is owned by `test/e2e/playwright/llm-workflow/` — out of scope here).

---

## 9. Soft reload (after a code change)

Edit any UI file under `ui/` so webpack rebuilds, then:

```bash
node test/agentic/soft-refresh.js --cdp-port "$CDP_PORT"
```

Expected: extension service worker restarts; status check (step 4) still shows `UNLOCKED`.

---

## 10. Idempotent rerun + teardown

Re-run the smoke recipe right after step 6 — it must pass again without re-launching the sandbox:

```bash
bash test/agentic/validate-recipe.sh \
  test/agentic/domains/browser-features/recipes/page-reload-smoke.json \
  --cdp-port "$CDP_PORT"
```

Then tear down:

```bash
bash test/agentic/sandbox.sh down
```

Expected:

```
[down] killing launcher.pid (PID ...)
[down] killing browser.pid (PID ...)
[down] sandbox cleaned
```

Re-run `bash test/agentic/sandbox.sh down` — must be a no-op (no errors, prints `[down] sandbox cleaned`).

---

## 11. Multi-sandbox isolation

In one shell:

```bash
CDP_PORT=9222 SANDBOX_LABEL=alpha AGENT_DIR=/tmp/agentic-alpha \
  bash test/agentic/sandbox.sh up
```

In another:

```bash
CDP_PORT=9223 SANDBOX_LABEL=beta AGENT_DIR=/tmp/agentic-beta \
  bash test/agentic/sandbox.sh up
```

Expected: two Chromium windows, distinct titles (`alpha — ...`, `beta — ...`), independent profile dirs, independent CDP ports. Recipes can target either via `--cdp-port`.

Teardown both:

```bash
AGENT_DIR=/tmp/agentic-alpha bash test/agentic/sandbox.sh down
AGENT_DIR=/tmp/agentic-beta  bash test/agentic/sandbox.sh down
rm -rf /tmp/agentic-alpha /tmp/agentic-beta
```

---

## QA pass criteria

All of:

- [ ] Steps 0–11 each produce the expected output.
- [ ] Step 10 idempotency: `sandbox.sh down` is safe to re-run.
- [ ] Step 11 isolation: two parallel sandboxes coexist without port or profile collisions.
- [ ] No stale Chromium processes left after `sandbox.sh down` (`pgrep -fa chromium` shows none from your sandboxes).

If any check fails, capture the offending command + output and file as a follow-up — do not patch in this PR.
