import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { BUILT_IN_NETWORKS } from '@metamask/controller-utils';

const Caip25CaveatType = 'authorizedScopes';
const Caip25EndowmentPermissionName = 'endowment:caip25';

const validNotifications = [
  'accountsChanged',
  'chainChanged',
  'eth_subscription',
];

const validRpcMethods = [
  'wallet_addEthereumChain',
  'wallet_switchEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_revokePermissions',
  'personal_sign',
  'eth_signTypedData_v4',
  'wallet_registerOnboarding',
  'wallet_watchAsset',
  'wallet_scanQRCode',
  'eth_requestAccounts',
  'eth_accounts',
  'eth_sendTransaction',
  'eth_decrypt',
  'eth_getEncryptionPublicKey',
  'web3_clientVersion',
  'eth_subscribe',
  'eth_unsubscribe',
  'eth_blobBaseFee',
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_coinbase',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getBlockReceipts',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber',
  'eth_getCode',
  'eth_getFilterChanges',
  'eth_getFilterLogs',
  'eth_getLogs',
  'eth_getProof',
  'eth_getStorageAt',
  'eth_getTransactionByBlockHashAndIndex',
  'eth_getTransactionByBlockNumberAndIndex',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_getUncleCountByBlockHash',
  'eth_getUncleCountByBlockNumber',
  'eth_maxPriorityFeePerGas',
  'eth_newBlockFilter',
  'eth_newFilter',
  'eth_newPendingTransactionFilter',
  'eth_sendRawTransaction',
  'eth_syncing',
  'eth_uninstallFilter',
];

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 126;

/**
 * This migration transforms `eth_accounts` and `permittedChains` permissions into
 * an equivalent CAIP-25 permission.
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

function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'SnapController') ||
    !hasProperty(state, 'PermissionController') ||
    !isObject(state.PermissionController) ||
    !hasProperty(state, 'NetworkController') ||
    !isObject(state.NetworkController)
  ) {
    return state;
  }
  const {
    PermissionController: { subjects },
    NetworkController: { selectedNetworkClientId, networkConfigurations },
  } = state;
  if (typeof selectedNetworkClientId !== 'string' || !networkConfigurations) {
    return state;
  }

  // don't we actullay want the current chain for the origin specifically?...
  const networkConfiguration =
    networkConfigurations[selectedNetworkClientId] ??
    BUILT_IN_NETWORKS[selectedNetworkClientId];
  const currentChainId = networkConfiguration.chainId;
  if (typeof currentChainId !== 'string') {
    return state;
  }

  if (!isObject(subjects)) {
    return state;
  }

  // use Object.values instead?
  for (const subject of Object.values(subjects)) {
    if (!isObject(subject)) {
      return state;
    }

    const { permissions } = subject;
    if (!isObject(permissions)) {
      return state;
    }

    let basePermission = {};

    let ethAccounts = [];
    if (
      isObject(permissions.eth_accounts) &&
      Array.isArray(permissions.eth_accounts.caveats)
    ) {
      ethAccounts = permissions.eth_accounts.caveats[0]?.value ?? [];
      basePermission = permissions.eth_accounts;
      delete permissions.eth_accounts;
    }

    let chainIds: string[] = [];
    if (
      isObject(permissions.permittedChains) &&
      Array.isArray(permissions.permittedChains.caveats)
    ) {
      chainIds = permissions.permittedChains.caveats[0]?.value ?? [];
      basePermission ??= permissions.permittedChains;
      delete permissions.permittedChains;
    }

    if (permissions[Caip25EndowmentPermissionName]) {
      // nothing to migrate?
      continue;
    }

    if (ethAccounts.length === 0 && chainIds.length === 0) {
      // nothing to migrate
      // have we properly handled snaps here?
      continue;
    }

    if (ethAccounts.length > 0 && chainIds.length === 0) {
      chainIds = [currentChainId];
    }

    const scopes = {};

    chainIds.forEach((chainId) => {
      const scopeString = `eip155:${chainId}`;
      const caipAccounts = ethAccounts.map(
        (account) => `${scopeString}:${account}`,
      );
      scopes[scopeString] = {
        methods: validRpcMethods,
        notifications: validNotifications,
        accounts: caipAccounts,
      };
    });

    permissions[Caip25EndowmentPermissionName] = {
      ...basePermission,
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            requiredScopes: {},
            optionalScopes: scopes,
            isMultichainOrigin: false,
          },
        },
      ],
    };
  }

  return state;
}
