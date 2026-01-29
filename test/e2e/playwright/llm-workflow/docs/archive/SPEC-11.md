# Dynamic Context Switching for LLM Workflow

## TL;DR

> **Quick Summary**: Add `mm_set_context` and `mm_get_context` tools to the MCP server allowing runtime switching between e2e and prod contexts with guardrails to prevent switching during active sessions.
>
> **Deliverables**:
>
> - New tool: `mm_set_context` - switch context (e2e ↔ prod) with error if session active
> - New tool: `mm_get_context` - query current context, capabilities, and session status
> - Updated session manager interface + implementation with context switching logic
> - Knowledge store records context per step
> - Unit tests for all new functionality
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Tasks 7,8 (parallel) → Task 9

---

## Multi-Repo Architecture

This feature spans **TWO repositories**:

| Repository    | Location                                                                                  | Changes                                                                             |
| ------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **mcp-core**  | `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp`         | Error codes, tool definitions, schemas, ISessionManager interface, step record type |
| **extension** | `/Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2` | MetaMaskSessionManager implementation, context factory, tests, docs                 |

**After mcp-core changes**: Run `yarn build && yalc publish --push` in mcp-core, then `yalc update` in extension.

---

## Context

### Original Request

The llm-workflow solution currently works properly for an e2e context. Despite supporting a prod context at the code level, the context cannot be specified dynamically at runtime. The goal is to add dynamic context switching with guardrails - context can only be changed before `mm_launch` or after `mm_cleanup`, never during an active session.

### Interview Summary

**Key Discussions**:

- Method: New dedicated tools (`mm_set_context`, `mm_get_context`) rather than parameters on mm_launch
- Guardrail: Throw descriptive error if `mm_set_context` called during active session
- Default context: e2e (maintains current behavior)
- State on switch: Knowledge store persists, capability state cleared via new context instances
- Testing: Unit tests only (following existing patterns)

**Research Findings**:

- Context factory infrastructure already exists: `createMetaMaskE2EContext()` and `createMetaMaskProdContext()`
- Session manager already has `setWorkflowContext()` method
- `activeSession` check (`hasActiveSession()`) is sufficient guardrail indicator
- Knowledge store is independent of context (singleton, safe to preserve)
- Capability instances have state that clears when replaced (new instances = fresh state)
- Tool handlers use `runTool()` pattern with `classifyError` for error classification
- Step records are created in `knowledge-store.ts` via `recordStep()` method
- Tool schemas are registered in `toolSchemas` object and `ToolName` type
- `recordStep` params must be extended to accept `context` field

### Metis Review

**Identified Gaps** (addressed):

- Same-context switch behavior: Resolved as no-op success with same capabilities returned
- Error code needed: Added `MM_CONTEXT_SWITCH_BLOCKED` to error codes
- Step record schema: Added `context` field to step records
- Capability state clearing: New context instances automatically have fresh state

### Momus Review (Critical Fixes Applied - Round 2)

1. **Error code story**: Added both `MM_CONTEXT_SWITCH_BLOCKED` AND `MM_SET_CONTEXT_FAILED` to errors.ts
2. **Step record context wiring**: Fixed to update `knowledge-store.ts` params type AND write context into stepRecord object
3. **Context tools not recorded**: Explicitly documented that mm_set_context/mm_get_context are NOT recorded (acceptable - they're meta-operations without session)
4. **Schema registry**: Added entries to `toolSchemas` object and `ToolName` type extension
5. **Unit test strategy**: Clarified mocking approach using Jest spies, no actual capability instantiation

---

## Work Objectives

### Core Objective

Enable runtime context switching (e2e ↔ prod) via new MCP tools with guardrails preventing changes during active sessions.

### Concrete Deliverables

- `mm_set_context` tool registered in MCP server
- `mm_get_context` tool registered in MCP server
- `setContext()` and `getContextInfo()` methods on ISessionManager interface
- `setContext()` and `getContextInfo()` implemented in MetaMaskSessionManager
- `MM_CONTEXT_SWITCH_BLOCKED` and `MM_SET_CONTEXT_FAILED` error codes
- `context` field in knowledge store step records (wired in knowledge-store.ts)
- Unit tests for context switching functionality
- Updated documentation in README files

### Definition of Done

- [ ] `mm_set_context({ context: 'prod' })` succeeds when no session active
- [ ] `mm_set_context({ context: 'e2e' })` throws `MM_CONTEXT_SWITCH_BLOCKED` when session active
- [ ] `mm_get_context` returns current context, capabilities list, and session status
- [ ] Knowledge store steps include `context` field
- [ ] All existing tests continue to pass (with updated assertions for 26 tools)
- [ ] New unit tests pass

### Must Have

- Guardrail: Cannot switch context during active session (throw error)
- Default startup context: e2e
- Knowledge store persistence across context switches
- Context recorded in every step (when session exists)

### Must NOT Have (Guardrails)

- **No custom/extensible contexts** - Only e2e and prod, hardcoded
- **No context auto-switch** - Explicit switch via mm_set_context only
- **No context persistence** - Default to e2e every server startup
- **No mm_launch context parameter** - Use dedicated mm_set_context tool
- **No partial capability toggles** - Full context or switch, no cherry-picking
- **No context change events/hooks** - Keep implementation simple for MVP

### Important Design Decision: Context Tools Recording Behavior

**Recording follows standard `runTool` behavior**: Steps are recorded when `sessionId` exists (run-tool.ts:118).

**mm_set_context**:

- Typical usage: Called BEFORE `mm_launch` (no session) → NOT recorded
- If called during active session → Throws `MM_CONTEXT_SWITCH_BLOCKED`, recorded as failed step
- After `mm_cleanup` (no session) → NOT recorded

**mm_get_context**:

- Can be called anytime (before, during, or after session)
- If called during active session → Recorded (this is useful - shows context in step history)
- If called without session → NOT recorded

**Why this is acceptable**:

- `mm_set_context` during session throws an error anyway (guardrail working as intended)
- `mm_get_context` during session being recorded is actually useful for debugging
- No special "skip-recording" mechanism needed - standard `runTool` behavior is correct

**Note**: Unlike `mm_build` which uses direct response helpers (not `runTool`), these tools use `runTool` for consistency with error classification and future extensibility.

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: YES (Jest in both repos)
- **User wants tests**: YES (unit tests only)
- **Framework**: Jest

### Test Execution

```bash
# In mcp-core repo:
cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
yarn test

# In extension repo:
cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2
yarn jest test/e2e/playwright/llm-workflow/
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (mcp-core - Sequential Foundation):
└── Task 1: Add error codes + step record context field
    ↓
└── Task 2: Wire context into knowledge-store.ts recordStep
    ↓
└── Task 3: Add ISessionManager interface methods
    ↓
└── Task 4: Add schemas for new tools + update toolSchemas/ToolName
    ↓
└── Task 5: Add tool handlers + definitions + error classification
    ↓
└── Task 6: Update tests and exports, publish via yalc

Wave 2 (extension - After yalc update):
├── Task 7: Implement setContext/getContextInfo in MetaMaskSessionManager
└── Task 8: Write unit tests + update integration.test.ts
    (Tasks 7,8 can run parallel)
    ↓
└── Task 9: Update documentation

Critical Path: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9
```

### Dependency Matrix

| Task | Repo      | Depends On | Blocks | Can Parallelize With |
| ---- | --------- | ---------- | ------ | -------------------- |
| 1    | mcp-core  | None       | 2      | None                 |
| 2    | mcp-core  | 1          | 3      | None                 |
| 3    | mcp-core  | 2          | 4      | None                 |
| 4    | mcp-core  | 3          | 5      | None                 |
| 5    | mcp-core  | 4          | 6      | None                 |
| 6    | mcp-core  | 5          | 7, 8   | None                 |
| 7    | extension | 6          | 9      | 8                    |
| 8    | extension | 6          | 9      | 7                    |
| 9    | extension | 7, 8       | None   | None                 |

---

## TODOs

- [ ] 1. Add error codes and context field to types (mcp-core)

  **What to do**:
  - Add to `src/mcp-server/types/errors.ts` ErrorCodes object:
    ```typescript
    MM_CONTEXT_SWITCH_BLOCKED: "MM_CONTEXT_SWITCH_BLOCKED",
    MM_SET_CONTEXT_FAILED: "MM_SET_CONTEXT_FAILED",
    ```
  - Add to `src/mcp-server/types/step-record.ts` StepRecord type:
    ```typescript
    context?: 'e2e' | 'prod';
    ```

  **Must NOT do**:
  - Do not modify any other error codes or types
  - Do not wire the context field yet (Task 2)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small edits to existing files
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 1)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/types/errors.ts:1-41` - ErrorCodes object, add new error codes following existing pattern (e.g., lines 34-37)
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/types/step-record.ts:86-99` - StepRecord type, add context field alongside existing fields like `sessionId`

  **Acceptance Criteria**:

  ```bash
  # Agent runs in mcp-core repo:
  cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp

  grep "MM_CONTEXT_SWITCH_BLOCKED" src/mcp-server/types/errors.ts
  # Assert: Returns match showing error code defined

  grep "MM_SET_CONTEXT_FAILED" src/mcp-server/types/errors.ts
  # Assert: Returns match showing error code defined

  grep "context.*e2e.*prod" src/mcp-server/types/step-record.ts
  # Assert: Returns match showing context field in StepRecord

  yarn tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(types): add context switching error codes and context field to step records`
  - Files: `src/mcp-server/types/errors.ts`, `src/mcp-server/types/step-record.ts`
  - Pre-commit: `yarn lint`

---

- [ ] 2. Wire context field into knowledge-store.ts recordStep (mcp-core)

  **What to do**:
  - In `src/mcp-server/knowledge-store.ts`, update the `recordStep` params type (line ~282) to include context:
    ```typescript
    async recordStep(params: {
      sessionId: string;
      toolName: string;
      input?: Record<string, unknown>;
      target?: StepRecordTool["target"];
      outcome: StepRecordOutcome;
      observation: StepRecordObservation;
      durationMs?: number;
      screenshotPath?: string;
      screenshotDimensions?: { width: number; height: number };
      context?: 'e2e' | 'prod';  // NEW: Add context parameter
    }): Promise<string> {
    ```
  - In the `stepRecord` construction (line ~307), add the context field:
    ```typescript
    const stepRecord: StepRecord = {
      schemaVersion: SCHEMA_VERSION,
      timestamp: timestamp.toISOString(),
      sessionId: params.sessionId,
      context: params.context, // NEW: Add context to record
      environment: this.getEnvironmentInfo(),
      // ... rest of fields
    };
    ```
  - In `src/mcp-server/tools/run-tool.ts`, update both `knowledgeStore.recordStep()` calls (lines ~123 and ~166) to pass context:
    ```typescript
    await knowledgeStore.recordStep({
      sessionId,
      toolName: config.toolName,
      input: recordInput,
      target: config.getTarget?.(config.input),
      outcome: { ok: true },
      observation: observation ?? createEmptyObservation(),
      durationMs: Date.now() - startTime,
      context: sessionManager.getEnvironmentMode(), // NEW: Pass context (not optional - always exists)
    });
    ```

  **Must NOT do**:
  - Do not change the StepRecord type (done in Task 1)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Three targeted edits to existing files
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/knowledge-store.ts:282-292` - recordStep params type to extend
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/knowledge-store.ts:307-326` - stepRecord construction to update
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/tools/run-tool.ts:118-132` - Success path recordStep call
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/tools/run-tool.ts:161-178` - Error path recordStep call

  **API/Type References**:
  - `getEnvironmentMode()` from session manager - returns `'e2e' | 'prod'`

  **Acceptance Criteria**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp

  # Verify params type updated:
  grep -A15 "async recordStep" src/mcp-server/knowledge-store.ts | grep "context"
  # Assert: Returns match showing context in params

  # Verify stepRecord construction updated:
  grep -B5 -A20 "const stepRecord: StepRecord" src/mcp-server/knowledge-store.ts | grep "context"
  # Assert: Returns match showing context field

  # Verify run-tool.ts passes context:
  grep -A15 "knowledgeStore.recordStep" src/mcp-server/tools/run-tool.ts | grep "context"
  # Assert: Returns matches in both recordStep calls

  yarn tsc --noEmit
  # Assert: Exit code 0

  yarn test
  # Assert: All tests pass
  ```

  **Commit**: YES
  - Message: `feat(knowledge-store): wire context field into step records`
  - Files: `src/mcp-server/knowledge-store.ts`, `src/mcp-server/tools/run-tool.ts`
  - Pre-commit: `yarn lint`

---

- [ ] 3. Add context methods to ISessionManager interface (mcp-core)

  **What to do**:
  - Add to ISessionManager interface in `src/mcp-server/session-manager.ts`:

    ```typescript
    /**
     * Set the current context (e2e or prod).
     * @throws Error with code MM_CONTEXT_SWITCH_BLOCKED if session is active
     */
    setContext?(context: 'e2e' | 'prod'): void;

    /**
     * Get current context information.
     */
    getContextInfo?(): {
      currentContext: 'e2e' | 'prod';
      hasActiveSession: boolean;
      sessionId: string | null;
      capabilities: { available: string[] };
      canSwitchContext: boolean;
    };
    ```

  - Methods are optional (?) to maintain backward compatibility

  **Must NOT do**:
  - Do not make methods required (would break existing implementations)
  - Do not add implementation in this file

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding interface methods
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 3)
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/session-manager.ts:89-267` - ISessionManager interface definition

  **API/Type References**:
  - `EnvironmentMode` type from `../capabilities/context.js` - Already imported, use for context type

  **Acceptance Criteria**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp

  grep -A5 "setContext" src/mcp-server/session-manager.ts
  # Assert: Returns method signature

  grep -A10 "getContextInfo" src/mcp-server/session-manager.ts
  # Assert: Returns method signature with return type

  yarn tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(session-manager): add setContext and getContextInfo to ISessionManager interface`
  - Files: `src/mcp-server/session-manager.ts`
  - Pre-commit: `yarn lint`

---

- [ ] 4. Add schemas for context tools and update toolSchemas/ToolName (mcp-core)

  **What to do**:
  - Add to `src/mcp-server/schemas.ts` (after existing schema exports, before `toolSchemas`):

    ```typescript
    export const setContextInputSchema = z.object({
      context: z.enum(['e2e', 'prod']).describe('Target context to switch to'),
    });

    export const getContextInputSchema = z
      .object({})
      .describe('No parameters required');

    export type SetContextInputZ = z.infer<typeof setContextInputSchema>;
    export type GetContextInputZ = z.infer<typeof getContextInputSchema>;
    ```

  - Add to `toolSchemas` object (line ~450):
    ```typescript
    export const toolSchemas = {
      // ... existing entries ...
      set_context: setContextInputSchema,
      get_context: getContextInputSchema,
    } as const;
    ```

  **Note**: `ToolName` type is derived from `toolSchemas` via `keyof typeof toolSchemas`, so it auto-updates.

  **Must NOT do**:
  - Do not add complex validation logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adding schemas and updating registry
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 4)
  - **Blocks**: Task 5
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/schemas.ts:426-475` - toolSchemas object definition
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/schemas.ts:477` - ToolName type derivation

  **Acceptance Criteria**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp

  grep "setContextInputSchema" src/mcp-server/schemas.ts
  # Assert: Returns schema definition

  grep "getContextInputSchema" src/mcp-server/schemas.ts
  # Assert: Returns schema definition

  grep "set_context:" src/mcp-server/schemas.ts
  # Assert: Returns toolSchemas entry

  grep "get_context:" src/mcp-server/schemas.ts
  # Assert: Returns toolSchemas entry

  yarn tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(schemas): add setContext and getContext schemas to registry`
  - Files: `src/mcp-server/schemas.ts`
  - Pre-commit: `yarn lint`

---

- [ ] 5. Add tool handlers, definitions, and error classification (mcp-core)

  **What to do**:

  **5a. Add error classifier to `src/mcp-server/tools/error-classification.ts`** (at end of file):

  ```typescript
  /**
   * Classify a context switching error.
   */
  export function classifyContextError(error: unknown): {
    code: string;
    message: string;
  } {
    const message = extractErrorMessage(error);

    // Check if error message contains our blocked error code
    if (message.includes(ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED)) {
      return { code: ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED, message };
    }

    return {
      code: ErrorCodes.MM_SET_CONTEXT_FAILED,
      message: `Context switch failed: ${message}`,
    };
  }
  ```

  **5b. Create `src/mcp-server/tools/context.ts`** using `runTool` pattern:

  ```typescript
  import type { McpResponse, HandlerOptions } from '../types/index.js';
  import { runTool } from './run-tool.js';
  import { getSessionManager } from '../session-manager.js';
  import { classifyContextError } from './error-classification.js';

  export type SetContextInput = { context: 'e2e' | 'prod' };
  export type SetContextResult = {
    previousContext: 'e2e' | 'prod';
    newContext: 'e2e' | 'prod';
    availableCapabilities: string[];
  };

  export async function handleSetContext(
    input: SetContextInput,
    options?: HandlerOptions,
  ): Promise<McpResponse<SetContextResult>> {
    return runTool<SetContextInput, SetContextResult>({
      toolName: 'mm_set_context',
      input,
      options,
      requiresSession: false, // Can run without active session (not recorded)
      observationPolicy: 'none',

      execute: async () => {
        const sessionManager = getSessionManager();

        if (!sessionManager.setContext) {
          throw new Error(
            'Context switching not supported by this session manager',
          );
        }

        const previousContext = sessionManager.getEnvironmentMode();
        sessionManager.setContext(input.context); // Throws if session active
        const info = sessionManager.getContextInfo?.();

        return {
          previousContext,
          newContext: input.context,
          availableCapabilities: info?.capabilities.available ?? [],
        };
      },

      classifyError: classifyContextError,
    });
  }

  export type GetContextResult = {
    currentContext: 'e2e' | 'prod';
    hasActiveSession: boolean;
    sessionId: string | null;
    capabilities: { available: string[] };
    canSwitchContext: boolean;
  };

  export async function handleGetContext(
    input: Record<string, never>,
    options?: HandlerOptions,
  ): Promise<McpResponse<GetContextResult>> {
    return runTool<Record<string, never>, GetContextResult>({
      toolName: 'mm_get_context',
      input,
      options,
      requiresSession: false, // Can run without active session (not recorded)
      observationPolicy: 'none',

      execute: async () => {
        const sessionManager = getSessionManager();

        if (sessionManager.getContextInfo) {
          return sessionManager.getContextInfo();
        }

        // Fallback for session managers without getContextInfo
        return {
          currentContext: sessionManager.getEnvironmentMode(),
          hasActiveSession: sessionManager.hasActiveSession(),
          sessionId: sessionManager.getSessionId() ?? null,
          capabilities: { available: [] },
          canSwitchContext: !sessionManager.hasActiveSession(),
        };
      },
    });
  }
  ```

  **5c. Add to `src/mcp-server/tools/definitions.ts`** tools record:
  - Import schemas: `import { setContextInputSchema, getContextInputSchema } from "../schemas.js";`
  - Import handlers: `import { handleSetContext, handleGetContext } from "./context.js";`
  - Add to tools object:

  ```typescript
  set_context: {
    schema: setContextInputSchema,
    description: "Switch workflow context (e2e or prod). Cannot switch during active session.",
    handler: handleSetContext as ToolHandler,
  },
  get_context: {
    schema: getContextInputSchema,
    description: "Get current context, available capabilities, and whether context can be switched.",
    handler: handleGetContext as ToolHandler,
  },
  ```

  **Must NOT do**:
  - Do not bypass runTool pattern
  - Do not call createSuccessResponse/createErrorResponse directly in handlers

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Creating new file + edits following existing patterns
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 5)
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/tools/state.ts` - Similar handler using runTool pattern with requiresSession
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/tools/run-tool.ts:37-51` - ToolExecutionConfig type showing all options
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/tools/definitions.ts:161-297` - Tool registration pattern
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/tools/error-classification.ts:45-64` - Error classification pattern (classifyInteractionError)

  **API/Type References**:
  - `runTool` from `./run-tool.js` - Core tool execution wrapper
  - `getSessionManager` from `../session-manager.js` - Session manager singleton
  - `ErrorCodes` from `../types/errors.js` - Error code constants
  - `McpResponse`, `HandlerOptions` from `../types/index.js` - Type definitions

  **Acceptance Criteria**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp

  # Verify context.ts exists and uses runTool:
  test -f src/mcp-server/tools/context.ts && echo "File exists"
  grep "runTool" src/mcp-server/tools/context.ts
  # Assert: Returns matches showing runTool usage

  # Verify error classifier:
  grep "classifyContextError" src/mcp-server/tools/error-classification.ts
  # Assert: Returns match

  # Verify tools registered:
  grep "set_context:" src/mcp-server/tools/definitions.ts
  grep "get_context:" src/mcp-server/tools/definitions.ts
  # Assert: Both return matches

  yarn tsc --noEmit
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(tools): add mm_set_context and mm_get_context tools with runTool pattern`
  - Files: `src/mcp-server/tools/context.ts`, `src/mcp-server/tools/definitions.ts`, `src/mcp-server/tools/error-classification.ts`
  - Pre-commit: `yarn lint`

---

- [ ] 6. Update tests, exports, and publish via yalc (mcp-core)

  **What to do**:

  **6a. Update `src/index.ts`** - Add export for context handlers (after other tool exports ~line 47):

  ```typescript
  export * from './mcp-server/tools/context.js';
  ```

  **6b. Update `src/mcp-server/tools/definitions.test.ts`**:
  - Change assertion from 24 to 26 tools: `expect(definitions.length).toBe(26);`
  - Add `mm_set_context` and `mm_get_context` to the `expectedTools` array (~line 26-51)

  **6c. Build and publish via yalc**:

  ```bash
  yarn build
  yalc publish --push
  ```

  **6d. In extension repo, update yalc**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2
  yalc update @metamask/metamask-mcp-core
  ```

  **Must NOT do**:
  - Do not publish to npm (yalc only for local development)
  - Do not skip the test update

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small edits + build/publish
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 6)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/index.ts:36-47` - Existing tool handler exports
  - `/Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp/src/mcp-server/tools/definitions.test.ts:17-55` - Tool count assertion and expectedTools array

  **Acceptance Criteria**:

  ```bash
  # In mcp-core:
  cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp

  # Verify export added:
  grep "context.js" src/index.ts
  # Assert: Returns match

  # Verify test updated:
  grep "26" src/mcp-server/tools/definitions.test.ts | grep "toBe"
  # Assert: Returns match
  grep "mm_set_context" src/mcp-server/tools/definitions.test.ts
  grep "mm_get_context" src/mcp-server/tools/definitions.test.ts
  # Assert: Both return matches

  yarn test
  # Assert: All tests pass (including updated tool count)

  yarn build && yalc publish --push
  # Assert: "Package published"

  # In extension:
  cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2
  yalc update @metamask/metamask-mcp-core
  # Assert: Package updated
  ```

  **Commit**: YES
  - Message: `feat(tools): update exports and tests for context tools`
  - Files: `src/index.ts`, `src/mcp-server/tools/definitions.test.ts`
  - Pre-commit: `yarn lint && yarn test`

---

- [ ] 7. Implement setContext and getContextInfo in MetaMaskSessionManager (extension)

  **What to do**:
  - Import factory functions at top of `test/e2e/playwright/llm-workflow/mcp-server/metamask-provider.ts`:

    ```typescript
    import {
      createMetaMaskE2EContext,
      createMetaMaskProdContext,
    } from '../capabilities/factory';
    import { ErrorCodes } from '@metamask/metamask-mcp-core';
    ```

  - Add method implementations to MetaMaskSessionManager class:

    ```typescript
    setContext(context: 'e2e' | 'prod'): void {
      if (this.hasActiveSession()) {
        throw new Error(
          `${ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED}: Cannot switch context while session is active. ` +
          `Current session: ${this.getSessionId()}. Call mm_cleanup first.`
        );
      }

      const currentContext = this.getEnvironmentMode();
      if (currentContext === context) {
        return; // No-op if same context
      }

      // Create new context (clears capability state)
      const newContext = context === 'e2e'
        ? createMetaMaskE2EContext()
        : createMetaMaskProdContext();

      this.setWorkflowContext(newContext as WorkflowContext);
    }

    getContextInfo(): {
      currentContext: 'e2e' | 'prod';
      hasActiveSession: boolean;
      sessionId: string | null;
      capabilities: { available: string[] };
      canSwitchContext: boolean;
    } {
      const context = this.getEnvironmentMode();
      const hasSession = this.hasActiveSession();

      const availableCapabilities: string[] = [];
      if (this.getBuildCapability()) availableCapabilities.push('build');
      if (this.getFixtureCapability()) availableCapabilities.push('fixture');
      if (this.getChainCapability()) availableCapabilities.push('chain');
      if (this.getContractSeedingCapability()) availableCapabilities.push('contractSeeding');
      if (this.getStateSnapshotCapability()) availableCapabilities.push('stateSnapshot');
      if (this.getMockServerCapability()) availableCapabilities.push('mockServer');

      return {
        currentContext: context,
        hasActiveSession: hasSession,
        sessionId: this.getSessionId() ?? null,
        capabilities: { available: availableCapabilities },
        canSwitchContext: !hasSession,
      };
    }
    ```

  **Must NOT do**:
  - Do not allow context switch during active session
  - Do not persist context across server restarts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Adding methods to existing class
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 8)
  - **Parallel Group**: Wave 2 (with Task 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2/test/e2e/playwright/llm-workflow/mcp-server/metamask-provider.ts:49-63` - Existing hasActiveSession, setWorkflowContext, getEnvironmentMode patterns
  - `/Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2/test/e2e/playwright/llm-workflow/capabilities/factory.ts:51-146` - Factory functions to import

  **API/Type References**:
  - `ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED` - New error code from Task 1
  - `createMetaMaskE2EContext`, `createMetaMaskProdContext` from `../capabilities/factory`

  **Acceptance Criteria**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2

  grep -n "setContext" test/e2e/playwright/llm-workflow/mcp-server/metamask-provider.ts
  # Assert: Returns line number showing method definition

  grep -n "getContextInfo" test/e2e/playwright/llm-workflow/mcp-server/metamask-provider.ts
  # Assert: Returns line number showing method definition

  yarn tsc --noEmit -p test/e2e/playwright/llm-workflow/tsconfig.json
  # Assert: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(mcp-server): implement setContext and getContextInfo in MetaMaskSessionManager`
  - Files: `test/e2e/playwright/llm-workflow/mcp-server/metamask-provider.ts`
  - Pre-commit: `yarn lint:changed:fix`

---

- [ ] 8. Write unit tests and update integration.test.ts (extension)

  **What to do**:

  **8a. Update `test/e2e/playwright/llm-workflow/capabilities/integration.test.ts`**:
  - Add `mm_set_context` and `mm_get_context` to the `expectedTools` array (lines ~83-108)
  - The array should have 26 tools total

  **8b. Add tests** to `factory.test.ts` (or create `metamask-provider.test.ts`) following Jest patterns with mocks:

  **Testing approach (IMPORTANT - use Jest mocks, NOT actual capabilities):**

  ```typescript
  describe('MetaMaskSessionManager context switching', () => {
    let sessionManager: typeof metaMaskSessionManager;

    beforeEach(() => {
      // Use actual session manager but mock internal state
      sessionManager = metaMaskSessionManager;
      sessionManager.setWorkflowContext(
        createMetaMaskE2EContext() as WorkflowContext,
      );
    });

    afterEach(() => {
      sessionManager.setWorkflowContext(
        undefined as unknown as WorkflowContext,
      );
    });

    describe('setContext', () => {
      it('switches from e2e to prod context successfully', () => {
        // Arrange: Manager starts with e2e context
        expect(sessionManager.getEnvironmentMode()).toBe('e2e');

        // Act: Switch to prod
        sessionManager.setContext('prod');

        // Assert: Context is now prod
        expect(sessionManager.getEnvironmentMode()).toBe('prod');
      });

      it('is no-op when switching to same context', () => {
        // Arrange: Manager has e2e context
        const originalContext = sessionManager.getWorkflowContext();

        // Act: Switch to e2e (same context)
        sessionManager.setContext('e2e');

        // Assert: Context object unchanged (still same instance)
        expect(sessionManager.getEnvironmentMode()).toBe('e2e');
      });

      it('throws MM_CONTEXT_SWITCH_BLOCKED when session is active', () => {
        // Arrange: Mock hasActiveSession to return true
        const hasActiveSessionSpy = jest
          .spyOn(sessionManager, 'hasActiveSession')
          .mockReturnValue(true);
        const getSessionIdSpy = jest
          .spyOn(sessionManager, 'getSessionId')
          .mockReturnValue('test-session-123');

        // Act & Assert: setContext should throw
        expect(() => sessionManager.setContext('prod')).toThrow(
          'MM_CONTEXT_SWITCH_BLOCKED',
        );
        expect(() => sessionManager.setContext('prod')).toThrow(
          'Call mm_cleanup first',
        );

        // Cleanup
        hasActiveSessionSpy.mockRestore();
        getSessionIdSpy.mockRestore();
      });

      it('creates new context instance on switch (clears capability state)', () => {
        // Arrange: Get reference to original context
        const originalContext = sessionManager.getWorkflowContext();

        // Act: Switch to prod and back to e2e
        sessionManager.setContext('prod');
        sessionManager.setContext('e2e');

        // Assert: Context is different instance (fresh state)
        const newContext = sessionManager.getWorkflowContext();
        expect(newContext).not.toBe(originalContext);
      });
    });

    describe('getContextInfo', () => {
      it('returns correct info for e2e context', () => {
        const info = sessionManager.getContextInfo();

        expect(info.currentContext).toBe('e2e');
        expect(info.capabilities.available).toContain('build');
        expect(info.capabilities.available).toContain('fixture');
        expect(info.capabilities.available).toContain('chain');
      });

      it('returns correct info for prod context', () => {
        sessionManager.setContext('prod');
        const info = sessionManager.getContextInfo();

        expect(info.currentContext).toBe('prod');
        // Prod has fewer capabilities
        expect(info.capabilities.available).not.toContain('fixture');
      });

      it('returns canSwitchContext=false when session active', () => {
        const spy = jest
          .spyOn(sessionManager, 'hasActiveSession')
          .mockReturnValue(true);

        const info = sessionManager.getContextInfo();
        expect(info.canSwitchContext).toBe(false);

        spy.mockRestore();
      });

      it('returns canSwitchContext=true when no session', () => {
        const spy = jest
          .spyOn(sessionManager, 'hasActiveSession')
          .mockReturnValue(false);

        const info = sessionManager.getContextInfo();
        expect(info.canSwitchContext).toBe(true);

        spy.mockRestore();
      });

      it('returns sessionId when session is active', () => {
        const hasSessionSpy = jest
          .spyOn(sessionManager, 'hasActiveSession')
          .mockReturnValue(true);
        const getIdSpy = jest
          .spyOn(sessionManager, 'getSessionId')
          .mockReturnValue('session-456');

        const info = sessionManager.getContextInfo();
        expect(info.sessionId).toBe('session-456');
        expect(info.hasActiveSession).toBe(true);

        hasSessionSpy.mockRestore();
        getIdSpy.mockRestore();
      });
    });
  });
  ```

  **Must NOT do**:
  - Do not create integration tests that actually launch browser or Anvil
  - Do not use manual mocks in `__mocks__/`
  - Do not forget to update integration.test.ts expectedTools array

  **Clarification on mocking strategy**:
  - Constructing context objects via `createMetaMaskE2EContext()`/`createMetaMaskProdContext()` is OK (these are lightweight factory calls)
  - Use `jest.spyOn()` to mock session state (hasActiveSession, getSessionId) when testing error paths
  - Do NOT start Playwright browser, Anvil chain, or deploy contracts in unit tests

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Following existing test patterns
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 7)
  - **Parallel Group**: Wave 2 (with Task 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `/Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2/test/e2e/playwright/llm-workflow/capabilities/factory.test.ts:1-239` - Existing test patterns with mocks
  - `/Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2/test/e2e/playwright/llm-workflow/capabilities/integration.test.ts:81-114` - Expected tools array to update

  **Test References**:
  - Follow existing test naming convention (no "should", present tense)
  - Use `describe` blocks organized by method name
  - Use `jest.spyOn()` for mocking, not manual mocks

  **Acceptance Criteria**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2

  # Verify integration.test.ts updated:
  grep "mm_set_context" test/e2e/playwright/llm-workflow/capabilities/integration.test.ts
  grep "mm_get_context" test/e2e/playwright/llm-workflow/capabilities/integration.test.ts
  # Assert: Both return matches

  yarn jest test/e2e/playwright/llm-workflow/ --testNamePattern="context"
  # Assert: All context-related tests pass

  yarn jest test/e2e/playwright/llm-workflow/
  # Assert: All tests pass (26 tools expected)
  ```

  **Commit**: YES
  - Message: `test(llm-workflow): add unit tests for context switching and update integration tests`
  - Files: Test file(s), `test/e2e/playwright/llm-workflow/capabilities/integration.test.ts`
  - Pre-commit: `yarn lint:changed:fix`

---

- [ ] 9. Update documentation (extension)

  **What to do**:
  - Add to tool tables in both READMEs:
    ```markdown
    | `mm_set_context` | Switch workflow context (e2e or prod) |
    | `mm_get_context` | Get current context and capabilities |
    ```
  - Add new section "Context Switching" explaining:
    - Default context is e2e
    - Cannot switch during active session
    - Available capabilities per context
    - Example usage

  **Must NOT do**:
  - Do not create new documentation files

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation task
  - **Skills**: [`git-master`]
    - `git-master`: For atomic commit

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Task 9 - Final)
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 8

  **References**:

  **Documentation References**:
  - `/Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2/test/e2e/playwright/llm-workflow/README.md`
  - `/Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2/test/e2e/playwright/llm-workflow/mcp-server/README.md`

  **Acceptance Criteria**:

  ```bash
  cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2

  grep "mm_set_context" test/e2e/playwright/llm-workflow/README.md
  grep "mm_get_context" test/e2e/playwright/llm-workflow/README.md
  grep "mm_set_context" test/e2e/playwright/llm-workflow/mcp-server/README.md
  grep "mm_get_context" test/e2e/playwright/llm-workflow/mcp-server/README.md
  # Assert: All return matches
  ```

  **Commit**: YES
  - Message: `docs(llm-workflow): document context switching tools`
  - Files: README files
  - Pre-commit: `yarn lint:changed:fix`

---

## Commit Strategy

| After Task | Repo      | Message                                                            | Verification    |
| ---------- | --------- | ------------------------------------------------------------------ | --------------- |
| 1          | mcp-core  | `feat(types): add context switching error codes and context field` | `yarn tsc`      |
| 2          | mcp-core  | `feat(knowledge-store): wire context field into step records`      | `yarn test`     |
| 3          | mcp-core  | `feat(session-manager): add context methods to interface`          | `yarn tsc`      |
| 4          | mcp-core  | `feat(schemas): add setContext and getContext schemas to registry` | `yarn tsc`      |
| 5          | mcp-core  | `feat(tools): add mm_set_context and mm_get_context tools`         | `yarn tsc`      |
| 6          | mcp-core  | `feat(tools): update exports and tests for context tools`          | `yarn test`     |
| N/A        | mcp-core  | (yalc publish, no commit)                                          | Package updated |
| 7          | extension | `feat(mcp-server): implement context switching`                    | `yarn tsc`      |
| 8          | extension | `test(llm-workflow): add context switching tests`                  | `yarn jest`     |
| 9          | extension | `docs(llm-workflow): document context switching tools`             | `grep`          |

---

## Success Criteria

### Verification Commands

```bash
# 1. mcp-core builds and tests pass
cd /Users/joaotavares/Documents/projects/consensys/Metamask/metamask-extension-mcp
yarn build && yarn test

# 2. Extension TypeScript compiles
cd /Users/joaotavares/Documents/projects/consensys/metamask-extension-worktrees/worktree-2
yarn tsc --noEmit -p test/e2e/playwright/llm-workflow/tsconfig.json

# 3. Extension tests pass
yarn jest test/e2e/playwright/llm-workflow/

# 4. Lint passes
yarn lint:changed
```

### Final Checklist

- [ ] `mm_set_context` tool works when no session active
- [ ] `mm_set_context` throws `MM_CONTEXT_SWITCH_BLOCKED` during active session
- [ ] `mm_get_context` returns correct context info
- [ ] Context field appears in step records (when session exists)
- [ ] Default startup context is e2e
- [ ] All "Must Have" requirements present
- [ ] All "Must NOT Have" guardrails respected
- [ ] All tests pass (including 26 tool count assertion)
- [ ] Documentation updated
