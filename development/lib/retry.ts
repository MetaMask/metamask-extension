export type RetryOptions = {
  retries: number;
  delay?: number;
  rejectionMessage?: string;
  stopAfterOneFailure?: boolean;
};

/**
 * Re-runs the given function until it returns a resolved promise or the number
 * of retries is exceeded, whichever comes first (with an optional delay in
 * between retries).
 *
 * @param options - Retry options.
 * @param options.retries
 * @param options.delay
 * @param options.rejectionMessage
 * @param options.stopAfterOneFailure
 * @param functionToRetry - The function that is run and tested for failure.
 * @returns Resolves with the return value of `functionToRetry`, resolves with `null`
 * when `stopAfterOneFailure` is true and the function succeeds, or rejects when
 * retries are exhausted.
 */
export async function retry<TResult>(
  options: RetryOptions & { stopAfterOneFailure?: false | undefined },
  functionToRetry: () => Promise<TResult> | TResult,
): Promise<TResult>;
export async function retry<TResult>(
  options: RetryOptions & { stopAfterOneFailure: true },
  functionToRetry: () => Promise<TResult> | TResult,
): Promise<TResult | null>;
export async function retry<TResult>(
  options: RetryOptions,
  functionToRetry: () => Promise<TResult> | TResult,
): Promise<TResult | null> {
  const {
    retries,
    delay = 0,
    rejectionMessage = 'Retry limit reached',
    stopAfterOneFailure = false,
  } = options;
  let attempts = 0;
  while (attempts <= retries) {
    if (attempts > 0 && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await functionToRetry();
      if (!stopAfterOneFailure) {
        return result;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Exited with code '1'") {
        console.log("retry() received: Exited with code '1'");
      } else {
        console.error('error caught in retry():', error);
      }

      if (stopAfterOneFailure) {
        throw new Error('Test failed. No more retries will be performed');
      }

      if (attempts < retries) {
        console.log('Ready to retry() again');
      }
    } finally {
      attempts += 1;
    }
  }

  if (stopAfterOneFailure) {
    return null;
  }

  throw new Error(rejectionMessage);
}
