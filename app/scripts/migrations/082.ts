import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { v4 } from 'uuid';

export const version = 82;

/**
 * Migrate the frequentRpcListDetail from the PreferencesController to the NetworkController, convert it from an array to an object
 * keyed by random uuids.
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
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController) ||
    !isObject(state.NetworkController) ||
    !hasProperty(state.PreferencesController, 'frequentRpcListDetail') ||
    !Array.isArray(state.PreferencesController.frequentRpcListDetail) ||
    !state.PreferencesController.frequentRpcListDetail.every(isObject)
  ) {
    return state;
  }
  const { PreferencesController, NetworkController } = state;
  const { frequentRpcListDetail } = PreferencesController;
  if (!Array.isArray(frequentRpcListDetail)) {
    return state;
  }

  const networkConfigurations = frequentRpcListDetail.reduce(
    (
      networkConfigurationsAcc,
      { rpcUrl, chainId, ticker, nickname, rpcPrefs },
    ) => {
      const networkConfigurationId = v4();
      return {
        ...networkConfigurationsAcc,
        [networkConfigurationId]: {
          rpcUrl,
          chainId,
          ticker,
          rpcPrefs,
          nickname,
        },
      };
    },
    {},
  );

  delete PreferencesController.frequentRpcListDetail;

  return {
    ...state,
    NetworkController: {
      ...NetworkController,
      networkConfigurations,
    },
    PreferencesController: {
      ...PreferencesController,
    },
  };
}
