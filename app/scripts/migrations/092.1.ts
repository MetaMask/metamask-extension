import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import log from 'loglevel';

export const version = 92.1;

/**
 * Check whether the `TokenListController.tokensChainsCache` state is
 * `undefined`, and delete it if so.
 *
 * This property was accidentally set to `undefined` by an earlier revision of
 * migration #77 in some cases.
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
  if (!hasProperty(state, 'TokenListController')) {
    log.warn('Skipping migration, TokenListController state is missing');
    return state;
  } else if (!isObject(state.TokenListController)) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.TokenListController is ${typeof state.TokenListController}`,
      ),
    );
    return state;
  } else if (!hasProperty(state.TokenListController, 'tokensChainsCache')) {
    log.warn(
      'Skipping migration, TokenListController.tokensChainsCache state is missing',
    );
    return state;
  }

  if (state.TokenListController.tokensChainsCache === undefined) {
    delete state.TokenListController.tokensChainsCache;
  }

  return state;
}
