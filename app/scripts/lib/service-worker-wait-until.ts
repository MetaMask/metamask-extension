const KEEP_ALIVE_INTERVAL_MS = 25 * 1000;

/**
 * Keeps the extension service worker alive until the given promise settles.
 *
 * During long-running startup work that does not call extension APIs, Chrome
 * may terminate the service worker. Calling a trivial extension API on an
 * interval resets the idle timer until startup completes.
 *
 * @param promise
 * @see https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers#keep_the_service_worker_alive
 */
export async function waitUntil(promise: Promise<unknown>): Promise<void> {
  const keepAlive = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => {
      // Ignore errors. This call only resets the idle timer.
    });
  }, KEEP_ALIVE_INTERVAL_MS);

  try {
    await promise;
  } finally {
    clearInterval(keepAlive);
  }
}
