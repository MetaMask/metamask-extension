import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 112;

/**
 * Fully remove perDomainNetwork setting from selectedNetworkController
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
  if (!hasProperty(state, 'SelectedNetworkController')) {
    return state;
  }

  if (!isObject(state.SelectedNetworkController)) {
    global.sentry?.captureException?.(
      new Error(
        `state.SelectedNetworkController is type: ${typeof state.SelectedNetworkController}`,
      ),
    );
    state.SelectedNetworkController = {};
  } else if (
    !hasProperty(state.SelectedNetworkController, 'perDomainNetwork')
  ) {
    global.sentry?.captureException?.(
      new Error(
        `state.SelectedNetworkController.perDomainNetwork is missing from SelectedNetworkController state`,
      ),
    );
  } else if (
    typeof state.SelectedNetworkController.perDomainNetwork !== 'boolean'
  ) {
    global.sentry?.captureException?.(
      new Error(
        `state.SelectedNetworkController.perDomainNetwork is type: ${typeof state
          .SelectedNetworkController.perDomainNetwork}`,
      ),
    );
  }

  delete state.SelectedNetworkController.perDomainNetwork;

  return state;
}
