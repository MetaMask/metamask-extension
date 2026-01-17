import type {
  CleanupInput,
  CleanupResult,
  McpResponse,
  HandlerOptions,
} from '../types';
import { createSuccessResponse } from '../types';
import { sessionManager } from '../session-manager';

export async function handleCleanup(
  input: CleanupInput,
  _options?: HandlerOptions,
): Promise<McpResponse<CleanupResult>> {
  const startTime = Date.now();
  const sessionId = input.sessionId ?? sessionManager.getSessionId();

  const cleanedUp = await sessionManager.cleanup();

  return createSuccessResponse<CleanupResult>(
    { cleanedUp },
    sessionId,
    startTime,
  );
}
