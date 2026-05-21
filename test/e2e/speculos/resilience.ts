// Generic retry utilities for Speculos E2E tests
export async function withRetry<TResult>(
  fn: () => Promise<TResult>,
  options: {
    maxRetries: number;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
  },
): Promise<TResult> {
  const { maxRetries, shouldRetry, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const canRetry =
        attempt < maxRetries && (shouldRetry ? shouldRetry(error) : true);
      if (!canRetry) {
        throw error;
      }
      onRetry?.(error, attempt + 1);
      // Small delay before retrying – exponential backoff could be used by caller
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }
  throw new Error('Unreachable');
}

export class ExponentialBackoff {
  private current: number;

  private readonly initialMs: number;

  private readonly maxMs: number;

  private readonly multiplier: number;

  constructor(initialMs: number, maxMs: number, multiplier = 2) {
    this.initialMs = initialMs;
    this.maxMs = maxMs;
    this.multiplier = multiplier;
    this.current = initialMs;
  }

  next(): number {
    const wait = this.current;
    this.current = Math.min(this.current * this.multiplier, this.maxMs);
    return wait;
  }

  reset(): void {
    this.current = this.initialMs;
  }
}

// Common transient errors used to decide retry strategy
export function isRetryableError(error: Error): boolean {
  const msg = String((error as { message?: unknown }).message ?? '');
  const code = String((error as { code?: unknown }).code ?? '');
  const retryableCodes = new Set<string>([
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
    'EPIPE',
  ]);
  if (retryableCodes.has(code)) {
    return true;
  }
  if (
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNRESET')
  ) {
    return true;
  }
  return false;
}
