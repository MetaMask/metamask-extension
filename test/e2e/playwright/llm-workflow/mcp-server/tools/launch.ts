import type {
  LaunchInput,
  LaunchResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import {
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
} from '../types';
import { sessionManager } from '../session-manager';

export async function handleLaunch(
  input: LaunchInput,
  _options?: HandlerOptions,
): Promise<McpResponse<LaunchResult>> {
  const startTime = Date.now();

  try {
    if (sessionManager.hasActiveSession()) {
      return createErrorResponse(
        ErrorCodes.MM_SESSION_ALREADY_RUNNING,
        'A session is already running. Call mm_cleanup first.',
        { currentSessionId: sessionManager.getSessionId() },
        sessionManager.getSessionId(),
        startTime,
      );
    }

    const result = await sessionManager.launch(input);

    return createSuccessResponse<LaunchResult>(
      result,
      result.sessionId,
      startTime,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('EADDRINUSE') || message.includes('port')) {
      return createErrorResponse(
        ErrorCodes.MM_PORT_IN_USE,
        `Port conflict: ${message}`,
        { input },
        undefined,
        startTime,
      );
    }

    return createErrorResponse(
      ErrorCodes.MM_LAUNCH_FAILED,
      `Launch failed: ${message}`,
      { input },
      undefined,
      startTime,
    );
  }
}
