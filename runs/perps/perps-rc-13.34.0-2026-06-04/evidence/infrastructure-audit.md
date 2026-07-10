# Infrastructure Audit — Perps RC Headless Run

Date: 2026-07-10  
Environment: Cursor Cloud Agent (Linux 6.12.94+)

## Automation Prerequisites Check

| Requirement | Status | Detail |
|---|---|---|
| `MetaMask/experimental-mm-qa-ai-tasks` repo | ❌ UNAVAILABLE | 404 from GitHub API; not accessible with automation token |
| `AGENTS.md` (task repo) | ❌ NOT READ | Source repo unavailable |
| `tasks/perps-rc/prompt.md` | ❌ NOT READ | Source repo unavailable |
| Node.js | ✅ v22.14.0 | Available |
| Yarn | ✅ 1.22.22 | Available |
| node_modules | ❌ NOT INSTALLED | `yarn install` not run in this environment |
| `mm` CLI | ❌ UNAVAILABLE | Depends on node_modules |
| Playwright Chromium | ❌ NOT VERIFIED | Depends on node_modules |
| HyperLiquid credentials | ❌ NOT INJECTED | No `HYPERLIQUID_PRIVATE_KEY` env var |
| Extension build (v13.40.0) | ✅ AVAILABLE | CloudFront URL retrieved from PR #44326 |
| git (correct branch) | ✅ `cursor/perps-rc-headless-automation-8afe` | |
| gh CLI auth | ✅ Authenticated | Read-only access to MetaMask repos |

## Slack Trigger

```
Channel: #mm-qa-legends (C08388MPZ9V)
ts:      1783677057.367089
Author:  @U02PQ1D6CFP
Text:    "Extension release v13.40.0 was cut, ready to test."
```

## Build Resolved

| Artifact | URL |
|---|---|
| Chrome test webpack | https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/29057484302/build-test-webpack/builds/metamask-chrome-13.40.0.zip |
| Resolved from | PR #44326 "Builds ready [823e0a0]" comment |

## Steps to Fully Provision This Automation

```bash
# 1. Add secrets in Cursor Cloud Agent Dashboard:
#    - HYPERLIQUID_PRIVATE_KEY (funded testnet account private key)
#    - HYPERLIQUID_API_KEY (if required by HyperLiquid REST API)

# 2. Grant automation service account access to:
#    - MetaMask/experimental-mm-qa-ai-tasks (private repo)

# 3. Pre-install deps in the VM (or add to setup):
cd /workspace && yarn install
cd /workspace && yarn playwright install chromium

# 4. Set correct parameter values (not placeholders):
#    METAMASK_EXTENSION_PATH=/workspace
#    AI_RC_TESTING_PATH=/path/to/experimental-ai-rc-testing (clone separately)

# 5. Download and extract test build:
curl -L <build-url> -o /tmp/metamask-chrome-13.40.0.zip
unzip /tmp/metamask-chrome-13.40.0.zip -d /tmp/metamask-ext/

# 6. Then run:
mm launch --extension-path /tmp/metamask-ext/chrome
mm knowledge-search "perps trading"
# ... execute test cases from prompt.md
mm cleanup
```
