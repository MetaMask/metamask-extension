# SPEC-05: Smart Contract Seeder for MCP Server

## Overview

This specification details how to add smart contract deployment capabilities to the MetaMask MCP server (`test/e2e/playwright/llm-workflow/mcp-server/`). The implementation reuses the existing `AnvilSeeder` from `test/e2e/seeder/anvil-seeder.js` to enable LLM agents to deploy and interact with predetermined smart contracts on the local Anvil node.

### Goals

1. Deploy predetermined smart contracts (ERC20, NFTs, etc.) to the local Anvil node
2. Enable testing of token operations (send, approve, transfer)
3. Expand visual testing capabilities for DeFi-related flows
4. Reuse existing E2E seeder infrastructure

### Decisions

| Question        | Decision                                                                              |
| --------------- | ------------------------------------------------------------------------------------- |
| Hardfork        | Default to `prague`, but configurable via tool input                                  |
| Token Minting   | Always mint to default fixture account (`0x5CfE73b6021E818B776b421B1c4Db2474086a7e1`) |
| Knowledge Store | Yes - record deployments with `seeding` label                                         |
| Fixture Presets | Yes - add `withHSTToken` preset for testing                                           |

---

## Architecture

### Current State

```
MCP Server (server.ts)
    ↓
SessionManager (session-manager.ts)
    ↓
MetaMaskExtensionLauncher (extension-launcher.ts)
    ↓
Anvil (test/e2e/seeder/anvil.ts) ← No seeding capability
```

### Target State

```
MCP Server (server.ts) ← New tools: mm_seed_contract, mm_seed_contracts, mm_get_contract_address, mm_list_contracts
    ↓
SessionManager (session-manager.ts) ← Exposes seeder via getSeeder()
    ↓
MetaMaskExtensionLauncher (extension-launcher.ts) ← Initializes seeder after Anvil starts
    ↓
AnvilSeederWrapper (new) → AnvilSeeder (reused from test/e2e/seeder/)
    ↓
Anvil ← Contracts deployed here
```

---

## Available Smart Contracts

| Contract                 | Name Key               | Purpose                             | Special Behavior              |
| ------------------------ | ---------------------- | ----------------------------------- | ----------------------------- |
| **HST**                  | `hst`                  | ERC-20 test token (TST, 4 decimals) | 10 tokens minted to deployer  |
| **NFTs**                 | `nfts`                 | ERC-721 NFT collection              | Auto-mints 1 NFT on deploy    |
| **ERC1155**              | `erc1155`              | Multi-token standard                | Auto-mints batch [1,2,3]      |
| **Piggybank**            | `piggybank`            | Simple savings contract             | -                             |
| **Failing**              | `failing`              | Intentionally reverts               | For error testing             |
| **Multisig**             | `multisig`             | Multi-signature wallet              | -                             |
| **Entrypoint**           | `entrypoint`           | ERC-4337 entry point                | -                             |
| **SimpleAccountFactory** | `simpleAccountFactory` | ERC-4337 account factory            | Requires ENTRYPOINT           |
| **VerifyingPaymaster**   | `verifyingPaymaster`   | ERC-4337 paymaster                  | Requires ENTRYPOINT + account |

---

## New MCP Tools

### mm_seed_contract

Deploy a single smart contract to Anvil.

**Input Schema:**

```json
{
  "contractName": "hst",
  "deployerOptions": {
    "fromAddress": "0x...",
    "fromPrivateKey": "0x..."
  },
  "hardfork": "prague"
}
```

**Result:**

```json
{
  "contractAddress": "0x...",
  "contractName": "hst",
  "deployedAt": "2026-01-19T00:00:00.000Z"
}
```

### mm_seed_contracts

Deploy multiple contracts in sequence.

**Input Schema:**

```json
{
  "contracts": ["hst", "nfts", "erc1155"],
  "hardfork": "prague"
}
```

**Result:**

```json
{
  "deployed": [
    { "contractName": "hst", "contractAddress": "0x...", "deployedAt": "..." }
  ],
  "failed": [{ "contractName": "failing", "error": "Deployment reverted" }]
}
```

### mm_get_contract_address

Query the deployed address of a contract.

**Input Schema:**

```json
{
  "contractName": "hst"
}
```

**Result:**

```json
{
  "contractName": "hst",
  "contractAddress": "0x..." | null
}
```

### mm_list_contracts

List all deployed contracts in the session.

**Input Schema:**

```json
{}
```

**Result:**

```json
{
  "contracts": [
    { "contractName": "hst", "contractAddress": "0x...", "deployedAt": "..." }
  ]
}
```

### mm_launch (Updated)

Add `seedContracts` option to deploy contracts at launch time.

**New Property:**

```json
{
  "seedContracts": ["hst", "nfts"]
}
```

---

## Implementation Tasks

### Phase 1: Core Infrastructure

#### Task 1.1: Create TypeScript AnvilSeederWrapper

**New File:** `test/e2e/playwright/llm-workflow/anvil-seeder-wrapper.ts`

**Purpose:** TypeScript wrapper around the existing JS `AnvilSeeder` for MCP server integration.

**Implementation:**

```typescript
import type { Anvil } from '../../seeder/anvil';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AnvilSeeder = require('../../seeder/anvil-seeder');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

export const SMART_CONTRACT_NAMES = [
  'hst',
  'nfts',
  'erc1155',
  'piggybank',
  'failing',
  'multisig',
  'entrypoint',
  'simpleAccountFactory',
  'verifyingPaymaster',
] as const;

export type SmartContractName = (typeof SMART_CONTRACT_NAMES)[number];

export type Hardfork =
  | 'frontier'
  | 'homestead'
  | 'dao'
  | 'tangerine'
  | 'spuriousDragon'
  | 'byzantium'
  | 'constantinople'
  | 'petersburg'
  | 'istanbul'
  | 'muirGlacier'
  | 'berlin'
  | 'london'
  | 'arrowGlacier'
  | 'grayGlacier'
  | 'paris'
  | 'shanghai'
  | 'prague';

export type DeployerOptions = {
  fromAddress?: string;
  fromPrivateKey?: string;
};

export type DeployContractOptions = {
  deployerOptions?: DeployerOptions;
  hardfork?: Hardfork;
};

export type DeployedContract = {
  name: SmartContractName;
  address: string;
  deployedAt: string;
};

export class AnvilSeederWrapper {
  private seeder: InstanceType<typeof AnvilSeeder>;
  private deployedContracts: Map<SmartContractName, DeployedContract> =
    new Map();
  private defaultHardfork: Hardfork = 'prague';

  constructor(provider: ReturnType<Anvil['getProvider']>) {
    this.seeder = new AnvilSeeder(provider);
  }

  async deployContract(
    name: SmartContractName,
    options: DeployContractOptions = {},
  ): Promise<DeployedContract> {
    const hardfork = options.hardfork ?? this.defaultHardfork;
    const contractKey = SMART_CONTRACTS[name.toUpperCase()];

    if (!contractKey) {
      throw new Error(`Unknown contract: ${name}`);
    }

    await this.seeder.deploySmartContract(
      contractKey,
      hardfork,
      options.deployerOptions,
    );

    const address = this.seeder
      .getContractRegistry()
      .getContractAddress(contractKey);

    const deployed: DeployedContract = {
      name,
      address,
      deployedAt: new Date().toISOString(),
    };

    this.deployedContracts.set(name, deployed);
    return deployed;
  }

  async deployContracts(
    names: SmartContractName[],
    options: DeployContractOptions = {},
  ): Promise<{
    deployed: DeployedContract[];
    failed: Array<{ name: string; error: string }>;
  }> {
    const deployed: DeployedContract[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    for (const name of names) {
      try {
        const contract = await this.deployContract(name, options);
        deployed.push(contract);
      } catch (error) {
        failed.push({
          name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { deployed, failed };
  }

  getContractAddress(name: SmartContractName): string | null {
    return this.deployedContracts.get(name)?.address ?? null;
  }

  getDeployedContracts(): DeployedContract[] {
    return Array.from(this.deployedContracts.values());
  }

  async transfer(to: string, valueWei: bigint): Promise<void> {
    await this.seeder.transfer(to, `0x${valueWei.toString(16)}`);
  }

  async paymasterDeposit(amountWei: bigint): Promise<void> {
    await this.seeder.paymasterDeposit(`0x${amountWei.toString(16)}`);
  }

  clearRegistry(): void {
    this.deployedContracts.clear();
  }
}
```

---

#### Task 1.2: Extend MetaMaskExtensionLauncher with Seeder

**File:** `test/e2e/playwright/llm-workflow/extension-launcher.ts`

**Changes:**

1. Add import at top of file:

```typescript
import {
  AnvilSeederWrapper,
  type SmartContractName,
} from './anvil-seeder-wrapper';
```

2. Add private property after other private properties (~line 58):

```typescript
private seeder: AnvilSeederWrapper | undefined;
```

3. Modify `startAnvil()` method to initialize seeder after Anvil is ready (after line 256):

```typescript
private async startAnvil(): Promise<void> {
  console.log('Starting Anvil...');
  this.anvil = new Anvil();

  // ... existing anvil options setup (lines 234-253) ...

  await this.anvil.start(anvilOptions);
  await this.waitForAnvilReady();

  // Initialize seeder after Anvil is ready
  this.seeder = new AnvilSeederWrapper(this.anvil.getProvider());
  console.log('AnvilSeeder initialized');

  console.log(`Anvil started on port ${port} with chainId ${chainId}`);
}
```

4. Add new method to deploy seed contracts (after `startAnvil`):

```typescript
private async deploySeedContracts(): Promise<void> {
  const seedContracts = (this.options as { seedContracts?: SmartContractName[] }).seedContracts;

  if (!seedContracts || seedContracts.length === 0) {
    return;
  }

  if (!this.seeder) {
    throw new Error('Seeder not initialized');
  }

  console.log(`Deploying ${seedContracts.length} seed contracts...`);

  for (const contractName of seedContracts) {
    try {
      const deployed = await this.seeder.deployContract(contractName);
      console.log(`  Deployed ${contractName} at ${deployed.address}`);
    } catch (error) {
      console.error(`  Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  console.log('Seed contract deployment complete');
}
```

5. Call `deploySeedContracts()` from `launch()` method after `startAnvil()` (around line 184):

```typescript
async launch(): Promise<LauncherContext> {
  // ... existing code ...

  try {
    await this.startAnvil();
    await this.deploySeedContracts();  // ADD THIS LINE
    await this.startFixtureServer();
    // ... rest of method
  }
}
```

6. Add getter method (after `getAnvil()` around line 1157):

```typescript
getSeeder(): AnvilSeederWrapper {
  if (!this.seeder) {
    throw new Error('Seeder not initialized. Ensure Anvil has started.');
  }
  return this.seeder;
}
```

7. Update `cleanup()` method to clear seeder (around line 1276):

```typescript
async cleanup(): Promise<void> {
  const errors: string[] = [];

  // ... existing cleanup code ...

  // Clear seeder (add before clearing anvil)
  if (this.seeder) {
    this.seeder.clearRegistry();
    this.seeder = undefined;
  }

  // ... rest of cleanup
}
```

8. Update `ResolvedOptions` type to include `seedContracts` (around line 36):

```typescript
type ResolvedOptions = {
  // ... existing properties ...
  seedContracts?: SmartContractName[];
};
```

9. Update constructor to handle `seedContracts` option (around line 77):

```typescript
constructor(options: LaunchOptions = {}) {
  this.options = {
    // ... existing options ...
    seedContracts: (options as { seedContracts?: SmartContractName[] }).seedContracts,
  };
  // ...
}
```

---

#### Task 1.3: Extend SessionManager with Seeder Access

**File:** `test/e2e/playwright/llm-workflow/mcp-server/session-manager.ts`

**Changes:**

1. Add import at top:

```typescript
import type { AnvilSeederWrapper } from '../anvil-seeder-wrapper';
```

2. Add method to access seeder (after `getLauncher()` method):

```typescript
getSeeder(): AnvilSeederWrapper {
  if (!this.launcher) {
    throw new Error('No active session. Call launch() first.');
  }
  return this.launcher.getSeeder();
}
```

---

### Phase 2: MCP Tool Implementation

#### Task 2.1: Add Seeding Types

**File:** `test/e2e/playwright/llm-workflow/mcp-server/types.ts`

**Add these types after existing type definitions:**

```typescript
// =============================================================================
// Smart Contract Seeding Types
// =============================================================================

export const SMART_CONTRACT_NAMES = [
  'hst',
  'nfts',
  'erc1155',
  'piggybank',
  'failing',
  'multisig',
  'entrypoint',
  'simpleAccountFactory',
  'verifyingPaymaster',
] as const;

export type SmartContractName = (typeof SMART_CONTRACT_NAMES)[number];

export type Hardfork =
  | 'frontier'
  | 'homestead'
  | 'dao'
  | 'tangerine'
  | 'spuriousDragon'
  | 'byzantium'
  | 'constantinople'
  | 'petersburg'
  | 'istanbul'
  | 'muirGlacier'
  | 'berlin'
  | 'london'
  | 'arrowGlacier'
  | 'grayGlacier'
  | 'paris'
  | 'shanghai'
  | 'prague';

/**
 * mm_seed_contract input
 */
export type SeedContractInput = {
  contractName: SmartContractName;
  hardfork?: Hardfork;
  deployerOptions?: {
    fromAddress?: string;
    fromPrivateKey?: string;
  };
};

/**
 * mm_seed_contracts input
 */
export type SeedContractsInput = {
  contracts: SmartContractName[];
  hardfork?: Hardfork;
};

/**
 * mm_get_contract_address input
 */
export type GetContractAddressInput = {
  contractName: SmartContractName;
};

/**
 * mm_list_contracts input
 */
export type ListDeployedContractsInput = Record<string, never>;

/**
 * mm_seed_contract result
 */
export type SeedContractResult = {
  contractName: string;
  contractAddress: string;
  deployedAt: string;
};

/**
 * mm_seed_contracts result
 */
export type SeedContractsResult = {
  deployed: SeedContractResult[];
  failed: Array<{ contractName: string; error: string }>;
};

/**
 * mm_get_contract_address result
 */
export type GetContractAddressResult = {
  contractName: string;
  contractAddress: string | null;
};

/**
 * mm_list_contracts result
 */
export type ListDeployedContractsResult = {
  contracts: SeedContractResult[];
};
```

**Add error codes to `ErrorCodes` constant:**

```typescript
export const ErrorCodes = {
  // ... existing codes ...

  // Seeding errors
  MM_SEED_FAILED: 'MM_SEED_FAILED',
  MM_CONTRACT_NOT_FOUND: 'MM_CONTRACT_NOT_FOUND',
} as const;
```

**Update `LaunchInput` type to include `seedContracts`:**

```typescript
export type LaunchInput = {
  autoBuild?: boolean;
  stateMode?: 'default' | 'onboarding' | 'custom';
  fixturePreset?: string;
  fixture?: Record<string, unknown>;
  ports?: {
    anvil?: number;
    fixtureServer?: number;
  };
  slowMo?: number;
  extensionPath?: string;
  goal?: string;
  flowTags?: string[];
  tags?: string[];
  seedContracts?: SmartContractName[]; // ADD THIS
};
```

---

#### Task 2.2: Add Zod Validation Schemas

**File:** `test/e2e/playwright/llm-workflow/mcp-server/schemas.ts`

**Add these schemas:**

```typescript
const smartContractNames = [
  'hst',
  'nfts',
  'erc1155',
  'piggybank',
  'failing',
  'multisig',
  'entrypoint',
  'simpleAccountFactory',
  'verifyingPaymaster',
] as const;

const hardforks = [
  'frontier',
  'homestead',
  'dao',
  'tangerine',
  'spuriousDragon',
  'byzantium',
  'constantinople',
  'petersburg',
  'istanbul',
  'muirGlacier',
  'berlin',
  'london',
  'arrowGlacier',
  'grayGlacier',
  'paris',
  'shanghai',
  'prague',
] as const;

export const SeedContractInputSchema = z.object({
  contractName: z.enum(smartContractNames),
  hardfork: z.enum(hardforks).optional(),
  deployerOptions: z
    .object({
      fromAddress: z.string().optional(),
      fromPrivateKey: z.string().optional(),
    })
    .optional(),
});

export const SeedContractsInputSchema = z.object({
  contracts: z.array(z.enum(smartContractNames)).min(1).max(9),
  hardfork: z.enum(hardforks).optional(),
});

export const GetContractAddressInputSchema = z.object({
  contractName: z.enum(smartContractNames),
});

export const ListDeployedContractsInputSchema = z.object({});
```

**Update `toolSchemas` export to include new schemas:**

```typescript
export const toolSchemas = {
  // ... existing schemas ...
  mm_seed_contract: SeedContractInputSchema,
  mm_seed_contracts: SeedContractsInputSchema,
  mm_get_contract_address: GetContractAddressInputSchema,
  mm_list_contracts: ListDeployedContractsInputSchema,
} as const;
```

**Update `LaunchInputSchema` to include `seedContracts`:**

```typescript
export const LaunchInputSchema = z.object({
  // ... existing properties ...
  seedContracts: z.array(z.enum(smartContractNames)).optional(),
});
```

---

#### Task 2.3: Create Seeding Tool Handlers

**New File:** `test/e2e/playwright/llm-workflow/mcp-server/tools/seeding.ts`

```typescript
import type {
  SeedContractInput,
  SeedContractsInput,
  GetContractAddressInput,
  ListDeployedContractsInput,
  SeedContractResult,
  SeedContractsResult,
  GetContractAddressResult,
  ListDeployedContractsResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore } from '../knowledge-store';

export async function handleSeedContract(
  input: SeedContractInput,
  _options?: HandlerOptions,
): Promise<McpResponse<SeedContractResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId();
    const seeder = sessionManager.getSeeder();

    const deployed = await seeder.deployContract(input.contractName, {
      hardfork: input.hardfork,
      deployerOptions: input.deployerOptions,
    });

    const result: SeedContractResult = {
      contractName: deployed.name,
      contractAddress: deployed.address,
      deployedAt: deployed.deployedAt,
    };

    // Record step in knowledge store
    await knowledgeStore.recordStep({
      tool: {
        name: 'mm_seed_contract',
        input: {
          contractName: input.contractName,
          hardfork: input.hardfork ?? 'prague',
        },
      },
      outcome: { ok: true },
      observation: {
        state: await sessionManager.getExtensionState(),
        testIds: [],
        a11y: { nodes: [] },
      },
      labels: ['seeding'],
    });

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_SEED_FAILED,
      `Failed to deploy contract '${input.contractName}': ${message}`,
      { contractName: input.contractName },
      sessionManager.getSessionId(),
      startTime,
    );
  }
}

export async function handleSeedContracts(
  input: SeedContractsInput,
  _options?: HandlerOptions,
): Promise<McpResponse<SeedContractsResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId();
    const seeder = sessionManager.getSeeder();

    const { deployed, failed } = await seeder.deployContracts(input.contracts, {
      hardfork: input.hardfork,
    });

    const result: SeedContractsResult = {
      deployed: deployed.map((d) => ({
        contractName: d.name,
        contractAddress: d.address,
        deployedAt: d.deployedAt,
      })),
      failed: failed.map((f) => ({
        contractName: f.name,
        error: f.error,
      })),
    };

    // Record step in knowledge store
    await knowledgeStore.recordStep({
      tool: {
        name: 'mm_seed_contracts',
        input: {
          contracts: input.contracts,
          hardfork: input.hardfork ?? 'prague',
        },
      },
      outcome: {
        ok: failed.length === 0,
        error:
          failed.length > 0
            ? {
                message: `${failed.length} contract(s) failed to deploy`,
              }
            : undefined,
      },
      observation: {
        state: await sessionManager.getExtensionState(),
        testIds: [],
        a11y: { nodes: [] },
      },
      labels: ['seeding'],
    });

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_SEED_FAILED,
      `Failed to deploy contracts: ${message}`,
      { contracts: input.contracts },
      sessionManager.getSessionId(),
      startTime,
    );
  }
}

export async function handleGetContractAddress(
  input: GetContractAddressInput,
  _options?: HandlerOptions,
): Promise<McpResponse<GetContractAddressResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId();
    const seeder = sessionManager.getSeeder();
    const address = seeder.getContractAddress(input.contractName);

    const result: GetContractAddressResult = {
      contractName: input.contractName,
      contractAddress: address,
    };

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_CONTRACT_NOT_FOUND,
      `Failed to get contract address: ${message}`,
      { contractName: input.contractName },
      sessionManager.getSessionId(),
      startTime,
    );
  }
}

export async function handleListDeployedContracts(
  _input: ListDeployedContractsInput,
  _options?: HandlerOptions,
): Promise<McpResponse<ListDeployedContractsResult>> {
  const startTime = Date.now();

  try {
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    const sessionId = sessionManager.getSessionId();
    const seeder = sessionManager.getSeeder();
    const deployed = seeder.getDeployedContracts();

    const result: ListDeployedContractsResult = {
      contracts: deployed.map((d) => ({
        contractName: d.name,
        contractAddress: d.address,
        deployedAt: d.deployedAt,
      })),
    };

    return createSuccessResponse(result, sessionId, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_SEED_FAILED,
      `Failed to list contracts: ${message}`,
      undefined,
      sessionManager.getSessionId(),
      startTime,
    );
  }
}
```

---

#### Task 2.4: Register Tools in MCP Server

**File:** `test/e2e/playwright/llm-workflow/mcp-server/server.ts`

**Changes:**

1. Add imports at top of file (after existing imports around line 30):

```typescript
import type {
  SeedContractInput,
  SeedContractsInput,
  GetContractAddressInput,
  ListDeployedContractsInput,
} from './types';
import {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './tools/seeding';
```

2. Add tool definitions to `TOOL_DEFINITIONS` array (after existing definitions, before the closing bracket around line 554):

```typescript
{
  name: 'mm_seed_contract',
  description: 'Deploy a smart contract to the local Anvil node. Available: hst (ERC20 TST token), nfts (ERC721), erc1155, piggybank, failing (reverts), multisig, entrypoint (ERC-4337), simpleAccountFactory, verifyingPaymaster.',
  inputSchema: {
    type: 'object',
    properties: {
      contractName: {
        type: 'string',
        enum: ['hst', 'nfts', 'erc1155', 'piggybank', 'failing', 'multisig', 'entrypoint', 'simpleAccountFactory', 'verifyingPaymaster'],
        description: 'Smart contract to deploy',
      },
      hardfork: {
        type: 'string',
        enum: ['frontier', 'homestead', 'dao', 'tangerine', 'spuriousDragon', 'byzantium', 'constantinople', 'petersburg', 'istanbul', 'muirGlacier', 'berlin', 'london', 'arrowGlacier', 'grayGlacier', 'paris', 'shanghai', 'prague'],
        default: 'prague',
        description: 'EVM hardfork to use for deployment (default: prague)',
      },
      deployerOptions: {
        type: 'object',
        properties: {
          fromAddress: { type: 'string', description: 'Deploy from impersonated address' },
          fromPrivateKey: { type: 'string', description: 'Deploy from private key (account seeded with 1 ETH)' },
        },
        additionalProperties: false,
      },
    },
    required: ['contractName'],
    additionalProperties: false,
  },
},
{
  name: 'mm_seed_contracts',
  description: 'Deploy multiple smart contracts in sequence.',
  inputSchema: {
    type: 'object',
    properties: {
      contracts: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['hst', 'nfts', 'erc1155', 'piggybank', 'failing', 'multisig', 'entrypoint', 'simpleAccountFactory', 'verifyingPaymaster'],
        },
        minItems: 1,
        maxItems: 9,
        description: 'List of contracts to deploy',
      },
      hardfork: {
        type: 'string',
        enum: ['frontier', 'homestead', 'dao', 'tangerine', 'spuriousDragon', 'byzantium', 'constantinople', 'petersburg', 'istanbul', 'muirGlacier', 'berlin', 'london', 'arrowGlacier', 'grayGlacier', 'paris', 'shanghai', 'prague'],
        default: 'prague',
        description: 'EVM hardfork to use for deployment (default: prague)',
      },
    },
    required: ['contracts'],
    additionalProperties: false,
  },
},
{
  name: 'mm_get_contract_address',
  description: 'Get the deployed address of a smart contract.',
  inputSchema: {
    type: 'object',
    properties: {
      contractName: {
        type: 'string',
        enum: ['hst', 'nfts', 'erc1155', 'piggybank', 'failing', 'multisig', 'entrypoint', 'simpleAccountFactory', 'verifyingPaymaster'],
        description: 'Contract name to look up',
      },
    },
    required: ['contractName'],
    additionalProperties: false,
  },
},
{
  name: 'mm_list_contracts',
  description: 'List all smart contracts deployed in this session.',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
},
```

3. Update `mm_launch` tool definition to include `seedContracts` property (find mm_launch definition and add to properties):

```typescript
seedContracts: {
  type: 'array',
  items: {
    type: 'string',
    enum: ['hst', 'nfts', 'erc1155', 'piggybank', 'failing', 'multisig', 'entrypoint', 'simpleAccountFactory', 'verifyingPaymaster'],
  },
  description: 'Smart contracts to deploy on launch (before extension loads)',
},
```

4. Add switch cases in `CallToolRequestSchema` handler (around line 627, after existing cases):

```typescript
case 'mm_seed_contract':
  response = await handleSeedContract(validatedArgs as SeedContractInput, options);
  break;
case 'mm_seed_contracts':
  response = await handleSeedContracts(validatedArgs as SeedContractsInput, options);
  break;
case 'mm_get_contract_address':
  response = await handleGetContractAddress(validatedArgs as GetContractAddressInput, options);
  break;
case 'mm_list_contracts':
  response = await handleListDeployedContracts(validatedArgs as ListDeployedContractsInput, options);
  break;
```

---

#### Task 2.5: Export from Module Index

**File:** `test/e2e/playwright/llm-workflow/mcp-server/index.ts`

**Add exports:**

```typescript
// Seeding types
export type {
  SmartContractName,
  Hardfork,
  SeedContractInput,
  SeedContractsInput,
  GetContractAddressInput,
  ListDeployedContractsInput,
  SeedContractResult,
  SeedContractsResult,
  GetContractAddressResult,
  ListDeployedContractsResult,
} from './types';

export { SMART_CONTRACT_NAMES } from './types';

// Seeding tool handlers
export {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './tools/seeding';
```

---

### Phase 3: Fixture Preset for Testing

#### Task 3.1: Add withHSTToken Fixture Preset

**File:** `test/e2e/playwright/llm-workflow/fixture-helper.ts`

**Add to `FixturePresets` object:**

```typescript
export const FixturePresets = {
  // ... existing presets ...

  /**
   * Default fixture optimized for ERC-20 token testing.
   * Launch with seedContracts: ['hst'] to deploy the TST token.
   * The token will appear in the wallet after:
   * 1. Auto-detection picks it up, OR
   * 2. Manual import using the deployed address from mm_get_contract_address
   */
  withHSTToken: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withTokensControllerERC20({ chainId: 1337 }).build();
  },
};
```

---

### Phase 4: Documentation

#### Task 4.1: Update MCP Server README

**File:** `test/e2e/playwright/llm-workflow/mcp-server/README.md`

**Add this section after the existing tools documentation:**

````markdown
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
````

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

````

---

### Phase 5: Testing

#### Task 5.1: Add Unit Tests for Seeding Handlers

**New File:** `test/e2e/playwright/llm-workflow/mcp-server/tools/seeding.test.ts`

```typescript
import {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './seeding';
import { sessionManager } from '../session-manager';
import { knowledgeStore } from '../knowledge-store';

// Mock dependencies
jest.mock('../session-manager');
jest.mock('../knowledge-store');

const mockSessionManager = sessionManager as jest.Mocked<typeof sessionManager>;
const mockKnowledgeStore = knowledgeStore as jest.Mocked<typeof knowledgeStore>;

describe('Seeding Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKnowledgeStore.recordStep.mockResolvedValue(undefined);
  });

  describe('handleSeedContract', () => {
    it('returns error when no active session', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(false);

      const result = await handleSeedContract({ contractName: 'hst' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MM_NO_ACTIVE_SESSION');
      }
    });

    it('deploys HST contract successfully', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContract: jest.fn().mockResolvedValue({
          name: 'hst',
          address: '0x1234567890abcdef',
          deployedAt: '2026-01-19T00:00:00.000Z',
        }),
      } as any);
      mockSessionManager.getExtensionState.mockResolvedValue({
        isLoaded: true,
        currentUrl: 'chrome-extension://test/home.html',
        extensionId: 'test',
        isUnlocked: true,
        currentScreen: 'home',
        accountAddress: '0x123',
        networkName: 'Localhost 8545',
        chainId: 1337,
        balance: '25 ETH',
      });

      const result = await handleSeedContract({ contractName: 'hst' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contractAddress).toBe('0x1234567890abcdef');
      }
    });

    it('uses custom hardfork when specified', async () => {
      const mockDeployContract = jest.fn().mockResolvedValue({
        name: 'hst',
        address: '0x1234',
        deployedAt: '2026-01-19T00:00:00.000Z',
      });

      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContract: mockDeployContract,
      } as any);
      mockSessionManager.getExtensionState.mockResolvedValue({} as any);

      await handleSeedContract({ contractName: 'hst', hardfork: 'london' });

      expect(mockDeployContract).toHaveBeenCalledWith('hst', {
        hardfork: 'london',
        deployerOptions: undefined,
      });
    });

    it('records step in knowledge store', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContract: jest.fn().mockResolvedValue({
          name: 'hst',
          address: '0x1234',
          deployedAt: '2026-01-19T00:00:00.000Z',
        }),
      } as any);
      mockSessionManager.getExtensionState.mockResolvedValue({} as any);

      await handleSeedContract({ contractName: 'hst' });

      expect(mockKnowledgeStore.recordStep).toHaveBeenCalledWith(
        expect.objectContaining({
          tool: expect.objectContaining({ name: 'mm_seed_contract' }),
          labels: ['seeding'],
        }),
      );
    });
  });

  describe('handleSeedContracts', () => {
    it('deploys multiple contracts', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContracts: jest.fn().mockResolvedValue({
          deployed: [
            { name: 'hst', address: '0x1', deployedAt: '...' },
            { name: 'nfts', address: '0x2', deployedAt: '...' },
          ],
          failed: [],
        }),
      } as any);
      mockSessionManager.getExtensionState.mockResolvedValue({} as any);

      const result = await handleSeedContracts({ contracts: ['hst', 'nfts'] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.deployed).toHaveLength(2);
        expect(result.result.failed).toHaveLength(0);
      }
    });

    it('reports partial failures', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        deployContracts: jest.fn().mockResolvedValue({
          deployed: [{ name: 'hst', address: '0x1', deployedAt: '...' }],
          failed: [{ name: 'failing', error: 'Deployment reverted' }],
        }),
      } as any);
      mockSessionManager.getExtensionState.mockResolvedValue({} as any);

      const result = await handleSeedContracts({ contracts: ['hst', 'failing'] });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.deployed).toHaveLength(1);
        expect(result.result.failed).toHaveLength(1);
      }
    });
  });

  describe('handleGetContractAddress', () => {
    it('returns address for deployed contract', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getContractAddress: jest.fn().mockReturnValue('0xabc123'),
      } as any);

      const result = await handleGetContractAddress({ contractName: 'hst' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contractAddress).toBe('0xabc123');
      }
    });

    it('returns null for non-deployed contract', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getContractAddress: jest.fn().mockReturnValue(null),
      } as any);

      const result = await handleGetContractAddress({ contractName: 'nfts' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contractAddress).toBeNull();
      }
    });
  });

  describe('handleListDeployedContracts', () => {
    it('returns empty list when no contracts deployed', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getDeployedContracts: jest.fn().mockReturnValue([]),
      } as any);

      const result = await handleListDeployedContracts({});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contracts).toHaveLength(0);
      }
    });

    it('returns all deployed contracts', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);
      mockSessionManager.getSessionId.mockReturnValue('test-session');
      mockSessionManager.getSeeder.mockReturnValue({
        getDeployedContracts: jest.fn().mockReturnValue([
          { name: 'hst', address: '0x1', deployedAt: '...' },
          { name: 'nfts', address: '0x2', deployedAt: '...' },
        ]),
      } as any);

      const result = await handleListDeployedContracts({});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.contracts).toHaveLength(2);
      }
    });
  });
});
````

---

## Task Summary

| #   | Task                            | File(s)                             | Priority |
| --- | ------------------------------- | ----------------------------------- | -------- |
| 1.1 | Create AnvilSeederWrapper       | `anvil-seeder-wrapper.ts` (new)     | High     |
| 1.2 | Extend Launcher with Seeder     | `extension-launcher.ts`             | High     |
| 1.3 | Add getSeeder to SessionManager | `session-manager.ts`                | High     |
| 2.1 | Add Seeding Types               | `mcp-server/types.ts`               | High     |
| 2.2 | Add Zod Schemas                 | `mcp-server/schemas.ts`             | High     |
| 2.3 | Create Seeding Handlers         | `mcp-server/tools/seeding.ts` (new) | High     |
| 2.4 | Register Tools in Server        | `mcp-server/server.ts`              | High     |
| 2.5 | Export from Index               | `mcp-server/index.ts`               | High     |
| 3.1 | Add withHSTToken Preset         | `fixture-helper.ts`                 | Medium   |
| 4.1 | Update README                   | `mcp-server/README.md`              | Medium   |
| 5.1 | Add Unit Tests                  | `tools/seeding.test.ts` (new)       | Medium   |

---

## Implementation Order

1. **Task 1.1** - Create `AnvilSeederWrapper` (foundation)
2. **Task 1.2** - Extend launcher (integrates wrapper)
3. **Task 1.3** - Extend SessionManager (exposes seeder)
4. **Task 2.1-2.2** - Add types and schemas (can be parallel)
5. **Task 2.3** - Create handlers (depends on 1.1-1.3)
6. **Task 2.4-2.5** - Register and export (depends on 2.3)
7. **Task 3.1** - Add fixture preset (can be parallel after 2.x)
8. **Task 4.1** - Update docs (after implementation)
9. **Task 5.1** - Add tests (after implementation)

---

## Verification Steps

After implementation, verify with this workflow:

```
1. mm_launch { "stateMode": "default" }
2. mm_seed_contract { "contractName": "hst" }
   ✓ Should return contractAddress
3. mm_get_contract_address { "contractName": "hst" }
   ✓ Should return same address
4. mm_list_contracts
   ✓ Should show hst in list
5. mm_describe_screen
   ✓ Should show home screen
6. [Manually import token using address]
7. [Verify token appears in wallet]
8. mm_cleanup
```

### Alternative Verification (Launch with seedContracts)

```
1. mm_launch { "stateMode": "default", "seedContracts": ["hst", "nfts"] }
   ✓ Should return session info
2. mm_list_contracts
   ✓ Should show both hst and nfts
3. mm_cleanup
```
