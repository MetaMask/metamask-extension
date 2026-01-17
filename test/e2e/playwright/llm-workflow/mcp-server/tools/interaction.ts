import type {
  ClickInput,
  ClickResult,
  TypeInput,
  TypeResult,
  WaitForInput,
  WaitForResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  validateTargetSelection,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import {
  collectTestIds,
  collectTrimmedA11ySnapshot,
  waitForTarget,
} from '../discovery';

export async function handleClick(
  input: ClickInput,
  _options?: HandlerOptions,
): Promise<McpResponse<ClickResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const timeoutMs = input.timeoutMs ?? 15000;

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

    const validation = validateTargetSelection(input);
    if (!validation.valid) {
      return createErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        (validation as { valid: false; error: string }).error,
        { input },
        sessionId,
        startTime,
      );
    }

    const { type: targetType, value: targetValue } = validation as {
      valid: true;
      type: 'a11yRef' | 'testId' | 'selector';
      value: string;
    };

    const page = sessionManager.getPage();
    const refMap = sessionManager.getRefMap();

    const locator = await waitForTarget(
      page,
      targetType,
      targetValue,
      refMap,
      timeoutMs,
    );

    await locator.click();

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap: newRefMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(newRefMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_click',
      input: { timeoutMs },
      target: {
        [targetType]: targetValue,
      },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<ClickResult>(
      {
        clicked: true,
        target: `${targetType}:${targetValue}`,
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Unknown a11yRef') || message.includes('not found')) {
      return createErrorResponse(
        ErrorCodes.MM_TARGET_NOT_FOUND,
        message,
        { input },
        sessionId,
        startTime,
      );
    }

    return createErrorResponse(
      ErrorCodes.MM_CLICK_FAILED,
      `Click failed: ${message}`,
      { input },
      sessionId,
      startTime,
    );
  }
}

export async function handleType(
  input: TypeInput,
  _options?: HandlerOptions,
): Promise<McpResponse<TypeResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const timeoutMs = input.timeoutMs ?? 15000;

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

    const validation = validateTargetSelection(input);
    if (!validation.valid) {
      return createErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        (validation as { valid: false; error: string }).error,
        { input: { ...input, text: '[REDACTED]' } },
        sessionId,
        startTime,
      );
    }

    const { type: targetType, value: targetValue } = validation as {
      valid: true;
      type: 'a11yRef' | 'testId' | 'selector';
      value: string;
    };

    const page = sessionManager.getPage();
    const refMap = sessionManager.getRefMap();

    const locator = await waitForTarget(
      page,
      targetType,
      targetValue,
      refMap,
      timeoutMs,
    );

    await locator.fill(input.text);

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap: newRefMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(newRefMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_type',
      input: {
        timeoutMs,
        text: input.text,
        testId: input.testId,
        selector: input.selector,
        a11yRef: input.a11yRef,
      },
      target: {
        [targetType]: targetValue,
      },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<TypeResult>(
      {
        typed: true,
        target: `${targetType}:${targetValue}`,
        textLength: input.text.length,
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Unknown a11yRef') || message.includes('not found')) {
      return createErrorResponse(
        ErrorCodes.MM_TARGET_NOT_FOUND,
        message,
        { input: { ...input, text: '[REDACTED]' } },
        sessionId,
        startTime,
      );
    }

    return createErrorResponse(
      ErrorCodes.MM_TYPE_FAILED,
      `Type failed: ${message}`,
      { input: { ...input, text: '[REDACTED]' } },
      sessionId,
      startTime,
    );
  }
}

export async function handleWaitFor(
  input: WaitForInput,
  _options?: HandlerOptions,
): Promise<McpResponse<WaitForResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const timeoutMs = input.timeoutMs ?? 15000;

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

    const validation = validateTargetSelection(input);
    if (!validation.valid) {
      return createErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        (validation as { valid: false; error: string }).error,
        { input },
        sessionId,
        startTime,
      );
    }

    const { type: targetType, value: targetValue } = validation as {
      valid: true;
      type: 'a11yRef' | 'testId' | 'selector';
      value: string;
    };

    const page = sessionManager.getPage();
    const refMap = sessionManager.getRefMap();

    await waitForTarget(page, targetType, targetValue, refMap, timeoutMs);

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap: newRefMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(newRefMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_wait_for',
      input: { timeoutMs },
      target: {
        [targetType]: targetValue,
      },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<WaitForResult>(
      {
        found: true,
        target: `${targetType}:${targetValue}`,
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_WAIT_TIMEOUT,
      `Wait timed out: ${message}`,
      { input, timeoutMs },
      sessionId,
      startTime,
    );
  }
}
