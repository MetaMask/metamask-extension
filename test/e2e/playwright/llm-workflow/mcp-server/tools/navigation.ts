import type {
  NavigateInput,
  NavigateResult,
  WaitForNotificationInput,
  WaitForNotificationResult,
  McpResponse,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

export async function handleNavigate(
  input: NavigateInput,
): Promise<McpResponse<NavigateResult>> {
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

    switch (input.screen) {
      case 'home':
        await sessionManager.navigateToHome();
        break;
      case 'settings':
        await sessionManager.navigateToSettings();
        break;
      case 'url':
        if (!input.url) {
          return createErrorResponse(
            ErrorCodes.MM_INVALID_INPUT,
            'url is required when screen is "url"',
            { input },
            sessionId,
            startTime,
          );
        }
        await sessionManager.navigateToUrl(input.url);
        break;
      case 'notification':
        await sessionManager.waitForNotificationPage(15000);
        break;
      default:
        return createErrorResponse(
          ErrorCodes.MM_INVALID_INPUT,
          `Unknown screen: ${input.screen}`,
          { input },
          sessionId,
          startTime,
        );
    }

    const page = sessionManager.getPage();
    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(refMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId!,
      toolName: 'mm_navigate',
      input: { screen: input.screen, url: input.url },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<NavigateResult>(
      {
        navigated: true,
        currentUrl: page.url(),
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NAVIGATION_FAILED,
      `Navigation failed: ${message}`,
      { input },
      sessionId,
      startTime,
    );
  }
}

export async function handleWaitForNotification(
  input: WaitForNotificationInput,
): Promise<McpResponse<WaitForNotificationResult>> {
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

    const notificationPage =
      await sessionManager.waitForNotificationPage(timeoutMs);
    const pageUrl = notificationPage.url();

    const state = await sessionManager.getExtensionState();
    const testIds = await collectTestIds(notificationPage, 50);
    const { nodes, refMap } =
      await collectTrimmedA11ySnapshot(notificationPage);

    sessionManager.setRefMap(refMap);

    await knowledgeStore.recordStep({
      sessionId: sessionId!,
      toolName: 'mm_wait_for_notification',
      input: { timeoutMs },
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<WaitForNotificationResult>(
      {
        found: true,
        pageUrl,
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NOTIFICATION_TIMEOUT,
      `Notification popup did not appear: ${message}`,
      { timeoutMs },
      sessionId,
      startTime,
    );
  }
}
