import { isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 87;

/**
 * Remove the now-obsolete tokens controller `suggestedAssets` state.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (!isObject(state.TokensController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.TokensController is ${typeof state.TokensController}`,
      ),
    );
    return state;
  }

  delete state.TokensController.suggestedAssets;

  return state;
}
