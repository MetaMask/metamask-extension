---
name: metamask-visual-testing
description: Drives the MetaMask Chrome extension via the mm CLI for visual testing in headed Chrome with MetaMask running in sidepanel mode. Use when asked to visually verify UI changes, capture screenshots, click through onboarding, unlock, send, swap, connect, or confirmation flows, test dapp interactions, or debug extension UI state. Trigger phrases include "verify visually", "take a screenshot", "test the flow", "check the UI", and "click through onboarding".
compatibility: opencode
metadata:
  location: test/e2e/playwright/llm-workflow/
  type: browser-testing
---

# MetaMask Visual Testing — Agent Skill

## When to Use This Skill

Use this skill when you need to:

- Visually validate MetaMask UI changes in a real browser
- Capture screenshots as evidence
- Verify onboarding, unlock, transaction, swap, or dapp-confirmation flows
- Click through extension behavior instead of reasoning from code alone
- Debug unexpected UI state in the extension or sidepanel

For architecture and developer-facing implementation details, see `test/e2e/playwright/llm-workflow/README.md`.

## Prerequisites

**CLI invocation**: The `mm` CLI is a project-local dependency. Use one of:

```bash
npx mm <command>
yarn mm <command>
./node_modules/.bin/mm <command>
```

All examples in this skill use `mm` for brevity.

**Validate that there is an extension build** before `mm launch`:

- Build output is in `dist/chrome/`
- If there is no build, build the extension
- If there is a build and the user explicitly asked to rebuild, rebuild it
- If there is a build and the user explicitly asked not to rebuild, reuse it
- If reuse vs rebuild affects the task and the user was explicit, follow that instruction

**Build command**:

```bash
yarn install
yarn build:test:webpack
```

`mm launch` validates the build and returns an actionable error if it is missing.

If ports are stuck from a previous run, do not assume fixed port numbers. The current daemon and sub-service ports are persisted in the worktree-local `.mm-server` file:

```bash
cat .mm-server
```

Look under `subPorts` for the active `anvil`, `fixture`, and `mock` ports, then target those specific ports if you need to clean up orphan processes.

## Gotchas

- `a11yRef`s (`e1`, `e2`, ...) are **ephemeral**. After `mm describe-screen`, `mm accessibility-snapshot`, or major navigation, re-describe before reusing refs.
- `mm type` uses Playwright `fill()` and **clears the field first**.
- After confirm or reject in sidepanel mode, the page does **not** close. It stays open and navigates back to the home route.
- `mm wait-for-notification` waits for the sidepanel confirmation route. It does **not** wait for a legacy popup window.
- `mm run-steps` expects a JSON **object** with a `steps` key, not a bare array.
- In `mm run-steps`, prefer `a11yRef`, `testId`, or `selector` in args. `ref` is accepted as shorthand, but explicit keys are clearer.
- You cannot switch context during an active session. Run `mm cleanup` first, or use `mm launch --context ...`.
- The default password for built-in fixtures is `correct horse battery staple`.

## CLI Commands Overview

The `mm` CLI is the primary interface.

### Lifecycle

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `mm launch`             | Launch MetaMask in headed Chrome       |
| `mm cleanup`            | Stop browser and services              |
| `mm cleanup --shutdown` | Stop browser, services, and the daemon |
| `mm status`             | Show current daemon and session status |

### Interaction

| Command                      | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `mm click <ref>`             | Click element by a11y ref, testId, or selector       |
| `mm type <ref> <text>`       | Type text into element                               |
| `mm get-text <ref>`          | Read text content of element                         |
| `mm describe-screen`         | Combined state + activeTab + testIds + a11y snapshot |
| `mm screenshot [--name <n>]` | Take and save screenshot                             |
| `mm wait-for <ref>`          | Wait for element to be visible                       |
| `mm wait-for-notification`   | Wait for sidepanel confirmation route, set as active |
| `mm accessibility-snapshot`  | Get trimmed a11y tree with refs                      |
| `mm list-testids`            | List visible `data-testid` attributes                |
| `mm clipboard <action>`      | Read from or write to browser clipboard              |

### Navigation & Tabs

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `mm navigate <url>`       | Navigate to a specific URL                    |
| `mm navigate-home`        | Navigate to the extension home                |
| `mm navigate-settings`    | Navigate to the extension settings            |
| `mm switch-to-tab <role>` | Switch active page to a different tab by role |
| `mm close-tab <role>`     | Close a tab                                   |

### Context

| Command                      | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `mm get-context`             | Get current context and available capabilities |
| `mm set-context <e2e\|prod>` | Switch workflow context                        |

### State, Knowledge, and Seeding

| Command                       | Description                               |
| ----------------------------- | ----------------------------------------- |
| `mm get-state`                | Get current extension state               |
| `mm knowledge-search <query>` | Search steps across sessions              |
| `mm knowledge-last`           | Get last N step records from this session |
| `mm knowledge-sessions`       | List recent sessions with metadata        |
| `mm knowledge-summarize`      | Generate session recipe                   |
| `mm run-steps <json>`         | Execute multiple tools in sequence        |
| `mm seed-contract <type>`     | Deploy a test contract                    |
| `mm seed-contracts`           | Deploy multiple test contracts            |
| `mm get-contract-address`     | Get deployed contract address             |
| `mm list-contracts`           | List all deployed contracts               |

## Launch Modes & Fixtures

### Default: Pre-Onboarded Wallet

Wallet is pre-configured with 25 ETH on local Anvil.

```bash
mm launch
mm launch --state default
mm launch --context prod
```

### Onboarding: Fresh Wallet

```bash
mm launch --state onboarding
```

### Custom Fixture

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

Two execution contexts are supported:

| Context | Description                                                              |
| ------- | ------------------------------------------------------------------------ |
| `e2e`   | Default. Local Anvil blockchain, pre-onboarded wallet, fixtures, seeding |
| `prod`  | Production-like mode. No fixtures, no local chain, limited capabilities  |

Use:

```bash
mm get-context
mm set-context prod
mm set-context e2e
```

Rules:

1. Cannot switch during an active session — run `mm cleanup` first
2. Default context is `e2e`
3. Context persists until changed or daemon restart
4. `mm launch --context prod` sets context and launches in one step

## Sidepanel Mode (Default)

The extension runs in **headless browser mode** by default, using `sidepanel.html` instead of the legacy popup.

What matters operationally:

1. After confirm or reject, the sidepanel stays open and navigates back to home
2. `mm wait-for-notification` waits for a confirmation route in the sidepanel URL hash
3. After a confirmation action, use `mm describe-screen` to verify the return to home state
4. Known confirmation routes include:
   - `/connect`
   - `/confirm-transaction`
   - `/confirmation`
   - `/confirm-import-token`
   - `/confirm-add-suggested-token`
   - `/confirm-add-suggested-nft`

## Core Workflow

### 1. Build Extension

```bash
yarn build:test:webpack
```

Skip if already built and reuse is acceptable for the task.

### 2. Launch Extension

```bash
mm launch
mm launch --state default
mm launch --state onboarding
mm launch --context prod --state onboarding
mm launch --state custom --preset withMultipleAccounts
```

### 3. Reuse Existing Knowledge (Mandatory)

Before interacting, query prior knowledge:

```bash
mm knowledge-search "<flow name>"
mm knowledge-sessions
```

If knowledge exists, reuse the discovered sequence. If not, proceed with discovery and let this session record the new steps.

### 4. Describe Current Screen

```bash
mm describe-screen
```

This returns the current screen, active tab info, visible testIds, and an accessibility tree with refs.

**Observation efficiency:**

- Mutating actions like `click`, `type`, and `navigate` return compact observations
- After the first mutation, later mutations return diff-based observations until `mm describe-screen` resets the baseline
- Use mutation responses for quick next-step targeting when they already contain the needed refs
- Call `mm describe-screen` when you need the full a11y tree, screenshots, or priorKnowledge

### 5. Interact with UI

Use exactly one targeting method per call.

#### By a11yRef

Use refs from `mm describe-screen` or `mm accessibility-snapshot` during discovery.

```bash
mm click e5
mm type e2 "correct horse battery staple"
mm wait-for e3 --timeout 10000
```

#### Scoped targeting with `--within`

Use `--within` when duplicate names or testIds exist and you need to target inside a specific container.

```bash
mm click --testid end-accessory --within "testid:account-list-item/0"
mm click e3 --within "testid:dialog-container"
mm wait-for --testid confirm-btn --within "selector:.modal-content"
```

The `--within` value accepts an a11y ref, `testid:<id>`, or `selector:<css>`.

#### By testId

Prefer `testId` for stable, known flows and batching.

```bash
mm click --testid unlock-submit
mm type --testid unlock-password "correct horse battery staple"
mm wait-for --testid account-menu-icon --timeout 10000
mm get-text --testid balance-display
```

#### By CSS selector

Use selectors as a fallback when testIds or a11y refs are unavailable.

Supported forms:

- CSS: `button.primary`
- Text: `text=Rename`
- Role: `role=button[name='Submit']`

Do not use the unsupported `:text()` pseudo-class.

```bash
mm click --selector "button.primary"
mm click --selector "text=Rename"
mm click --selector "role=button[name='Submit']"
mm type --selector "input[name='amount']" "0.1"
mm wait-for --selector ".transaction-list-item" --timeout 10000
mm get-text --selector ".balance-value"
```

#### Reading Element Text

```bash
mm get-text e5
mm get-text --testid balance-display
mm get-text --selector ".tx-amount"
mm get-text --testid amount --within "testid:tx-row"
```

Start with a11y refs during discovery, then prefer testIds once the flow is known.

### 6. Verify-Fix Loop

After any interaction sequence:

1. Run `mm describe-screen` to verify the expected state
2. If the state is wrong:
   - capture `mm screenshot --name "debug-<action>"`
   - check `mm knowledge-search "<flow>"`
   - retry the failed step or adjust targeting
3. Only continue when the expected screen or state is confirmed

### 7. Handle Confirmations (Dapp Flows)

```bash
mm navigate https://test-dapp.io
mm click e1
mm wait-for-notification
mm describe-screen
mm click e2
mm describe-screen
mm switch-to-tab dapp
mm describe-screen
```

`mm switch-to-tab dapp` is equivalent to `mm switch-to-tab --role dapp`.

Tab roles: `extension`, `notification`, `dapp`, `other`.

### 8. Navigate

```bash
mm navigate-home
mm navigate-settings
mm navigate https://test-dapp.io
```

### 9. Take Screenshots

```bash
mm screenshot --name "after-unlock"
```

For visual validation, capture screenshots before and after meaningful state changes.

### 10. Cleanup (Always Required)

```bash
mm cleanup
mm cleanup --shutdown
```

## Batching with mm run-steps

Use `mm run-steps` for known, deterministic sequences. Use individual commands for discovery, debugging, or when intermediate state changes the next action.

Important details:

- `mm run-steps` expects a JSON object with a `steps` key
- Prefer `a11yRef`, `testId`, or `selector` in args
- Use `within` in args to scope a target within a parent element
- Add `batchTimeoutMs` for an overall timeout
- Tool aliases such as `navigate_home` and `navigate-home` are supported

```bash
mm run-steps '{"steps":[
  { "tool": "type", "args": { "testId": "unlock-password", "text": "correct horse battery staple" } },
  { "tool": "click", "args": { "testId": "unlock-submit" } },
  { "tool": "wait_for", "args": { "testId": "account-menu-icon", "timeoutMs": 10000 } },
  { "tool": "get_text", "args": { "testId": "account-balance", "within": { "testId": "account-overview" } } }
]}'
```

Pattern:

1. Discover with `mm describe-screen`
2. Reuse prior successful steps from `mm knowledge-search`
3. Batch the known sequence with `mm run-steps`
4. Re-verify with `mm describe-screen`

## Capabilities

- **Anvil**: Local blockchain on port 8545
- **Fixture Server**: Wallet state management on port 12345
- **Contract Seeding**: Deploy test contracts with `mm seed-contract`
- **Mock Server**: Mock external API responses when enabled

## Error Recovery

### On Failure

1. Run `mm describe-screen`
2. Check the current screen:
   - `unlock` → enter password and submit
   - `home` → continue, but check for modals or blockers
   - `onboarding-*` → complete onboarding
   - `unknown` → take a screenshot and investigate
3. Query prior runs if needed:

```bash
mm knowledge-search "send"
mm knowledge-sessions
mm knowledge-last
```

4. Capture `mm screenshot --name "debug"` for diagnosis

### Error Codes

| Code                         | Meaning                                     |
| ---------------------------- | ------------------------------------------- |
| `MM_SESSION_ALREADY_RUNNING` | Session exists, call `mm cleanup` first     |
| `MM_NO_ACTIVE_SESSION`       | No session, call `mm launch` first          |
| `MM_LAUNCH_FAILED`           | Browser launch failed                       |
| `MM_INVALID_INPUT`           | Invalid parameters                          |
| `MM_TARGET_NOT_FOUND`        | Element not found                           |
| `MM_TAB_NOT_FOUND`           | Tab not found                               |
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

| Symptom                       | Likely Cause                    | Solution                                                                                                         |
| ----------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `MM_SESSION_ALREADY_RUNNING`  | Previous session not cleaned    | Call `mm cleanup` first                                                                                          |
| `MM_NO_ACTIVE_SESSION`        | No browser running              | Call `mm launch` first                                                                                           |
| Extension not loading         | Extension not built             | Run `yarn build:test:webpack` then retry `mm launch`                                                             |
| `EADDRINUSE` port error       | Orphan processes                | Check `.mm-server` for the active daemon/sub-service ports, then kill the specific orphaned process on that port |
| `MM_TARGET_NOT_FOUND`         | Element not visible             | Use `mm describe-screen` to check state                                                                          |
| `MM_WAIT_TIMEOUT`             | Slow environment or UI delay    | Increase timeout, inspect screenshot                                                                             |
| `MM_CONTEXT_SWITCH_BLOCKED`   | Switching during active session | Call `mm cleanup` before `mm set-context`                                                                        |
| Fixtures not available        | Running in prod context         | Switch to e2e: `mm set-context e2e`                                                                              |
| Stale a11yRefs after navigate | Refs not refreshed              | Call `mm describe-screen` to get fresh refs                                                                      |
