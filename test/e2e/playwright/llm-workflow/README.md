# MetaMask Extension LLM Workflow

MCP-based tooling for LLM agents to build, launch, and interact with the MetaMask Chrome extension using Playwright. Provides a complete feedback loop for implementing and validating UI changes.

## Architecture

The system is built on a decoupled architecture consisting of a generic core package and a MetaMask-specific implementation.

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
│  (Uses @metamask/metamask-extension-mcp generic core)                   │
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

1. **GET TASK**: Read GitHub issue/PR requirements.
2. **GATHER CONTEXT**: Search codebase, understand existing patterns.
3. **PLAN**: Break down into atomic implementation steps.
4. **IMPLEMENT**: Write code changes.
5. **RUN TESTS**: `yarn test:unit`, `yarn lint:changed`.
6. **BUILD & LAUNCH**: `mm_build` → `mm_launch`.
7. **VISUAL VALIDATION**: `mm_describe_screen`, `mm_screenshot`.
8. **INTERACT & VERIFY**: `mm_click`, `mm_type` → verify behavior.
9. **ITERATE**: If acceptance criteria NOT met → go to step 4.
10. **CLEANUP**: `mm_cleanup` (always!).

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

---

## Launch Modes

### Default: Pre-Onboarded Wallet

Wallet is pre-configured with 25 ETH. Just unlock and use.
**Default password:** `correct horse battery staple`

### Fresh Wallet: Onboarding Flow

Start with a brand new wallet that requires onboarding.

### Prod-like Mode: Real Network & Manual Setup

Use this mode to test against real networks or when you need to perform manual setup.

- **remoteChain**: Remote chain config with `rpcUrl` and `chainId`.
- **includeBuild**: Ensure the extension is built before launching.

---

## Directory Structure

```
test/e2e/playwright/llm-workflow/
├── mcp-server/              # MCP server wrapper
│   ├── server.ts            # Main server entrypoint
│   └── metamask-provider.ts # MetaMask session manager + capability wiring
├── capabilities/            # MetaMask-specific capability implementations
├── launcher/                # Launcher utilities (MM-specific)
├── page-objects/            # Page object models
├── docs/                    # Detailed specifications and archive
└── README.md                # This file
```
