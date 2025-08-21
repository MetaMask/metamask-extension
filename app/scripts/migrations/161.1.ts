import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    PreferencesController?: {
      // These properties are not in the PreferencesControllerState type anymore
      bitcoinSupportEnabled?: boolean;
      bitcoinTestnetSupportEnabled?: boolean;
    };
  };
};

export const version = 161.1;

function transformState(state: VersionedData['data']) {
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid PreferencesController state: ${typeof state.PreferencesController}`,
      ),
    );
    return state;
  }

  if (hasProperty(state.PreferencesController, 'bitcoinSupportEnabled')) {
    delete state.PreferencesController.bitcoinSupportEnabled;
  }

  if (
    hasProperty(state.PreferencesController, 'bitcoinTestnetSupportEnabled')
  ) {
    delete state.PreferencesController.bitcoinTestnetSupportEnabled;
  }

  return state;
}

/**
 * This migration updates PreferencesController's state to remove the
 * bitcoin support enabled.
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
