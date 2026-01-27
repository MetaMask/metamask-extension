# SPEC-07: Tool Execution Plumbing, MCP Structured Outputs, Knowledge Store Performance, and Batching

## Overview

This specification details improvements to the MCP server focused on reducing boilerplate, improving agent ergonomics, optimizing knowledge store performance, and adding batch execution capabilities.

### Goals

1. **Standardize tool execution plumbing**: Create a `runTool()` wrapper to reduce handler boilerplate
2. **Switch to MCP-native structured outputs**: Use `structuredContent` + `isError` for better agent parsing
3. **Make knowledge-store bounded & predictable**: Fix confidence normalization, add caching, implement indexing
4. **Add batch execution**: Implement `mm_run_steps` to reduce round trips and improve testing time

### Non-Goals

- Breaking changes to existing tool schemas
- Changing the knowledge store persistence format (JSON files)
- Adding concurrent session support (singleton pattern remains)
- Implementing embeddings or vector search (keep heuristic approach)

### Decisions

| Question                   | Decision                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Execution wrapper location | New `tools/run-tool.ts`                                                                                                              |
| Observation policy         | Configurable per-tool: `none`, `default`, or `custom`                                                                                |
| Structured output format   | ~~Use `structuredContent` + concise `content` text~~ **REVERTED**: Use standard `content[0].text` with full JSON (see Phase 2 notes) |
| Knowledge store indexing   | In-memory inverted index, built lazily per session                                                                                   |
| Batch execution semantics  | Sequential, continue-on-error by default, per-step results                                                                           |

---

## Current State Analysis

### Tool Handler Boilerplate (~60 lines repeated per handler)

Every interaction tool repeats this pattern:

```typescript
export async function handleClick(input: ClickInput): Promise<McpResponse<ClickResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const timeoutMs = input.timeoutMs ?? 15000;

  try {
    // 1. Session validation (repeated 14x)
    if (!sessionManager.hasActiveSession()) {
      return createErrorResponse(ErrorCodes.MM_NO_ACTIVE_SESSION, ...);
    }

    // 2. Target validation (repeated 3x for click/type/wait)
    const validation = validateTargetSelection(input);
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.MM_INVALID_INPUT, ...);
    }

    // 3. Tool-specific action
    const locator = await waitForTarget(page, targetType, targetValue, refMap, timeoutMs);
    await locator.click();

    // 4. Observation collection (repeated 11x)
    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap: newRefMap } = await collectTrimmedA11ySnapshot(page);
    sessionManager.setRefMap(newRefMap);

    // 5. Knowledge recording (repeated 11x)
    await knowledgeStore.recordStep({ sessionId, toolName, input, target, outcome, observation, durationMs });

    return createSuccessResponse<ClickResult>({ clicked: true, target }, sessionId, startTime);
  } catch (error) {
    // 6. Error classification (repeated with variations)
    if (message.includes('Unknown a11yRef') || message.includes('not found')) {
      return createErrorResponse(ErrorCodes.MM_TARGET_NOT_FOUND, ...);
    }
    return createErrorResponse(ErrorCodes.MM_CLICK_FAILED, ...);
  }
}
```

### Response Format (JSON-in-text wrapping)

Current MCP response:

```typescript
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        ok: true,
        result: { clicked: true, target: 'testId:confirm-button' },
        meta: { timestamp: '...', sessionId: '...', durationMs: 150 },
      }),
    },
  ];
}
```

Problems:

- Agents must JSON.parse the text content
- Parsing failures cause agent errors
- Token overhead from JSON encoding

### Knowledge Store Performance

| Issue                    | Current Behavior                                | Impact                                                |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------------- |
| Confidence normalization | `Math.min(score / 20, 1)` where 20 is arbitrary | Max score can exceed 20, making confidence unreliable |
| Step file scanning       | Load all step files for each search             | O(n) disk reads per search                            |
| No scan limits           | Processes all steps in all sessions             | Slow with large artifact sets                         |

### Testing Time Concern

Each tool call requires a full MCP round trip:

- Agent sends request → MCP server processes → Response returned → Agent parses
- For a 10-step flow: 10 round trips, 10 separate recordings, 10 observation collections

---

## Implementation Plan

### Phase 1: `runTool()` Wrapper

**Effort: 1-4 hours**

#### 1.1 Create `tools/run-tool.ts`

```typescript
// tools/run-tool.ts

import type { McpResponse, HandlerOptions } from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

/**
 * Observation collection policy for tool execution.
 * - 'none': Skip observation collection (for knowledge queries, build, etc.)
 * - 'default': Collect state, testIds, a11y nodes, update refMap
 * - 'custom': Tool provides its own observation
 */
export type ObservationPolicy = 'none' | 'default' | 'custom';

/**
 * Configuration for a tool execution.
 */
export interface ToolExecutionConfig<TInput, TResult> {
  /** Tool name for logging and step recording */
  toolName: string;

  /** Raw input from MCP call */
  input: TInput;

  /** Handler options passed from server */
  options?: HandlerOptions;

  /** Whether this tool requires an active session (default: true) */
  requiresSession?: boolean;

  /** Observation collection policy (default: 'default') */
  observationPolicy?: ObservationPolicy;

  /**
   * The core tool action. Receives validated context.
   * Should throw on failure (errors are caught and classified).
   */
  execute: (context: ToolExecutionContext) => Promise<TResult>;

  /**
   * Optional: Classify errors into specific error codes.
   * If not provided, uses generic tool failure code.
   */
  classifyError?: (error: unknown) => { code: string; message: string };

  /**
   * Optional: Build target info for step recording.
   * Only needed for interaction tools (click, type, wait).
   */
  getTarget?: (
    input: TInput,
  ) => { testId?: string; selector?: string; a11yRef?: string } | undefined;

  /**
   * Optional: Transform input before recording (e.g., redact sensitive fields).
   */
  sanitizeInputForRecording?: (input: TInput) => Record<string, unknown>;
}

/**
 * Context passed to the execute function.
 */
export interface ToolExecutionContext {
  sessionId: string | undefined;
  page: Page;
  refMap: Map<string, string>;
  startTime: number;
}

/**
 * Execute a tool with standardized validation, observation, and recording.
 */
export async function runTool<TInput, TResult>(
  config: ToolExecutionConfig<TInput, TResult>,
): Promise<McpResponse<TResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const requiresSession = config.requiresSession ?? true;
  const observationPolicy = config.observationPolicy ?? 'default';

  try {
    // 1. Session validation
    if (requiresSession && !sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'No active session. Call mm_launch first.',
        undefined,
        undefined,
        startTime,
      );
    }

    // 2. Build execution context
    const context: ToolExecutionContext = {
      sessionId,
      page: requiresSession ? sessionManager.getPage() : undefined!,
      refMap: requiresSession ? sessionManager.getRefMap() : new Map(),
      startTime,
    };

    // 3. Execute tool action
    const result = await config.execute(context);

    // 4. Collect observation (if policy requires)
    let observation;
    if (observationPolicy === 'default' && requiresSession) {
      const state = await sessionManager.getExtensionState();
      const testIds = await collectTestIds(context.page, 50);
      const { nodes, refMap: newRefMap } = await collectTrimmedA11ySnapshot(
        context.page,
      );
      sessionManager.setRefMap(newRefMap);
      observation = createDefaultObservation(state, testIds, nodes);
    }

    // 5. Record step (if session exists)
    if (sessionId) {
      const recordInput = config.sanitizeInputForRecording
        ? config.sanitizeInputForRecording(config.input)
        : (config.input as Record<string, unknown>);

      await knowledgeStore.recordStep({
        sessionId,
        toolName: config.toolName,
        input: recordInput,
        target: config.getTarget?.(config.input),
        outcome: { ok: true },
        observation,
        durationMs: Date.now() - startTime,
      });
    }

    return createSuccessResponse<TResult>(result, sessionId, startTime);
  } catch (error) {
    const errorInfo = config.classifyError?.(error) ?? {
      code: `MM_${config.toolName.toUpperCase()}_FAILED`,
      message: error instanceof Error ? error.message : String(error),
    };

    // Record failed step
    if (sessionId) {
      await knowledgeStore.recordStep({
        sessionId,
        toolName: config.toolName,
        input: config.input as Record<string, unknown>,
        target: config.getTarget?.(config.input),
        outcome: {
          ok: false,
          error: { code: errorInfo.code, message: errorInfo.message },
        },
        durationMs: Date.now() - startTime,
      });
    }

    return createErrorResponse(
      errorInfo.code,
      errorInfo.message,
      { input: config.input },
      sessionId,
      startTime,
    );
  }
}
```

#### 1.2 Create Error Classification Utilities

```typescript
// tools/error-classification.ts

import { ErrorCodes } from '../types';

/**
 * Common error patterns and their classifications.
 */
export const ERROR_PATTERNS = {
  targetNotFound: [
    'Unknown a11yRef',
    'not found',
    'No element found',
    'Timeout waiting for selector',
  ],
  timeout: ['Timeout', 'exceeded', 'timed out'],
  navigation: ['Navigation failed', 'net::ERR'],
} as const;

/**
 * Classify an error for interaction tools (click, type, wait).
 */
export function classifyInteractionError(
  error: unknown,
  fallbackCode: string,
): { code: string; message: string } {
  const message = error instanceof Error ? error.message : String(error);

  for (const pattern of ERROR_PATTERNS.targetNotFound) {
    if (message.includes(pattern)) {
      return { code: ErrorCodes.MM_TARGET_NOT_FOUND, message };
    }
  }

  for (const pattern of ERROR_PATTERNS.timeout) {
    if (message.includes(pattern)) {
      return { code: ErrorCodes.MM_WAIT_TIMEOUT, message };
    }
  }

  return { code: fallbackCode, message: `Operation failed: ${message}` };
}
```

#### 1.3 Refactor `handleClick` to Use `runTool()`

```typescript
// tools/interaction.ts (after refactoring)

import { runTool, type ToolExecutionConfig } from './run-tool';
import { classifyInteractionError } from './error-classification';
import { validateTargetSelection } from '../types';
import { waitForTarget } from '../discovery';
import type {
  ClickInput,
  ClickResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import { ErrorCodes } from '../types';

export async function handleClick(
  input: ClickInput,
  options?: HandlerOptions,
): Promise<McpResponse<ClickResult>> {
  const timeoutMs = input.timeoutMs ?? 15000;

  // Validate target before execution
  const validation = validateTargetSelection(input);
  if (!validation.valid) {
    return createErrorResponse(
      ErrorCodes.MM_INVALID_INPUT,
      (validation as { valid: false; error: string }).error,
      { input },
      sessionManager.getSessionId(),
      Date.now(),
    );
  }

  const { type: targetType, value: targetValue } = validation as {
    valid: true;
    type: 'a11yRef' | 'testId' | 'selector';
    value: string;
  };

  return runTool<ClickInput, ClickResult>({
    toolName: 'mm_click',
    input,
    options,

    execute: async (context) => {
      const locator = await waitForTarget(
        context.page,
        targetType,
        targetValue,
        context.refMap,
        timeoutMs,
      );
      await locator.click();

      return {
        clicked: true,
        target: `${targetType}:${targetValue}`,
      };
    },

    getTarget: () => ({ [targetType]: targetValue }),

    classifyError: (error) =>
      classifyInteractionError(error, ErrorCodes.MM_CLICK_FAILED),

    sanitizeInputForRecording: () => ({ timeoutMs }),
  });
}
```

#### 1.4 Migration Waves

| Wave | Tools                                                                | Complexity                                     |
| ---- | -------------------------------------------------------------------- | ---------------------------------------------- |
| 1    | `mm_click`, `mm_type`, `mm_wait_for`                                 | High (target validation, error classification) |
| 2    | `mm_list_testids`, `mm_accessibility_snapshot`, `mm_describe_screen` | Medium (custom observation)                    |
| 3    | `mm_navigate`, `mm_wait_for_notification`, `mm_screenshot`           | Low                                            |
| 4    | `mm_get_state`, `mm_knowledge_*`                                     | Low (no observation)                           |
| 5    | `mm_seed_*`, `mm_build`, `mm_launch`, `mm_cleanup`                   | Low (no observation, special handling)         |

#### 1.5 Testing

- Unit test `runTool()` with mock handlers
- Test session validation returns correct error
- Test observation collection can be skipped
- Test error classification works correctly
- Verify existing handler tests still pass after migration

---

### Phase 2: MCP-Native Structured Outputs

> **⚠️ REVERTED (2026-01-20)**
>
> This phase was implemented but subsequently reverted because `structuredContent` is **not part of the official MCP specification**. The MCP `CallToolResult` schema only includes:
>
> - `content` (required) - Array of content items
> - `isError` (optional) - Boolean error flag
> - `_meta` (optional) - Metadata
>
> Clients like OpenCode/Vercel AI SDK only process the standard `content` field and ignore non-standard fields like `structuredContent`. The "ergonomic" text summaries in `formatResponseAsText()` actually broke agent functionality by truncating knowledge store data to 100 characters.
>
> **Resolution:** Return full `JSON.stringify(response)` in the standard `content[0].text` field. This ensures all MCP clients receive complete, parseable data.

**Effort: 1-2 hours**

~~Since there are no existing consumers, we can implement the clean solution directly without backward compatibility concerns.~~

#### 2.1 Update Server Response Format

```typescript
// server.ts - Updated tool call handler

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // ... validation and handler lookup ...

  const response = await handler(validatedInput, { signal: request.signal });

  return {
    // Machine-readable structured content (primary output for agents)
    structuredContent: response,

    // Human-readable text summary (for logs and debugging)
    content: [
      {
        type: 'text',
        text: formatResponseAsText(response),
      },
    ],

    // MCP-native error flag
    isError: !response.ok,
  };
});

/**
 * Format response as concise human-readable text.
 */
function formatResponseAsText(response: McpResponse<unknown>): string {
  if (!response.ok) {
    return `Error [${response.error?.code}]: ${response.error?.message}`;
  }

  const result = response.result;
  if (typeof result === 'object' && result !== null) {
    if ('clicked' in result) return `Clicked: ${(result as any).target}`;
    if ('typed' in result)
      return `Typed ${(result as any).textLength} chars into ${(result as any).target}`;
    if ('found' in result) return `Found: ${(result as any).target}`;
    if ('items' in result)
      return `Found ${(result as any).items?.length ?? 0} items`;
    if ('nodes' in result)
      return `Found ${(result as any).nodes?.length ?? 0} a11y nodes`;
    if ('state' in result)
      return `Screen: ${(result as any).state?.currentScreen}`;
    if ('sessionId' in result)
      return `Session started: ${(result as any).sessionId}`;
    if ('steps' in result)
      return `Batch: ${(result as any).summary?.succeeded}/${(result as any).summary?.total} succeeded`;
  }

  return `OK: ${JSON.stringify(result).substring(0, 100)}`;
}
```

#### 2.2 Response Type Updates

```typescript
// types/responses.ts

/**
 * MCP-native tool result with structured content.
 */
export interface McpToolResult<T> {
  /** Machine-readable structured response */
  structuredContent: McpResponse<T>;

  /** Human-readable text content */
  content: Array<{ type: 'text'; text: string }>;

  /** True if the tool execution resulted in an error */
  isError: boolean;
}
```

#### 2.3 Testing

- Verify `structuredContent` contains the full response object
- Verify `isError` is true when `response.ok` is false
- Verify `content[0].text` contains concise human-readable summary

---

### Phase 3: Knowledge Store Performance

**Effort: 3-6 hours**

#### 3.1 Fix Confidence Normalization

```typescript
// knowledge-store.ts

/**
 * Maximum possible similarity score based on weights and overlap caps.
 *
 * Calculation:
 * - sameScreen: 8 (1 match max)
 * - urlPathOverlap: 6 (1 match max)
 * - testIdOverlap: 3 * 3 = 9 (capped at 3 overlaps)
 * - a11yOverlap: 2 * 2 = 4 (capped at 2 overlaps)
 * - actionableTool: 2 (1 match max)
 *
 * Total: 8 + 6 + 9 + 4 + 2 = 29
 */
const MAX_SIMILARITY_SCORE =
  SIMILARITY_WEIGHTS.sameScreen +
  SIMILARITY_WEIGHTS.urlPathOverlap +
  SIMILARITY_WEIGHTS.testIdOverlap * 3 + // Cap of 3 overlaps
  SIMILARITY_WEIGHTS.a11yOverlap * 2 + // Cap of 2 overlaps
  SIMILARITY_WEIGHTS.actionableTool;

// In getSimilarSteps():
const similarSteps: PriorKnowledgeSimilarStep[] = scoredSteps
  .slice(0, PRIOR_KNOWLEDGE_CONFIG.maxSimilarSteps)
  .map(({ step, score }) => ({
    // ... other fields ...
    confidence: Math.min(score / MAX_SIMILARITY_SCORE, 1), // Now correctly normalized
  }));
```

#### 3.2 Add In-Memory Step Index

```typescript
// knowledge-store.ts

/** TTL for step index cache (5 minutes) */
const STEP_INDEX_TTL_MS = 5 * 60 * 1000;

/**
 * Inverted index mapping tokens to step file references.
 */
interface StepIndex {
  /** Maps token -> array of step filenames */
  tokenToFiles: Map<string, string[]>;
  /** When this index was built */
  builtAt: number;
  /** List of all step files (for full scans) */
  allFiles: string[];
}

export class KnowledgeStore {
  private stepIndexCache: Map<string, StepIndex> = new Map();

  /**
   * Get or build step index for a session.
   */
  private async getStepIndex(sessionId: string): Promise<StepIndex> {
    const cached = this.stepIndexCache.get(sessionId);

    if (cached && Date.now() - cached.builtAt < STEP_INDEX_TTL_MS) {
      return cached;
    }

    const index = await this.buildStepIndex(sessionId);
    this.stepIndexCache.set(sessionId, index);
    return index;
  }

  private async buildStepIndex(sessionId: string): Promise<StepIndex> {
    const stepsDir = path.join(this.knowledgeRoot, sessionId, 'steps');
    const tokenToFiles = new Map<string, string[]>();
    let allFiles: string[] = [];

    try {
      const files = await fs.readdir(stepsDir);
      allFiles = files.filter((f) => f.endsWith('.json'));

      for (const file of allFiles) {
        // Extract tokens from filename: "20240120-143052-mm_click.json"
        const tokens = tokenizeIdentifier(file.replace('.json', ''));

        for (const token of tokens) {
          const existing = tokenToFiles.get(token) ?? [];
          existing.push(file);
          tokenToFiles.set(token, existing);
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return {
      tokenToFiles,
      builtAt: Date.now(),
      allFiles,
    };
  }

  /**
   * Search steps using index for pre-filtering.
   */
  async searchSteps(
    query: string,
    limit: number,
    scope: KnowledgeScope,
    currentSessionId: string | undefined,
    filters?: KnowledgeFilters,
  ): Promise<KnowledgeStepSummary[]> {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const expandedTokens = expandWithSynonyms(queryTokens);
    const sessionIds = await this.resolveSessionIds(
      scope,
      currentSessionId,
      filters,
    );

    const matches: StepMatch[] = [];

    for (const sid of sessionIds) {
      const index = await this.getStepIndex(sid);

      // Use index to find candidate files
      const candidateFiles = this.getCandidateFiles(index, expandedTokens);

      // Only load and score candidate files (not all files)
      for (const file of candidateFiles) {
        if (matches.length >= limit * 3) break; // Early exit with buffer

        const step = await this.loadStepFile(sid, file);
        if (!step || !this.stepMatchesFilters(step, filters)) continue;

        const { score, matchedFields } = this.computeSearchScore(
          step,
          expandedTokens,
        );
        if (score > 0) {
          matches.push({ step, score, matchedFields });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches
      .slice(0, limit)
      .map((m) => this.summarizeStep(m.step, m.matchedFields));
  }

  private getCandidateFiles(index: StepIndex, tokens: string[]): string[] {
    const fileScores = new Map<string, number>();

    for (const token of tokens) {
      const files = index.tokenToFiles.get(token) ?? [];
      for (const file of files) {
        fileScores.set(file, (fileScores.get(file) ?? 0) + 1);
      }
    }

    // Return files sorted by token match count, then all files as fallback
    const scored = Array.from(fileScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([file]) => file);

    // If no matches from index, return all files (up to scan limit)
    if (scored.length === 0) {
      return index.allFiles.slice(0, SCAN_LIMITS.maxStepsPerSession);
    }

    return scored;
  }
}
```

#### 3.3 Add Scan Limits

```typescript
// knowledge-store.ts

const SCAN_LIMITS = {
  maxSessionsToScan: 20,
  maxStepsPerSession: 500,
  maxTotalSteps: 2000,
} as const;

// Apply in search and similarity methods
async searchSteps(...): Promise<...> {
  const sessionIds = (await this.resolveSessionIds(...))
    .slice(0, SCAN_LIMITS.maxSessionsToScan);

  let totalStepsScanned = 0;

  for (const sid of sessionIds) {
    if (totalStepsScanned >= SCAN_LIMITS.maxTotalSteps) break;

    const steps = await this.loadSessionSteps(sid);
    const limitedSteps = steps.slice(0, SCAN_LIMITS.maxStepsPerSession);
    totalStepsScanned += limitedSteps.length;

    // ... process steps ...
  }
}
```

#### 3.4 Testing

- Test confidence normalization: verify 1.0 is reachable at max score
- Test index building: verify tokens extracted correctly
- Test index search: verify candidate filtering reduces step loading
- Test scan limits: verify large datasets don't cause performance issues

---

### Phase 4: `mm_run_steps` Batching

**Effort: 1-4 hours**

#### 4.1 Add Schema

```typescript
// schemas.ts

export const runStepsSchema = z.object({
  steps: z
    .array(
      z.object({
        tool: z.enum([
          'mm_click',
          'mm_type',
          'mm_wait_for',
          'mm_navigate',
          'mm_wait_for_notification',
          'mm_list_testids',
          'mm_accessibility_snapshot',
          'mm_describe_screen',
          'mm_screenshot',
          'mm_get_state',
        ]),
        args: z.record(z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(50),

  /** Stop execution on first error (default: false - continue) */
  stopOnError: z.boolean().optional().default(false),

  /**
   * When to include observations in results.
   * - 'none': Never include (fastest)
   * - 'failures': Only include for failed steps
   * - 'all': Include for all steps (default)
   */
  includeObservations: z
    .enum(['none', 'failures', 'all'])
    .optional()
    .default('all'),
});

export type RunStepsInput = z.infer<typeof runStepsSchema>;
```

#### 4.2 Add Types

```typescript
// types/tool-inputs.ts

export interface RunStepsInput {
  steps: Array<{
    tool: string;
    args?: Record<string, unknown>;
  }>;
  stopOnError?: boolean;
  includeObservations?: 'none' | 'failures' | 'all';
}

// types/tool-outputs.ts

export interface StepResult {
  tool: string;
  ok: boolean;
  result?: unknown;
  error?: { code: string; message: string; details?: unknown };
  meta: {
    durationMs: number;
    timestamp: string;
  };
}

export interface RunStepsResult {
  steps: StepResult[];
  summary: {
    ok: boolean;
    total: number;
    succeeded: number;
    failed: number;
    durationMs: number;
  };
}
```

#### 4.3 Implement Handler

```typescript
// tools/batch.ts

import type {
  RunStepsInput,
  RunStepsResult,
  StepResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { toolHandlers } from './registry';
import { toolSchemas, validateToolInput } from '../schemas';

export async function handleRunSteps(
  input: RunStepsInput,
  options?: HandlerOptions,
): Promise<McpResponse<RunStepsResult>> {
  const batchStartTime = Date.now();
  const sessionId = sessionManager.getSessionId();

  // Require active session
  if (!sessionManager.hasActiveSession()) {
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      'No active session. Call mm_launch first.',
      undefined,
      undefined,
      batchStartTime,
    );
  }

  const {
    steps: stepInputs,
    stopOnError = false,
    includeObservations = 'all',
  } = input;
  const stepResults: StepResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const stepInput of stepInputs) {
    const stepStartTime = Date.now();
    const { tool, args = {} } = stepInput;

    // Validate tool exists
    const handler = toolHandlers[tool];
    if (!handler) {
      const result: StepResult = {
        tool,
        ok: false,
        error: {
          code: ErrorCodes.MM_UNKNOWN_TOOL,
          message: `Unknown tool: ${tool}`,
        },
        meta: {
          durationMs: Date.now() - stepStartTime,
          timestamp: new Date().toISOString(),
        },
      };
      stepResults.push(result);
      failed++;

      if (stopOnError) break;
      continue;
    }

    // Validate input schema
    const schema = toolSchemas[tool];
    if (schema) {
      const validation = schema.safeParse(args);
      if (!validation.success) {
        const result: StepResult = {
          tool,
          ok: false,
          error: {
            code: ErrorCodes.MM_INVALID_INPUT,
            message: `Invalid input: ${validation.error.message}`,
          },
          meta: {
            durationMs: Date.now() - stepStartTime,
            timestamp: new Date().toISOString(),
          },
        };
        stepResults.push(result);
        failed++;

        if (stopOnError) break;
        continue;
      }
    }

    // Execute tool
    try {
      const response = await handler(args, options);

      const result: StepResult = {
        tool,
        ok: response.ok,
        result: response.ok ? response.result : undefined,
        error: !response.ok ? response.error : undefined,
        meta: {
          durationMs: Date.now() - stepStartTime,
          timestamp: new Date().toISOString(),
        },
      };

      stepResults.push(result);

      if (response.ok) {
        succeeded++;
      } else {
        failed++;
        if (stopOnError) break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const result: StepResult = {
        tool,
        ok: false,
        error: {
          code: ErrorCodes.MM_INTERNAL_ERROR,
          message: `Unexpected error: ${message}`,
        },
        meta: {
          durationMs: Date.now() - stepStartTime,
          timestamp: new Date().toISOString(),
        },
      };
      stepResults.push(result);
      failed++;

      if (stopOnError) break;
    }
  }

  const batchResult: RunStepsResult = {
    steps: stepResults,
    summary: {
      ok: failed === 0,
      total: stepResults.length,
      succeeded,
      failed,
      durationMs: Date.now() - batchStartTime,
    },
  };

  return createSuccessResponse(batchResult, sessionId, batchStartTime);
}
```

#### 4.4 Register Tool

```typescript
// tools/registry.ts

import { handleRunSteps } from './batch';

export const toolHandlers: Record<string, ToolHandler> = {
  // ... existing handlers ...
  mm_run_steps: handleRunSteps as ToolHandler,
};
```

#### 4.5 Add Tool Definition

```typescript
// tool-definitions.ts

{
  name: 'mm_run_steps',
  description: 'Execute multiple tools in sequence. Reduces round trips for multi-step flows.',
  inputSchema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        description: 'Array of tool calls to execute in order',
        items: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              description: 'Tool name (e.g., mm_click, mm_type)'
            },
            args: {
              type: 'object',
              description: 'Tool arguments'
            },
          },
          required: ['tool'],
        },
        minItems: 1,
        maxItems: 50,
      },
      stopOnError: {
        type: 'boolean',
        description: 'Stop execution on first error (default: false)',
        default: false,
      },
      includeObservations: {
        type: 'string',
        enum: ['none', 'failures', 'all'],
        description: 'When to include observations in results',
        default: 'all',
      },
    },
    required: ['steps'],
  },
}
```

#### 4.6 Usage Example

```typescript
// Agent usage
const result = await mcp.callTool('mm_run_steps', {
  steps: [
    { tool: 'mm_click', args: { testId: 'send-button' } },
    { tool: 'mm_type', args: { testId: 'amount-input', text: '0.1' } },
    { tool: 'mm_type', args: { testId: 'recipient-input', text: '0x123...' } },
    { tool: 'mm_click', args: { testId: 'confirm-button' } },
    { tool: 'mm_wait_for', args: { testId: 'transaction-complete' } },
  ],
  stopOnError: true,
});

// Result
{
  ok: true,
  result: {
    steps: [
      { tool: 'mm_click', ok: true, result: { clicked: true, target: 'testId:send-button' }, meta: { durationMs: 120, ... } },
      { tool: 'mm_type', ok: true, result: { typed: true, textLength: 3, ... }, meta: { durationMs: 85, ... } },
      { tool: 'mm_type', ok: true, result: { typed: true, textLength: 42, ... }, meta: { durationMs: 90, ... } },
      { tool: 'mm_click', ok: true, result: { clicked: true, ... }, meta: { durationMs: 150, ... } },
      { tool: 'mm_wait_for', ok: true, result: { found: true, ... }, meta: { durationMs: 2500, ... } },
    ],
    summary: { ok: true, total: 5, succeeded: 5, failed: 0, durationMs: 2945 },
  },
  meta: { ... }
}
```

#### 4.7 Testing

- Test successful batch execution
- Test `stopOnError: true` stops on first failure
- Test `stopOnError: false` continues on failure
- Test unknown tool returns proper error
- Test invalid input validation
- Test summary counts are accurate
- Test individual step timing is recorded

---

## File Changes Summary

### New Files

| File                            | Purpose                          |
| ------------------------------- | -------------------------------- |
| `tools/run-tool.ts`             | `runTool()` wrapper and types    |
| `tools/error-classification.ts` | Error pattern matching utilities |
| `tools/batch.ts`                | `mm_run_steps` handler           |

### Modified Files

| File                       | Changes                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `server.ts`                | Add `structuredContent` and `isError` to responses         |
| `knowledge-store.ts`       | Fix confidence, add caching, add indexing, add scan limits |
| `tools/interaction.ts`     | Refactor to use `runTool()`                                |
| `tools/discovery-tools.ts` | Refactor to use `runTool()`                                |
| `tools/navigation.ts`      | Refactor to use `runTool()`                                |
| `tools/screenshot.ts`      | Refactor to use `runTool()`                                |
| `tools/state.ts`           | Refactor to use `runTool()`                                |
| `tools/registry.ts`        | Add `mm_run_steps` handler                                 |
| `schemas.ts`               | Add `runStepsSchema`                                       |
| `tool-definitions.ts`      | Add `mm_run_steps` definition                              |
| `types/tool-inputs.ts`     | Add `RunStepsInput`                                        |
| `types/tool-outputs.ts`    | Add `RunStepsResult`, `StepResult`                         |

---

## Implementation Order

```
Phase 1: runTool() wrapper
├── 1.1 Create tools/run-tool.ts
├── 1.2 Create tools/error-classification.ts
├── 1.3 Refactor mm_click (prove pattern)
├── 1.4 Refactor mm_type, mm_wait_for
├── 1.5 Run tests, verify no regressions
│
Phase 2: MCP structured outputs
├── 2.1 Update server.ts response format
├── 2.2 Update response types
├── 2.3 Add tests
│
Phase 3: Knowledge store performance
├── 3.1 Fix confidence normalization
├── 3.2 Add step index
├── 3.3 Add scan limits
├── 3.4 Add tests for indexing
│
Phase 4: mm_run_steps batching
├── 4.1 Add schema
├── 4.2 Add types
├── 4.3 Implement handler
├── 4.4 Register tool
├── 4.5 Add tool definition
├── 4.6 Add tests
│
Phase 5: Remaining tool migrations
├── 5.1 Migrate discovery tools
├── 5.2 Migrate navigation tools
├── 5.3 Migrate screenshot/state tools
├── 5.4 Final test pass
```

---

## Effort Estimates

| Phase                         | Effort                      | Dependencies                       |
| ----------------------------- | --------------------------- | ---------------------------------- |
| Phase 1: `runTool()` wrapper  | 1-4 hours                   | None                               |
| Phase 2: Structured outputs   | 1-2 hours                   | None (can parallel with Phase 1)   |
| Phase 3: Knowledge store      | 3-6 hours                   | None (can parallel with Phase 1-2) |
| Phase 4: `mm_run_steps`       | 1-4 hours                   | Phase 1 (uses `runTool()` pattern) |
| Phase 5: Remaining migrations | 2-4 hours                   | Phase 1                            |
| **Total**                     | **8-20 hours (1-2.5 days)** |                                    |

---

## Success Criteria

1. **Boilerplate reduction**: Tool handlers reduced by ~40 lines each
2. **Agent parsing**: `structuredContent` available in all responses
3. **Knowledge store**:
   - Confidence values accurately reflect similarity (1.0 = max match)
   - Search completes in <100ms for typical artifact sets
4. **Batching**: 5-step flow executes in single round trip with accurate per-step results
5. **No regressions**: All existing tests pass, no breaking changes to tool schemas

---

## Rollback Plan

Each phase is independently deployable and reversible:

1. **Phase 1**: Revert tool handler changes, keep old implementations
2. **Phase 2**: Revert server.ts response format changes
3. **Phase 3**: Disable indexing via config, fall back to full scans
4. **Phase 4**: Remove `mm_run_steps` from registry (additive, no impact on existing tools)
