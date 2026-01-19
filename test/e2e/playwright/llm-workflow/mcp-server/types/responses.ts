export type ResponseMeta = {
  timestamp: string;
  sessionId?: string;
  durationMs: number;
};

export type SuccessResponse<Result = unknown> = {
  meta: ResponseMeta;
  ok: true;
  result: Result;
};

export type ErrorDetails = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ErrorResponse = {
  error: ErrorDetails;
  meta: ResponseMeta;
  ok: false;
};

export type McpResponse<Result = unknown> =
  | SuccessResponse<Result>
  | ErrorResponse;
