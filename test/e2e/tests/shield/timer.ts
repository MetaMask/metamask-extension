export function waitUntil(condition: () => boolean, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => {
      if (interval) {
        clearInterval(interval);
      }
      reject(new Error('Timeout'));
    }, timeoutMs);

    interval = setInterval(() => {
      if (condition()) {
        if (interval) {
          clearInterval(interval);
        }
        clearTimeout(timeout);
        resolve();
      }
    }, 100);
  });
}

export function waitUntilCalledWith(
  spy: sinon.SinonSpy,
  expected: sinon.SinonMatcher,
  timeoutMs: number,
) {
  return waitUntil(() => spy.calledWith(expected), timeoutMs);
}
