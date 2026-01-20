export type RetryOptions = {
  attempts: number;
  delayMs: number;
};

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryUntil<Result>(
  operation: () => Promise<Result>,
  isSuccess: (result: Result) => boolean,
  options: RetryOptions,
): Promise<Result> {
  const { attempts, delayMs } = options;

  let lastResult: Result | undefined;

  for (let attempt = 0; attempt < attempts; attempt++) {
    lastResult = await operation();
    if (isSuccess(lastResult)) {
      return lastResult;
    }

    if (attempt < attempts - 1) {
      await delay(delayMs);
    }
  }

  return lastResult as Result;
}
