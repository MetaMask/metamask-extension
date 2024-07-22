import { cloneDeep } from 'lodash';
import { CHAIN_IDS } from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 124;

/**
 * This migration sets the preference `showConfirmationAdvancedDetails` to
 * `true` if the user has enabled `useNonceField` or `sendHexData`.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
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
  const networkConfigurations = NetworkController?.networkConfigurations || {};

  console.log('STATE BEFORE ++++++++++++++', NetworkController);

  const networkConfigurationsByChainId = Object.values(
    networkConfigurations,
  ).reduce((acc: Record<string, any>, config: any) => {
    const { chainId, id, rpcPrefs, rpcUrl, ticker, nickname } = config;

    // filter deprecated goerli
    if (chainId === CHAIN_IDS.GOERLI || chainId === CHAIN_IDS.LINEA_GOERLI) {
      return acc;
    }
    const chainConfig = acc[chainId] || {
      blockExplorerUrls: [],
      chainId,
      defaultRpcEndpointIndex: 0,
      name: nickname,
      nativeCurrency: ticker,
      rpcEndpoints: [],
    };

    // Add block explorer URL if it exists
    if (
      rpcPrefs?.blockExplorerUrl &&
      !chainConfig.blockExplorerUrls.includes(rpcPrefs.blockExplorerUrl)
    ) {
      chainConfig.blockExplorerUrls.push(rpcPrefs.blockExplorerUrl);
    }

    // Add RPC endpoint
    chainConfig.rpcEndpoints.push({
      networkClientId: id,
      type: 'custom',
      url: rpcUrl,
    });

    // TODO: take the correct index from the tx controller
    if (chainConfig.rpcEndpoints.length > 0) {
      chainConfig.defaultRpcEndpointIndex = 0;
    }
    // Block explorer is optional
    if (chainConfig.blockExplorerUrls.length > 0) {
      chainConfig.defaultBlockExplorerUrlIndex = 0;
    }

    acc[chainId] = chainConfig;
    return acc;
  }, {});

  NetworkController.networkConfigurationsByChainId =
    networkConfigurationsByChainId;

  state.NetworkController = {
    ...NetworkController,
    networkConfigurationsByChainId,
  };
  console.log('STATE AFTER ++++++++++++++', state.NetworkController);

  return state;
}
