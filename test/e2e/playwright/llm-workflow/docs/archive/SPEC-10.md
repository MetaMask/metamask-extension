# SPEC: Decouple LLM-Workflow from MetaMask Extension

## Overview

This specification details how to decouple the `llm-workflow` MCP server solution from the MetaMask Extension codebase, enabling it to become a generic, reusable package that can support multiple browser extensions and environments.

### Goals

1. Create a generic `@metamask/client-mcp-core` package that can live in its own repository
2. Provide a thin wrapper in the MetaMask Extension repo that injects extension-specific dependencies
3. Support both **e2e environment** (current: local Anvil node, fixture server, mocked state) AND **prod-like environment** (real blockchain, no mocks)
4. Maintain backward compatibility with existing `mm_*` tool names
5. Enable other wallet extensions to adopt the same infrastructure

### Non-Goals

- Changing the MCP protocol or tool behavior
- Supporting multiple simultaneous sessions
- Adding new tools (beyond what's needed for abstraction)

### Decisions

| Question           | Decision                                                           |
| ------------------ | ------------------------------------------------------------------ |
| Architecture       | Capability-based dependency injection (not monolithic provider)    |
| Tool naming        | Keep `mm_*` as stable public API, add `lw_*` as canonical internal |
| Environment        | Launch-time configuration (not compile-time)                       |
| Knowledge store    | Generic core with optional enricher capability                     |
| State extraction   | Optional capability (not required)                                 |
| Package management | Separate repo for core, MetaMask wrapper stays in extension repo   |

---

## Current Architecture

### File Structure (Post-Phase 2)

```
metamask-extension/test/e2e/playwright/llm-workflow/
├── mcp-server/
│   ├── server.ts             # MCP server entry (thin wrapper)
│   └── metamask-provider.ts  # Session manager + capability wiring
├── capabilities/             # MetaMask-specific capability implementations
│   ├── build.ts
│   ├── fixture.ts
│   ├── chain.ts
│   ├── seeding.ts
│   ├── state-snapshot.ts
├── launcher/
│   ├── anvil-service.ts
│   └── state-inspector.ts
├── page-objects/
├── extension-launcher.ts     # Browser + extension lifecycle (no build/fixture)
 ├── launcher-types.ts         # Launcher-only types
 ├── fixture-helper.ts         # Fixture builder + presets
 └── anvil-seeder-wrapper.ts   # Smart contract deployment


 metamask-extension-mcp/src/
 ├── capabilities/             # Generic capability interfaces
 ├── mcp-server/               # MCP protocol core + tools
 └── launcher/                 # Generic launcher utilities
```

### Critical Coupling Points

| Coupling             | Files                                                      | External Dependency                                                               |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Fixture System**   | `capabilities/fixture.ts`, `fixture-helper.ts`             | `test/e2e/fixtures/fixture-builder.js`, `fixture-server.js`, `default-fixture.js` |
| **Anvil/Seeder**     | `anvil-seeder-wrapper.ts`, `launcher/anvil-service.ts`     | `test/e2e/seeder/anvil.ts`, `anvil-seeder.js`, `smart-contracts.js`               |
| **Build System**     | `capabilities/build.ts`, `mcp-server/metamask-provider.ts` | `yarn build:test`, `dist/chrome` path                                             |
| **State Extraction** | `launcher/state-inspector.ts`                              | `window.__METAMASK_STATE__`                                                       |
| **Page Objects**     | `page-objects/*`                                           | MetaMask-specific UI flows                                                        |

### Import Analysis

```typescript
// fixture-helper.ts
const FixtureBuilderClass = require('../../fixtures/fixture-builder');
const {
  defaultFixture,
  FIXTURE_STATE_METADATA_VERSION,
} = require('../../fixtures/default-fixture');

// anvil-seeder-wrapper.ts
import type { Anvil } from '../../seeder/anvil';
const AnvilSeeder = require('../../seeder/anvil-seeder');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

// launcher/anvil-service.ts
import { Anvil } from '../../../seeder/anvil';

// capabilities/fixture.ts
import FixtureServerClass from '../../../fixtures/fixture-server';

// mcp-server/metamask-provider.ts (build ownership)
const buildResult = await buildCapability.build({ force: false });
const extensionPath = buildResult.extensionPath;
```

---

## Target Architecture

### Capability-Based Design

Instead of a monolithic provider interface, define **small, optional capability interfaces**. This prevents MetaMask-specific assumptions from leaking into the core.

### Capability Interfaces

```typescript
// metamask-extension-mcp/src/capabilities/types.ts

// ==================== REQUIRED ====================

/**
 * Required: Launch a browser with extension loaded.
 * This is the only capability that MUST be implemented.
 */
interface BrowserCapability {
  launch(options: LaunchOptions): Promise<BrowserSession>;
  cleanup(): Promise<void>;
  getExtensionId(): string | undefined;
  getExtensionUrl(path: string): string;
}

// ==================== OPTIONAL ====================

/**
 * Optional: Build extension from source.
 * If not provided, mm_build tool is disabled.
 */
interface BuildCapability {
  build(options?: BuildOptions): Promise<BuildResult>;
  getExtensionPath(): string;
  isBuilt(): Promise<boolean>;
}

/**
 * Optional: Inject wallet state before launch.
 * If not provided, wallet starts in default/fresh state.
 */
interface FixtureCapability {
  start(state: WalletState): Promise<void>;
  stop(): Promise<void>;
  getDefaultState(): WalletState;
  getOnboardingState(): WalletState;
}

/**
 * Optional: Local blockchain node management.
 * If not provided, uses external RPC or none.
 */
interface ChainCapability {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

/**
 * Optional: Smart contract deployment.
 * Requires ChainCapability. If not provided, seeding tools disabled.
 */
interface ContractSeedingCapability {
  deployContract(
    name: string,
    options?: DeployOptions,
  ): Promise<ContractDeployment>;
  getContractAddress(name: string): Promise<string | undefined>;
  listDeployedContracts(): Promise<ContractInfo[]>;
  getAvailableContracts(): string[];
}

/**
 * Optional: Extract wallet internal state.
 * If not provided, relies on UI discovery only.
 */
interface StateSnapshotCapability {
  getState(page: Page, options: StateOptions): Promise<StateSnapshot>;
  detectCurrentScreen(page: Page): Promise<string>;
}

/**
 * Optional: Enrich observations with wallet-specific data.
 * Allows provider to add custom data to knowledge store records.
 */
interface ObservationEnricherCapability {
  enrich(context: {
    page: Page;
    baseObservation: Observation;
  }): Promise<EnrichedData>;
}
```

### WorkflowContext

```typescript
// metamask-extension-mcp/src/capabilities/types.ts

/**
 * Runtime container for all capabilities.
 * Tools receive this context and check for capability availability.
 */
interface WorkflowContext {
  // Required
  browser: BrowserCapability;

  // Optional - check before use
  build?: BuildCapability;
  fixture?: FixtureCapability;
  chain?: ChainCapability;
  contractSeeding?: ContractSeedingCapability;
  stateSnapshot?: StateSnapshotCapability;
  observationEnricher?: ObservationEnricherCapability;

  // Configuration
  config: EnvironmentConfig;
}

type EnvironmentConfig = E2EEnvironmentConfig | ProdEnvironmentConfig;

interface E2EEnvironmentConfig {
  environment: 'e2e';
  extensionName: string;
  defaultPassword?: string;
  defaultChainId?: number;
  toolPrefix?: string; // 'mm' | 'lw' | custom
  artifactsDir?: string;
  ports?: {
    anvil?: number;
    fixtureServer?: number;
  };
  fork?: {
    url?: string;
    blockNumber?: number;
  };
}

interface ProdEnvironmentConfig {
  environment: 'prod';
  extensionName: string;
  defaultPassword?: string;
  defaultChainId?: number;
  toolPrefix?: string;
  artifactsDir?: string;
}
```

### Package Structure

```
metamask-extension-mcp/                 # SEPARATE REPO (generic core)
├── src/                               # /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
 │   ├── capabilities/
 │   │   ├── types.ts                   # Capability interfaces + WorkflowContext
 │   │   └── index.ts

│   ├── mcp-server/
│   │   ├── server.ts                  # MCP protocol
│   │   ├── session-manager.ts         # Browser lifecycle
│   │   ├── knowledge-store.ts         # Generic step recording
│   │   ├── discovery.ts               # TestId + a11y collection
│   │   ├── schemas.ts                 # Zod validation
│   │   ├── types/                     # Type definitions
│   │   ├── utils/                     # Utility functions
│   │   └── tools/
│   │       ├── registry.ts            # Capability-gated registration
│   │       ├── interaction.ts         # click, type, wait_for
│   │       ├── discovery-tools.ts
│   │       ├── screenshot.ts
│   │       ├── navigation.ts
│   │       ├── knowledge.ts
│   │       └── batch.ts
│   ├── launcher/
│   │   ├── extension-launcher.ts      # Generic extension launch
│   │   ├── extension-id-resolver.ts
│   │   ├── extension-readiness.ts
│   │   └── retry.ts
│   └── index.ts                       # Public exports
├── package.json                       # @metamask/client-mcp-core
├── tsconfig.json
└── tsconfig.build.json

metamask-extension/                     # EXISTING REPO (MetaMask wrapper)
└── test/e2e/playwright/llm-workflow/
    ├── server.ts                       # Entry point (uses linked package)
    ├── metamask-provider.ts            # Session manager + capability wiring
    ├── capabilities/
    │   ├── build.ts                    # yarn build:test, dist/chrome
    │   ├── fixture.ts                  # FixtureServer + FixtureBuilder
    │   ├── chain.ts                    # Anvil wrapper
    │   ├── seeding.ts                  # AnvilSeeder + SMART_CONTRACTS
    │   ├── state-snapshot.ts           # window.__METAMASK_STATE__
    ├── launcher/                       # MM-specific launcher services
    │   ├── anvil-service.ts
    │   └── state-inspector.ts
     ├── page-objects/                   # MM-specific UI flows
     └── launcher-types.ts               # Launcher-only types
```

**Local Development with yalc:**

```bash
# Link the package for development
cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
yarn build && yalc publish

cd /path/to/metamask-extension
yalc add @metamask/client-mcp-core
```

---

## Tool Strategy

### Tool Naming

**Strategy**: Keep `mm_*` as stable public API, add `lw_*` as canonical internal names.

```typescript
// metamask-extension-mcp - canonical tool IDs
const CANONICAL_TOOLS = {
  lw_build: buildToolHandler,
  lw_launch: launchToolHandler,
  lw_cleanup: cleanupToolHandler,
  lw_click: clickToolHandler,
  lw_type: typeToolHandler,
  // ...
};

// MetaMask wrapper - register aliases for backward compatibility
const TOOL_ALIASES: Record<string, string> = {
  mm_build: 'lw_build',
  mm_launch: 'lw_launch',
  mm_cleanup: 'lw_cleanup',
  mm_click: 'lw_click',
  mm_type: 'lw_type',
  mm_wait_for: 'lw_wait_for',
  mm_screenshot: 'lw_screenshot',
  mm_describe_screen: 'lw_describe_screen',
  mm_list_testids: 'lw_list_testids',
  mm_accessibility_snapshot: 'lw_accessibility_snapshot',
  mm_get_state: 'lw_get_state',
  mm_navigate: 'lw_navigate',
  mm_wait_for_notification: 'lw_wait_for_notification',
  mm_switch_to_tab: 'lw_switch_to_tab',
  mm_close_tab: 'lw_close_tab',
  mm_knowledge_last: 'lw_knowledge_last',
  mm_knowledge_search: 'lw_knowledge_search',
  mm_knowledge_summarize: 'lw_knowledge_summarize',
  mm_knowledge_sessions: 'lw_knowledge_sessions',
  mm_seed_contract: 'lw_seed_contract',
  mm_seed_contracts: 'lw_seed_contracts',
  mm_get_contract_address: 'lw_get_contract_address',
  mm_list_contracts: 'lw_list_contracts',
  mm_run_steps: 'lw_run_steps',
};
```

### Tool Categorization

| Category      | Tools                                                                     | Capability Dependency                              |
| ------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| **Core**      | click, type, wait_for, screenshot, navigate, switch_tab, close_tab        | BrowserCapability (required)                       |
| **Discovery** | list_testids, accessibility_snapshot, describe_screen                     | BrowserCapability                                  |
| **Knowledge** | knowledge_last, knowledge_search, knowledge_summarize, knowledge_sessions | None                                               |
| **Batch**     | run_steps                                                                 | None                                               |
| **Build**     | build                                                                     | BuildCapability (optional)                         |
| **Session**   | launch, cleanup                                                           | Browser + Chain + Fixture                          |
| **State**     | get_state                                                                 | StateSnapshotCapability (optional, fallback to UI) |
| **Seeding**   | seed_contract, seed_contracts, get_contract_address, list_contracts       | ContractSeedingCapability (optional)               |

### Capability-Gated Tool Registration

```typescript
// metamask-extension-mcp/src/mcp-server/tools/registry.ts

export function createToolRegistry(context: WorkflowContext): ToolRegistry {
  const tools: Tool[] = [];

  // Always available (require BrowserCapability)
  tools.push(
    clickTool(context),
    typeTool(context),
    waitForTool(context),
    screenshotTool(context),
    navigateTool(context),
    switchToTabTool(context),
    closeTabTool(context),
    listTestIdsTool(context),
    accessibilitySnapshotTool(context),
    describeScreenTool(context),
  );

  // Knowledge tools (no capability required)
  tools.push(
    knowledgeLastTool(context),
    knowledgeSearchTool(context),
    knowledgeSummarizeTool(context),
    knowledgeSessionsTool(context),
    runStepsTool(context),
  );

  // Session management
  tools.push(
    launchTool(context), // Uses chain, fixture if available
    cleanupTool(context),
  );

  // Conditional: Build
  if (context.build) {
    tools.push(buildTool(context.build));
  }

  // Conditional: State extraction
  tools.push(getStateTool(context)); // Falls back to UI-only if no stateSnapshot

  // Conditional: Contract seeding
  if (context.contractSeeding) {
    tools.push(
      seedContractTool(context.contractSeeding),
      seedContractsTool(context.contractSeeding),
      getContractAddressTool(context.contractSeeding),
      listContractsTool(context.contractSeeding),
    );
  }

  return new ToolRegistry(tools, context.config.toolPrefix);
}
```

---

## Environment Support

### E2E Environment (Current Setup)

```typescript
// MetaMask Extension - test/e2e/playwright/llm-workflow/server.ts

import { createMCPServer } from '@metamask/client-mcp-core';
import { createMetaMaskProvider } from './metamask-provider';

const context = createMetaMaskProvider({
  environment: 'e2e',

  build: {
    command: 'yarn build:test',
    outputPath: 'dist/chrome',
    timeout: 600000,
  },

  chain: {
    type: 'anvil',
    port: 8545,
    chainId: 1337,
  },

  fixture: {
    port: 12345,
    defaultPassword: 'correct horse battery staple',
  },

  seeding: {
    availableContracts: [
      'hst',
      'nfts',
      'erc1155',
      'piggybank',
      'failing',
      'multisig',
      'entrypoint',
      'simpleAccountFactory',
      'verifyingPaymaster',
    ],
  },

  stateSnapshot: {
    windowVar: '__METAMASK_STATE__',
  },
});

const server = createMCPServer(context);
server.start();
```

### Prod-Like Environment (New)

```typescript
const context = createMetaMaskProvider({
  environment: 'prod',

  build: {
    // Use pre-built extension
    outputPath: '/path/to/prebuilt/extension',
    skipBuild: true,
  },

  chain: {
    type: 'remote',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    chainId: 1,
  },

  // NO fixture injection - manual wallet setup required
  // NO contract seeding - uses existing contracts

  stateSnapshot: {
    windowVar: '__METAMASK_STATE__',
  },
});
```

### Capability Availability by Environment

| Capability                | e2e Mode          | prod Mode                |
| ------------------------- | ----------------- | ------------------------ |
| BrowserCapability         | Required          | Required                 |
| BuildCapability           | Available         | Optional (skipBuild)     |
| FixtureCapability         | Available         | Not Available            |
| ChainCapability           | Available (Anvil) | Optional (read-only RPC) |
| ContractSeedingCapability | Available         | Not Available            |
| StateSnapshotCapability   | Available         | Available                |

---

## Migration Path

### Phase 1: In-Place Refactoring (1-2 days)

**Goal**: Introduce capability interfaces without changing file structure.

#### Step 1.1: Create Capability Interface Files

Create new file: `llm-workflow/capabilities/types.ts`

```typescript
// All capability interfaces defined here
export interface BrowserCapability { ... }
export interface BuildCapability { ... }
// ... etc
```

#### Step 1.2: Create MetaMask Capability Implementations

```
llm-workflow/capabilities/
├── types.ts           # Interfaces (Step 1.1)
├── build.ts           # Wraps yarn build:test
├── fixture.ts         # Wraps FixtureServer + FixtureBuilder
├── chain.ts           # Wraps Anvil
├── seeding.ts         # Wraps AnvilSeeder + SMART_CONTRACTS
├── state-snapshot.ts  # Wraps window.__METAMASK_STATE__
```

#### Step 1.3: Create WorkflowContext

```typescript
// llm-workflow/capabilities/types.ts

export function createWorkflowContext(
  options: ProviderOptions,
): WorkflowContext {
  const context: WorkflowContext = {
    browser: new MetaMaskBrowserCapability(options),
    config: {
      environment: options.environment,
      extensionName: 'MetaMask',
      defaultPassword: options.fixture?.defaultPassword,
      defaultChainId: options.chain?.chainId,
      toolPrefix: 'mm',
    },
  };

  if (options.build && !options.build.skipBuild) {
    context.build = new MetaMaskBuildCapability(options.build);
  }

  if (options.fixture) {
    context.fixture = new MetaMaskFixtureCapability(options.fixture);
  }

  if (options.chain) {
    context.chain = new MetaMaskChainCapability(options.chain);

    if (options.seeding) {
      context.contractSeeding = new MetaMaskSeedingCapability(
        options.seeding,
        context.chain,
      );
    }
  }

  if (options.stateSnapshot) {
    context.stateSnapshot = new MetaMaskStateSnapshotCapability(
      options.stateSnapshot,
    );
  }

  return context;
}
```

#### Step 1.4: Refactor Tool Handlers

Update each tool handler to receive capabilities from context instead of direct imports.

**Before:**

```typescript
// tools/build.ts
import { execSync } from 'child_process';

export async function handleBuild(input: BuildInput): Promise<BuildResult> {
  execSync('yarn build:test', { cwd: process.cwd() });
  // ...
}
```

**After:**

```typescript
// tools/build.ts
export function createBuildTool(buildCapability: BuildCapability) {
  return async function handleBuild(input: BuildInput): Promise<BuildResult> {
    return buildCapability.build(input);
  };
}
```

#### Step 1.5: Update Session Manager

```typescript
// session-manager.ts
export class SessionManager {
  private context: WorkflowContext;

  constructor(context: WorkflowContext) {
    this.context = context;
  }

  async launch(input: LaunchInput): Promise<LaunchResult> {
    // Use context.chain?.start() instead of direct Anvil import
    if (this.context.chain) {
      await this.context.chain.start();
    }

    // Use context.fixture?.start() instead of direct FixtureServer import
    if (this.context.fixture && input.stateMode !== 'onboarding') {
      const state =
        input.stateMode === 'default'
          ? this.context.fixture.getDefaultState()
          : input.customFixture;
      await this.context.fixture.start(state);
    }

    // Use context.browser.launch() instead of direct launcher import
    return this.context.browser.launch(input);
  }
}
```

#### Step 1.6: Update server.ts

```typescript
// server.ts
import { createMetaMaskE2EContext } from './capabilities/factory';
import { createToolRegistry } from './mcp-server/tools/registry';

const context = createMetaMaskE2EContext({
  environment: 'e2e',
  build: { command: 'yarn build:test', outputPath: 'dist/chrome' },
  chain: { type: 'anvil', port: 8545, chainId: 1337 },
  fixture: { port: 12345, defaultPassword: 'correct horse battery staple' },
  seeding: { availableContracts: ['hst', 'nfts', ...] },
  stateSnapshot: { windowVar: '__METAMASK_STATE__' },
});

const toolRegistry = createToolRegistry(context);
const server = new MCPServer(toolRegistry);
server.start();
```

### Phase 2: Extract to Separate Package (3+ days)

#### Step 2.1: Setup Package in Existing Repository

**Repository Location:** `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp`

The repository has already been created with `git init`. Setup the package structure:

```bash
# Package structure
metamask-extension-mcp/
├── src/
 │   ├── capabilities/
 │   │   ├── types.ts           # Capability interfaces + WorkflowContext
 │   │   └── index.ts

│   ├── mcp-server/
│   │   ├── server.ts
│   │   ├── session-manager.ts
│   │   ├── knowledge-store.ts
│   │   ├── discovery.ts
│   │   ├── schemas.ts
│   │   ├── types/
│   │   ├── utils/
│   │   └── tools/
│   ├── launcher/
│   │   ├── extension-launcher.ts
│   │   ├── extension-id-resolver.ts
│   │   └── ...
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.js
└── README.md
```

#### Step 2.2: Move Generic Code to Core

Files to move:

- `mcp-server/server.ts` (with capability injection)
- `mcp-server/session-manager.ts` (with capability injection)
- `mcp-server/knowledge-store.ts`
- `mcp-server/discovery.ts`
- `mcp-server/schemas.ts` (generic parts)
- `mcp-server/tools/*.ts` (refactored for capabilities)
- `mcp-server/types/*.ts`
- `mcp-server/utils/*.ts`
- `launcher/extension-id-resolver.ts`
- `launcher/extension-readiness.ts`
- `launcher/retry.ts`
- `launcher/console-error-buffer.ts`

Files that stay in MetaMask repo:

- `capabilities/*.ts` (MetaMask implementations)
- `launcher/anvil-service.ts`
- `launcher/state-inspector.ts`
- `page-objects/*`
- `launcher-types.ts` (launcher-only types)
- `fixture-helper.ts`

- `anvil-seeder-wrapper.ts`

#### Step 2.3: Create Tool Alias System

```typescript
// metamask-extension-mcp/src/mcp-server/tools/registry.ts

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor(tools: Tool[], prefix: string = 'lw') {
    for (const tool of tools) {
      const canonicalName = `${prefix}_${tool.baseName}`;
      this.tools.set(canonicalName, tool);
    }
  }

  registerAliases(aliases: Record<string, string>) {
    for (const [alias, canonical] of Object.entries(aliases)) {
      this.aliases.set(alias, canonical);
    }
  }

  getTool(name: string): Tool | undefined {
    // Try direct lookup
    if (this.tools.has(name)) {
      return this.tools.get(name);
    }
    // Try alias lookup
    const canonical = this.aliases.get(name);
    if (canonical) {
      return this.tools.get(canonical);
    }
    return undefined;
  }

  listTools(): ToolDefinition[] {
    const definitions: ToolDefinition[] = [];

    // Add canonical tools
    for (const [name, tool] of this.tools) {
      definitions.push({ name, ...tool.definition });
    }

    // Add aliases
    for (const [alias, canonical] of this.aliases) {
      const tool = this.tools.get(canonical);
      if (tool) {
        definitions.push({ name: alias, ...tool.definition });
      }
    }

    return definitions;
  }
}
```

#### Step 2.4: Update MetaMask Wrapper

```typescript
// metamask-extension/test/e2e/playwright/llm-workflow/server.ts

import {
  createMCPServer,
  ToolRegistry,
} from '@metamask/client-mcp-core';
import {
  createMetaMaskProvider,
  METAMASK_TOOL_ALIASES,
} from './metamask-provider';

const context = createMetaMaskProvider({
  environment: 'e2e',
  // ... configuration
});

const server = createMCPServer(context, {
  aliases: METAMASK_TOOL_ALIASES,
});

server.start();
```

#### Step 2.5: Link Package for Local Development

Use yalc to link the core package for local development:

```bash
# In metamask-extension-mcp repo
cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
yarn build
yalc publish

# In metamask-extension repo
cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2
yalc add @metamask/client-mcp-core

# After code changes, push updates
cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
yarn build && yalc push
```

**Alternative: yarn link**

```bash
# In metamask-extension-mcp repo
yarn link

# In metamask-extension repo
yarn link @metamask/client-mcp-core
```

### Phase 3: Prod-Like Environment Support

#### Step 3.1: Add Environment Config Schema

```typescript
// metamask-extension-mcp/src/capabilities/types.ts

type EnvironmentMode = 'e2e' | 'prod';

interface ProdEnvironmentConfig {
  mode: 'prod';
  chain?: {
    type: 'remote';
    rpcUrl: string;
    chainId: number;
  };
  // No fixture, no seeding
  walletSetup: 'manual'; // User must setup wallet
}

interface E2EEnvironmentConfig {
  mode: 'e2e';
  chain: {
    type: 'anvil' | 'ganache';
    port: number;
    chainId: number;
  };
  fixture: {
    port: number;
    defaultPassword: string;
  };
  seeding?: {
    availableContracts: string[];
  };
}
```

#### Step 3.2: Implement Capability Availability Errors

```typescript
// metamask-extension-mcp/src/mcp-server/tools/seeding.ts

export function createSeedContractTool(context: WorkflowContext) {
  return {
    name: 'seed_contract',
    handler: async (input: SeedContractInput) => {
      if (!context.contractSeeding) {
        return {
          ok: false,
          error: {
            code: 'MM_CAPABILITY_NOT_AVAILABLE',
            message:
              'Contract seeding is not available in prod environment. Use existing contracts or switch to e2e mode.',
          },
        };
      }

      return context.contractSeeding.deployContract(
        input.contractName,
        input.options,
      );
    },
  };
}
```

#### Step 3.3: Add Prerequisites Messaging

```typescript
// metamask-extension-mcp/src/mcp-server/tools/launch.ts

export function createLaunchTool(context: WorkflowContext) {
  return {
    handler: async (input: LaunchInput) => {
      const prerequisites: string[] = [];

      if (context.config.environment === 'prod') {
        if (!context.fixture) {
          prerequisites.push(
            'Wallet must be installed and configured manually',
          );
        }
        if (!context.chain) {
          prerequisites.push('Network must be configured in wallet settings');
        }
        prerequisites.push(
          'Wallet must be unlocked manually before interactions',
        );
      }

      const result = await context.browser.launch(input);

      return {
        ...result,
        prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      };
    },
  };
}
```

---

## Risk Assessment & Mitigations

| Risk                                                 | Likelihood | Impact | Mitigation                                                                                   |
| ---------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------- |
| **Leaky Abstraction** - Core becomes MetaMask-shaped | Medium     | High   | Capability gating; keep wallet flows provider-owned; review core for MM-specific assumptions |
| **Capability Creep** - Too many interfaces           | Medium     | Medium | Start minimal; version interfaces; avoid exporting internals                                 |
| **Tool Schema Instability** - Breaking LLM agents    | Medium     | High   | Keep `mm_*` stable forever; deprecate slowly with aliases; version tool schemas              |
| **Prod Mode Surprises** - Flaky without fixtures     | High       | Medium | Explicit prerequisites; clear error messages; document manual steps                          |
| **Security Boundaries** - State/secrets leakage      | Low        | High   | Default-redact snapshots; allowlists; audit before extraction                                |
| **Integration Complexity** - Hard to test both modes | Medium     | Medium | Comprehensive integration tests; CI for both environments                                    |

---

## Success Criteria

1. **Decoupled Packages**: `@metamask/client-mcp-core` has zero MetaMask-specific imports
2. **Backward Compatibility**: All existing `mm_*` tools work without changes to agent configurations
3. **Environment Support**: Same server binary supports both e2e and prod modes via configuration
4. **Capability Isolation**: Tools gracefully handle missing capabilities with clear error messages
5. **Clean Provider Interface**: MetaMask wrapper is < 500 lines, mostly configuration
6. **Local Development**: yalc/yarn link workflow allows rapid iteration without npm publishing
7. **Documentation**: Clear docs for implementing providers for other extensions

---

## Implementation Tasks

### Phase 1: In-Place Refactoring - COMPLETE

| Task ID  | Description                                                           | Effort | Dependencies  | Status |
| -------- | --------------------------------------------------------------------- | ------ | ------------- | ------ |
| **1.1**  | Create capability interface files in `capabilities/types.ts`          | 2h     | -             | Done   |
| **1.2**  | Implement `BuildCapability` wrapping `yarn build:test`                | 1h     | 1.1           | Done   |
| **1.3**  | Implement `FixtureCapability` wrapping FixtureServer + FixtureBuilder | 2h     | 1.1           | Done   |
| **1.4**  | Implement `ChainCapability` wrapping Anvil                            | 2h     | 1.1           | Done   |
| **1.5**  | Implement `ContractSeedingCapability` wrapping AnvilSeeder            | 2h     | 1.1, 1.4      | Done   |
| **1.6**  | Implement `StateSnapshotCapability` wrapping state-inspector          | 1h     | 1.1           | Done   |
| **1.7**  | Create `WorkflowContext` aggregating capabilities                     | 1h     | 1.1-1.6       | Done   |
| **1.8**  | Refactor `tools/build.ts` to use BuildCapability                      | 1h     | 1.2, 1.7      | Done   |
| **1.9**  | Refactor `tools/launch.ts` to use capabilities                        | 2h     | 1.3, 1.4, 1.7 | Done   |
| **1.10** | Refactor `tools/seeding.ts` to use ContractSeedingCapability          | 1h     | 1.5, 1.7      | Done   |
| **1.11** | Refactor `tools/state.ts` to use StateSnapshotCapability              | 1h     | 1.6, 1.7      | Done   |
| **1.12** | Update `session-manager.ts` to use WorkflowContext                    | 2h     | 1.7           | Done   |
| **1.13** | Update `server.ts` to construct capabilities                          | 1h     | 1.7-1.12      | Done   |
| **1.14** | Add unit tests for capability implementations                         | 3h     | 1.2-1.6       | Done   |
| **1.15** | Add integration test verifying existing behavior unchanged            | 2h     | 1.13          | Done   |

**Phase 1 Completed**: 2025-01-26

**Files Created:**

- `capabilities/types.ts` - All capability interfaces
- `capabilities/types.ts` - Capability interfaces and WorkflowContext

- `capabilities/build.ts` - MetaMaskBuildCapability
- `capabilities/fixture.ts` - MetaMaskFixtureCapability
- `capabilities/chain.ts` - MetaMaskChainCapability
- `capabilities/seeding.ts` - MetaMaskContractSeedingCapability
- `capabilities/state-snapshot.ts` - MetaMaskStateSnapshotCapability
- `capabilities/factory.ts` - Factory functions (createMetaMaskE2EContext, createMetaMaskProdContext)
- `capabilities/index.ts` - Public exports
- `capabilities/*.test.ts` - Unit tests (51 tests)
- `capabilities/integration.test.ts` - Integration tests (10 tests)
- `jest.config.js` - Jest configuration for capability tests
- `tsconfig.json` - TypeScript configuration

**Files Modified:**

- `mcp-server/server.ts` - Initialize and inject WorkflowContext
- `mcp-server/session-manager.ts` - Store context and provide getter methods
- `mcp-server/tools/registry.ts` - Capability injection wrappers
- `mcp-server/tools/build.ts` - Accept optional BuildCapability
- `mcp-server/tools/seeding.ts` - Accept optional ContractSeedingCapability
- `mcp-server/tools/state.ts` - Accept optional StateSnapshotCapability

**Test Results:** 61 tests passing (51 unit + 10 integration)

### Phase 2: Extract to Separate Package (Estimated: 3+ days)

**Target Repository:** `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp`

**Local Development Strategy:** Use `yalc` or `yarn link` for testing instead of npm publishing.

#### Package Linking Options

**Option A: yalc (Recommended)**

```bash
# In metamask-extension-mcp repo
npm install -g yalc
yalc publish

# In metamask-extension repo
yalc add @metamask/client-mcp-core
# or
yalc link @metamask/client-mcp-core

# After making changes to core, republish
cd /path/to/metamask-extension-mcp
yalc push  # automatically updates linked consumers
```

**Option B: yarn link**

```bash
# In metamask-extension-mcp repo
yarn link

# In metamask-extension repo
yarn link @metamask/client-mcp-core
```

#### Task Breakdown

| Task ID  | Description                                              | Effort | Dependencies     | Assignee |
| -------- | -------------------------------------------------------- | ------ | ---------------- | -------- |
| **2.1**  | Setup package structure in `metamask-extension-mcp` repo | 2h     | Phase 1          |          |
| **2.2**  | Move capability interfaces to core                       | 1h     | 2.1              |          |
| **2.3**  | Move MCP server code to core (server.ts, schemas.ts)     | 2h     | 2.2              |          |
| **2.4**  | Move session manager to core                             | 2h     | 2.2, 2.3         |          |
| **2.5**  | Move discovery + knowledge store to core                 | 2h     | 2.2              |          |
| **2.6**  | Move generic tool handlers to core                       | 3h     | 2.3, 2.4         |          |
| **2.7**  | Move launcher utilities to core                          | 1h     | 2.2              |          |
| **2.8**  | Create tool alias system (`mm_*` -> `lw_*`)              | 2h     | 2.6              |          |
| **2.9**  | Create `metamask-provider.ts` in extension repo          | 2h     | 2.1-2.7          |          |
| **2.10** | Setup yalc/yarn link for local development               | 1h     | 2.1              |          |
| **2.11** | Update extension `server.ts` to use linked package       | 1h     | 2.8, 2.9, 2.10   |          |
| **2.12** | Add unit tests for core package                          | 4h     | 2.3-2.7          |          |
| **2.13** | Add integration tests for MetaMask wrapper               | 3h     | 2.11             |          |
| **2.14** | Verify full MCP server workflow works with linked pkg    | 2h     | 2.11, 2.12, 2.13 |          |

#### Task 2.1: Setup Package Structure

Create the following structure in `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp`:

```
metamask-extension-mcp/
├── src/
 │   ├── capabilities/
 │   │   ├── types.ts           # Capability interfaces + WorkflowContext (from Phase 1)
 │   │   └── index.ts

│   ├── mcp-server/
│   │   ├── server.ts          # Generic MCP server
│   │   ├── session-manager.ts # Browser session lifecycle
│   │   ├── knowledge-store.ts # Step recording
│   │   ├── discovery.ts       # TestId + a11y collection
│   │   ├── schemas.ts         # Zod validation schemas
│   │   ├── tool-definitions.ts
│   │   ├── tokenization.ts
│   │   ├── types/             # Type definitions
│   │   ├── utils/             # Utility functions
│   │   └── tools/             # Generic tool handlers
│   │       ├── registry.ts
│   │       ├── run-tool.ts
│   │       ├── helpers.ts
│   │       ├── interaction.ts
│   │       ├── navigation.ts
│   │       ├── discovery-tools.ts
│   │       ├── screenshot.ts
│   │       ├── knowledge.ts
│   │       ├── batch.ts
│   │       └── error-classification.ts
│   ├── launcher/
│   │   ├── extension-launcher.ts   # Generic extension launcher
│   │   ├── extension-id-resolver.ts
│   │   ├── extension-readiness.ts
│   │   ├── console-error-buffer.ts
│   │   └── retry.ts
│   └── index.ts               # Public exports
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.js
├── .gitignore
└── README.md
```

**package.json:**

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "zod": "^3.24.2"
  },
  "description": "Generic MCP server for browser extension visual testing with LLM agents",
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.10",
    "jest": "^29.7.0",
    "playwright": "^1.49.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.7.3"
  },
  "files": ["dist"],
  "keywords": [
    "mcp",
    "metamask",
    "playwright",
    "llm",
    "visual-testing",
    "browser-extension"
  ],
  "license": "MIT",
  "main": "dist/index.js",
  "name": "@metamask/client-mcp-core",
  "peerDependencies": {
    "@playwright/test": "^1.49.0",
    "playwright": "^1.49.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/metamask/metamask-extension-mcp.git"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:watch": "tsc -p tsconfig.build.json --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "clean": "rm -rf dist",
    "prepublishOnly": "yarn clean && yarn build",
    "yalc:publish": "yalc publish --push"
  },
  "types": "dist/index.d.ts",
  "version": "0.1.0"
}
```

#### Task 2.10: Setup yalc for Local Development

```bash
# Install yalc globally (if not already installed)
npm install -g yalc

# In metamask-extension-mcp repo
cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
yarn build
yalc publish

# In metamask-extension repo
cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2
yalc add @metamask/client-mcp-core

# Add to .gitignore in metamask-extension
echo ".yalc" >> .gitignore
echo "yalc.lock" >> .gitignore
```

**Development Workflow:**

```bash
# After making changes to core package
cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
yarn build && yalc push

# Changes automatically propagate to metamask-extension
# Test the MCP server
cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2
yarn tsx test/e2e/playwright/llm-workflow/mcp-server/server.ts
```

#### Files That Move to Core Package

**FROM** `test/e2e/playwright/llm-workflow/` **TO** `metamask-extension-mcp/src/`:

| Source File             | Destination             | Notes                  |
| ----------------------- | ----------------------- | ---------------------- |
| `capabilities/types.ts` | `capabilities/types.ts` | Interfaces and Context |

| `mcp-server/server.ts` | `mcp-server/server.ts` | Remove MM-specific init |
| `mcp-server/session-manager.ts` | `mcp-server/session-manager.ts` | Use capability injection |
| `mcp-server/knowledge-store.ts` | `mcp-server/knowledge-store.ts` | As-is |
| `mcp-server/discovery.ts` | `mcp-server/discovery.ts` | As-is |
| `mcp-server/schemas.ts` | `mcp-server/schemas.ts` | As-is |
| `mcp-server/tool-definitions.ts` | `mcp-server/tool-definitions.ts` | As-is |
| `mcp-server/tokenization.ts` | `mcp-server/tokenization.ts` | As-is |
| `mcp-server/types/*.ts` | `mcp-server/types/*.ts` | As-is |
| `mcp-server/utils/*.ts` | `mcp-server/utils/*.ts` | As-is |
| `mcp-server/tools/registry.ts` | `mcp-server/tools/registry.ts` | Add capability gating |
| `mcp-server/tools/run-tool.ts` | `mcp-server/tools/run-tool.ts` | As-is |
| `mcp-server/tools/helpers.ts` | `mcp-server/tools/helpers.ts` | As-is |
| `mcp-server/tools/interaction.ts` | `mcp-server/tools/interaction.ts` | As-is |
| `mcp-server/tools/navigation.ts` | `mcp-server/tools/navigation.ts` | As-is |
| `mcp-server/tools/discovery-tools.ts` | `mcp-server/tools/discovery-tools.ts` | As-is |
| `mcp-server/tools/screenshot.ts` | `mcp-server/tools/screenshot.ts` | As-is |
| `mcp-server/tools/knowledge.ts` | `mcp-server/tools/knowledge.ts` | As-is |
| `mcp-server/tools/batch.ts` | `mcp-server/tools/batch.ts` | As-is |
| `mcp-server/tools/error-classification.ts` | `mcp-server/tools/error-classification.ts` | As-is |
| `launcher/extension-id-resolver.ts` | `launcher/extension-id-resolver.ts` | As-is |
| `launcher/extension-readiness.ts` | `launcher/extension-readiness.ts` | As-is |
| `launcher/console-error-buffer.ts` | `launcher/console-error-buffer.ts` | As-is |
| `launcher/retry.ts` | `launcher/retry.ts` | As-is |

**Files That STAY in MetaMask Extension Repo:**

| File                             | Reason                          |
| -------------------------------- | ------------------------------- |
| `capabilities/build.ts`          | MetaMask-specific build command |
| `capabilities/fixture.ts`        | Uses MM fixture-builder         |
| `capabilities/chain.ts`          | Uses MM Anvil wrapper           |
| `capabilities/seeding.ts`        | Uses MM AnvilSeeder             |
| `capabilities/state-snapshot.ts` | Uses MM state inspector         |
| `capabilities/factory.ts`        | MM context factory              |
| `launcher/anvil-service.ts`      | MM Anvil integration            |
| `launcher-types.ts`              | Launcher-only type definitions  |
| `launcher/state-inspector.ts`    | MM state extraction             |

| `page-objects/*` | MM-specific UI flows |
| `fixture-helper.ts` | MM fixture builder |
| `anvil-seeder-wrapper.ts` | MM contract seeding |
| `mcp-server/tools/build.ts` | Delegates to BuildCapability |
| `mcp-server/tools/launch.ts` | Uses all capabilities |
| `mcp-server/tools/cleanup.ts` | Uses capabilities |
| `mcp-server/tools/state.ts` | Uses StateSnapshotCapability |
| `mcp-server/tools/seeding.ts` | Uses ContractSeedingCapability |

### Post-Phase 2 Cleanup (Completed 2026-01-26)

- **Type boundaries**: Introduced `launcher-types.ts` and added `LauncherLaunchOptions` alias for clarity.

- **Build ownership**: Moved build execution to `BuildCapability` in the session manager; launcher now only validates that the extension exists.
- **Fixture ownership**: `FixtureCapability` now owns fixture server lifecycle and state resolution; `fixture-server-service.ts` removed.

### Phase 3: Prod-Like Environment Support (Completed: 2026-01-26)

| Task ID | Description                                                        | Effort | Dependencies | Assignee |
| ------- | ------------------------------------------------------------------ | ------ | ------------ | -------- |
| **3.1** | Add environment config schema and types                            | 1h     | Phase 2      |          |
| **3.2** | Update MetaMask prod context factory (no fixture/chain by default) | 1h     | 3.1          |          |
| **3.3** | Gate fixture/build usage in session manager for prod mode          | 2h     | 3.2          |          |
| **3.4** | Add "capability not available" error handling to MCP tools         | 2h     | 3.1          |          |
| **3.5** | Add prerequisites messaging in launch response                     | 1h     | 3.3, 3.4     |          |
| **3.6** | Create `NoOpChainCapability` or remote-chain adapter for prod      | 1h     | 3.2          |          |
| **3.7** | Update documentation for prod mode usage                           | 2h     | 3.5          |          |
| **3.8** | Add prod-mode integration tests                                    | 3h     | 3.6          |          |
| **3.9** | Add example provider for another wallet (template)                 | 2h     | Phase 2      |          |

---

## Appendix A: MetaMask Capability Implementations

### BuildCapability Implementation

```typescript
// capabilities/build.ts

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import type {
  BuildCapability,
  BuildOptions,
  BuildResult,
} from '@metamask/client-mcp-core';

export class MetaMaskBuildCapability implements BuildCapability {
  private options: { command: string; outputPath: string; timeout: number };

  constructor(options: {
    command?: string;
    outputPath?: string;
    timeout?: number;
  }) {
    this.options = {
      command: options.command ?? 'yarn build:test',
      outputPath: options.outputPath ?? 'dist/chrome',
      timeout: options.timeout ?? 600000,
    };
  }

  async build(options?: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now();

    try {
      execSync(this.options.command, {
        cwd: process.cwd(),
        stdio: 'inherit',
        timeout: this.options.timeout,
      });

      return {
        success: true,
        extensionPath: this.getExtensionPath(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Build failed',
        durationMs: Date.now() - startTime,
      };
    }
  }

  getExtensionPath(): string {
    return path.join(process.cwd(), this.options.outputPath);
  }

  async isBuilt(): Promise<boolean> {
    const manifestPath = path.join(this.getExtensionPath(), 'manifest.json');
    return fs.existsSync(manifestPath);
  }
}
```

### ChainCapability Implementation

```typescript
// capabilities/chain.ts

import { Anvil } from '../../../seeder/anvil';
import type { ChainCapability } from '@metamask/client-mcp-core';

export class MetaMaskChainCapability implements ChainCapability {
  private anvil: Anvil | undefined;
  private options: { port: number; chainId: number; forkUrl?: string };

  constructor(options: { port: number; chainId: number; forkUrl?: string }) {
    this.options = options;
  }

  async start(): Promise<void> {
    this.anvil = new Anvil();

    const anvilOptions: any = {
      port: this.options.port,
      chainId: this.options.chainId,
    };

    if (this.options.forkUrl) {
      anvilOptions.forkUrl = this.options.forkUrl;
    }

    await this.anvil.start(anvilOptions);
  }

  async stop(): Promise<void> {
    if (this.anvil) {
      await this.anvil.quit();
      this.anvil = undefined;
    }
  }

  isRunning(): boolean {
    return this.anvil !== undefined;
  }

  // MetaMask-specific: expose Anvil for seeding
  getAnvil(): Anvil | undefined {
    return this.anvil;
  }
}
```

---

## Appendix B: Example Usage After Decoupling

### Using Generic Package for Another Wallet

```typescript
// example-wallet/llm-workflow/server.ts

import {
  createMCPServer,
  WorkflowContext,
} from '@metamask/client-mcp-core';

const context: WorkflowContext = {
  browser: new ExampleWalletBrowserCapability({
    extensionPath: 'dist/extension',
  }),

  config: {
    environment: 'e2e',
    extensionName: 'ExampleWallet',
    defaultPassword: 'test-password',
    toolPrefix: 'ew', // ew_click, ew_launch, etc.
  },

  // Only implement what you need
  build: new ExampleWalletBuildCapability(),
  stateSnapshot: new ExampleWalletStateCapability(),
  // No fixture, chain, or seeding - not needed for this wallet
};

const server = createMCPServer(context);
server.start();
```

### MCP Client Configuration (Unchanged)

```json
{
  "mcpServers": {
    "metamask": {
      "command": "yarn",
      "args": ["tsx", "test/e2e/playwright/llm-workflow/server.ts"],
      "cwd": "/path/to/metamask-extension"
    }
  }
}
```

---

## References

- [SPEC-00: MetaMask Visual Testing MCP Server](./SPEC-00.md)
- [SPEC-05: Smart Contract Seeder](./SPEC-05.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Playwright Documentation](https://playwright.dev/)
- Oracle consultation session: `ses_40dc8ed9bffeeKfHOeF1cfJre5`
