import type { Page } from '@playwright/test';
import type {
  ScreenshotInput,
  ScreenshotResult,
  McpResponse,
  HandlerOptions,
  ObservationPolicyOverride,
  StepRecordObservation,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

async function collectObservationWithPolicy(
  page: Page,
  policy: ObservationPolicyOverride | undefined,
  isFailure: boolean,
): Promise<StepRecordObservation> {
  const effectivePolicy = policy ?? 'default';
  const shouldCollectFull =
    effectivePolicy === 'default' ||
    (effectivePolicy === 'failures' && isFailure);

  const state = await sessionManager.getExtensionState();

  if (shouldCollectFull) {
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);
    sessionManager.setRefMap(refMap);
    return createDefaultObservation(state, testIds, nodes);
  }

  return createDefaultObservation(state, [], []);
}

export async function handleScreenshot(
  input: ScreenshotInput,
  options?: HandlerOptions,
): Promise<McpResponse<ScreenshotResult>> {
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

    const result = await sessionManager.screenshot({
      name: input.name,
      fullPage: input.fullPage ?? true,
      selector: input.selector,
    });

    const page = sessionManager.getPage();
    const observation = await collectObservationWithPolicy(
      page,
      options?.observationPolicy,
      false,
    );

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_screenshot',
      input: {
        name: input.name,
        fullPage: input.fullPage,
        selector: input.selector,
      },
      outcome: { ok: true },
      observation,
      durationMs: Date.now() - startTime,
      screenshotPath: result.path,
      screenshotDimensions: { width: result.width, height: result.height },
    });

    const response: ScreenshotResult = {
      path: result.path,
      width: result.width,
      height: result.height,
    };

    if (input.includeBase64) {
      response.base64 = result.base64;
    }

    return createSuccessResponse<ScreenshotResult>(
      response,
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_SCREENSHOT_FAILED,
      `Screenshot failed: ${message}`,
      { input },
      sessionId,
      startTime,
    );
  }
}
