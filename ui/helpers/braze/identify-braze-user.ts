import { captureException } from '../../../shared/lib/sentry';
import {
  initializeBraze,
  isBrazeInitialized,
  loadBrazeSdk,
  resetBrazeInitialization,
} from './initialize-braze';

const LOG_PREFIX = '[Braze]';

let identifiedProfileId: string | undefined;
// Serializes identify and wipe operations: `changeUser` and `wipeData` are
// async through the SDK load and must never interleave — a `wipeData` landing
// after a new `changeUser` would leave the SDK wiped while the caller still
// treats the user as identified.
let operationQueue: Promise<unknown> = Promise.resolve();

/**
 * Run `operation` once all previously enqueued Braze operations have settled.
 *
 * @param operation - The SDK operation to run.
 * @returns The result of `operation`.
 */
function enqueueBrazeOperation<TResult>(
  operation: () => Promise<TResult>,
): Promise<TResult> {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

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
 * Lazily initializes the SDK on the first identify — documents that never
 * identify never load the SDK chunk. Serialized against `clearBrazeUser` so
 * the two operations never interleave.
 *
 * No-ops when this document already identified that ID, when the SDK cannot
 * initialize, or in test builds. Does not call `openSession`.
 *
 * @param canonicalProfileId - Profile Sync canonical profile ID (`external_id`).
 * @returns Whether Braze is identified as this ID after the call.
 */
export async function identifyBrazeUser(
  canonicalProfileId: string,
): Promise<boolean> {
  if (!canonicalProfileId) {
    return false;
  }

  if (identifiedProfileId === canonicalProfileId) {
    return true;
  }

  if (isTestBuild()) {
    return false;
  }

  return enqueueBrazeOperation(async () => {
    // Re-check: an earlier queued operation may have identified this ID or
    // wiped the SDK while this call was queued.
    if (identifiedProfileId === canonicalProfileId) {
      return true;
    }

    if (!isBrazeInitialized() && !(await initializeBraze())) {
      return false;
    }

    try {
      const braze = await loadBrazeSdk();
      braze.changeUser(canonicalProfileId);
      identifiedProfileId = canonicalProfileId;
      console.warn(`${LOG_PREFIX} Identified user`);
      return true;
    } catch (error) {
      captureException(error);
      console.warn(`${LOG_PREFIX} changeUser threw`, error);
      return false;
    }
  });
}

/**
 * Clear the Braze identity and local SDK data.
 *
 * Call on sign-out or when basic functionality is turned off. Serialized
 * against `identifyBrazeUser` so a wipe can never land after a newer
 * `changeUser`. Does not wipe on lock. After wipe the SDK must be initialized
 * again before the next `changeUser`; this resets the init latch and does not
 * re-initialize, so a signed-out document does not keep an anonymous Braze
 * profile.
 */
export async function clearBrazeUser(): Promise<void> {
  if (isTestBuild()) {
    identifiedProfileId = undefined;
    resetBrazeInitialization();
    return;
  }

  await enqueueBrazeOperation(async () => {
    identifiedProfileId = undefined;

    // Check at run time, not call time: the wipe may have been queued while a
    // first initialization was still in flight.
    if (!isBrazeInitialized()) {
      resetBrazeInitialization();
      return;
    }

    try {
      const braze = await loadBrazeSdk();
      braze.wipeData();
      console.warn(`${LOG_PREFIX} Cleared user identity`);
    } catch (error) {
      captureException(error);
      console.warn(`${LOG_PREFIX} wipeData threw`, error);
    } finally {
      resetBrazeInitialization();
    }
  });
}
