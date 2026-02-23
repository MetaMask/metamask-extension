# MetaMask Extension LLM Workflow

MCP-based tooling for LLM agents to build, launch, and interact with the MetaMask Chrome extension using Playwright. Provides a complete feedback loop for implementing and validating UI changes.

## Architecture

The system uses a **decoupled, capability-based architecture**:

- **Generic Core**: `@metamask/client-mcp-core` package provides MCP server infrastructure, tool definitions, knowledge store, and capability interfaces
- **MetaMask Implementation**: This directory implements MetaMask-specific capabilities that plug into the core

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
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  @metamask/client-mcp-core (generic core)                │   │
│  │  - MCP server infrastructure                                    │   │
│  │  - Tool definitions (mm_click, mm_type, mm_screenshot, etc.)    │   │
│  │  - Knowledge store                                              │   │
│  │  - Capability interfaces                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  MetaMask Capabilities (this directory)                         │   │
│  │  - BuildCapability: yarn build:test                             │   │
│  │  - FixtureCapability: wallet state management                   │   │
│  │  - ChainCapability: Anvil blockchain                            │   │
│  │  - ContractSeedingCapability: deploy test contracts             │   │
│  │  - StateSnapshotCapability: extension state detection           │   │
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

| Component           | Location                          | Description                                                     |
| ------------------- | --------------------------------- | --------------------------------------------------------------- |
| **MCP Server**      | `mcp-server/server.ts`            | Entry point, wires capabilities to core                         |
| **Session Manager** | `mcp-server/metamask-provider.ts` | Manages browser session, page tracking, capability coordination |
| **Capabilities**    | `capabilities/`                   | MetaMask-specific implementations                               |
| **Launcher**        | `extension-launcher.ts`           | Core browser/extension launcher                                 |

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
| `mm_get_state`              | Get current extension state (screen, URL, balance, network)           |
| `mm_list_testids`           | List all visible `data-testid` attributes                             |
| `mm_accessibility_snapshot` | Get accessibility tree with refs (e1, e2…)                            |
| `mm_describe_screen`        | Combined: state + testIds + a11y + prior knowledge from past sessions |

### Interaction

| Tool                       | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `mm_click`                 | Click element by a11yRef, testId, or CSS               |
| `mm_type`                  | Type text into element                                 |
| `mm_wait_for`              | Wait for element to become visible                     |
| `mm_clipboard`             | Read from or write to browser clipboard                |
| `mm_navigate`              | Navigate to home, settings, notification, or URL       |
| `mm_wait_for_notification` | Wait for notification popup and set it as active page  |
| `mm_switch_to_tab`         | Switch active page to a different tab (by role or URL) |
| `mm_close_tab`             | Close a tab (notification, dapp, or other)             |

### Screenshots

| Tool            | Description                         |
| --------------- | ----------------------------------- |
| `mm_screenshot` | Take screenshot, save to artifacts/ |

### Smart Contract Seeding

| Tool                      | Description                                |
| ------------------------- | ------------------------------------------ |
| `mm_seed_contract`        | Deploy a single smart contract to Anvil    |
| `mm_seed_contracts`       | Deploy multiple contracts in sequence      |
| `mm_get_contract_address` | Get the deployed address of a contract     |
| `mm_list_contracts`       | List all deployed contracts in the session |

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

### Context Switching

| Tool             | Description                                      |
| ---------------- | ------------------------------------------------ |
| `mm_set_context` | Switch workflow context, optionally with options |
| `mm_get_context` | Get current context and available capabilities   |

---

## Context Switching

The workflow supports switching between different execution contexts:

### Default Context: E2E

By default, the workflow runs in **e2e context**, which provides:

- Local Anvil blockchain (port 8545)
- Pre-onboarded wallet with 25 ETH
- Test fixtures and contract seeding
- Full visual testing capabilities

### Switching Contexts

Use `mm_set_context` to switch between contexts:

```json
mm_set_context { "context": "prod" }
```

You can also pass optional context-specific overrides:

```json
mm_set_context {
  "context": "e2e",
  "options": {
    "mockServer": {
      "enabled": true,
      "port": 8000
    }
  }
}
```

For `e2e`, useful options include:

- `mockServer.enabled` and `mockServer.port`
- `ports.anvil` and `ports.fixtureServer`
- `forkUrl` and `forkBlockNumber`

### Important Constraints

- **Cannot switch during active session**: You must call `mm_cleanup` first before switching contexts
- **Context persists**: Once set, the context remains active for subsequent sessions until changed
- **Verify context**: Use `mm_get_context` to check the current context and available capabilities
- **Options are optional**: Omitting `options` uses defaults for the selected context
- **Same-context updates are allowed**: `mm_set_context` with non-empty `options` reapplies that context with the new settings
- **Mock server is opt-in**: In `e2e`, mock server is disabled by default and must be enabled explicitly via `options`

### Example: Switching to Production Context

```
1. mm_cleanup                    # End current e2e session
2. mm_set_context { "context": "prod" }  # Switch to production
3. mm_get_context                # Verify context switched
4. mm_launch { ... }             # Launch in production context
```

### Example: Enable Mock Server in E2E

```
1. mm_cleanup
2. mm_set_context {
     "context": "e2e",
     "options": {
       "mockServer": { "enabled": true, "port": 8000 }
     }
   }
3. mm_get_context                # Verify capabilities and no active session
4. mm_launch { "stateMode": "default" }
```

---

## Launch Modes

### Default: Pre-Onboarded Wallet

Wallet is pre-configured with 25 ETH on local Anvil. Just unlock and use.

**Default password:** `correct horse battery staple`

```json
mm_launch { "stateMode": "default" }
```

### Onboarding: Fresh Wallet

Start with a brand new wallet that requires onboarding.

```json
mm_launch { "stateMode": "onboarding" }
```

### Custom Fixture

Use a preset fixture or provide custom wallet state.

```json
mm_launch {
  "stateMode": "custom",
  "fixturePreset": "withMultipleAccounts"
}
```

### Pre-deployed Contracts

Deploy contracts before the extension loads:

```json
mm_launch {
  "stateMode": "default",
  "seedContracts": ["hst", "nfts"]
}
```

---

## Capabilities

The system is built on pluggable capabilities that implement interfaces from the core package:

| Capability           | Class                               | Description                            |
| -------------------- | ----------------------------------- | -------------------------------------- |
| **Build**            | `MetaMaskBuildCapability`           | Builds extension via `yarn build:test` |
| **Fixture**          | `MetaMaskFixtureCapability`         | Manages wallet state fixtures, presets |
| **Chain**            | `MetaMaskChainCapability`           | Anvil blockchain management            |
| **Contract Seeding** | `MetaMaskContractSeedingCapability` | Deploy ERC-20, NFT, ERC-4337 contracts |
| **State Snapshot**   | `MetaMaskStateSnapshotCapability`   | Extension state detection              |

### Factory Pattern

The `createMetaMaskE2EContext()` function in `capabilities/factory.ts` wires all capabilities together:

```typescript
const context = createMetaMaskE2EContext({
  ports: { anvil: 8545, fixtureServer: 12345 },
  forkUrl: 'https://mainnet.infura.io/v3/...', // optional
});
```

---

## Directory Structure

```
test/e2e/playwright/llm-workflow/
├── mcp-server/                   # MCP server implementation
│   ├── server.ts                 # Entry point - wires capabilities to core
│   └── metamask-provider.ts      # Session manager implementation
│
├── capabilities/                 # MetaMask-specific capability implementations
│   ├── factory.ts                # Creates workflow context with all capabilities
│   ├── build.ts                  # BuildCapability - yarn build:test
│   ├── fixture.ts                # FixtureCapability - wallet state management
│   ├── chain.ts                  # ChainCapability - Anvil blockchain
│   ├── seeding.ts                # ContractSeedingCapability - deploy contracts
│   ├── state-snapshot.ts         # StateSnapshotCapability - extension state
│   └── index.ts                  # Public exports
│
├── launcher/                     # Browser/extension launcher components
│   └── state-inspector.ts        # Screen detection, state extraction
│
├── extension-launcher.ts         # Core MetaMaskExtensionLauncher class
├── anvil-seeder-wrapper.ts       # Smart contract deployment wrapper
├── fixture-helper.ts             # Fixture preset definitions
├── mock-server.ts                # Mock server for API responses (experimental)
├── launcher-types.ts             # TypeScript types
│
├── page-objects/                 # Page object models
│   └── home-page.ts
│
├── docs/                         # Documentation and archive
│   └── archive/                  # Historical specifications
│
└── README.md                     # This file
```

---

## See Also

- **MCP Server Details**: [`mcp-server/README.md`](./mcp-server/README.md) - Tool reference, launch modes, examples
- **Core Package**: `@metamask/client-mcp-core` - Generic MCP infrastructure
- **Agent Skill**: `.claude/skills/metamask-visual-testing/SKILL.md` - Agent usage instructions
