---
name: metamask-visual-testing
description: Launch and test MetaMask Chrome extension with Playwright in headless sidepanel mode. Use for visual validation of UI changes, testing onboarding/unlock flows, confirmations, and capturing screenshots.
compatibility: opencode
metadata:
  location: test/e2e/playwright/llm-workflow/
  type: browser-testing
---

# MetaMask Visual Testing — Agent Skill

## When to Use This Skill

Use this skill when you need to:

- Visually validate MetaMask UI changes
- Test extension behavior in a real browser
- Verify onboarding, unlock, or transaction flows
- Capture screenshots for validation
- Debug UI state issues

## CRITICAL: Always Start with Knowledge Search

**Before launching a browser or interacting with any UI, you MUST run:**

```bash
mm knowledge-search "<flow>"    # e.g. "send", "unlock", "connect", "swap", "onboarding"
mm knowledge-sessions           # List recent sessions with discovered steps
```

This is the single most important step. Prior sessions contain exact step sequences, testId targets, and timing that eliminate trial-and-error. See [Core Workflow → Step 0](#0-reuse-existing-knowledge-mandatory--do-not-skip) for full details.

## Prerequisites

**CLI invocation**: The `mm` CLI is a project-local dependency. Use one of:

```bash
npx mm <command>          # Works in any project that has it installed
yarn mm <command>         # If using Yarn
./node_modules/.bin/mm <command>  # Direct path
```

All examples in this skill use `mm` for brevity — prefix with `npx` or `yarn` as needed.

**Validate that there's an Extension build** (required before `mm launch` will work):

Extension build is in the `dist/chrome/` folder.

- If there is NO build, then proceed and build the Extension
- If there is a build, then:
  - if the user has asked to build, proceed with rebuilding the Extension
  - if the user has asked to NOT build, proceed WITHOUT building and re-use the existing build
  - if the user was not explicit about it, ASK the user how they want to proceed — use existing build or rebuild the Extension

**Build the extension** (required before any CLI command will work):

```bash
yarn install      # Install dependencies (first time only)
yarn build:test   # Build extension to dist/chrome/
```

You only need to rebuild after source code changes. `mm launch` validates the
build exists and returns a clear error with the exact command if it's missing.

If ports are in use from previous runs:

```bash
lsof -ti:8545,12345,8000 | xargs kill -9
```

## CLI Commands Overview

The `mm` CLI is the primary interface. It automatically manages a background HTTP daemon.

### Lifecycle

| Command                 | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `mm launch`             | Launch MetaMask in headed Chrome (starts daemon) |
| `mm cleanup`            | Stop browser and all services                    |
| `mm cleanup --shutdown` | Stop browser, services, and the daemon           |
| `mm status`             | Show current daemon and session status           |

### Interaction

| Command                      | Description                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `mm click <ref>`             | Click element by a11y ref, testId, or selector (supports `--within` scoping) |
| `mm type <ref> <text>`       | Type text into element (clears field first, uses Playwright `fill()`)        |
| `mm get-text <ref>`          | Read text content of element (supports `--within` scoping)                   |
| `mm describe-screen`         | Combined state + activeTab + testIds + a11y snapshot                         |
| `mm screenshot [--name <n>]` | Take and save screenshot                                                     |
| `mm wait-for <ref>`          | Wait for element to be visible (supports `--within` scoping)                 |
| `mm wait-for-notification`   | Wait for sidepanel confirmation route, set as active                         |
| `mm accessibility-snapshot`  | Get trimmed a11y tree with refs (e1, e2...)                                  |
| `mm list-testids`            | List visible `data-testid` attributes                                        |
| `mm clipboard <action>`      | Read from or write to browser clipboard                                      |

### Navigation & Tabs

| Command                   | Description                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `mm navigate <url>`       | Navigate to a specific URL                                             |
| `mm navigate-home`        | Navigate to the extension home                                         |
| `mm navigate-settings`    | Navigate to the extension settings                                     |
| `mm switch-to-tab <role>` | Switch active page to a different tab by role (positional or `--role`) |
| `mm close-tab <role>`     | Close a tab (notification, dapp, or other)                             |

### Context

| Command                      | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `mm get-context`             | Get current context and available capabilities |
| `mm set-context <e2e\|prod>` | Switch workflow context (e2e or prod)          |

### State & Knowledge

| Command                       | Description                                     |
| ----------------------------- | ----------------------------------------------- |
| `mm get-state`                | Get current extension state (includes tab info) |
| `mm knowledge-search <query>` | Search steps across sessions                    |
| `mm knowledge-last`           | Get last N step records from this session       |
| `mm knowledge-sessions`       | List recent sessions with metadata              |
| `mm knowledge-summarize`      | Generate session recipe                         |
| `mm run-steps <json>`         | Execute multiple tools in sequence              |

### Contract Seeding

| Command                   | Description                             |
| ------------------------- | --------------------------------------- |
| `mm seed-contract <type>` | Deploy a test contract (ERC-20, NFT...) |
| `mm seed-contracts`       | Deploy multiple test contracts          |
| `mm get-contract-address` | Get deployed contract address           |
| `mm list-contracts`       | List all deployed contracts             |

## Daemon Model

- **Auto-start**: `mm launch` starts the daemon if not running.
- **Worktree Isolation**: Each worktree has its own daemon, tracked in `.mm-server`.
- **Idle Timeout**: Daemon shuts down after 30 minutes of inactivity.
- **Logs**: Activity logged to `.mm-daemon.log`.

## Launch Modes & Fixtures

### Default: Pre-Onboarded Wallet

Wallet is pre-configured with 25 ETH on local Anvil.

```bash
mm launch                   # or explicitly:
mm launch --state default
mm launch --context prod    # launch directly in prod context (no separate set-context needed)
```

### Onboarding: Fresh Wallet

Start with a brand new wallet that requires onboarding.

```bash
mm launch --state onboarding
```

### Custom Fixture

Use a preset fixture or provide custom wallet state.

```bash
mm launch --state custom --preset withMultipleAccounts
```

### Available Presets

| Preset                 | Description                       |
| ---------------------- | --------------------------------- |
| `withMultipleAccounts` | Wallet with 2 accounts            |
| `withERC20Tokens`      | Wallet with test ERC-20 tokens    |
| `withConnectedDapp`    | Wallet pre-connected to test dapp |
| `withPopularNetworks`  | Popular L2 networks added         |
| `withMainnet`          | Switched to Ethereum Mainnet      |
| `withNFTs`             | Wallet with test NFTs             |
| `withFiatDisabled`     | Fiat conversion display disabled  |
| `withHSTToken`         | Wallet with HST token             |

## Context Switching (e2e vs prod)

The system supports two execution contexts with different capabilities.

### Available Contexts

| Context | Description                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| `e2e`   | **Default.** Local Anvil blockchain, pre-onboarded wallet, fixtures, seeding |
| `prod`  | Production-like mode. No fixtures, no local chain, limited capabilities      |

### E2E Context Capabilities (Default)

- `fixture` — Wallet state management with presets
- `chain` — Local Anvil blockchain (port 8545)
- `contractSeeding` — Deploy test contracts (ERC-20, NFTs, etc.)
- `stateSnapshot` — Extension state detection
- `mockServer` — Mock API responses (opt-in)

### Prod Context Capabilities

- `stateSnapshot` — Extension state detection only

### Switching Contexts

**Check current context:**

```bash
mm get-context
```

**Switch to prod context:**

```bash
mm set-context prod
```

**Switch back to e2e:**

```bash
mm set-context e2e
```

### Context Switching Rules

1. **Cannot switch during active session** — You must call `mm cleanup` first (or use `--context` on `mm launch` which sets context before launching)
2. **Default context is e2e** — On daemon startup, context is always e2e
3. **Context persists** — Once switched, context remains until changed or daemon restarts
4. **Inline context on launch** — `mm launch --context prod` sets context and launches in one step, no separate `mm set-context` needed

### Example: Testing in Different Contexts

```bash
# Start in e2e (default)
mm get-context                                # Verify e2e context
mm launch --state default                     # Launch with fixtures
mm describe-screen
mm cleanup                                    # End session

# Switch to prod (option A: inline --context flag)
mm launch --context prod --state onboarding   # Sets context + launches in one step
mm describe-screen
mm cleanup

# Switch to prod (option B: separate set-context)
mm set-context prod                           # Switch context
mm get-context                                # Verify prod context
mm launch --state onboarding                  # No fixtures in prod
mm describe-screen
mm cleanup

# Switch back to e2e
mm set-context e2e
```

## Sidepanel Mode (Default)

The extension runs in **headless mode by default**, using Chrome's side panel (`sidepanel.html`) instead of the traditional popup (`notification.html`). No configuration needed.

### Sidepanel vs Popup: Key Differences

| Behavior             | Sidepanel (headless, default)                             | Popup (legacy)                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------ |
| **Confirmation UI**  | Renders inside `sidepanel.html`                           | Opens separate `notification.html`   |
| **After confirming** | Sidepanel stays open, navigates back to home route        | Popup auto-closes                    |
| **After rejecting**  | Sidepanel stays open, navigates back to home route        | Popup auto-closes                    |
| **Page lifecycle**   | Single persistent page, URL hash changes between routes   | New page opens, closes on completion |
| **Route detection**  | Checks URL hash against known confirmation route prefixes | Waits for `notification.html` event  |

### What This Means for Testing

1. **No tab closing after confirmation**: After clicking confirm/reject, the sidepanel navigates back to the home route. You do NOT need to switch tabs — just continue interacting with the sidepanel page.

2. **`mm wait-for-notification` behavior**: Opens or finds the `sidepanel.html` page and waits for a confirmation route in its URL hash. It does NOT wait for a new popup window.

3. **Post-confirmation state**: After a confirmation action, use `mm describe-screen` to verify the extension returned to the home screen. The sidepanel page remains active.

4. **Confirmation routes detected**:
   - `/connect`
   - `/confirm-transaction`
   - `/confirmation`
   - `/confirm-import-token`
   - `/confirm-add-suggested-token`
   - `/confirm-add-suggested-nft`

## Core Workflow

### 0. Reuse Existing Knowledge (MANDATORY — DO NOT SKIP)

**STOP. Before `mm launch` or any interaction, you MUST query prior knowledge first.**

Skipping this step wastes tokens rediscovering flows that are already recorded. Prior sessions contain exact step sequences, testId targets, and timing that eliminate trial-and-error.

```bash
# ALWAYS run BOTH of these before starting any flow:
mm knowledge-search "<flow name>"   # e.g. "send flow", "unlock", "connect dapp", "swap"
mm knowledge-sessions               # List recent sessions with metadata
```

**If knowledge exists:** Use the discovered steps directly (via `mm run-steps` for known sequences).
**If no knowledge exists:** Proceed with discovery (`mm describe-screen`) — your steps will be recorded for future sessions.

**This is not optional.** Agents that skip this step will repeat work that has already been done.

### 1. Build Extension (prerequisite — run outside mm CLI)

```bash
yarn build:test
```

Skip if already built. `mm launch` validates the build and returns an
actionable error if it's missing.

### 2. Launch Extension

```bash
mm launch
mm launch --state default          # Pre-onboarded with 25 ETH
mm launch --state onboarding       # Fresh wallet requiring onboarding
mm launch --context prod --state onboarding  # Prod context + onboarding in one command
mm launch --state custom --preset withMultipleAccounts
```

### 3. Describe Current Screen

```bash
mm describe-screen
```

Returns combined state information:

- Current screen (home, unlock, onboarding-\*, settings, unknown)
- Active tab info (`role` and `url` of the currently active page)
- Visible testIds
- Accessibility tree with refs (e1, e2, ...) — includes actionable roles (`button`, `link`, `checkbox`, `radio`, `switch`, `textbox`, `combobox`, `menuitem`), structural roles (`menu`, `listbox`, `option`, `tab`, `tabpanel`, `list`, `listitem`), and important roles (`dialog`, `alert`, `status`, `heading`)

A11y nodes with short or generic names are enriched with `testId` (from `data-testid`) and `textContent` (visible text) to help identify ambiguous elements. When 3+ consecutive identical nodes appear, they are collapsed into a summary like `… 3 more "maskicon" (refs e2–e4)` to reduce token waste — individual refs still work for targeting.

### 4. Interact with UI

Interaction commands (`mm click`, `mm type`, `mm wait-for`) support **three targeting methods**. Use exactly ONE per call.

#### By a11yRef (from accessibility snapshot)

Refs like `e1`, `e2`, etc. come from `mm describe-screen` or `mm accessibility-snapshot`. These are the most common targets during discovery.

```bash
mm click e5
mm type e2 "correct horse battery staple"
mm wait-for e3 --timeout 10000
```

**Note**: `mm type` uses Playwright's `fill()` — it **clears the field** then sets the value. No `clearFirst` flag needed.

**Note**: a11yRefs are ephemeral — they refresh on every `mm describe-screen` or `mm accessibility-snapshot` call. After major navigation, always re-describe before using refs.

#### Scoped targeting with `--within`

Use `--within` to scope a target inside a parent element. This is essential when multiple elements share the same testId or a11y name and you need to target one inside a specific container.

```bash
mm click --testid end-accessory --within "testid:account-list-item/0"
mm click e3 --within "testid:dialog-container"
mm wait-for --testid confirm-btn --within "selector:.modal-content"
```

The `--within` value accepts the same formats as the target: a bare a11y ref (`e5`), `testid:<id>`, or `selector:<css>`.

#### By testId (data-testid attribute)

Use `data-testid` values from `mm list-testids` or `mm describe-screen`. These are stable and preferred for known, deterministic flows and batching.

```bash
mm click --testid unlock-submit
mm type --testid unlock-password "correct horse battery staple"
mm wait-for --testid account-menu-icon --timeout 10000
mm get-text --testid balance-display
```

#### By CSS selector

Use Playwright-compatible selectors for elements that lack testIds or a11y refs. The `--selector` value is passed directly to Playwright's `page.locator()`.

**Supported selector engines:**

| Engine | Syntax                 | Example                                                         |
| ------ | ---------------------- | --------------------------------------------------------------- |
| CSS    | Standard CSS selectors | `button.primary`, `[data-testid="foo"]`, `input[name='amount']` |
| Text   | `text=` prefix         | `text=Rename`, `text=Confirm`                                   |
| Role   | `role=` prefix         | `role=button[name="Submit"]`                                    |

**Not supported:** `:text()` pseudo-class (e.g. `button:text('Rename')`) — this is not valid CSS or Playwright syntax. Use `text=Rename` instead.

```bash
mm click --selector "button.primary"
mm click --selector "text=Rename"
mm click --selector "role=button[name='Submit']"
mm type --selector "input[name='amount']" "0.1"
mm wait-for --selector ".transaction-list-item" --timeout 10000
mm get-text --selector ".balance-value"
```

#### Which Targeting Method to Use

| Method       | Best For                                   | Stability |
| ------------ | ------------------------------------------ | --------- |
| **a11yRef**  | Discovery, exploration, first-time flows   | Ephemeral |
| **testId**   | Known flows, batching, deterministic steps | Stable    |
| **selector** | Fallback when no testId or a11y ref exists | Fragile   |

#### Reading Element Text

Use `mm get-text` to read the visible text content of any element. Supports the same targeting methods and `--within` scoping as other interaction commands.

```bash
mm get-text e5                                          # By a11y ref
mm get-text --testid balance-display                    # By testId
mm get-text --selector ".tx-amount"                     # By CSS selector
mm get-text --testid amount --within "testid:tx-row"    # Scoped within parent
```

Returns `{ text, target, length }`. Useful for asserting values, reading balances, or verifying text after actions.

**Recommendation**: Start with `a11yRef` during discovery (`mm describe-screen`), then switch to `testId` for batched/repeated flows (`mm run-steps`).

### 5. Take Screenshots

```bash
mm screenshot --name "after-unlock"
```

### 6. Handle Confirmations (Dapp Flows)

When a dapp triggers a confirmation (connect, sign, send):

```bash
mm navigate https://test-dapp.io          # Open dapp in new tab, set as active
mm click e1                                # Click Connect button in dapp
mm wait-for-notification                   # Active page = sidepanel (confirmation route)
mm describe-screen                         # See confirmation elements
mm click e2                                # Confirm action
mm describe-screen                         # Sidepanel navigates back to home (activeTab shows role/url)
mm switch-to-tab dapp                      # Switch back to dapp (positional role)
mm describe-screen                         # Verify connected state in dapp
```

**Important**: After clicking confirm or reject, the sidepanel does NOT close. It stays open and navigates back to the home route. Use `mm describe-screen` to verify (check `activeTab` for current role/url), then `mm switch-to-tab dapp` to return to the dapp.

**Note**: `mm switch-to-tab` accepts a positional role argument: `mm switch-to-tab dapp` is equivalent to `mm switch-to-tab --role dapp`.

**Tab roles**: `extension` (home), `notification` (sidepanel), `dapp` (external sites), `other`

### 7. Navigate

```bash
mm navigate-home
mm navigate-settings
mm navigate https://test-dapp.io
```

### 8. Cleanup (Always Required)

```bash
mm cleanup                     # Stop browser and services
mm cleanup --shutdown          # Also stop the daemon
```

## Typical Workflow Example

```bash
# 0. MANDATORY: Check prior knowledge FIRST
mm knowledge-search "unlock"
mm knowledge-sessions

# 1. Build (if needed)
yarn build:test

# 2. Launch
mm launch

# 3. Observe
mm describe-screen

# 4. Interact (using refs from describe-screen)
mm type e1 "correct horse battery staple"
mm click e2

# 5. Verify
mm describe-screen
mm screenshot --name "home-validated"

# 6. Cleanup
mm cleanup
```

## Batching with mm run-steps

Use `mm run-steps` to execute multiple commands in a single call when you **already know** the exact sequence. This reduces round-trips and is ideal for known, deterministic flows.

### When to Use Batching

| Use `mm run-steps`                      | Use Individual Commands                     |
| --------------------------------------- | ------------------------------------------- |
| Known flows from prior knowledge        | First-time exploration                      |
| Deterministic sequences (wizard steps)  | Decisions based on intermediate state       |
| Repetitive patterns (fill form, submit) | Debugging or investigating issues           |
| Replaying a successful flow             | When you need to inspect each step's result |

### Example: Batched Unlock Flow

**IMPORTANT**: `mm run-steps` expects a JSON **object** with a `steps` key, NOT a bare array.

**Targeting in run-steps**: Use `a11yRef`, `testId`, or `selector` as the arg key (not `ref`). The shorthand `ref` is also accepted and auto-mapped to `a11yRef`. Use `within` in args to scope targets within a parent element.

**Batch timeout**: Add `"batchTimeoutMs": 30000` to set an overall deadline. If exceeded, remaining steps are marked as skipped (`MM_BATCH_TIMEOUT`) and partial results are returned — no more silent HTTP timeouts with zero diagnostic info. The summary includes a `skipped` count alongside `succeeded` and `failed`.

**Tool aliases**: Steps accept shorthand tool names: `navigate_home` / `navigate-home`, `navigate_settings` / `navigate-settings`, and `navigate_notification` / `navigate-notification` resolve to `navigate` with the appropriate `screen` argument.

```bash
mm run-steps '{"steps":[
  { "tool": "type", "args": { "testId": "unlock-password", "text": "correct horse battery staple" } },
  { "tool": "click", "args": { "testId": "unlock-submit" } },
  { "tool": "wait_for", "args": { "testId": "account-menu-icon", "timeoutMs": 10000 } },
  { "tool": "get_text", "args": { "testId": "account-balance", "within": { "testId": "account-overview" } } }
]}'

# Using a11yRef (from describe-screen):
mm run-steps '{"steps":[
  { "tool": "type", "args": { "a11yRef": "e1", "text": "correct horse battery staple" } },
  { "tool": "click", "args": { "a11yRef": "e2" } }
]}'
```

### Pattern: Discover First, Then Batch

1. Use `mm describe-screen` to discover available elements
2. Use `mm knowledge-search` to find prior successful sequences
3. Use `mm run-steps` to execute the known sequence efficiently
4. Use `mm describe-screen` again to verify the end state

## Common Workflows

### Unlock Wallet

```bash
mm launch
mm describe-screen
mm type e1 "correct horse battery staple"    # e1 = password field
mm click e2                                   # e2 = unlock button
mm describe-screen                            # verify home screen
```

### Connect to Dapp

```bash
mm navigate https://test-dapp.io
mm click e1                                   # Connect button in dapp
mm wait-for-notification                      # Wait for confirmation in sidepanel
mm describe-screen                            # See connect prompt
mm click e2                                   # Confirm connection
mm describe-screen                            # Verify sidepanel returned to home (check activeTab)
mm switch-to-tab dapp                         # Switch back to dapp (positional role)
mm describe-screen                            # Verify connected state
```

### Onboarding Flow

```bash
mm launch --state onboarding
mm describe-screen                            # See onboarding screen
# Follow the onboarding steps using refs from describe-screen
```

## Capabilities

- **Anvil**: Local blockchain running on port 8545
- **Fixture Server**: Manages wallet state on port 12345
- **Contract Seeding**: Deploy test contracts via `mm seed-contract`
- **Mock Server**: Mock external API responses (opt-in)

## Error Recovery

### On Failure

1. Call `mm describe-screen` to see current state
2. Check the screen value:
   - `unlock` → Type password and click submit
   - `home` → Already ready, check for modals
   - `onboarding-*` → Complete onboarding flow
   - `unknown` → Take screenshot, investigate
3. If still stuck, query prior runs:

```bash
mm knowledge-search "send"
mm knowledge-sessions
mm knowledge-last
```

4. Use `mm screenshot --name "debug"` for visual diagnosis

### Error Codes

| Code                         | Meaning                                     |
| ---------------------------- | ------------------------------------------- |
| `MM_SESSION_ALREADY_RUNNING` | Session exists, call `mm cleanup` first     |
| `MM_NO_ACTIVE_SESSION`       | No session, call `mm launch` first          |
| `MM_LAUNCH_FAILED`           | Browser launch failed                       |
| `MM_INVALID_INPUT`           | Invalid parameters                          |
| `MM_TARGET_NOT_FOUND`        | Element not found                           |
| `MM_TAB_NOT_FOUND`           | Tab not found (for switch/close)            |
| `MM_CLICK_FAILED`            | Click operation failed                      |
| `MM_TYPE_FAILED`             | Type operation failed                       |
| `MM_WAIT_TIMEOUT`            | Wait timeout exceeded                       |
| `MM_SCREENSHOT_FAILED`       | Screenshot capture failed                   |
| `MM_BATCH_TIMEOUT`           | `batchTimeoutMs` deadline exceeded          |
| `MM_CONTEXT_SWITCH_BLOCKED`  | Cannot switch context during active session |
| `MM_SET_CONTEXT_FAILED`      | Context switch failed                       |

## Default Credentials

| Property | Value                          |
| -------- | ------------------------------ |
| Password | `correct horse battery staple` |
| Chain ID | `1337`                         |
| Balance  | 25 ETH                         |

## Common Failures & Solutions

| Symptom                       | Likely Cause                    | Solution                                     |
| ----------------------------- | ------------------------------- | -------------------------------------------- |
| `MM_SESSION_ALREADY_RUNNING`  | Previous session not cleaned    | Call `mm cleanup` first                      |
| `MM_NO_ACTIVE_SESSION`        | No browser running              | Call `mm launch` first                       |
| Extension not loading         | Extension not built             | Run `yarn build:test` then retry `mm launch` |
| `EADDRINUSE` port error       | Orphan processes                | `lsof -ti:8545,12345,8000 \| xargs kill -9`  |
| `MM_TARGET_NOT_FOUND`         | Element not visible             | Use `mm describe-screen` to check state      |
| `MM_WAIT_TIMEOUT`             | Slow environment or UI delay    | Increase timeout, check screenshot           |
| `MM_CONTEXT_SWITCH_BLOCKED`   | Switching during active session | Call `mm cleanup` before `mm set-context`    |
| Fixtures not available        | Running in prod context         | Switch to e2e: `mm set-context e2e`          |
| Stale a11yRefs after navigate | Refs not refreshed              | Call `mm describe-screen` to get fresh refs  |

## Visual Testing Decision Rules

When performing visual validation:

1. **Before action**: `mm screenshot --name "before-X"`
2. **Perform action**: `mm click` / `mm type` using refs from `mm describe-screen`
3. **After action**: `mm describe-screen` to verify state
4. **Capture result**: `mm screenshot --name "after-X"`
5. **On failure**: Check `mm knowledge-last` and screenshot for diagnosis

## Key Files

| File                                                     | Purpose                                        |
| -------------------------------------------------------- | ---------------------------------------------- |
| `test/e2e/playwright/llm-workflow/README.md`             | Canonical operator runbook (source of truth)   |
| `test/e2e/playwright/llm-workflow/daemon.ts`             | Daemon entry point                             |
| `test/e2e/playwright/llm-workflow/extension-launcher.ts` | Core launcher class                            |
| `test/e2e/playwright/llm-workflow/fixture-helper.ts`     | Fixture presets and builder                    |
| `test/e2e/playwright/llm-workflow/metamask-provider.ts`  | Session manager (browser, pages, capabilities) |
| `test/e2e/playwright/llm-workflow/capabilities/`         | MetaMask-specific capabilities                 |
