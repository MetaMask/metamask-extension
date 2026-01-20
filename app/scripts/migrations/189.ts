import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import { BrowserStorageAdapter } from '../lib/stores/browser-storage-adapter';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};
export const version = 189;

export async function migrate(
  originalVersionedData: VersionedData,
  localChangedControllers: Set<string>,
): Promise<void> {
  originalVersionedData.meta.version = version;

  try {
    const didUpdate = await transformState(originalVersionedData.data);

    if (didUpdate) {
      localChangedControllers.add('SnapController');
    }
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
  }
}

/**
 * This migration does:
 * - Remove the sourceCode property from each snap in the SnapController state.
 * - Store the sourceCode in the browser storage in order to allow the StorageService to fetch the snap source code.
 *
 * @param state - The persisted MetaMask extension state, exactly what we persist to disk.
 * @returns True if the state was updated, false if the state was not updated or an error occurred.
 */
async function transformState(state: Record<string, unknown>) {
  if (!hasProperty(state, 'SnapController')) {
    captureException(
      new Error(`Migration ${version}: SnapController not found.`),
    );
    return false;
  }

  const snapControllerState = state.SnapController;

  if (!isObject(snapControllerState)) {
    captureException(
      new Error(
        `Migration ${version}: SnapController is not an object: ${typeof snapControllerState}`,
      ),
    );
    return false;
  }

  if (!hasProperty(snapControllerState, 'snaps')) {
    captureException(
      new Error(`Migration ${version}: SnapController missing property snaps.`),
    );
    return false;
  }

  if (!isObject(snapControllerState.snaps)) {
    captureException(
      new Error(
        `Migration ${version}: SnapController.snaps is not an object: ${typeof snapControllerState.snaps}`,
      ),
    );
    return false;
  }

  const browserStorageAdapter = new BrowserStorageAdapter();

  Object.values(
    snapControllerState.snaps as Record<string, Record<string, unknown>>,
  ).forEach(async (snap) => {
    const sourceCode = snap.sourceCode as string;

    await browserStorageAdapter.setItem('SnapController', snap.id as string, {
      sourceCode,
    });

    delete snap.sourceCode;
  });

  return true;
}
