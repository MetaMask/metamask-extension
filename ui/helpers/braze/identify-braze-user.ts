import * as braze from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import {
  initializeBraze,
  isBrazeInitialized,
  resetBrazeInitialization,
} from './initialize-braze';

const LOG_PREFIX = '[Braze]';

let identifiedProfileId: string | undefined;

/**
 * Canonical profile ID last passed to `changeUser` in this UI document.
 *
 * @returns The identified ID, or `undefined` if this document has not identified.
 */
export function getIdentifiedBrazeProfileId(): string | undefined {
  return identifiedProfileId;
}

/**
 * Reset the identity latch. Tests only.
 */
export function resetBrazeIdentityForTesting(): void {
  identifiedProfileId = undefined;
}

function isTestBuild(): boolean {
  return Boolean(process.env.IN_TEST);
}

/**
 * Identify the Braze user as the given canonical profile ID.
 *
 * No-ops when this document already identified that ID, when the SDK cannot
 * initialize, or in test builds. Does not call `openSession`.
 *
 * @param canonicalProfileId - Profile Sync canonical profile ID (`external_id`).
 * @returns Whether Braze is identified as this ID after the call.
 */
export function identifyBrazeUser(canonicalProfileId: string): boolean {
  if (!canonicalProfileId) {
    return false;
  }

  if (identifiedProfileId === canonicalProfileId) {
    return true;
  }

  if (isTestBuild()) {
    return false;
  }

  if (!isBrazeInitialized() && !initializeBraze()) {
    return false;
  }

  try {
    braze.changeUser(canonicalProfileId);
    identifiedProfileId = canonicalProfileId;
    console.warn(`${LOG_PREFIX} Identified user`);
    return true;
  } catch (error) {
    captureException(error);
    console.warn(`${LOG_PREFIX} changeUser threw`, error);
    return false;
  }
}

/**
 * Clear the Braze identity and local SDK data.
 *
 * Call on sign-out or when basic functionality is turned off. Does not wipe
 * on lock. After wipe the SDK must be initialized again before the next
 * `changeUser`; this resets the init latch and does not re-initialize, so a
 * signed-out document does not keep an anonymous Braze profile.
 */
export function clearBrazeUser(): void {
  identifiedProfileId = undefined;

  if (isTestBuild() || !isBrazeInitialized()) {
    resetBrazeInitialization();
    return;
  }

  try {
    braze.wipeData();
    console.warn(`${LOG_PREFIX} Cleared user identity`);
  } catch (error) {
    captureException(error);
    console.warn(`${LOG_PREFIX} wipeData threw`, error);
  } finally {
    resetBrazeInitialization();
  }
}
