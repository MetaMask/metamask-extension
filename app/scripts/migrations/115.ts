import { cloneDeep, isObject } from 'lodash';
import { NetworkType } from '@metamask/controller-utils';
import { hasProperty } from '@metamask/utils';
import { NetworkStatus } from '@metamask/network-controller';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_RPC_URL_MAP,
  NETWORK_TYPES,
  TEST_NETWORK_TICKER_MAP,
  LINEA_SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 115;

/**
 * Migrates the user network to Linea Sepolia if the user is on Linea Goerli network.
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const NetworkController = state?.NetworkController || {};
  const provider = NetworkController?.providerConfig || {};

  if (provider?.chainId !== CHAIN_IDS.LINEA_GOERLI) {
    return state;
  }
  const networkControllerState = state.NetworkController;

  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'providerConfig') &&
    isObject(state.NetworkController.providerConfig) &&
    hasProperty(state.NetworkController.providerConfig, 'chainId') &&
    state.NetworkController.providerConfig.chainId === CHAIN_IDS.LINEA_GOERLI
  ) {
    networkControllerState.providerConfig = {
      type: NetworkType['linea-sepolia'],
      rpcPrefs: {},
      chainId: CHAIN_IDS.LINEA_SEPOLIA,
      nickname: LINEA_SEPOLIA_DISPLAY_NAME,
      rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.LINEA_SEPOLIA],
      providerType: NETWORK_TYPES.LINEA_SEPOLIA,
      ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_SEPOLIA],
      id: NETWORK_TYPES.LINEA_SEPOLIA,
    };
    networkControllerState.selectedNetworkClientId =
      NETWORK_TYPES.LINEA_SEPOLIA;
    networkControllerState.networksMetadata = {
      ...networkControllerState.networksMetadata,
      'linea-sepolia': {
        EIPS: {
          '1559': true,
        },
        status: NetworkStatus.Available,
      },
    };
  }
  return {
    ...state,
    NetworkController: networkControllerState,
  };
}
