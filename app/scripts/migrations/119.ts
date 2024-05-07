import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 119;

/**
 * This migration sets preference useRequestQueue to true
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

// TODO: Replace `any` with specific type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  if (!hasProperty(state, 'PreferencesController')) {
    return state;
  }

  if (!isObject(state.PreferencesController)) {
    const controllerType = typeof state.PreferencesController;
    global.sentry?.captureException?.(
      new Error(`state.PreferencesController is type: ${controllerType}`),
    );
    state.PreferencesController = {};
  }

  if (
    state.PreferencesController.useRequestQueue === false ||
    state.PreferencesController.useRequestQueue === undefined
  ) {
    state.PreferencesController.useRequestQueue = true;
  }

  return state;
}
