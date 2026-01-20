import type { Page } from '@playwright/test';
import type {
  McpResponse,
  HandlerOptions,
  StepRecordObservation,
  TestIdItem,
  A11yNodeTrimmed,
  ErrorCode,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import type { ExtensionState } from '../../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

function createEmptyObservation(): StepRecordObservation {
  return {
    state: {} as ExtensionState,
    testIds: [],
    a11y: { nodes: [] },
  };
}

/**
 * Observation collection policy for tool execution.
 * - 'none': Skip observation collection (for knowledge queries, build, etc.)
 * - 'default': Collect state, testIds, a11y nodes, update refMap
 * - 'custom': Tool provides its own observation via executeResult
 */
export type ObservationPolicy = 'none' | 'default' | 'custom';

/**
 * Context passed to the execute function.
 */
export type ToolExecutionContext = {
  /** Current session ID (undefined if no active session) */
  sessionId: string | undefined;
  /** Playwright page instance (only available if requiresSession is true) */
  page: Page;
  /** Map of a11y refs to selectors */
  refMap: Map<string, string>;
  /** Timestamp when execution started */
  startTime: number;
};

/**
 * Result returned from the execute function.
 */
export type ToolExecuteResult<TResult> = {
  /** The result data to return to the caller */
  result: TResult;
  /** Custom observation (only used when observationPolicy is 'custom') */
  observation?: StepRecordObservation;
};

/**
 * Configuration for a tool execution.
 */
export type ToolExecutionConfig<TInput, TResult> = {
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
  execute: (
    context: ToolExecutionContext,
  ) => Promise<TResult | ToolExecuteResult<TResult>>;

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
};

/**
 * Helper to check if execute result contains a custom observation.
 *
 * @param result - The result from execute to check
 * @returns True if the result is a ToolExecuteResult with custom observation
 */
function isToolExecuteResult<TResult>(
  result: TResult | ToolExecuteResult<TResult>,
): result is ToolExecuteResult<TResult> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'result' in result &&
    Object.prototype.hasOwnProperty.call(result, 'result')
  );
}

/**
 * Execute a tool with standardized validation, observation, and recording.
 *
 * This wrapper reduces boilerplate in tool handlers by providing:
 * - Session validation
 * - Automatic observation collection
 * - Step recording to knowledge store
 * - Standardized error handling and classification
 *
 * @param config - Tool execution configuration
 * @returns MCP response with result or error
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
      page: requiresSession ? sessionManager.getPage() : (undefined as never),
      refMap: requiresSession ? sessionManager.getRefMap() : new Map(),
      startTime,
    };

    // 3. Execute tool action
    const executeResult = await config.execute(context);

    // 4. Extract result and optional custom observation
    let result: TResult;
    let customObservation: StepRecordObservation | undefined;

    if (isToolExecuteResult<TResult>(executeResult)) {
      result = executeResult.result;
      customObservation = executeResult.observation;
    } else {
      result = executeResult;
    }

    // 5. Collect observation (if policy requires)
    let observation: StepRecordObservation | undefined;

    if (observationPolicy === 'custom' && customObservation) {
      observation = customObservation;
    } else if (observationPolicy === 'default' && requiresSession) {
      const state = await sessionManager.getExtensionState();
      const testIds: TestIdItem[] = await collectTestIds(context.page, 50);
      const {
        nodes,
        refMap: newRefMap,
      }: { nodes: A11yNodeTrimmed[]; refMap: Map<string, string> } =
        await collectTrimmedA11ySnapshot(context.page);
      sessionManager.setRefMap(newRefMap);
      observation = createDefaultObservation(state, testIds, nodes);
    }

    // 6. Record step (if session exists)
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
        observation: observation ?? createEmptyObservation(),
        durationMs: Date.now() - startTime,
      });
    }

    return createSuccessResponse<TResult>(result, sessionId, startTime);
  } catch (error) {
    const errorInfo = config.classifyError?.(error) ?? {
      code: `MM_${config.toolName.toUpperCase().replace(/^MM_/u, '')}_FAILED`,
      message: error instanceof Error ? error.message : String(error),
    };

    // Record failed step
    if (sessionId) {
      const recordInput = config.sanitizeInputForRecording
        ? config.sanitizeInputForRecording(config.input)
        : (config.input as Record<string, unknown>);

      await knowledgeStore.recordStep({
        sessionId,
        toolName: config.toolName,
        input: recordInput,
        target: config.getTarget?.(config.input),
        outcome: {
          ok: false,
          error: { code: errorInfo.code, message: errorInfo.message },
        },
        observation: createEmptyObservation(),
        durationMs: Date.now() - startTime,
      });
    }

    return createErrorResponse(
      errorInfo.code as ErrorCode,
      errorInfo.message,
      { input: config.input },
      sessionId,
      startTime,
    );
  }
}
