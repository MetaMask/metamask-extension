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
| `mm_seed_contract`          | Deploy a single smart contract to Anvil        |
| `mm_seed_contracts`         | Deploy multiple smart contracts                |
| `mm_get_contract_address`   | Get deployed address of a contract             |
| `mm_list_contracts`         | List all deployed contracts in session         |
| `mm_run_steps`              | Execute multiple tools in sequence             |

## Smart Contract Seeding

Deploy predetermined smart contracts to the local Anvil node for testing token operations, NFTs, and other DeFi flows.

### Available Contracts

| Contract             | Key                    | Description                                                              |
| -------------------- | ---------------------- | ------------------------------------------------------------------------ |
| HST                  | `hst`                  | ERC-20 test token (TST symbol, 4 decimals, 10 tokens minted to deployer) |
| NFTs                 | `nfts`                 | ERC-721 NFT collection (1 NFT minted on deployment)                      |
| ERC1155              | `erc1155`              | ERC-1155 multi-token standard (batch minted on deployment)               |
| Piggybank            | `piggybank`            | Simple savings contract                                                  |
| Failing              | `failing`              | Contract that always reverts (for error testing)                         |
| Multisig             | `multisig`             | Multi-signature wallet                                                   |
| Entrypoint           | `entrypoint`           | ERC-4337 entry point for account abstraction                             |
| SimpleAccountFactory | `simpleAccountFactory` | ERC-4337 smart account factory                                           |
| VerifyingPaymaster   | `verifyingPaymaster`   | ERC-4337 paymaster for gas sponsorship                                   |

### Seeding Tools

| Tool                      | Description                                |
| ------------------------- | ------------------------------------------ |
| `mm_seed_contract`        | Deploy a single smart contract             |
| `mm_seed_contracts`       | Deploy multiple contracts in sequence      |
| `mm_get_contract_address` | Get the deployed address of a contract     |
| `mm_list_contracts`       | List all deployed contracts in the session |

### Hardfork Configuration

All seeding tools default to the `prague` hardfork but support configuring any EVM hardfork:

```json
{
  "contractName": "hst",
  "hardfork": "london"
}
```

### Example Workflows

#### Deploy ERC-20 Token for Testing

```
1. mm_launch { "stateMode": "default" }
2. mm_seed_contract { "contractName": "hst" }
   → Returns: { "contractAddress": "0x..." }
3. mm_describe_screen
4. [Import token using address, or wait for auto-detection]
5. [Test send/approve flows]
6. mm_cleanup
```

#### Launch with Pre-deployed Contracts

```json
mm_launch {
  "stateMode": "default",
  "seedContracts": ["hst", "nfts"]
}
```

Contracts are deployed before the extension loads, making them immediately available.

#### Query Deployed Contracts

```
mm_list_contracts
→ Returns: {
    "contracts": [
      { "contractName": "hst", "contractAddress": "0x...", "deployedAt": "..." },
      { "contractName": "nfts", "contractAddress": "0x...", "deployedAt": "..." }
    ]
  }
```

## Batching Multiple Steps

Use `mm_run_steps` to execute multiple tools in a single call. Ideal for known, deterministic flows where you don't need to inspect intermediate state.

### When to Use

- **Known flows**: Sequences learned from prior knowledge or documentation
- **Form fills**: Type into multiple fields, then click submit
- **Wizard steps**: Click through predictable UI sequences
- **Replaying successful flows**: Re-execute a known working sequence

### When NOT to Use

- **Exploration**: When you need to discover what's on screen
- **Conditional flows**: When next step depends on intermediate state
- **Debugging**: When you need to inspect each step's result

### Example: Batch Unlock Flow

```json
mm_run_steps {
  "steps": [
    { "tool": "mm_type", "args": { "testId": "unlock-password", "text": "correct horse battery staple" } },
    { "tool": "mm_click", "args": { "testId": "unlock-submit" } },
    { "tool": "mm_wait_for", "args": { "testId": "account-menu-icon", "timeoutMs": 10000 } }
  ],
  "stopOnError": true
}
```

### Options

| Option        | Default | Description                     |
| ------------- | ------- | ------------------------------- |
| `stopOnError` | `false` | Stop executing on first failure |

### Response

Returns a summary with individual step results:

```json
{
  "steps": [
    { "tool": "mm_type", "ok": true, "result": {...}, "meta": {...} },
    { "tool": "mm_click", "ok": true, "result": {...}, "meta": {...} },
    { "tool": "mm_wait_for", "ok": true, "result": {...}, "meta": {...} }
  ],
  "summary": {
    "ok": true,
    "total": 3,
    "succeeded": 3,
    "failed": 0,
    "durationMs": 1250
  }
}
```

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
| `MM_SEED_FAILED`             | Contract deployment failed            |
| `MM_CONTRACT_NOT_FOUND`      | Contract not deployed in session      |

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
