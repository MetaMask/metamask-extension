# Getting Started — Agentic Recipes (Extension)

Run your first recipe end-to-end on a clean checkout. Target: ~10 minutes the first time, mostly the initial extension build. Tested on macOS Apple silicon.

## Prerequisites

- macOS or Linux, Node + Yarn (see `.tool-versions`)
- A test seed phrase (12 words). Smoke recipes (page reload, dapp interaction) need no funds. Trade recipes need a Hyperliquid testnet wallet — get one from `https://app.hyperliquid-testnet.xyz`
- Playwright's bundled Chromium (`yarn install` pulls it via the Playwright dependency)

## Setup

```bash
git clone https://github.com/MetaMask/metamask-extension.git
cd metamask-extension

# 1. Install + .metamaskrc
yarn install
cp .metamaskrc.dist .metamaskrc

# 2. Wallet fixture — testnet seed only, never mainnet
mkdir -p temp/runtime
node test/agentic/setup/bootstrap-fixture.cjs \
  --password 'devpass' \
  --srp 'word1 word2 word3 ... word12' \
  --out temp/runtime/wallet-fixture.json

# 3. Build watcher in one terminal — leave running
yarn start

# 4. In another terminal, preflight + launch the sandbox
bash test/agentic/preflight.sh
bash test/agentic/launch-sandbox.sh
```

When `launch-sandbox.sh` finishes you'll see `[ready] agentic (CDP:9222)`. A Chromium window stays open with MetaMask unlocked, isolated from your day-to-day Chrome profile.

## Run a recipe

```bash
# Smallest one — page reload smoke, ~5s
bash test/agentic/validate-recipe.sh \
  test/agentic/domains/browser-features/recipes/page-reload-smoke.json
```

Terminal prints PASS, artifacts land under `test/agentic/domains/artifacts/`.

## What to try next

| Recipe | What it shows |
|---|---|
| `domains/browser-features/recipes/page-reload-smoke.json` | navigate + reload + state assert, no wallet needed |
| `domains/extension-core/flows/unlock-wallet.json` | wallet unlock flow as a standalone scenario |
| `domains/perps/recipes/full-trade-lifecycle.json` | open → close position; needs HL testnet wallet |

## Troubleshooting

```bash
# Health check: CDP, current screen, account state
npx tsx test/agentic/status.ts

# Soft reload of the extension (after a code change)
node test/agentic/soft-refresh.js

# Tear down + relaunch fresh
bash test/agentic/stop-sandbox.sh && bash test/agentic/launch-sandbox.sh
```

Common issues:

- **`FAIL: No build at dist/chrome/manifest.json`** — `yarn start` not running yet. Start it and wait for the first compile.
- **`FAIL: extension not detected after 60s`** — Chromium launched but couldn't load the unpacked extension. Confirm `dist/chrome/manifest.json` exists; run `yarn a:stop` then `yarn a:launch`.
- **CDP port collision** — another Chromium owns 9222. Set `CDP_PORT=9223` or kill the other Chromium.

## Multi-worktree / parallel sandboxes

Every knob is an env var so the same script runs in N worktrees side-by-side. Each one needs a unique `CDP_PORT` and its own `AGENT_DIR` (defaults to `<worktree>/temp/runtime` so it's already isolated):

```bash
# Worktree A — default ports
bash test/agentic/launch-sandbox.sh

# Worktree B — separate Chromium + CDP
CDP_PORT=9223 SANDBOX_LABEL=feature-b bash test/agentic/launch-sandbox.sh
```

The `temp/runtime/` dir is gitignored, so each worktree carries its own profile, fixture state, and PIDs.

## How it works

See ADR #0058 (`https://github.com/MetaMask/decisions/pull/173`) for the recipe format and security boundary. The toolkit lives at `test/agentic/`. `setup/launch-sandbox.js` mirrors the farmslot per-slot launcher but is self-contained — no farmslot install required.
