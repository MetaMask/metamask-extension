import { cloneDeep } from 'lodash';
import log from 'loglevel';
import { hasProperty, isObject } from '@metamask/utils';

export const version = 117;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

/**
 * Removes all Snaps domains (identified as starting with 'npm:' or 'local:') from the SelectedNetworkController's domains state.
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

/**
 * Removes all domains starting with 'npm:' or 'local:' from the SelectedNetworkController's domains state.
 *
 * @param state - The entire state object of the MetaMask extension.
 */
function transformState(state: Record<string, unknown>) {
  const selectedNetworkControllerState = state.SelectedNetworkController;
  if (!selectedNetworkControllerState) {
    log.warn('Skipping migration. SelectedNetworkController state not found.');
    return;
  }

  if (!isObject(selectedNetworkControllerState)) {
    global.sentry?.captureException?.(
      new Error('SelectedNetworkController is not an object.'),
    );
    return;
  }

  if (!hasProperty(selectedNetworkControllerState, 'domains')) {
    global.sentry?.captureException?.(
      new Error('Domains key is missing in SelectedNetworkController state.'),
    );
    return;
  }

  if (!isObject(selectedNetworkControllerState.domains)) {
    global.sentry?.captureException?.(
      new Error('Domains state is not an object.'),
    );
    return;
  }

  const { domains } = selectedNetworkControllerState;
  const filteredDomains = Object.keys(domains).reduce<Record<string, unknown>>(
    (acc, domain) => {
      if (!domain.startsWith('npm:') && !domain.startsWith('local:')) {
        acc[domain] = domains[domain];
      }
      return acc;
    },
    {},
  );

  selectedNetworkControllerState.domains = filteredDomains;
}
