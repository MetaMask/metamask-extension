---
name: metamask-visual-testing
description: Launch and test MetaMask Chrome extension with Playwright. Use for visual validation of UI changes, testing onboarding/unlock flows, and capturing screenshots.
compatibility: opencode
metadata:
  location: test/e2e/playwright/llm-workflow/mcp-server
  type: browser-testing
---

## When to Use This Skill

Use this skill when you need to:

- Visually validate MetaMask UI changes
- Test extension behavior in a real browser
- Verify onboarding, unlock, or transaction flows
- Capture screenshots for validation
- Debug UI state issues

## Prerequisites

Run from repository root (macOS/Linux):

```bash
yarn install      # Install dependencies
yarn build:test   # Build the extension (or use mm_build tool)
```

If ports are in use from previous runs:

```bash
lsof -ti:8545,12345,8000 | xargs kill -9
```

## MCP Tools Overview

The MetaMask MCP server provides tools for browser automation:

| Tool                        | Description                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `mm_build`                  | Build extension using `yarn build:test`                     |
| `mm_launch`                 | Launch MetaMask in headed Chrome                            |
| `mm_cleanup`                | Stop browser and all services                               |
| `mm_get_state`              | Get current extension state (includes tab info)             |
| `mm_navigate`               | Navigate to home, settings, notification, or URL            |
| `mm_wait_for_notification`  | Wait for notification popup and set it as active page       |
| `mm_switch_to_tab`          | Switch active page to a different tab (by role or URL)      |
| `mm_close_tab`              | Close a tab (notification, dapp, or other)                  |
| `mm_list_testids`           | List visible data-testid attributes                         |
| `mm_accessibility_snapshot` | Get trimmed a11y tree with refs (e1, e2...)                 |
| `mm_describe_screen`        | Combined state + testIds + a11y snapshot (+ priorKnowledge) |
| `mm_screenshot`             | Take and save screenshot                                    |
| `mm_click`                  | Click element by a11yRef, testId, or selector               |
| `mm_type`                   | Type text into element                                      |
| `mm_wait_for`               | Wait for element to be visible                              |
| `mm_knowledge_last`         | Get last N recorded steps                                   |
| `mm_knowledge_search`       | Search recorded steps (cross-session supported)             |
| `mm_knowledge_summarize`    | Generate session recipe                                     |
| `mm_knowledge_sessions`     | List recent sessions and their metadata (tags/flowTags)     |
| `mm_run_steps`              | Execute multiple tools in sequence with error handling      |

## Core Workflow

### 0. Reuse Existing Knowledge (REQUIRED)

Before attempting any non-trivial flow (send/swap/connect/sign), query what worked previously.

Recommended pattern:

```
mm_knowledge_search { "query": "send flow", "scope": "all", "filters": { "flowTag": "send", "sinceHours": 48 } }
```

If you’re not sure which `flowTag` applies yet:

```
mm_knowledge_search { "query": "send", "scope": "all" }
```

If you need to discover which sessions exist:

```
mm_knowledge_sessions { "limit": 10, "filters": { "sinceHours": 48 } }
```

### 1. Build Extension (if needed)

```
mm_build
```

Builds the extension using `yarn build:test`. Skip if already built.

### 2. Launch Extension (ALWAYS TAG THE SESSION)

```
mm_launch
```

Options:

- `stateMode`: `"default"` (pre-onboarded with 25 ETH), `"onboarding"` (fresh wallet), or `"custom"`
- `fixturePreset`: Name of preset fixture (e.g., `"withMultipleAccounts"`)
- `fixture`: Custom fixture object
- `ports`: `{ anvil: 8545, fixtureServer: 12345 }`
- `goal`: Short description of what you’re doing
- `flowTags`: Flow categorization (e.g., `send`, `swap`, `connect`, `sign`, `onboarding`)
- `tags`: Free-form tags (e.g., `smoke`, `regression`)

Examples:

```json
// Pre-onboarded wallet (default)
{
  "stateMode": "default",
  "goal": "Send flow smoke",
  "flowTags": ["send"],
  "tags": ["smoke"]
}

// Fresh wallet requiring onboarding
{
  "stateMode": "onboarding",
  "goal": "Onboarding flow",
  "flowTags": ["onboarding"],
  "tags": ["smoke"]
}

// Custom fixture
{
  "stateMode": "custom",
  "fixturePreset": "withMultipleAccounts",
  "goal": "Send flow with multiple accounts",
  "flowTags": ["send"],
  "tags": ["regression"]
}
```

### 3. Describe Current Screen

```
mm_describe_screen
```

Returns combined state information:

- Current screen (home, unlock, onboarding-\*, settings, unknown)
- Visible testIds
- Accessibility tree with refs (e1, e2, ...)
- Optional screenshot

### 4. Interact with UI

Use one of three targeting methods (exactly ONE required):

**By a11yRef** (from accessibility snapshot):

```json
{ "a11yRef": "e5" }
```

**By testId** (data-testid attribute):

```json
{ "testId": "unlock-password" }
```

**By CSS selector**:

```json
{ "selector": "button.primary" }
```

#### Click Element

```
mm_click { "testId": "unlock-submit" }
mm_click { "a11yRef": "e12" }
```

#### Type Text

```
mm_type { "testId": "unlock-password", "text": "correct horse battery staple" }
```

#### Wait for Element

```
mm_wait_for { "testId": "home-balance", "timeoutMs": 10000 }
```

### 5. Take Screenshots

```
mm_screenshot { "name": "after-unlock" }
```

Options:

- `name`: Screenshot filename (required)
- `fullPage`: Capture full page (default: false)
- `selector`: Capture specific element
- `includeBase64`: Include base64 in response

### 6. Handle Notifications (Dapp flows)

When a dapp triggers a notification (connect, sign, send), wait for it:

```
mm_wait_for_notification { "timeoutMs": 10000 }
```

This automatically sets the notification as the **active page**, so subsequent `mm_click`, `mm_type`, and `mm_describe_screen` calls operate on the notification popup.

**Dapp connection flow example:**

```
mm_navigate { "screen": "url", "url": "https://test-dapp.io" }  → Opens dapp in new tab, sets as active
mm_click { "testId": "connectButton" }                          → Triggers notification
mm_wait_for_notification                                        → Active page = notification
mm_describe_screen                                              → Shows notification elements
mm_click { "testId": "confirm-btn" }                            → Clicks on notification
mm_switch_to_tab { "role": "dapp" }                             → Switch back to dapp
mm_describe_screen                                              → Verify connected state
```

**Tab roles:** `extension` (home), `notification` (popups), `dapp` (external sites), `other`

### 7. Navigate

```
mm_navigate { "screen": "home" }
mm_navigate { "screen": "settings" }
mm_navigate { "screen": "notification" }
mm_navigate { "screen": "url", "url": "chrome-extension://..." }
```

### 8. Cleanup (Always Required)

```
mm_cleanup
```

Stops browser and all background services.

## Typical Workflow Example (Knowledge-First)

```
0. mm_knowledge_search { "query": "unlock", "scope": "all", "sinceHours": 48 }
1. mm_build
2. mm_launch { "stateMode": "default", "goal": "Unlock smoke", "flowTags": ["unlock"], "tags": ["smoke"] }
3. mm_describe_screen
4. mm_type { "testId": "unlock-password", "text": "correct horse battery staple" }
5. mm_click { "testId": "unlock-submit" }
6. mm_describe_screen
7. mm_screenshot { "name": "home-validated" }
8. mm_cleanup
```

Notes:

- Prefer `mm_describe_screen` as your main feedback loop tool.
- Prefer `mm_knowledge_search` early, before exploring.
- Prefer `flowTags` on launch so future searches can filter.

## Batching with mm_run_steps

Use `mm_run_steps` to execute multiple tools in a single call when you **already know** the exact sequence of steps. This reduces round-trips and is ideal for known, deterministic flows.

### When to Use Batching

| Use mm_run_steps                              | Use Individual Calls                        |
| --------------------------------------------- | ------------------------------------------- |
| Known flows from prior knowledge              | First-time exploration                      |
| Deterministic sequences (wizard steps)        | Decisions based on intermediate state       |
| Repetitive patterns (fill form, click submit) | Debugging or investigating issues           |
| Replaying a successful flow                   | When you need to inspect each step's result |

### Example: Batched Unlock Flow

When you already know the unlock sequence (from prior knowledge or documentation):

```
mm_run_steps {
  "steps": [
    { "tool": "mm_type", "args": { "testId": "unlock-password", "text": "correct horse battery staple" } },
    { "tool": "mm_click", "args": { "testId": "unlock-submit" } },
    { "tool": "mm_wait_for", "args": { "testId": "account-menu-icon", "timeoutMs": 10000 } }
  ],
  "stopOnError": true
}
```

### Example: Batched Form Fill

```
mm_run_steps {
  "steps": [
    { "tool": "mm_click", "args": { "testId": "send-button" } },
    { "tool": "mm_type", "args": { "testId": "send-recipient", "text": "0x1234..." } },
    { "tool": "mm_type", "args": { "testId": "send-amount", "text": "0.1" } },
    { "tool": "mm_click", "args": { "testId": "send-continue" } }
  ],
  "stopOnError": true
}
```

### Options

- `stopOnError: true` (default: false) - Stop executing on first failure
- `includeObservations`: Controls observation collection per step (see below)
- Returns a summary with `succeeded`/`failed` counts and individual step results

### Observation Modes (includeObservations)

| Value      | Behavior                                                  | Use When                            |
| ---------- | --------------------------------------------------------- | ----------------------------------- |
| `all`      | Full observation (state + testIds + a11y) after each step | Default. Exploration, debugging     |
| `none`     | Minimal observation (state only) - fastest                | Known deterministic flows           |
| `failures` | Minimal on success, full on failure - balanced            | Production flows with error capture |

**Example: Fast mode for known flows**

```
mm_run_steps {
  "includeObservations": "none",
  "steps": [
    { "tool": "mm_type", "args": { "testId": "unlock-password", "text": "correct horse battery staple" } },
    { "tool": "mm_click", "args": { "testId": "unlock-submit" } }
  ],
  "stopOnError": true
}
```

**Important:** When using `includeObservations: "none"` or `"failures"`, the a11y snapshot is not collected and `refMap` is not refreshed. This means `a11yRef` targets (e.g., `e5`) become stale. **Prefer `testId` targets in fast mode.** If you need `a11yRef`, call `mm_accessibility_snapshot` or `mm_describe_screen` first.

### Pattern: Discover First, Then Batch

1. Use `mm_describe_screen` to discover available elements
2. Use `mm_knowledge_search` to find prior successful sequences
3. Use `mm_run_steps` to execute the known sequence efficiently
4. Use `mm_describe_screen` again to verify the end state

### Recommended Fast Workflow

For maximum throughput on known, deterministic flows:

1. **Describe once:** `mm_describe_screen` to discover targets
2. **Batch steps:** `mm_run_steps { "includeObservations": "none", ... }` with `testId` targets
3. **Describe on churn:** Call `mm_describe_screen` again after major navigation or if you need fresh `a11yRef` targets

## Error Recovery

### On Failure

1. Call `mm_describe_screen` to see current state
2. Use the built-in `result.priorKnowledge` (when present) to guide next action
3. If still stuck, query prior runs:

```
mm_knowledge_search { "query": "send", "scope": "all", "filters": { "sinceHours": 48 } }
mm_knowledge_sessions { "limit": 10, "filters": { "sinceHours": 48 } }
```

4. Check the `state.currentScreen` value:
   - `unlock` → Type password and click submit
   - `home` → Already ready, check for modals
   - `onboarding-*` → Complete onboarding flow
   - `unknown` → Take screenshot, investigate

5. Use `mm_knowledge_last { "n": 10 }` to review immediate history (current session)

### IMPORTANT: Restart MCP server after code changes

The MCP server is a long-lived process. If you update the MCP server code (including knowledge tagging/metadata), restart the MCP server so new sessions write the new record format.

### Error Codes

| Code                         | Meaning                               |
| ---------------------------- | ------------------------------------- |
| `MM_BUILD_FAILED`            | Build command failed                  |
| `MM_SESSION_ALREADY_RUNNING` | Session exists, call mm_cleanup first |
| `MM_NO_ACTIVE_SESSION`       | No session, call mm_launch first      |
| `MM_LAUNCH_FAILED`           | Browser launch failed                 |
| `MM_INVALID_INPUT`           | Invalid tool parameters               |
| `MM_TARGET_NOT_FOUND`        | Element not found                     |
| `MM_TAB_NOT_FOUND`           | Tab not found (for switch/close)      |
| `MM_CLICK_FAILED`            | Click operation failed                |
| `MM_TYPE_FAILED`             | Type operation failed                 |
| `MM_WAIT_TIMEOUT`            | Wait timeout exceeded                 |
| `MM_SCREENSHOT_FAILED`       | Screenshot capture failed             |

## Knowledge Store (How to Actually Reuse It)

Every tool invocation is recorded to `test-artifacts/llm-knowledge/<sessionId>/steps/`.

Sessions can also include `session.json` metadata (goal/tags/flowTags) when `mm_launch` is called with `goal`, `flowTags`, and `tags`.

### Recommended usage patterns

**Before starting a flow (cross-session search):**

```
mm_knowledge_search { "query": "send flow", "scope": "all", "filters": { "flowTag": "send", "sinceHours": 48 } }
```

**Find recent sessions for a flow:**

```
mm_knowledge_sessions { "limit": 10, "filters": { "flowTag": "send", "sinceHours": 48 } }
```

**Summarize a specific prior session:**

```
mm_knowledge_summarize { "scope": { "sessionId": "mm-..." } }
```

**Review current-session history (debugging):**

```
mm_knowledge_last { "n": 10 }
```

### Practical guidance

- Use `mm_knowledge_search` early (before exploring UI) to reduce rediscovery.
- Always pass `flowTags` on `mm_launch` so filters work.
- Prefer selectors that were successful in recent sessions.

## Default Credentials

| Property | Value                          |
| -------- | ------------------------------ |
| Password | `correct horse battery staple` |
| Chain ID | `1337`                         |
| Balance  | 25 ETH                         |

## Response Format

All tool responses follow this structure:

```json
{
  "ok": true,
  "result": { ... },
  "meta": {
    "timestamp": "2026-01-15T15:30:00.000Z",
    "sessionId": "mm-abc123-xyz789",
    "durationMs": 150
  }
}
```

Error responses:

```json
{
  "ok": false,
  "error": {
    "code": "MM_TARGET_NOT_FOUND",
    "message": "Element not found",
    "details": { ... }
  },
  "meta": { ... }
}
```

## Known Limitations

1. **Headed mode only**: Chrome extensions cannot run headless. Requires display (use XVFB on Linux CI).
2. **Single session**: Only one browser session at a time. Call `mm_cleanup` before `mm_launch`.
3. **macOS/Linux**: Port cleanup commands (`lsof`) are Unix-specific.

## Common Failures & Solutions

| Symptom                      | Likely Cause                  | Solution                                    |
| ---------------------------- | ----------------------------- | ------------------------------------------- |
| `MM_SESSION_ALREADY_RUNNING` | Previous session not cleaned  | Call `mm_cleanup` first                     |
| `MM_NO_ACTIVE_SESSION`       | No browser running            | Call `mm_launch` first                      |
| Extension not loading        | Extension not built           | Call `mm_build` or `yarn build:test`        |
| `EADDRINUSE` port error      | Orphan processes              | `lsof -ti:8545,12345,8000 \| xargs kill -9` |
| `MM_TARGET_NOT_FOUND`        | Element not visible           | Use `mm_describe_screen` to check state     |
| `MM_WAIT_TIMEOUT`            | Slow environment or UI change | Increase timeout, check screenshot          |

## Key Files

| File                                                     | Purpose                  |
| -------------------------------------------------------- | ------------------------ |
| `test/e2e/playwright/llm-workflow/mcp-server/README.md`  | MCP server documentation |
| `test/e2e/playwright/llm-workflow/mcp-server/server.ts`  | MCP server entrypoint    |
| `test/e2e/playwright/llm-workflow/extension-launcher.ts` | Core launcher class      |
| `test/e2e/playwright/llm-workflow/docs/SPEC-*.md`        | Full specification       |

## Visual Testing Decision Rules

When performing visual validation:

1. **Before action**: `mm_screenshot { "name": "before-X" }`
2. **Perform action**: `mm_click` / `mm_type` with appropriate target
3. **After action**: `mm_describe_screen` to verify state
4. **Capture result**: `mm_screenshot { "name": "after-X" }`
5. **On failure**: Check `mm_knowledge_last` and screenshot for diagnosis
