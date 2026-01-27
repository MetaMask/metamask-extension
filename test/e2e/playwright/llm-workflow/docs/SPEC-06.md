# SPEC-06: Code Quality Refactoring

## Overview

This specification details a refactoring plan for the `test/e2e/playwright/llm-workflow/` codebase to improve code quality, reduce duplication, lower cyclomatic complexity, and increase test coverage.

### Goals

1. **Separate concerns**: Extract runtime utilities from `types.ts` while keeping it as the public import path
2. **Reduce duplication**: Consolidate repeated patterns (session checks, observation collection, knowledge recording)
3. **Lower complexity**: Replace large switch statement with handler registry; split monolithic files
4. **Improve test coverage**: Add missing tests for critical tools (currently ~40% coverage)
5. **Maintain backward compatibility**: Keep `mcp-server/types.ts` as the public import surface

### Non-Goals

- Breaking API changes to tool schemas or MCP protocol
- Refactoring `extension-launcher.ts` (deferred to future iteration)
- Changing knowledge store persistence format

### Decisions

| Question           | Decision                                               |
| ------------------ | ------------------------------------------------------ |
| Public import path | Keep `mcp-server/types.ts` as barrel re-export         |
| Utils location     | New `mcp-server/utils/` directory                      |
| Types location     | New `mcp-server/types/` directory                      |
| Tool helpers       | New `mcp-server/tools/helpers.ts`                      |
| Handler registry   | Object map in `server.ts`, not separate file           |
| Backward compat    | Re-export everything from `types.ts` during transition |

---

## Current State Analysis

### File Sizes (Lines of Code)

| File                            | LOC   | Issue                        |
| ------------------------------- | ----- | ---------------------------- |
| `mcp-server/knowledge-store.ts` | 1,548 | 8+ responsibilities          |
| `mcp-server/types.ts`           | 1,051 | Mixed types + runtime code   |
| `mcp-server/server.ts`          | 971   | 22-case switch statement     |
| `mcp-server/schemas.ts`         | 579   | Duplicated enum lists        |
| `extension-launcher.ts`         | 1,410 | Multiple concerns (deferred) |

### Code Duplication (~277 lines)

| Pattern                        | Occurrences | Lines |
| ------------------------------ | ----------- | ----- |
| Session validation boilerplate | 14          | ~112  |
| State collection pattern       | 11          | ~44   |
| Knowledge recording pattern    | 11          | ~88   |
| Contract enum lists            | 3           | ~33   |

### Test Coverage

| Tool                 | Has Tests |
| -------------------- | --------- |
| `build.ts`           | Yes       |
| `interaction.ts`     | Yes       |
| `navigation.ts`      | Yes       |
| `seeding.ts`         | Yes       |
| `launch.ts`          | **No**    |
| `cleanup.ts`         | **No**    |
| `state.ts`           | **No**    |
| `screenshot.ts`      | **No**    |
| `discovery-tools.ts` | **No**    |
| `knowledge.ts`       | **No**    |

**Current coverage: ~40%**

---

## Target Architecture

### Directory Structure

```
mcp-server/
├── types/                    # NEW: Type definitions (internal)
│   ├── responses.ts          # Response envelope types
│   ├── errors.ts             # Error codes and types
│   ├── tool-inputs.ts        # Tool input types
│   ├── tool-outputs.ts       # Tool output types
│   ├── knowledge.ts          # Knowledge/prior-knowledge types
│   ├── step-record.ts        # StepRecord types
│   ├── discovery.ts          # A11y, TestId, role types
│   ├── session.ts            # Session state types
│   ├── seeding.ts            # Contract seeding types
│   └── index.ts              # Internal barrel export
├── utils/                    # NEW: Runtime utilities
│   ├── response.ts           # createSuccessResponse, createErrorResponse
│   ├── redaction.ts          # SENSITIVE_FIELD_PATTERNS, isSensitiveField
│   ├── targets.ts            # validateTargetSelection
│   ├── time.ts               # generateFilesafeTimestamp, generateSessionId
│   └── index.ts              # Barrel export
├── tools/
│   ├── helpers.ts            # NEW: Shared tool helpers
│   ├── build.ts
│   ├── launch.ts
│   ├── cleanup.ts
│   ├── state.ts
│   ├── navigation.ts
│   ├── interaction.ts
│   ├── screenshot.ts
│   ├── discovery-tools.ts
│   ├── knowledge.ts
│   ├── seeding.ts
│   └── index.ts              # Handler registry export
├── types.ts                  # PUBLIC: Barrel re-export (backward compat)
├── schemas.ts                # Zod schemas (uses shared constants)
├── server.ts                 # MCP server (uses handler registry)
├── session-manager.ts
├── knowledge-store.ts
├── discovery.ts
└── index.ts                  # Module exports
```

---

## Task Breakdown

### Phase 1: Extract Runtime Utilities (High Priority)

#### Task 1.1: Create `mcp-server/utils/` directory structure

**Files to create:**

1. `mcp-server/utils/response.ts`
2. `mcp-server/utils/redaction.ts`
3. `mcp-server/utils/targets.ts`
4. `mcp-server/utils/time.ts`
5. `mcp-server/utils/index.ts`

**Implementation:**

```typescript
// mcp-server/utils/response.ts
import type { SuccessResponse, ErrorResponse, ErrorCode } from '../types';

export function createSuccessResponse<Result>(
  result: Result,
  sessionId?: string,
  startTime?: number,
): SuccessResponse<Result> {
  return {
    meta: {
      timestamp: new Date().toISOString(),
      sessionId,
      durationMs: startTime ? Date.now() - startTime : 0,
    },
    ok: true,
    result,
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  sessionId?: string,
  startTime?: number,
): ErrorResponse {
  return {
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      sessionId,
      durationMs: startTime ? Date.now() - startTime : 0,
    },
    ok: false,
  };
}
```

```typescript
// mcp-server/utils/redaction.ts
export const SENSITIVE_FIELD_PATTERNS = [
  /password/iu,
  /seed/iu,
  /srp/iu,
  /phrase/iu,
  /mnemonic/iu,
  /private.*key/iu,
  /secret/iu,
] as const;

export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
}
```

```typescript
// mcp-server/utils/targets.ts
import type { TargetSelection } from '../types';

export type TargetValidationResult =
  | { valid: true; type: 'a11yRef' | 'testId' | 'selector'; value: string }
  | { valid: false; error: string };

export function validateTargetSelection(
  target: TargetSelection,
): TargetValidationResult {
  const provided = [
    target.a11yRef ? 'a11yRef' : null,
    target.testId ? 'testId' : null,
    target.selector ? 'selector' : null,
  ].filter(Boolean) as ('a11yRef' | 'testId' | 'selector')[];

  if (provided.length === 0) {
    return {
      valid: false,
      error: 'Exactly one of a11yRef, testId, or selector must be provided',
    };
  }

  if (provided.length > 1) {
    return {
      valid: false,
      error: `Multiple targets provided (${provided.join(', ')}). Exactly one must be specified.`,
    };
  }

  const type = provided[0];
  const value = target[type] as string;

  return { valid: true, type, value };
}
```

```typescript
// mcp-server/utils/time.ts
export function generateFilesafeTimestamp(date: Date = new Date()): string {
  return date
    .toISOString()
    .replace(/[-:]/gu, '')
    .replace(
      /\.\d{3}Z$/u,
      `.${String(date.getMilliseconds()).padStart(3, '0')}Z`,
    );
}

export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mm-${timestamp}-${random}`;
}
```

```typescript
// mcp-server/utils/index.ts
export { createSuccessResponse, createErrorResponse } from './response';

export { SENSITIVE_FIELD_PATTERNS, isSensitiveField } from './redaction';

export {
  validateTargetSelection,
  type TargetValidationResult,
} from './targets';

export { generateFilesafeTimestamp, generateSessionId } from './time';
```

#### Task 1.2: Update `mcp-server/types.ts` to re-export from utils

Keep `types.ts` as the public import path by re-exporting:

```typescript
// mcp-server/types.ts (at the end, after type definitions)

// =============================================================================
// Runtime Utilities (re-exported from ./utils for backward compatibility)
// =============================================================================

export { createSuccessResponse, createErrorResponse } from './utils/response';

export { SENSITIVE_FIELD_PATTERNS, isSensitiveField } from './utils/redaction';

export { validateTargetSelection } from './utils/targets';

export { generateFilesafeTimestamp, generateSessionId } from './utils/time';
```

**Remove** the function implementations from `types.ts` (lines ~914-1051).

#### Task 1.3: Update internal imports

Update these files to import from `./utils` instead of `./types`:

| File                 | Current Import    | New Import                        |
| -------------------- | ----------------- | --------------------------------- |
| `knowledge-store.ts` | `from './types'`  | `from './utils'`                  |
| `server.ts`          | `from './types'`  | `from './utils'` (for functions)  |
| `tools/*.ts`         | `from '../types'` | `from '../utils'` (for functions) |

**Note:** Type imports should still come from `./types` or `../types`.

---

### Phase 2: Split Types into Modules (High Priority)

#### Task 2.1: Create `mcp-server/types/` directory structure

**Files to create:**

1. `mcp-server/types/responses.ts` (~40 lines)
2. `mcp-server/types/errors.ts` (~40 lines)
3. `mcp-server/types/tool-inputs.ts` (~150 lines)
4. `mcp-server/types/tool-outputs.ts` (~200 lines)
5. `mcp-server/types/knowledge.ts` (~150 lines)
6. `mcp-server/types/step-record.ts` (~120 lines)
7. `mcp-server/types/discovery.ts` (~80 lines)
8. `mcp-server/types/session.ts` (~50 lines)
9. `mcp-server/types/seeding.ts` (~80 lines)
10. `mcp-server/types/index.ts` (barrel)

#### Task 2.2: Move types from `types.ts` to modules

**Mapping:**

| Type(s)                                                                                                                                                                                                                                                                                                                                                                                                       | Target File             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `ResponseMeta`, `SuccessResponse`, `ErrorDetails`, `ErrorResponse`, `McpResponse`                                                                                                                                                                                                                                                                                                                             | `types/responses.ts`    |
| `ErrorCodes`, `ErrorCode`                                                                                                                                                                                                                                                                                                                                                                                     | `types/errors.ts`       |
| `BuildInput`, `LaunchInput`, `CleanupInput`, `NavigateInput`, `WaitForNotificationInput`, `ListTestIdsInput`, `AccessibilitySnapshotInput`, `DescribeScreenInput`, `ScreenshotInput`, `TargetSelection`, `ClickInput`, `TypeInput`, `WaitForInput`, `KnowledgeLastInput`, `KnowledgeSearchInput`, `KnowledgeSummarizeInput`, `KnowledgeSessionsInput`, `KnowledgeScope`, `KnowledgeFilters`, `HandlerOptions` | `types/tool-inputs.ts`  |
| `BuildResult`, `LaunchResult`, `CleanupResult`, `GetStateResult`, `NavigateResult`, `WaitForNotificationResult`, `ListTestIdsResult`, `AccessibilitySnapshotResult`, `DescribeScreenResult`, `ScreenshotResult`, `ClickResult`, `TypeResult`, `WaitForResult`, `KnowledgeLastResult`, `KnowledgeSearchResult`, `KnowledgeSummarizeResult`, `KnowledgeSessionsResult`, `ScreenshotInfo`                        | `types/tool-outputs.ts` |
| `PriorKnowledge*` types, `KnowledgeStepSummary`, `RecipeStep`, `SessionSummary`                                                                                                                                                                                                                                                                                                                               | `types/knowledge.ts`    |
| `StepRecord*` types, `SessionMetadata`, `FlowTag`, `StepLabel`, `FLOW_TAGS`, `STEP_LABELS`                                                                                                                                                                                                                                                                                                                    | `types/step-record.ts`  |
| `TestIdItem`, `A11yNodeTrimmed`, `RawA11yNode`, `ActionableRole`, `ImportantRole`, `IncludedRole`, `ACTIONABLE_ROLES`, `IMPORTANT_ROLES`, `INCLUDED_ROLES`                                                                                                                                                                                                                                                    | `types/discovery.ts`    |
| `SessionState`                                                                                                                                                                                                                                                                                                                                                                                                | `types/session.ts`      |
| `SmartContractName`, `Hardfork`, `SeedContractInput`, `SeedContractsInput`, `GetContractAddressInput`, `ListDeployedContractsInput`, `SeedContractResult`, `SeedContractsResult`, `GetContractAddressResult`, `ListDeployedContractsResult`, `SMART_CONTRACT_NAMES`                                                                                                                                           | `types/seeding.ts`      |

#### Task 2.3: Update `mcp-server/types.ts` as barrel

```typescript
// mcp-server/types.ts
/**
 * MCP Server Types - Public API
 *
 * This file re-exports all types and utilities for the MCP server.
 * Import from this file for stable API access.
 */

// Types
export * from './types/responses';
export * from './types/errors';
export * from './types/tool-inputs';
export * from './types/tool-outputs';
export * from './types/knowledge';
export * from './types/step-record';
export * from './types/discovery';
export * from './types/session';
export * from './types/seeding';

// Runtime utilities (for backward compatibility)
export * from './utils';
```

---

### Phase 3: Add Shared Tool Helpers (High Priority)

#### Task 3.1: Create `mcp-server/tools/helpers.ts`

```typescript
// mcp-server/tools/helpers.ts
import type { Page } from '@playwright/test';
import type { ErrorResponse, McpResponse, ExtensionState } from '../types';
import type {
  TestIdItem,
  A11yNodeTrimmed,
  StepRecordObservation,
} from '../types';
import { createErrorResponse, ErrorCodes } from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

/**
 * Check for active session; return error response if none.
 * Returns null if session is active (caller should proceed).
 */
export function requireActiveSession(startTime: number): ErrorResponse | null {
  if (!sessionManager.hasActiveSession()) {
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      'No active session. Call mm_launch first.',
      undefined,
      undefined,
      startTime,
    );
  }
  return null;
}

/**
 * Collect current page observation (state + testIds + a11y snapshot).
 * Also updates the session refMap.
 */
export async function collectObservation(
  page: Page,
  options: { testIdLimit?: number; rootSelector?: string } = {},
): Promise<{
  state: ExtensionState;
  testIds: TestIdItem[];
  a11yNodes: A11yNodeTrimmed[];
  refMap: Map<string, unknown>;
}> {
  const { testIdLimit = 50, rootSelector } = options;

  const state = await sessionManager.getExtensionState();
  const testIds = await collectTestIds(page, testIdLimit);
  const { nodes: a11yNodes, refMap } = await collectTrimmedA11ySnapshot(
    page,
    rootSelector,
  );

  sessionManager.setRefMap(refMap);

  return { state, testIds, a11yNodes, refMap };
}

/**
 * Create default observation object for knowledge store.
 */
export function createDefaultObservation(
  state: ExtensionState,
  testIds: TestIdItem[],
  a11yNodes: A11yNodeTrimmed[],
): StepRecordObservation {
  return {
    screen: state.currentScreen,
    url: state.currentUrl,
    isUnlocked: state.isUnlocked,
    networkName: state.networkName ?? undefined,
    accountAddress: state.accountAddress ?? undefined,
    balance: state.balance ?? undefined,
    testIds: testIds.slice(0, 20),
    a11ySnapshot: a11yNodes.slice(0, 30),
  };
}

/**
 * Record a tool step to the knowledge store.
 */
export async function recordToolStep(params: {
  toolName: string;
  sessionId: string;
  input: Record<string, unknown>;
  target?: { testId?: string; selector?: string; a11yRef?: string };
  outcome: { ok: boolean; error?: unknown };
  observation: StepRecordObservation;
  startTime: number;
  screenshotPath?: string;
}): Promise<void> {
  const {
    toolName,
    sessionId,
    input,
    target,
    outcome,
    observation,
    startTime,
    screenshotPath,
  } = params;

  await knowledgeStore.recordStep({
    sessionId,
    toolName,
    input,
    target,
    outcome,
    observation,
    durationMs: Date.now() - startTime,
    artifacts: screenshotPath ? { screenshotPath } : undefined,
  });
}
```

#### Task 3.2: Refactor tool handlers to use helpers

**Example refactor for `handleClick`:**

Before (~45 lines of boilerplate):

```typescript
export async function handleClick(
  input: ClickInput,
): Promise<McpResponse<ClickResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();

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
    // ... validation, click logic ...

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);
    sessionManager.setRefMap(refMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_click',
      input: { timeoutMs },
      target: { [targetType]: targetValue },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<ClickResult>(
      { clicked: true, target: targetValue },
      sessionId,
      startTime,
    );
  } catch (error) {
    // ... error handling ...
  }
}
```

After (~25 lines):

```typescript
export async function handleClick(
  input: ClickInput,
): Promise<McpResponse<ClickResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId() ?? '';

  const sessionError = requireActiveSession(startTime);
  if (sessionError) return sessionError;

  try {
    // ... validation, click logic ...

    const page = sessionManager.getPage();
    const { state, testIds, a11yNodes } = await collectObservation(page);

    await recordToolStep({
      toolName: 'mm_click',
      sessionId,
      input: { timeoutMs: input.timeoutMs },
      target: { [targetType]: targetValue },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, a11yNodes),
      startTime,
    });

    return createSuccessResponse<ClickResult>(
      { clicked: true, target: targetValue },
      sessionId,
      startTime,
    );
  } catch (error) {
    // ... error handling ...
  }
}
```

**Files to update:**

- `tools/interaction.ts` (3 handlers)
- `tools/navigation.ts` (2 handlers)
- `tools/discovery-tools.ts` (3 handlers)
- `tools/seeding.ts` (4 handlers)
- `tools/state.ts` (1 handler)
- `tools/screenshot.ts` (1 handler)

**Estimated reduction: ~150 lines**

---

### Phase 4: Replace Switch with Handler Registry (High Priority)

#### Task 4.1: Create handler registry in `tools/index.ts`

```typescript
// mcp-server/tools/index.ts
import type { McpResponse, HandlerOptions } from '../types';
import type { ToolName } from '../schemas';

import { handleBuild } from './build';
import { handleLaunch } from './launch';
import { handleCleanup } from './cleanup';
import { handleGetState } from './state';
import { handleNavigate, handleWaitForNotification } from './navigation';
import {
  handleListTestIds,
  handleAccessibilitySnapshot,
  handleDescribeScreen,
} from './discovery-tools';
import { handleClick, handleType, handleWaitFor } from './interaction';
import { handleScreenshot } from './screenshot';
import {
  handleKnowledgeLast,
  handleKnowledgeSearch,
  handleKnowledgeSummarize,
  handleKnowledgeSessions,
} from './knowledge';
import {
  handleSeedContract,
  handleSeedContracts,
  handleGetContractAddress,
  handleListDeployedContracts,
} from './seeding';

export type ToolHandler = (
  input: unknown,
  options?: HandlerOptions,
) => Promise<McpResponse<unknown>>;

export const toolHandlers: Record<ToolName, ToolHandler> = {
  mm_build: handleBuild,
  mm_launch: handleLaunch,
  mm_cleanup: handleCleanup,
  mm_get_state: handleGetState,
  mm_navigate: handleNavigate,
  mm_wait_for_notification: handleWaitForNotification,
  mm_list_testids: handleListTestIds,
  mm_accessibility_snapshot: handleAccessibilitySnapshot,
  mm_describe_screen: handleDescribeScreen,
  mm_click: handleClick,
  mm_type: handleType,
  mm_wait_for: handleWaitFor,
  mm_screenshot: handleScreenshot,
  mm_knowledge_last: handleKnowledgeLast,
  mm_knowledge_search: handleKnowledgeSearch,
  mm_knowledge_summarize: handleKnowledgeSummarize,
  mm_knowledge_sessions: handleKnowledgeSessions,
  mm_seed_contract: handleSeedContract,
  mm_seed_contracts: handleSeedContracts,
  mm_get_contract_address: handleGetContractAddress,
  mm_list_contracts: handleListDeployedContracts,
};

// Re-export individual handlers for direct imports
export * from './build';
export * from './launch';
export * from './cleanup';
export * from './state';
export * from './navigation';
export * from './discovery-tools';
export * from './interaction';
export * from './screenshot';
export * from './knowledge';
export * from './seeding';
export * from './helpers';
```

#### Task 4.2: Update `server.ts` to use registry

Replace the switch statement (lines ~812-937) with:

```typescript
import { toolHandlers, type ToolHandler } from './tools';
import { toolSchemas, validateToolInput, type ToolName } from './schemas';

// In CallToolRequestSchema handler:
const name = request.params.name;

if (!(name in toolHandlers)) {
  return createErrorResponse(
    ErrorCodes.MM_INVALID_INPUT,
    `Unknown tool: ${name}`,
    { availableTools: Object.keys(toolHandlers) },
    sessionManager.getSessionId(),
    startTime,
  );
}

const schema = toolSchemas[name as ToolName];
const validation = validateToolInput(
  name as ToolName,
  request.params.arguments ?? {},
);

if (!validation.success) {
  return createErrorResponse(
    ErrorCodes.MM_INVALID_INPUT,
    `Invalid input for ${name}: ${validation.error.message}`,
    { errors: validation.error.errors },
    sessionManager.getSessionId(),
    startTime,
  );
}

const handler = toolHandlers[name as ToolName];
const response = await handler(validation.data, options);
```

**Reduction: ~125 lines (switch statement)**

---

### Phase 5: Deduplicate Schema Constants (Medium Priority)

#### Task 5.1: Ensure single source of truth for enums

In `types/seeding.ts`:

```typescript
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

export const HARDFORKS = [
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

export type Hardfork = (typeof HARDFORKS)[number];
```

#### Task 5.2: Update `schemas.ts` to use shared constants

```typescript
import { SMART_CONTRACT_NAMES, HARDFORKS } from './types';

// In schema definitions, use the imported constants:
contractName: z.enum(SMART_CONTRACT_NAMES as unknown as [string, ...string[]]),
hardfork: z.enum(HARDFORKS as unknown as [string, ...string[]]),
```

---

### Phase 6: Add Missing Tests (High Priority)

#### Task 6.1: Create test files for untested tools

| File to Create                  | Handlers to Test                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tools/launch.test.ts`          | `handleLaunch`                                                                                        |
| `tools/cleanup.test.ts`         | `handleCleanup`                                                                                       |
| `tools/state.test.ts`           | `handleGetState`                                                                                      |
| `tools/screenshot.test.ts`      | `handleScreenshot`                                                                                    |
| `tools/discovery-tools.test.ts` | `handleListTestIds`, `handleAccessibilitySnapshot`, `handleDescribeScreen`                            |
| `tools/knowledge.test.ts`       | `handleKnowledgeLast`, `handleKnowledgeSearch`, `handleKnowledgeSummarize`, `handleKnowledgeSessions` |

#### Task 6.2: Test structure (follow existing patterns)

```typescript
// Example: tools/launch.test.ts
import { handleLaunch } from './launch';
import { sessionManager } from '../session-manager';

jest.mock('../session-manager');

describe('handleLaunch', () => {
  const mockSessionManager = sessionManager as jest.Mocked<
    typeof sessionManager
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when session already exists', () => {
    it('returns error MM_SESSION_ALREADY_RUNNING', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(true);

      const result = await handleLaunch({});

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('MM_SESSION_ALREADY_RUNNING');
    });
  });

  describe('when no session exists', () => {
    it('launches extension and returns session info', async () => {
      mockSessionManager.hasActiveSession.mockReturnValue(false);
      mockSessionManager.startSession.mockResolvedValue({
        sessionId: 'mm-test-123',
        extensionId: 'abc123',
      });
      mockSessionManager.getExtensionState.mockResolvedValue({
        isLoaded: true,
        currentScreen: 'home',
        // ... other state
      });

      const result = await handleLaunch({ stateMode: 'default' });

      expect(result.ok).toBe(true);
      expect(result.result?.sessionId).toBe('mm-test-123');
    });
  });
});
```

#### Task 6.3: Add tests for new utilities

```typescript
// utils/response.test.ts
describe('createSuccessResponse', () => {
  it('includes timestamp and duration', () => { ... });
  it('includes sessionId when provided', () => { ... });
});

describe('createErrorResponse', () => {
  it('includes error code and message', () => { ... });
  it('includes details when provided', () => { ... });
});

// utils/targets.test.ts
describe('validateTargetSelection', () => {
  it('returns valid for single testId', () => { ... });
  it('returns error for no targets', () => { ... });
  it('returns error for multiple targets', () => { ... });
});

// utils/redaction.test.ts
describe('isSensitiveField', () => {
  it('detects password fields', () => { ... });
  it('detects seed phrase fields', () => { ... });
  it('returns false for safe fields', () => { ... });
});
```

---

### Phase 7: Split Knowledge Store (Medium Priority, Deferred)

This phase is deferred to a future iteration but documented here for completeness.

#### Proposed structure:

```
mcp-server/knowledge-store/
├── store.ts              # File I/O, session persistence
├── search.ts             # searchSteps, scoring logic
├── prior-knowledge.ts    # generatePriorKnowledge
├── tokenization.ts       # tokenize, synonyms
└── index.ts              # Exports KnowledgeStore class
```

---

## Implementation Order

### Iteration 1 (This PR)

1. **Phase 1**: Extract runtime utilities to `utils/`
2. **Phase 2**: Split types into `types/` modules
3. **Phase 3**: Add `tools/helpers.ts` and refactor 2-3 tool handlers as proof
4. **Phase 4**: Replace switch with handler registry
5. **Phase 5**: Deduplicate schema constants
6. Run lint + existing tests

### Iteration 2 (Follow-up PR)

1. Refactor remaining tool handlers to use helpers
2. **Phase 6**: Add missing tool tests
3. Add utility tests

### Iteration 3 (Future)

1. **Phase 7**: Split knowledge-store.ts
2. Consider splitting extension-launcher.ts

---

## Validation Checklist

- [ ] `yarn lint:changed:fix` passes
- [ ] `yarn test:unit test/e2e/playwright/llm-workflow/` passes
- [ ] All existing imports from `mcp-server/types` still work
- [ ] MCP server starts: `yarn tsx test/e2e/playwright/llm-workflow/mcp-server/server.ts`
- [ ] Tool dispatch works via handler registry

---

## Metrics (Expected Improvements)

| Metric           | Before | After        |
| ---------------- | ------ | ------------ |
| `types.ts` LOC   | 1,051  | ~50 (barrel) |
| Duplicated lines | ~277   | ~50          |
| Switch cases     | 22     | 0 (registry) |
| Test coverage    | ~40%   | ~80%         |
| Max file size    | 1,548  | ~500         |

---

## Risks and Mitigations

| Risk                      | Mitigation                                             |
| ------------------------- | ------------------------------------------------------ |
| Breaking existing imports | Keep `types.ts` as barrel re-export                    |
| Circular dependencies     | Types have no runtime imports; utils import only types |
| Test failures             | Run tests after each phase                             |
| Large PR                  | Split into iterations as documented                    |

---

## References

- [SPEC-00: LLM Visual Testing Workflow](./SPEC-00.md)
- [SPEC-01: Cross-Session Knowledge](./SPEC-01.md)
- [SPEC-05: Smart Contract Seeder](./SPEC-05.md)
