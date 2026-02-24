import browser from 'webextension-polyfill';

/**
 * Session storage helpers for E2E tests that simulate init/state-sync timeout
 * and then restore. The flag is persisted across service worker restart (e.g.
 * after RELOAD_WINDOW).
 *
 * Why session storage (and not in-memory or local)?
 * - In-memory would be lost when the MV3 service worker restarts after we send RELOAD_WINDOW to the UI; the new worker would not know we're in the restore flow and might simulate the hang again.
 * - We use session (not local) so the flag is scoped to the current browser session and does not persist across restarts or leak into the next test run.
 */

/** Key used for the test restore flow pending flag (see saveTestValueToSession). */
export const SESSION_KEY_TEST_RESTORE_FLOW_PENDING =
  'METAMASK_TEST_RESTORE_FLOW_PENDING';

/** Session storage API used by the helpers; default is browser.storage. */
export type SessionStorage = typeof browser.storage;

/**
 * Writes a test-only value to session storage under the given key.
 * No-op when not in test. Used so a restarted service worker can read the value
 * (e.g. after RELOAD_WINDOW in E2E restore flows).
 *
 * @param inTest - Whether the extension is running in test (e.g. process.env.IN_TEST).
 * @param key - Session storage key.
 * @param value - Value to store (must be JSON-serializable).
 * @param storage - Optional storage (defaults to browser.storage); used for tests.
 */
export async function saveTestValueToSession(
  inTest: boolean,
  key: string,
  value: unknown,
  storage: SessionStorage = browser.storage,
): Promise<void> {
  if (!inTest) {
    return;
  }
  try {
    await storage.session.set({ [key]: value });
  } catch {
    // Session storage may be unavailable.
  }
}

/**
 * Reads and removes a test-only value from session storage.
 * No-op when not in test.
 *
 * @param inTest - Whether the extension is running in test.
 * @param key - Session storage key.
 * @param storage - Optional storage (defaults to browser.storage); used for tests.
 * @returns The value that was stored, or undefined if missing or on error.
 */
export async function getTestValueFromSession(
  inTest: boolean,
  key: string,
  storage: SessionStorage = browser.storage,
): Promise<unknown> {
  if (!inTest) {
    return undefined;
  }
  try {
    const session = await storage.session.get(key);
    const value = session[key];
    if (value !== undefined) {
      await storage.session.remove(key);
      return value;
    }
  } catch {
    // Session storage may be unavailable.
  }
  return undefined;
}
