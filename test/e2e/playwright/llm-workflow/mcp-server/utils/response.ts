import type { SuccessResponse, ErrorResponse, ErrorCode } from '../types';

export function createSuccessResponse<Result>(
  result: Result,
  sessionId?: string,
  startTime?: number,
): SuccessResponse<Result> {
  return {
    meta: {
      timestamp: new Date().toISOString(),
      sessionId,
      durationMs: startTime ? Date.now() - startTime : 0,
    },
    ok: true,
    result,
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  sessionId?: string,
  startTime?: number,
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      sessionId,
      durationMs: startTime ? Date.now() - startTime : 0,
    },
    ok: false,
  };
}
