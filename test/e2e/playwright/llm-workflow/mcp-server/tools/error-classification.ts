import { ErrorCodes } from '../types';

const ERROR_PATTERNS = {
  targetNotFound: [
    'Unknown a11yRef',
    'not found',
    'No element found',
    'Timeout waiting for selector',
  ],
  timeout: ['Timeout', 'exceeded', 'timed out'],
  navigation: ['Navigation failed', 'net::ERR'],
  pageClosed: [
    'Target page, context or browser has been closed',
    'page has been closed',
    'context has been closed',
    'browser has been closed',
    'Target closed',
    'Session closed',
  ],
} as const;

export function isPageClosedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return ERROR_PATTERNS.pageClosed.some((pattern) => message.includes(pattern));
}

export function classifyInteractionError(
  error: unknown,
  fallbackCode: string,
): { code: string; message: string } {
  const message = error instanceof Error ? error.message : String(error);

  for (const pattern of ERROR_PATTERNS.targetNotFound) {
    if (message.includes(pattern)) {
      return { code: ErrorCodes.MM_TARGET_NOT_FOUND, message };
    }
  }

  for (const pattern of ERROR_PATTERNS.timeout) {
    if (message.includes(pattern)) {
      return { code: ErrorCodes.MM_WAIT_TIMEOUT, message };
    }
  }

  return { code: fallbackCode, message: `Operation failed: ${message}` };
}

export function classifyClickError(error: unknown): {
  code: string;
  message: string;
} {
  return classifyInteractionError(error, ErrorCodes.MM_CLICK_FAILED);
}

export function classifyTypeError(error: unknown): {
  code: string;
  message: string;
} {
  return classifyInteractionError(error, ErrorCodes.MM_TYPE_FAILED);
}

export function classifyWaitError(error: unknown): {
  code: string;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  return {
    code: ErrorCodes.MM_WAIT_TIMEOUT,
    message: `Wait timed out: ${message}`,
  };
}
