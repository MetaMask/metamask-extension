import {
  changeUser,
  destroy,
  getUser,
  isInitialized,
  wipeData,
} from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import { initializeBraze } from './initialize-braze';

/**
 * Identify the user with Profile Sync's canonical profile ID (`external_id`).
 * The SDK owns initialization and identity state; these lifecycle calls are
 * synchronous, so identify and clear run in call order without a queue.
 *
 * A changed ID starts a session inside `changeUser`. We do not open an
 * additional session or subscribe to automatic message rendering here.
 *
 * @param canonicalProfileId - The primary SRP's canonical profile ID.
 * @returns Whether Braze is identified as this user.
 */
export function identifyBrazeUser(canonicalProfileId: string): boolean {
  if (!canonicalProfileId || !initializeBraze()) {
    return false;
  }

  try {
    if (getUser()?.getUserId() !== canonicalProfileId) {
      changeUser(canonicalProfileId);
    }
    return getUser()?.getUserId() === canonicalProfileId;
  } catch (error) {
    captureException(error);
    return false;
  }
}

/**
 * Discard local Braze data and stop the SDK on sign-out or basic-functionality
 * opt-out. An inactive document has nothing to stop. Locking does not clear data.
 */
export function clearBrazeUser(): void {
  if (!isInitialized()) {
    return;
  }

  try {
    try {
      // Destroy attempts a final flush. Discard data while storage and
      // providers are still available, then stop scheduled SDK activity.
      wipeData();
    } finally {
      destroy();
    }
  } catch (error) {
    captureException(error);
  }
}
