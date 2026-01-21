import type {
  NavigateInput,
  NavigateResult,
  WaitForNotificationInput,
  WaitForNotificationResult,
  SwitchToTabInput,
  SwitchToTabResult,
  CloseTabInput,
  CloseTabResult,
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

export async function handleNavigate(
  input: NavigateInput,
  _options?: HandlerOptions,
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
        await sessionManager.navigateToNotification();
        break;
      default:
        return createErrorResponse(
          ErrorCodes.MM_INVALID_INPUT,
          `Unknown screen: ${String(input.screen)}`,
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
      sessionId: sessionId ?? '',
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
  _options?: HandlerOptions,
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
      sessionId: sessionId ?? '',
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

export async function handleSwitchToTab(
  input: SwitchToTabInput,
  _options?: HandlerOptions,
): Promise<McpResponse<SwitchToTabResult>> {
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

    if (!input.role && !input.url) {
      return createErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        'Either role or url must be provided',
        { input },
        sessionId,
        startTime,
      );
    }

    const trackedPages = sessionManager.getTrackedPages();
    const targetPage = trackedPages.find((p) => {
      if (input.role) {
        return p.role === input.role;
      }
      if (input.url) {
        return p.url.startsWith(input.url);
      }
      return false;
    });

    if (!targetPage) {
      return createErrorResponse(
        ErrorCodes.MM_TAB_NOT_FOUND,
        `No tab found matching: ${input.role ?? input.url}`,
        {
          input,
          availableTabs: trackedPages.map((p) => ({
            role: p.role,
            url: p.url,
          })),
        },
        sessionId,
        startTime,
      );
    }

    await targetPage.page.bringToFront();
    sessionManager.setActivePage(targetPage.page);

    const page = sessionManager.getPage();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);
    sessionManager.setRefMap(refMap);

    const state = await sessionManager.getExtensionState();

    const updatedTrackedPages = sessionManager.getTrackedPages();
    const activeTabInfo = updatedTrackedPages.find(
      (p) => p.page === targetPage?.page,
    );

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_switch_to_tab',
      input,
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<SwitchToTabResult>(
      {
        switched: true,
        activeTab: {
          role: activeTabInfo?.role ?? 'other',
          url: page.url(),
        },
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NAVIGATION_FAILED,
      `Failed to switch tab: ${message}`,
      { input },
      sessionId,
      startTime,
    );
  }
}

export async function handleCloseTab(
  input: CloseTabInput,
  _options?: HandlerOptions,
): Promise<McpResponse<CloseTabResult>> {
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

    if (!input.role && !input.url) {
      return createErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        'Either role or url must be provided',
        { input },
        sessionId,
        startTime,
      );
    }

    const roleAsString = input.role as string | undefined;
    if (roleAsString === 'extension') {
      return createErrorResponse(
        ErrorCodes.MM_INVALID_INPUT,
        'Cannot close extension home page',
        { input },
        sessionId,
        startTime,
      );
    }

    const trackedPages = sessionManager.getTrackedPages();
    const targetPage = trackedPages.find((p) => {
      if (input.role) {
        return p.role === input.role;
      }
      if (input.url) {
        return p.url.startsWith(input.url);
      }
      return false;
    });

    if (!targetPage) {
      return createErrorResponse(
        ErrorCodes.MM_TAB_NOT_FOUND,
        `No tab found matching: ${input.role ?? input.url}`,
        { input },
        sessionId,
        startTime,
      );
    }

    const closedUrl = targetPage.url;

    const currentActivePage = sessionManager.getPage();
    if (targetPage.page === currentActivePage) {
      const extensionPage = trackedPages.find((p) => p.role === 'extension');
      if (extensionPage) {
        await extensionPage.page.bringToFront();
        sessionManager.setActivePage(extensionPage.page);
      }
    }

    await targetPage.page.close();

    const page = sessionManager.getPage();
    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);
    sessionManager.setRefMap(refMap);
    const state = await sessionManager.getExtensionState();

    await knowledgeStore.recordStep({
      sessionId: sessionId ?? '',
      toolName: 'mm_close_tab',
      input,
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<CloseTabResult>(
      {
        closed: true,
        closedUrl,
      },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NAVIGATION_FAILED,
      `Failed to close tab: ${message}`,
      { input },
      sessionId,
      startTime,
    );
  }
}
