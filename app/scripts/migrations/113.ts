import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 113;

/**
 * Migrates users that have opensea enabled to blockaid
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

function transformState(state: Record<string, any>) {
  if (!hasProperty(state, 'PreferencesController')) {
    return state;
  }

  if (!isObject(state.PreferencesController)) {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController is type: ${typeof state.PreferencesController}`,
      ),
    );
    state.PreferencesController = {};
  } else if (
    !hasProperty(state.PreferencesController, 'transactionSecurityCheckEnabled')
  ) {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController.transactionSecurityCheckEnabled is missing from PreferencesController state`,
      ),
    );
  } else if (
    typeof state.PreferencesController.transactionSecurityCheckEnabled !==
    'boolean'
  ) {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController.transactionSecurityCheckEnabled is type: ${typeof state
          .PreferencesController.transactionSecurityCheckEnabled}`,
      ),
    );
  }

  delete state.PreferencesController.transactionSecurityCheckEnabled;

  return state;
}
