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

// Function to get the index of a specific networkClientId
function getRpcIndexByNetworkClientId(rpcEndpoints, networkClientId) {
  return rpcEndpoints.findIndex(
    (endpoint) => endpoint.networkClientId === networkClientId,
  );
}

// Function to extract the last RPC used by each chainId
function getLastRpcByAllChainIds(transactions) {
  const result = {};

  // Iterate over the transactions array in reverse order
  // because the last used one is on the bottom for given chain ID
  // we're doing this for optimisation to take the first found one on the bottom
  for (let i = transactions.length - 1; i >= 0; i--) {
    const transaction = transactions[i];
    const chainId = transaction.chainId;

    // Check if the chainId is not already processed
    if (!result[chainId]) {
      // Extract the networkClientId from history[0].networkClientId
      if (transaction.history && transaction.history.length > 0) {
        const networkClientId = transaction.history[0].networkClientId;
        // Add to result
        result[chainId] = { networkClientId };
      }
    }
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const NetworkController = state?.NetworkController || {};
  const txMeta = state?.TransactionController?.transactions;

  const lastRpcs = getLastRpcByAllChainIds(txMeta);

  const networkConfigurations = NetworkController?.networkConfigurations || {};

  const networkConfigurationsByChainId = Object.values(
    networkConfigurations,
  ).reduce((acc: Record<string, any>, config: any) => {
    const { chainId, id, rpcPrefs, rpcUrl, ticker, nickname } = config;

    const lastUsedRpc = lastRpcs[chainId];

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

    if (chainConfig.rpcEndpoints.length > 0) {
      if (lastUsedRpc) {
        const index = getRpcIndexByNetworkClientId(
          chainConfig.rpcEndpoints,
          lastUsedRpc.networkClientId,
        );
        console.log();
        chainConfig.defaultRpcEndpointIndex = index !== -1 ? index : 0;
      } else {
        chainConfig.defaultRpcEndpointIndex = 0;
      }
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

  return state;
}
