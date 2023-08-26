import { cloneDeep, fromPairs, map } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, any>;
};

export const version = 96;

/**
 * This migration will operate the following:
 *
 * - Delete `showIncomingTransactions` from `featureFlags` in PreferencesController
 * - Create a new object under PreferencesController named as `incomingTransactionsPreferences`
 * 1. which will collect all added networks including localhost
 * 2. then append the test networks
 * 3. each of them would become a key coming with the value Ture/False from `showIncomingTransactions`
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

interface NetworkConfiguration {
  chainId: Record<string, any>;
}

function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController) ||
    !isObject(state.NetworkController) ||
    !hasProperty(state.PreferencesController, 'featureFlags') ||
    !hasProperty(state.NetworkController, 'networkConfigurations')
  ) {
    return state;
  }
  const { PreferencesController, NetworkController } = state;
  const { featureFlags }: Record<string, any> = PreferencesController;
  const { showIncomingTransactions }: any = featureFlags;
  const { networkConfigurations }: Record<string, any> = NetworkController;

  const addedNetwork: Record<string, any>[] =
    Object.values<NetworkConfiguration>(networkConfigurations).map(
      (network) => network.chainId,
    );

  const mainNetworks = [CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET];
  const testNetworks = [
    CHAIN_IDS.GOERLI,
    CHAIN_IDS.SEPOLIA,
    CHAIN_IDS.LINEA_GOERLI,
  ];
  const allSavedNetworks: Record<string, any> = [
    ...mainNetworks,
    ...addedNetwork,
    ...testNetworks,
  ];

  const incomingTransactionsPreferences = fromPairs(
    map(allSavedNetworks, (element) => [element, showIncomingTransactions]),
  );

  if (featureFlags?.showIncomingTransactions !== undefined) {
    delete featureFlags.showIncomingTransactions;
  }

  state.PreferencesController.incomingTransactionsPreferences =
    incomingTransactionsPreferences;

  return state;
}
