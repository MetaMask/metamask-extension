# MetaMask Extension LLM Workflow

CLI-based tooling for LLM agents to build, launch, and interact with the MetaMask Chrome extension using Playwright. Provides a complete feedback loop for implementing and validating UI changes through a persistent HTTP daemon.

## Documentation Scope

This README covers architecture, quick start, and available commands for the LLM workflow.

- For the full agent-facing command reference (targeting, scoping, batching, error recovery), see `.claude/skills/metamask-visual-testing/SKILL.md`.
- For the core package API and capability interfaces, see the `@metamask/client-mcp-core` README.

## Architecture

The system uses a **decoupled, daemon-based architecture**:

- **Generic Core**: `@metamask/client-mcp-core` package provides the HTTP daemon infrastructure, CLI interface, and knowledge store.
- **MetaMask Implementation**: This directory implements MetaMask-specific capabilities (fixtures, chain, seeding) that plug into the core daemon.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LLM Agent                                     │
│                    (Claude, GPT, etc.)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ CLI Commands (mm launch, mm click...)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         HTTP Daemon                                     │
│              test/e2e/playwright/llm-workflow/daemon.ts                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  @metamask/client-mcp-core (generic core)                │   │
│  │  - HTTP server & CLI infrastructure                             │   │
│  │  - Tool logic (click, type, screenshot, etc.)                   │   │
│  │  - Knowledge store                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  MetaMask Capabilities (this directory)                         │   │
│  │  - FixtureCapability: wallet state management                   │   │
│  │  - ChainCapability: Anvil blockchain                            │   │
│  │  - ContractSeedingCapability: deploy test contracts             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Playwright
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Headed Chrome Browser                                │
│                    + MetaMask Extension                                 │
│                    + Anvil (local blockchain)                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component           | Location                | Description                                                     |
| ------------------- | ----------------------- | --------------------------------------------------------------- |
| **Daemon**          | `daemon.ts`             | Entry point, starts the HTTP server and wires capabilities      |
| **Session Manager** | `metamask-provider.ts`  | Manages browser session, page tracking, capability coordination |
| **Capabilities**    | `capabilities/`         | MetaMask-specific implementations                               |
| **Launcher**        | `extension-launcher.ts` | Core browser/extension launcher                                 |

---

## Quick Start

### Prerequisites

1. Install [Node.js](https://nodejs.org) (version 24 is recommended).
2. Enable Yarn via Corepack: `corepack enable`
3. Install project dependencies: `yarn install`
4. Install Playwright Chromium: `yarn playwright install chromium`

### 1. CLI Usage

The `mm` CLI is the primary interface for interacting with the extension. It automatically manages the background daemon.

```bash
# 1. Build the extension
yarn build:test:webpack

# 2. Launch the session (starts daemon + browser)
mm launch

# 3. Interact
mm describe-screen
mm click [e1]
mm type [e2] "password"

# 4. Cleanup
mm cleanup
```

### 2. Daemon Model

- **Auto-start**: `mm launch` starts the daemon if it's not running.
- **Worktree Isolation**: Each worktree has its own daemon, tracked in `.mm-server`.
- **Idle Timeout**: Daemon shuts down after 30 minutes of inactivity.
- **Logs**: Activity is logged to `.mm-daemon.log`.

---

## Available Commands

### Lifecycle

- `mm launch`: Starts the daemon and browser session.
- `mm cleanup`: Stops the browser and services. Use `--shutdown` to stop the daemon.
- `mm status`: Shows the current daemon and session status.

### Interaction

- `mm click <ref>`: Clicks an element by its accessibility reference (e.g., `[e1]`).
- `mm type <ref> <text>`: Types text into an element.
- `mm describe-screen`: Captures the current screen state and element references.
- `mm screenshot`: Takes a screenshot of the current page.
- `mm wait-for <ref>`: Waits for an element to appear.

### Navigation

- `mm navigate <url>`: Navigates to a specific URL.
- `mm navigate-home`: Navigates to the extension home.
- `mm navigate-settings`: Navigates to the extension settings.

### Knowledge Store

- `mm knowledge-search <query>`: Search steps across sessions.
- `mm knowledge-last`: Get last N step records from this session.
- `mm knowledge-sessions`: List recent sessions with metadata.

---

## Launch Modes

### Default: Pre-Onboarded Wallet

Wallet is pre-configured with 25 ETH on local Anvil.
**Default password:** `correct horse battery staple`

```bash
mm launch --state default
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

---

## See Also

- **Agent Skill**: `.claude/skills/metamask-visual-testing/SKILL.md` - Concise command reference for agents.
- **Core Package**: `@metamask/client-mcp-core` - Generic daemon infrastructure.
- **Migrating from MCP?** If you previously configured an MCP server for MetaMask, see [mcp-cli-migration.md](./mcp-cli-migration.md).
