import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/browser';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 113;

/**
 * Remove preferences controller `isLineaMainnetReleased` state.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    captureException(
      `Migration ${version}: Invalid PreferencesController state: ${typeof state.PreferencesController}`,
    );

    return state;
  }

  if (hasProperty(state.PreferencesController, 'isLineaMainnetReleased')) {
    delete state.PreferencesController.isLineaMainnetReleased;
  }
  return state;
}
