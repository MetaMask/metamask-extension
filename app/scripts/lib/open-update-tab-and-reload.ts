import browser from 'webextension-polyfill';
import { SECOND } from '../../../shared/constants/time';
import { segment } from './segment';

/**
 * Upper bound for sending queued analytics before the reload. A slow or
 * unreachable analytics endpoint must never keep the user from updating.
 */
const ANALYTICS_FLUSH_TIMEOUT_MS = 2 * SECOND;

/**
 * Sends queued analytics events, waiting at most
 * {@link ANALYTICS_FLUSH_TIMEOUT_MS}. The reload discards the in-memory Segment
 * queue, so events tracked just before it (such as the update click) would
 * otherwise be lost. Failures are logged and never block the reload.
 */
async function flushAnalyticsBeforeReload(): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      segment.flush(),
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, ANALYTICS_FLUSH_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Opens the "Updating" page in a new tab and then triggers a safe extension reload.
 *
 * Used when an update is available to reload the extension.
 *
 * Queued analytics events are flushed first, so the update click is not lost
 * when the reload discards the in-memory queue.
 *
 * If opening the tab fails, the error is logged, and the reload proceeds anyway.
 *
 * @param requestSafeReload - A function that initiates a safe reload of the
 * extension without disrupting user state.
 */
export async function openUpdateTabAndReload(
  requestSafeReload: () => Promise<void>,
) {
  try {
    await browser.tabs.create({
      url: 'https://metamask.io/updating',
      active: true,
    });
  } catch (error) {
    console.error(error);
  }
  await flushAnalyticsBeforeReload();
  await requestSafeReload();
}
