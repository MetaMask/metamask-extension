import type {
  ListTestIdsInput,
  ListTestIdsResult,
  AccessibilitySnapshotInput,
  AccessibilitySnapshotResult,
  DescribeScreenInput,
  DescribeScreenResult,
  McpResponse,
  PriorKnowledgeContext,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

export async function handleListTestIds(
  input: ListTestIdsInput,
): Promise<McpResponse<ListTestIdsResult>> {
  const startTime = Date.now();
  const sessionId = sessionManager.getSessionId();
  const limit = input.limit ?? 150;

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

    const page = sessionManager.getPage();
    const items = await collectTestIds(page, limit);
    const state = await sessionManager.getExtensionState();
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(refMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId!,
      toolName: 'mm_list_testids',
      input: { limit },
      outcome: { ok: true },
      observation: createDefaultObservation(state, items, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<ListTestIdsResult>(
      { items },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      message,
      undefined,
      sessionId,
      startTime,
    );
  }
}

export async function handleAccessibilitySnapshot(
  input: AccessibilitySnapshotInput,
): Promise<McpResponse<AccessibilitySnapshotResult>> {
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

    const page = sessionManager.getPage();
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(
      page,
      input.rootSelector,
    );

    sessionManager.setRefMap(refMap);

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);

    await knowledgeStore.recordStep({
      sessionId: sessionId!,
      toolName: 'mm_accessibility_snapshot',
      input: { rootSelector: input.rootSelector },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<AccessibilitySnapshotResult>(
      { nodes },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      message,
      undefined,
      sessionId,
      startTime,
    );
  }
}

export async function handleDescribeScreen(
  input: DescribeScreenInput,
): Promise<McpResponse<DescribeScreenResult>> {
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

    const page = sessionManager.getPage();
    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 150);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(refMap);

    let screenshot: DescribeScreenResult['screenshot'] = null;
    let screenshotPath: string | undefined;
    let screenshotDimensions: { width: number; height: number } | undefined;

    if (input.includeScreenshot) {
      const screenshotName = input.screenshotName ?? 'describe-screen';
      const result = await sessionManager.screenshot({
        name: screenshotName,
        fullPage: true,
      });

      screenshot = {
        path: result.path,
        width: result.width,
        height: result.height,
        base64: input.includeScreenshotBase64 ? result.base64 : null,
      };

      screenshotPath = result.path;
      screenshotDimensions = { width: result.width, height: result.height };
    }

    await knowledgeStore.recordStep({
      sessionId: sessionId!,
      toolName: 'mm_describe_screen',
      input: {
        includeScreenshot: input.includeScreenshot,
        screenshotName: input.screenshotName,
      },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
      screenshotPath,
      screenshotDimensions,
    });

    const sessionMetadata = sessionManager.getSessionMetadata();
    const priorKnowledgeContext: PriorKnowledgeContext = {
      currentScreen: state.currentScreen,
      currentUrl: state.currentUrl,
      visibleTestIds: testIds,
      a11yNodes: nodes,
      currentSessionFlowTags: sessionMetadata?.flowTags,
    };

    const priorKnowledge = await knowledgeStore.generatePriorKnowledge(
      priorKnowledgeContext,
      sessionId,
    );

    return createSuccessResponse<DescribeScreenResult>(
      {
        state,
        testIds: { items: testIds },
        a11y: { nodes },
        screenshot,
        priorKnowledge,
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      message,
      undefined,
      sessionId,
      startTime,
    );
  }
}
