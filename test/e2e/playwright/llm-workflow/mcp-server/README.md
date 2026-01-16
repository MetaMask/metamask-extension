# MetaMask MCP Server

MCP (Model Context Protocol) server for LLM agents to build, launch, interact with, and visually validate the MetaMask Extension in a real headed Chrome browser.

## Quick Start

### Run the Server

```bash
# From repository root
yarn tsx test/e2e/playwright/llm-workflow/mcp-server/server.ts
```

The server communicates over stdio using the MCP protocol.

## MCP Client Configuration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "metamask-visual-testing": {
      "command": "yarn",
      "args": ["tsx", "test/e2e/playwright/llm-workflow/mcp-server/server.ts"],
      "cwd": "/path/to/metamask-extension"
    }
  }
}
```

### Other MCP Clients

Configure your MCP client to run:

```bash
yarn tsx test/e2e/playwright/llm-workflow/mcp-server/server.ts
```

Set the working directory to the MetaMask extension repository root.

## Available Tools

| Tool                        | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `mm_build`                  | Build extension using `yarn build:test`        |
| `mm_launch`                 | Launch MetaMask in headed Chrome               |
| `mm_cleanup`                | Stop browser and all services                  |
| `mm_get_state`              | Get current extension state                    |
| `mm_navigate`               | Navigate to home, settings, or URL             |
| `mm_wait_for_notification`  | Wait for notification popup                    |
| `mm_list_testids`           | List visible data-testid attributes            |
| `mm_accessibility_snapshot` | Get a11y tree with refs (e1, e2...)            |
| `mm_describe_screen`        | Combined state + testIds + a11y snapshot       |
| `mm_screenshot`             | Take and save screenshot                       |
| `mm_click`                  | Click element by a11yRef, testId, or selector  |
| `mm_type`                   | Type text into element                         |
| `mm_wait_for`               | Wait for element to be visible                 |
| `mm_knowledge_last`         | Get last N step records                        |
| `mm_knowledge_search`       | Search step records (cross-session by default) |
| `mm_knowledge_summarize`    | Generate session recipe                        |
| `mm_knowledge_sessions`     | List recent sessions with metadata             |

## Typical Workflow

```
1. mm_build           → Build extension (if needed)
2. mm_launch          → Start browser session
3. mm_describe_screen → See current state
4. mm_click/mm_type   → Interact with UI
5. mm_describe_screen → Verify changes
6. ... repeat 4-5 ...
7. mm_cleanup         → End session
```

## Target Selection

For `mm_click`, `mm_type`, and `mm_wait_for`, specify exactly ONE of:

- `a11yRef`: Reference from `mm_accessibility_snapshot` (e.g., "e5")
- `testId`: data-testid attribute value
- `selector`: CSS selector

## Launch Modes

### Default (pre-onboarded wallet)

```json
{
  "stateMode": "default"
}
```

Wallet is pre-configured with 25 ETH. Just unlock and use.

### Onboarding (fresh wallet)

```json
{
  "stateMode": "onboarding"
}
```

Start with brand new wallet requiring onboarding.

### Custom Fixture

```json
{
  "fixturePreset": "withMultipleAccounts",
  "stateMode": "custom"
}
```

Or provide fixture object directly:

```json
{
  "stateMode": "custom",
  "fixture": { ... }
}
```

## Knowledge Store

Step records are saved to `test-artifacts/llm-knowledge/<sessionId>/steps/`.

Each session has:

- `session.json` - Session metadata (flowTags, tags, goal, git info)
- `steps/*.json` - Individual step records

Each step captures:

- Tool invocation details
- UI state (screen, URL, balance, network)
- Visible testIds and accessibility tree
- Outcome (success/error)
- Screenshots (when captured)
- Labels (discovery, navigation, interaction, confirmation, error-recovery)

Sensitive text (passwords, SRP) is automatically redacted.

### Cross-Session Knowledge Retrieval

Sessions can be tagged at launch for later retrieval:

```json
{
  "flowTags": ["send"],
  "goal": "Test send flow",
  "stateMode": "default",
  "tags": ["smoke", "regression"]
}
```

Query across sessions:

```json
// Search all sessions (default)
mm_knowledge_search({ "query": "send", "scope": "all" })

// Filter by flowTag
mm_knowledge_search({ "query": "send", "filters": { "flowTag": "send" } })

// List recent sessions with filters
mm_knowledge_sessions({ "filters": { "flowTag": "send", "sinceHours": 48 } })

// Summarize a specific past session
mm_knowledge_summarize({ "scope": { "sessionId": "mm-..." } })
```

### Knowledge Scope Options

- `"current"` - Only active session
- `"all"` - All sessions (default for search)
- `{ "sessionId": "mm-..." }` - Specific session

### Filter Options

- `flowTag` - Filter by flow tag (send, swap, connect, sign, etc.)
- `tag` - Filter by free-form tag
- `screen` - Filter steps by screen name
- `sinceHours` - Only sessions created in last N hours
- `gitBranch` - Filter by git branch

## Error Codes

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

## Response Format

All responses follow this structure:

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
    "message": "Element not found: [data-testid=\"submit-btn\"]",
    "details": { ... }
  },
  "meta": { ... }
}
```

## Artifacts Directory

```
test-artifacts/
├── screenshots/           # mm_screenshot output
└── llm-knowledge/
    └── <sessionId>/
        └── steps/
            └── <timestamp>-<tool>.json
```

## Requirements

- Node.js 20+
- Built extension (`yarn build:test`)
- Chrome browser
