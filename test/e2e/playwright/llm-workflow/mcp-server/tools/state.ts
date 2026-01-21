import type { GetStateResult, McpResponse, HandlerOptions } from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';
import { knowledgeStore, createDefaultObservation } from '../knowledge-store';
import { collectTestIds, collectTrimmedA11ySnapshot } from '../discovery';

export async function handleGetState(
  _options?: HandlerOptions,
): Promise<McpResponse<GetStateResult>> {
  const startTime = Date.now();

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

    const state = await sessionManager.getExtensionState();
    const sessionId = sessionManager.getSessionId() ?? '';
    const page = sessionManager.getPage();

    const testIds = await collectTestIds(page, 50);
    const { nodes, refMap } = await collectTrimmedA11ySnapshot(page);

    sessionManager.setRefMap(refMap);

    const trackedPages = sessionManager.getTrackedPages();
    const activePage = sessionManager.getPage();
    const activeTabInfo = trackedPages.find((p) => p.page === activePage);

    const tabs = {
      active: {
        role: activeTabInfo?.role ?? 'other',
        url: activePage.url(),
      },
      tracked: trackedPages.map((p) => ({
        role: p.role,
        url: p.url,
      })),
    };

    await knowledgeStore.recordStep({
      sessionId,
      toolName: 'mm_get_state',
      outcome: { ok: true },
      observation: createDefaultObservation(state, testIds, nodes),
      durationMs: Date.now() - startTime,
    });

    return createSuccessResponse<GetStateResult>(
      { state, tabs },
      sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(
      ErrorCodes.MM_NO_ACTIVE_SESSION,
      message,
      undefined,
      sessionManager.getSessionId(),
      startTime,
    );
  }
}
