import type {
  ScreenshotInput,
  ScreenshotResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

export async function handleScreenshot(
  input: ScreenshotInput,
  _options?: HandlerOptions,
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
    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(refMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_screenshot',
      input: {
        name: input.name,
        fullPage: input.fullPage,
        selector: input.selector,
      },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
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
