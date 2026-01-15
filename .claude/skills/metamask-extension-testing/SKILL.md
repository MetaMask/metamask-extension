---
name: metamask-extension-testing
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

The MetaMask MCP server provides 16 tools for browser automation:

| Tool                        | Description                                   |
| --------------------------- | --------------------------------------------- |
| `mm_build`                  | Build extension using `yarn build:test`       |
| `mm_launch`                 | Launch MetaMask in headed Chrome              |
| `mm_cleanup`                | Stop browser and all services                 |
| `mm_get_state`              | Get current extension state                   |
| `mm_navigate`               | Navigate to home, settings, or URL            |
| `mm_wait_for_notification`  | Wait for notification popup                   |
| `mm_list_testids`           | List visible data-testid attributes           |
| `mm_accessibility_snapshot` | Get a11y tree with refs (e1, e2...)           |
| `mm_describe_screen`        | Combined state + testIds + a11y snapshot      |
| `mm_screenshot`             | Take and save screenshot                      |
| `mm_click`                  | Click element by a11yRef, testId, or selector |
| `mm_type`                   | Type text into element                        |
| `mm_wait_for`               | Wait for element to be visible                |
| `mm_knowledge_last`         | Get last N step records                       |
| `mm_knowledge_search`       | Search step records                           |
| `mm_knowledge_summarize`    | Generate session recipe                       |

## Core Workflow

### 1. Build Extension (if needed)

```
mm_build
```

Builds the extension using `yarn build:test`. Skip if already built.

### 2. Launch Extension

```
mm_launch
```

Options:

- `stateMode`: `"default"` (pre-onboarded with 25 ETH), `"onboarding"` (fresh wallet), or `"custom"`
- `fixturePreset`: Name of preset fixture (e.g., `"withMultipleAccounts"`)
- `fixture`: Custom fixture object
- `ports`: `{ anvil: 8545, fixtureServer: 12345 }`

Examples:

```json
// Pre-onboarded wallet (default)
{ "stateMode": "default" }

// Fresh wallet requiring onboarding
{ "stateMode": "onboarding" }

// Custom fixture
{ "stateMode": "custom", "fixturePreset": "withMultipleAccounts" }
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

Wait for notification popup:

```
mm_wait_for_notification { "timeoutMs": 10000 }
```

Then use `mm_describe_screen` to see notification content and interact with it.

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

## Typical Workflow Example

```
1. mm_build                                              → Build extension
2. mm_launch { "stateMode": "default" }                  → Start browser
3. mm_describe_screen                                    → See unlock screen
4. mm_type { "testId": "unlock-password", "text": "correct horse battery staple" }
5. mm_click { "testId": "unlock-submit" }                → Submit password
6. mm_describe_screen                                    → Verify home screen
7. mm_screenshot { "name": "home-validated" }            → Capture result
8. mm_cleanup                                            → End session
```

## Error Recovery

### On Failure

1. Call `mm_describe_screen` to see current state
2. Check the `state.currentScreen` value:
   - `unlock` → Type password and click submit
   - `home` → Already ready, check for modals
   - `onboarding-*` → Complete onboarding flow
   - `unknown` → Take screenshot, investigate
3. Use `mm_knowledge_last` to review recent steps

### Error Codes

| Code                         | Meaning                               |
| ---------------------------- | ------------------------------------- |
| `MM_BUILD_FAILED`            | Build command failed                  |
| `MM_SESSION_ALREADY_RUNNING` | Session exists, call mm_cleanup first |
| `MM_NO_ACTIVE_SESSION`       | No session, call mm_launch first      |
| `MM_LAUNCH_FAILED`           | Browser launch failed                 |
| `MM_INVALID_INPUT`           | Invalid tool parameters               |
| `MM_TARGET_NOT_FOUND`        | Element not found                     |
| `MM_CLICK_FAILED`            | Click operation failed                |
| `MM_TYPE_FAILED`             | Type operation failed                 |
| `MM_WAIT_TIMEOUT`            | Wait timeout exceeded                 |
| `MM_SCREENSHOT_FAILED`       | Screenshot capture failed             |

## Knowledge Store

Every tool invocation is recorded to `test-artifacts/llm-knowledge/<sessionId>/steps/`.

Query past steps:

```
mm_knowledge_last { "n": 5 }           → Get last 5 steps
mm_knowledge_search { "query": "click" } → Search for click actions
mm_knowledge_summarize                  → Generate session recipe
```

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
| `test/e2e/playwright/llm-workflow/SPEC.md`               | Full specification       |

## Visual Testing Decision Rules

When performing visual validation:

1. **Before action**: `mm_screenshot { "name": "before-X" }`
2. **Perform action**: `mm_click` / `mm_type` with appropriate target
3. **After action**: `mm_describe_screen` to verify state
4. **Capture result**: `mm_screenshot { "name": "after-X" }`
5. **On failure**: Check `mm_knowledge_last` and screenshot for diagnosis
