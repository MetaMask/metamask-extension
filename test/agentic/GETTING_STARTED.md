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
cp test/agentic/wallet-fixture.example.json temp/runtime/wallet-fixture.json
$EDITOR temp/runtime/wallet-fixture.json   # set password + srp

# 3. Sandbox config — pick a unique CDP_PORT per worktree. Other knobs
#    (SANDBOX_LABEL, LAUNCH_MODE, RUNTIME_DIR, ...) live here too.
cp test/agentic/.env.example test/agentic/.env
$EDITOR test/agentic/.env

# 4. Boot the sandbox. If `yarn start` isn't already running it gets
#    started in the background; preflight waits for the build to land.
bash test/agentic/sandbox.sh up
```

When `sandbox.sh up` finishes you'll see `[ready] agentic (CDP:9222)`. A Chromium window stays open with MetaMask unlocked, isolated from your day-to-day Chrome profile.

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
bash test/agentic/sandbox.sh status

# Soft reload of the extension (after a code change)
bash test/agentic/sandbox.sh reload

# Tear down + relaunch fresh
bash test/agentic/sandbox.sh down && bash test/agentic/sandbox.sh up
```

Common issues:

- **`FAIL: No build at dist/chrome/manifest.json`** — `yarn start` not running yet. Start it and wait for the first compile.
- **`FAIL: extension not detected after 60s`** — Chromium launched but couldn't load the unpacked extension. Confirm `dist/chrome/manifest.json` exists; run `bash test/agentic/sandbox.sh down && bash test/agentic/sandbox.sh up`.
- **CDP port collision** — another Chromium owns 9222. Set `CDP_PORT=9223` or kill the other Chromium.

## Multi-worktree / parallel sandboxes

Each worktree has its own `test/agentic/.env` (gitignored), so configuration stays per-checkout. Pick a unique `CDP_PORT` per worktree to avoid collisions — the launcher warns when the default `9222` is used.

```bash
# Worktree A — set once in test/agentic/.env: CDP_PORT=9222, SANDBOX_LABEL=feature-a
bash test/agentic/sandbox.sh up

# Worktree B — its own test/agentic/.env: CDP_PORT=9223, SANDBOX_LABEL=feature-b
bash test/agentic/sandbox.sh up
```

The `temp/runtime/` dir is gitignored, so each worktree carries its own profile, fixture state, and PIDs. Real shell env vars still override the file (`CDP_PORT=9999 bash test/agentic/sandbox.sh up`), so you can experiment without editing `.env`.

## How it works

See ADR #0058 (`https://github.com/MetaMask/decisions/pull/173`) for the recipe format and security boundary. The toolkit lives at `test/agentic/`.
