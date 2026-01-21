# MetaMask Extension LLM Workflow

MCP-based tooling for LLM agents to build, launch, and interact with the MetaMask Chrome extension using Playwright. Provides a complete feedback loop for implementing and validating UI changes.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LLM Agent                                     │
│                    (Claude, GPT, etc.)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ MCP Protocol (stdio)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MCP Server                                      │
│              test/e2e/playwright/llm-workflow/mcp-server/               │
│                                                                         │
│  Tools: mm_build, mm_launch, mm_click, mm_type, mm_screenshot, ...     │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Playwright
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Headed Chrome Browser                                │
│                    + MetaMask Extension                                 │
│                    + Anvil (local chain)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

The MCP server exposes tools that LLM agents call to interact with a real MetaMask Extension running in a headed Chrome browser.

---

## Quick Start

### 1. Configure MCP Client

Add to your MCP client configuration (e.g., Claude Desktop, OpenCode):

```json
{
  "mcpServers": {
    "metamask": {
      "command": "yarn",
      "args": ["tsx", "test/e2e/playwright/llm-workflow/mcp-server/server.ts"],
      "cwd": "/path/to/metamask-extension"
    }
  }
}
```

### 2. Use the Tools

Once configured, the LLM agent can use tools like:

```
mm_build      → Build the extension
mm_launch     → Launch browser with MetaMask
mm_click      → Click UI elements
mm_type       → Type into inputs
mm_screenshot → Capture screenshots
mm_cleanup    → Stop browser and services
```

---

## Development Workflow

When implementing UI changes, follow this cycle:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. GET TASK          │  Read GitHub issue/PR requirements             │
├───────────────────────┼─────────────────────────────────────────────────┤
│  2. GATHER CONTEXT    │  Search codebase, understand existing patterns │
├───────────────────────┼─────────────────────────────────────────────────┤
│  3. PLAN              │  Break down into atomic implementation steps   │
├───────────────────────┼─────────────────────────────────────────────────┤
│  4. IMPLEMENT         │  Write code changes                            │
├───────────────────────┼─────────────────────────────────────────────────┤
│  5. RUN TESTS         │  yarn test:unit, yarn lint:changed             │
├───────────────────────┼─────────────────────────────────────────────────┤
│  6. BUILD & LAUNCH    │  mm_build → mm_launch                          │
├───────────────────────┼─────────────────────────────────────────────────┤
│  7. VISUAL VALIDATION │  mm_describe_screen, mm_screenshot             │
├───────────────────────┼─────────────────────────────────────────────────┤
│  8. INTERACT & VERIFY │  mm_click, mm_type → verify behavior           │
├───────────────────────┼─────────────────────────────────────────────────┤
│  9. ITERATE           │  If acceptance criteria NOT met → go to step 4 │
├───────────────────────┼─────────────────────────────────────────────────┤
│ 10. CLEANUP           │  mm_cleanup (always!)                          │
└───────────────────────┴─────────────────────────────────────────────────┘
```

### Typical Tool Sequence

```
1. mm_build                         → Build extension (first time or after code changes)
2. mm_launch                        → Start browser session
3. mm_describe_screen               → See current UI state + available elements
4. mm_click { testId: "unlock-btn"} → Interact with UI
5. mm_type { testId: "password" }   → Enter text
6. mm_describe_screen               → Verify state changed as expected
7. mm_screenshot { name: "result" } → Capture visual proof
8. mm_cleanup                       → End session (ALWAYS call this!)
```

---

## Available Tools

### Build & Session Management

| Tool         | Description                              |
| ------------ | ---------------------------------------- |
| `mm_build`   | Build extension using `yarn build:test`  |
| `mm_launch`  | Launch MetaMask in headed Chrome browser |
| `mm_cleanup` | Stop browser, Anvil, and all services    |

### State & Discovery

| Tool                        | Description                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `mm_get_state`              | Get current extension state (screen, URL)                             |
| `mm_list_testids`           | List all visible `data-testid` attributes                             |
| `mm_accessibility_snapshot` | Get accessibility tree with refs (e1, e2…)                            |
| `mm_describe_screen`        | Combined: state + testIds + a11y + priorKnowledge from prior sessions |

### Interaction

| Tool                       | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `mm_click`                 | Click element by a11yRef, testId, or CSS               |
| `mm_type`                  | Type text into element                                 |
| `mm_wait_for`              | Wait for element to become visible                     |
| `mm_navigate`              | Navigate to home, settings, notification, or URL       |
| `mm_wait_for_notification` | Wait for notification popup and set it as active page  |
| `mm_switch_to_tab`         | Switch active page to a different tab (by role or URL) |
| `mm_close_tab`             | Close a tab (notification, dapp, or other)             |

### Screenshots

| Tool            | Description                         |
| --------------- | ----------------------------------- |
| `mm_screenshot` | Take screenshot, save to artifacts/ |

### Knowledge Store

| Tool                     | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `mm_knowledge_last`      | Get last N step records from this session               |
| `mm_knowledge_search`    | Search steps across sessions (cross-session by default) |
| `mm_knowledge_summarize` | Generate recipe-like summary of a session               |
| `mm_knowledge_sessions`  | List recent sessions with metadata                      |

### Batching

| Tool           | Description                                            |
| -------------- | ------------------------------------------------------ |
| `mm_run_steps` | Execute multiple tools in sequence with error handling |

**When to use `mm_run_steps`:**

- Known flows from prior knowledge or documentation
- Deterministic sequences (form fills, wizard steps)
- Replaying successful flows to reduce round-trips

**When NOT to use:**

- First-time exploration (use `mm_describe_screen` instead)
- When next step depends on intermediate state
- Debugging or investigating issues

**Example:**

```json
mm_run_steps({
  "steps": [
    { "tool": "mm_type", "args": { "testId": "unlock-password", "text": "correct horse battery staple" } },
    { "tool": "mm_click", "args": { "testId": "unlock-submit" } }
  ],
  "stopOnError": true
})
```

---

## Element Targeting

For `mm_click`, `mm_type`, and `mm_wait_for`, specify exactly **ONE** of:

| Method     | Example                        | Best For                       |
| ---------- | ------------------------------ | ------------------------------ |
| `testId`   | `{ testId: "unlock-button" }`  | Stable, well-defined elements  |
| `a11yRef`  | `{ a11yRef: "e5" }`            | Dynamic discovery via snapshot |
| `selector` | `{ selector: ".btn-primary" }` | Fallback when others unavail   |

### Discovery Flow

1. Call `mm_describe_screen` to see available testIds, a11y refs, and prior knowledge
2. Check `priorKnowledge.suggestedNextActions` for recommended interactions from prior sessions
3. Choose the most stable identifier (prefer testId > a11yRef > selector)
4. Use that identifier in interaction tools

---

## Launch Modes

### Default: Pre-Onboarded Wallet

```json
{ "stateMode": "default" }
```

Wallet is pre-configured with 25 ETH. Just unlock and use.

**Default password:** `correct horse battery staple`

### Fresh Wallet: Onboarding Flow

```json
{ "stateMode": "onboarding" }
```

Start with a brand new wallet that requires onboarding.

### Custom Fixture

```json
{
  "fixturePreset": "withMultipleAccounts",
  "stateMode": "custom"
}
```

Or provide a custom fixture object directly.

### Session Tagging (for cross-session knowledge)

```json
{
  "flowTags": ["send"],
  "goal": "Test send flow",
  "stateMode": "default",
  "tags": ["smoke", "regression"]
}
```

---

## Multi-Tab Management

The MCP server supports managing multiple browser tabs, enabling interaction with notification popups (confirmation windows) while preserving dapp state.

### Active Page Concept

Interaction tools (`mm_click`, `mm_type`, `mm_wait_for`) and discovery tools (`mm_describe_screen`, `mm_list_testids`, `mm_accessibility_snapshot`) operate on the **active page**. The active page changes automatically based on navigation actions:

| Action                                     | Active Page Becomes        |
| ------------------------------------------ | -------------------------- |
| `mm_launch`                                | Extension home page        |
| `mm_navigate({ screen: 'home' })`          | Extension home page        |
| `mm_navigate({ screen: 'url', url: '…' })` | The new URL page (new tab) |
| `mm_navigate({ screen: 'notification' })`  | The notification page      |
| `mm_wait_for_notification`                 | The notification page      |
| `mm_switch_to_tab({ role: '…' })`          | The specified tab          |

### Tab Roles

Pages are classified by role:

| Role           | Description                                       |
| -------------- | ------------------------------------------------- |
| `extension`    | Main extension page (`home.html`)                 |
| `notification` | Confirmation/approval pages (`notification.html`) |
| `dapp`         | External dapp pages (any non-extension URL)       |
| `other`        | Other extension or browser pages                  |

### Tab Tracking in State

`mm_get_state` returns tab information:

```json
{
  "state": { ... },
  "tabs": {
    "active": {
      "url": "chrome-extension://…/notification.html",
      "role": "notification"
    },
    "tracked": [
      { "role": "extension", "url": "chrome-extension://…/home.html" },
      { "role": "dapp", "url": "https://metamask.github.io/test-dapp/" },
      { "role": "notification", "url": "chrome-extension://…/notification.html" }
    ]
  }
}
```

### Switching Tabs

Use `mm_switch_to_tab` to change the active page:

```json
// Switch by role
mm_switch_to_tab({ "role": "dapp" })
mm_switch_to_tab({ "role": "notification" })
mm_switch_to_tab({ "role": "extension" })

// Switch by URL prefix
mm_switch_to_tab({ "url": "https://metamask.github.io" })
```

### Closing Tabs

Use `mm_close_tab` to close a tab:

```json
// Close notification tab
mm_close_tab({ "role": "notification" })

// Close dapp tab
mm_close_tab({ "role": "dapp" })

// Close by URL
mm_close_tab({ "url": "https://metamask.github.io" })
```

**Notes:**

- Cannot close the extension home page
- If closing the active tab, automatically switches to extension home

### Example: Dapp Connection Flow

```
1. mm_launch                                    → Active: extension home
2. mm_navigate({ screen: 'url', url: 'https://test-dapp.io' })
                                                → Active: dapp (new tab)
3. mm_click({ testId: 'connectButton' })        → Triggers notification popup
4. mm_wait_for_notification                     → Active: notification page ✅
5. mm_describe_screen                           → Shows notification elements
6. mm_click({ testId: 'confirm-btn' })          → Clicks on notification page
7. mm_switch_to_tab({ role: 'dapp' })           → Active: dapp
8. mm_describe_screen                           → Shows dapp (connected state)
9. mm_cleanup
```

### Example: Transaction Signing Flow

```
1. mm_launch
2. mm_navigate({ screen: 'url', url: 'https://test-dapp.io' })
3. mm_click({ testId: 'sendButton' })           → Triggers tx notification
4. mm_wait_for_notification                     → Active: notification
5. mm_describe_screen                           → See tx details, gas, confirm
6. mm_click({ testId: 'confirm-footer-button' }) → Confirm transaction
7. mm_switch_to_tab({ role: 'dapp' })
8. mm_describe_screen                           → Verify tx submitted
9. mm_cleanup
```

---

## Knowledge Store

Every tool invocation is recorded for learning and debugging.

### What's Captured

- Tool name and parameters
- UI state (screen, URL, balance, network)
- Visible testIds and accessibility tree
- Outcome (success/error)
- Screenshots (when captured)
- Auto-labels: `discovery`, `navigation`, `interaction`, `confirmation`, `error-recovery`

### Cross-Session Retrieval

Search across all sessions:

```json
mm_knowledge_search({ "query": "send button", "scope": "all" })
```

Filter by flow or time:

```json
mm_knowledge_search({
  "query": "confirm",
  "filters": { "flowTag": "send", "sinceHours": 48 }
})
```

List recent sessions:

```json
mm_knowledge_sessions({ "filters": { "flowTag": "swap" } })
```

Summarize a past session:

```json
mm_knowledge_summarize({ "scope": { "sessionId": "mm-abc123" } })
```

### Automatic Prior Knowledge Injection

When you call `mm_describe_screen`, the server automatically searches prior sessions and injects relevant knowledge into the response:

| Field                  | Description                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| `suggestedNextActions` | Ranked list of recommended actions based on successful prior interactions |
| `similarSteps`         | Relevant steps from prior sessions on the same/similar screens            |
| `relatedSessions`      | Sessions that match the current flow context                              |
| `avoid`                | Actions that failed in prior sessions (with error codes)                  |
| `query`                | Transparency metadata showing search parameters used                      |

This eliminates the need to manually call `mm_knowledge_search` before each interaction—the most relevant knowledge is delivered automatically.

### Storage Location

```
test-artifacts/llm-knowledge/
└── <sessionId>/
    ├── session.json           # Session metadata
    └── steps/
        └── <timestamp>-<tool>.json
```

---

## Infrastructure

| Service       | Port  | Purpose                |
| ------------- | ----- | ---------------------- |
| Anvil         | 8545  | Local Ethereum node    |
| FixtureServer | 12345 | Wallet state injection |

---

## Default Credentials

| Property | Value                          |
| -------- | ------------------------------ |
| Password | `correct horse battery staple` |
| Chain ID | `1337`                         |
| Balance  | 25 ETH                         |

---

## Error Codes

| Code                         | Meaning                               |
| ---------------------------- | ------------------------------------- |
| `MM_BUILD_FAILED`            | Build command failed                  |
| `MM_SESSION_ALREADY_RUNNING` | Session exists, call mm_cleanup first |
| `MM_NO_ACTIVE_SESSION`       | No session, call mm_launch first      |
| `MM_LAUNCH_FAILED`           | Browser launch failed                 |
| `MM_TARGET_NOT_FOUND`        | Element not found                     |
| `MM_CLICK_FAILED`            | Click operation failed                |
| `MM_TYPE_FAILED`             | Type operation failed                 |
| `MM_WAIT_TIMEOUT`            | Wait timeout exceeded                 |
| `MM_TAB_NOT_FOUND`           | Tab not found (for switch/close)      |

---

## Troubleshooting

### Port Already in Use

Kill orphan processes from previous runs:

```bash
lsof -ti:8545,12345 | xargs kill -9
```

### Extension Not Loading

Build the extension:

```bash
yarn build:test
```

Or use `mm_build` tool.

### Session Won't Start

Make sure to call `mm_cleanup` after each session. Only one session can run at a time.

### Element Not Found

1. Call `mm_describe_screen` to see what's visible
2. Check if the element has a `data-testid`
3. Use `mm_wait_for` if element appears asynchronously

---

## Best Practices

### 1. Always Cleanup

```
mm_launch → ... do work ... → mm_cleanup
```

Even if errors occur, call `mm_cleanup` to free ports.

### 2. Describe Before Acting

```
mm_describe_screen → understand state → mm_click
```

Don't guess at element identifiers. Discover them first.

### 3. Use testIds When Available

```json
// GOOD: Stable identifier
{ "testId": "confirm-transaction-button" }

// OK: Dynamic discovery
{ "a11yRef": "e5" }

// LAST RESORT: CSS selector
{ "selector": ".confirm-btn" }
```

### 4. Take Screenshots for Verification

```
mm_click → mm_screenshot { name: "after-click" }
```

Visual proof helps verify behavior and debug issues.

### 5. Use Knowledge Store

Before starting a flow, search for prior patterns:

```json
mm_knowledge_search({ "query": "unlock flow" })
```

This helps avoid rediscovering what was already learned.

### 6. Leverage Prior Knowledge

`mm_describe_screen` automatically injects `priorKnowledge` from prior sessions:

```json
{
  "priorKnowledge": {
    "suggestedNextActions": [
      {
        "rank": 1,
        "action": "click",
        "rationale": "Previously successful: clicked unlock button",
        "confidence": 0.85,
        "preferredTarget": { "type": "testId", "value": "unlock-button" }
      }
    ],
    "similarSteps": [...],
    "avoid": [...]
  }
}
```

Use `suggestedNextActions` to skip trial-and-error and repeat successful patterns.

---

## Directory Structure

```
test/e2e/playwright/llm-workflow/
├── mcp-server/              # MCP server implementation
│   ├── server.ts            # Main server entrypoint
│   ├── session-manager.ts   # Browser session management
│   ├── knowledge-store.ts   # Step recording and retrieval
│   ├── discovery.ts         # A11y snapshot and testId discovery
│   ├── types.ts             # TypeScript types
│   └── tools/               # Individual tool handlers
│       ├── build.ts
│       ├── launch.ts
│       ├── cleanup.ts
│       ├── state.ts
│       ├── navigation.ts
│       ├── discovery-tools.ts
│       ├── interaction.ts
│       ├── screenshot.ts
│       └── knowledge.ts
├── launcher.ts              # MetaMaskExtensionLauncher class
├── page-objects/            # Page object models
└── README.md                # This file
```

---

## Running the Server Manually

For debugging or development:

```bash
# From repository root
yarn tsx test/e2e/playwright/llm-workflow/mcp-server/server.ts
```

The server communicates over stdio using the MCP protocol.

---

## Response Format

All tool responses follow this structure:

```json
{
  "ok": true,
  "result": { ... },
  "meta": {
    "timestamp": "2026-01-15T15:30:00.000Z",
    "sessionId": "mm-abc123",
    "durationMs": 150
  }
}
```

### mm_describe_screen Response (with priorKnowledge)

```json
{
  "ok": true,
  "result": {
    "state": { "currentScreen": "unlock", "isUnlocked": false, ... },
    "testIds": { "items": [...] },
    "a11y": { "nodes": [...] },
    "screenshot": null,
    "priorKnowledge": {
      "schemaVersion": 1,
      "generatedAt": "2026-01-15T15:30:00.000Z",
      "query": {
        "windowHours": 48,
        "usedFlowTags": ["send"],
        "candidateSessions": 5,
        "candidateSteps": 42
      },
      "relatedSessions": [...],
      "similarSteps": [...],
      "suggestedNextActions": [
        {
          "rank": 1,
          "action": "click",
          "rationale": "Previously successful on unlock screen",
          "confidence": 0.85,
          "preferredTarget": { "type": "testId", "value": "unlock-button" }
        }
      ],
      "avoid": [...]
    }
  },
  "meta": { ... }
}
```

### Error Response

```json
{
  "ok": false,
  "error": {
    "code": "MM_TARGET_NOT_FOUND",
    "message": "Element not found: [data-testid=\"submit\"]"
  },
  "meta": { ... }
}
```

---

## Further Reading

- [MCP Server README](./mcp-server/README.md) - Detailed MCP server documentation
- [MCP Protocol](https://modelcontextprotocol.io/) - Model Context Protocol specification
