/**
 * Shared helper utilities for tool handlers.
 *
 * These helpers reduce duplication across tool handlers by extracting
 * common patterns for session validation, state collection, and
 * knowledge recording.
 */

import type { Page } from '@playwright/test';
import type {
  McpResponse,
  ErrorCode,
  TestIdItem,
  A11yNodeTrimmed,
  StepRecordObservation,
} from '../types';
import { createErrorResponse, ErrorCodes } from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';
import type { ExtensionState } from '../../types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Result of collecting current UI observation state.
 */
export type ObservationState = {
  state: ExtensionState;
  testIds: TestIdItem[];
  nodes: A11yNodeTrimmed[];
  refMap: Map<string, string>;
};

/**
 * Parameters for recording a tool step.
 */
export type RecordStepParams = {
  toolName: string;
  input: Record<string, unknown>;
  startTime: number;
  observation: StepRecordObservation;
  target?: Record<string, string>;
  screenshotPath?: string;
  screenshotDimensions?: { width: number; height: number };
};

/**
 * Context provided to the handler function by withActiveSession.
 */
export type ActiveSessionContext = {
  sessionId: string;
  page: Page;
  refMap: Map<string, string>;
};

// -----------------------------------------------------------------------------
// Session Validation
// -----------------------------------------------------------------------------

/**
 * Validates that an active session exists and returns an error response if not.
 *
 * @param startTime - The start time of the handler for duration tracking
 * @returns Error response if no session, undefined if session is active
 * @example
 * ```ts
 * const sessionError = requireActiveSession(startTime);
 * if (sessionError) {
 *   return sessionError;
 * }
 * // proceed with handler logic...
 * ```
 */
export function requireActiveSession<Result>(
  startTime: number,
): McpResponse<Result> | undefined {
  if (!sessionManager.hasActiveSession()) {
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      'No active session. Call mm_launch first.',
      undefined,
      undefined,
      startTime,
    ) as McpResponse<Result>;
  }
  return undefined;
}

/**
 * Higher-order function that wraps a handler with session validation.
 * Provides the handler with session context (sessionId, page, refMap).
 *
 * @param handler - The handler function to wrap
 * @returns A function that validates session and calls handler
 * @example
 * ```ts
 * export const handleClick = withActiveSession(
 *   async (input: ClickInput, ctx: ActiveSessionContext, startTime: number) => {
 *     // ctx.sessionId, ctx.page, ctx.refMap are available
 *     // If no session, error is automatically returned
 *   }
 * );
 * ```
 */
export function withActiveSession<TInput, TResult>(
  handler: (
    input: TInput,
    ctx: ActiveSessionContext,
    startTime: number,
  ) => Promise<McpResponse<TResult>>,
): (input: TInput) => Promise<McpResponse<TResult>> {
  return async (input: TInput): Promise<McpResponse<TResult>> => {
    const startTime = Date.now();

    const sessionError = requireActiveSession<TResult>(startTime);
    if (sessionError) {
      return sessionError;
    }

    const sessionId = sessionManager.getSessionId();
    if (!sessionId) {
      return createErrorResponse(
        ErrorCodes.MM_NO_ACTIVE_SESSION,
        'Session ID not found',
        undefined,
        undefined,
        startTime,
      ) as McpResponse<TResult>;
    }
    const page = sessionManager.getPage();
    const refMap = sessionManager.getRefMap();

    return handler(input, { sessionId, page, refMap }, startTime);
  };
}

// -----------------------------------------------------------------------------
// State Collection
// -----------------------------------------------------------------------------

/**
 * Collects the current UI observation state including extension state,
 * visible testIds, and accessibility tree nodes.
 *
 * This is the standard observation collection used by most tool handlers
 * after performing their action.
 *
 * @param page - Playwright page instance
 * @param testIdLimit - Maximum number of testIds to collect (default: 50)
 * @returns ObservationState with state, testIds, nodes, and refMap
 * @example
 * ```ts
 * const observation = await collectObservation(page);
 * sessionManager.setRefMap(observation.refMap);
 * ```
 */
export async function collectObservation(
  page: Page,
  testIdLimit = 50,
): Promise<ObservationState> {
  const state = await sessionManager.getExtensionState();
  const testIds = await collectTestIds(page, testIdLimit);
  const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);

  return { state, testIds, nodes, refMap };
}

/**
 * Collects observation and updates the session's refMap in one call.
 *
 * @param page - Playwright page instance
 * @param testIdLimit - Maximum number of testIds to collect (default: 50)
 * @returns ObservationState
 * @example
 * ```ts
 * const { state, testIds, nodes } = await collectAndUpdateObservation(page);
 * // refMap is automatically updated in sessionManager
 * ```
 */
export async function collectAndUpdateObservation(
  page: Page,
  testIdLimit = 50,
): Promise<ObservationState> {
  const observation = await collectObservation(page, testIdLimit);
  sessionManager.setRefMap(observation.refMap);
  return observation;
}

// -----------------------------------------------------------------------------
// Knowledge Recording
// -----------------------------------------------------------------------------

/**
 * Records a tool step to the knowledge store.
 *
 * This is a convenience wrapper around knowledgeStore.recordStep that
 * handles the common recording pattern used by most tool handlers.
 *
 * @param params - Step recording parameters
 * @example
 * ```ts
 * const observation = await collectAndUpdateObservation(page);
 * await recordToolStep({
 *   toolName: 'mm_click',
 *   input: { timeoutMs },
 *   startTime,
 *   observation: createDefaultObservation(observation.state, observation.testIds, observation.nodes),
 *   target: { testId: 'send-button' },
 * });
 * ```
 */
export async function recordToolStep(params: RecordStepParams): Promise<void> {
  const sessionId = sessionManager.getSessionId() ?? '';

  await knowledgeStore.recordStep({
    sessionId,
    toolName: params.toolName,
    input: params.input,
    target: params.target,
    outcome: { ok: true },
    observation: params.observation,
    durationMs: Date.now() - params.startTime,
    screenshotPath: params.screenshotPath,
    screenshotDimensions: params.screenshotDimensions,
  });
}

/**
 * Convenience function that collects observation and records a tool step.
 *
 * Combines collectAndUpdateObservation and recordToolStep into one call.
 *
 * @param page - Playwright page instance
 * @param toolName - Name of the tool being recorded
 * @param input - Tool input parameters
 * @param startTime - Handler start time
 * @param options - Additional recording options
 * @param options.target - Target element identifiers (testId, a11yRef, selector)
 * @param options.screenshotPath - Path to screenshot file if captured
 * @param options.screenshotDimensions - Screenshot dimensions
 * @param options.screenshotDimensions.width - Screenshot width in pixels
 * @param options.screenshotDimensions.height - Screenshot height in pixels
 * @param options.testIdLimit - Maximum number of testIds to collect
 * @returns ObservationState for use in the response
 * @example
 * ```ts
 * const observation = await collectObservationAndRecord(page, 'mm_click', { timeoutMs }, startTime, {
 *   target: { testId: 'send-button' },
 * });
 * return createSuccessResponse({ clicked: true }, sessionId, startTime);
 * ```
 */
export async function collectObservationAndRecord(
  page: Page,
  toolName: string,
  input: Record<string, unknown>,
  startTime: number,
  options: {
    target?: Record<string, string>;
    screenshotPath?: string;
    screenshotDimensions?: { width: number; height: number };
    testIdLimit?: number;
  } = {},
): Promise<ObservationState> {
  const observation = await collectAndUpdateObservation(
    page,
    options.testIdLimit ?? 50,
  );

  await recordToolStep({
    toolName,
    input,
    startTime,
    observation: createDefaultObservation(
      observation.state,
      observation.testIds,
      observation.nodes,
    ),
    target: options.target,
    screenshotPath: options.screenshotPath,
    screenshotDimensions: options.screenshotDimensions,
  });

  return observation;
}

// -----------------------------------------------------------------------------
// Error Handling
// -----------------------------------------------------------------------------

/**
 * Creates an error response with the appropriate error code based on
 * the error message content.
 *
 * @param error - The error that occurred
 * @param defaultCode - Default error code if message doesn't match patterns
 * @param defaultMessage - Default message prefix
 * @param input - Input parameters to include in error details
 * @param sessionId - Current session ID
 * @param startTime - Handler start time
 * @returns McpResponse with error details
 * @example
 * ```ts
 * catch (error) {
 *   return handleToolError(error, ErrorCodes.MM_CLICK_FAILED, 'Click failed', input, sessionId, startTime);
 * }
 * ```
 */
export function handleToolError<Result>(
  error: unknown,
  defaultCode: ErrorCode,
  defaultMessage: string,
  input: unknown,
  sessionId: string | undefined,
  startTime: number,
): McpResponse<Result> {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Unknown a11yRef') || message.includes('not found')) {
    return createErrorResponse(
      ErrorCodes.MM_TARGET_NOT_FOUND,
      message,
      { input },
      sessionId,
      startTime,
    ) as McpResponse<Result>;
  }

  return createErrorResponse(
    defaultCode,
    `${defaultMessage}: ${message}`,
    { input },
    sessionId,
    startTime,
  ) as McpResponse<Result>;
}
