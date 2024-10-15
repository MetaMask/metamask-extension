import {
  caveatSpecifications as snapsCaveatsSpecifications,
  endowmentCaveatSpecifications as snapsEndowmentCaveatSpecifications,
} from '@metamask/snaps-rpc-methods';
import {
  Caip25CaveatFactoryFn,
  Caip25CaveatType,
  caip25EndowmentBuilder,
} from '@metamask/multichain';
import {
  EndowmentTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';

/**
 * This file contains the specifications of the permissions and caveats
 * that are recognized by our permission system. See the PermissionController
 * README in @metamask/controllers for details.
 */

/**
 * The "keys" of all of permissions recognized by the PermissionController.
 * Permission keys and names have distinct meanings in the permission system.
 */
export const PermissionNames = Object.freeze({
  ...RestrictedMethods,
  ...EndowmentTypes,
});

/**
 * Factory functions for all caveat types recognized by the
 * PermissionController.
 */
export const CaveatFactories = Object.freeze({
  [Caip25CaveatType]: Caip25CaveatFactoryFn,
});

/**
 * Gets the specifications for all caveats that will be recognized by the
 * PermissionController.
 */
export const getCaveatSpecifications = () => {
  return {
    [Caip25CaveatType]: {
      type: Caip25CaveatType,
    },
    ...snapsCaveatsSpecifications,
    ...snapsEndowmentCaveatSpecifications,
  };
};

/**
 * Gets the specifications for all permissions that will be recognized by the
 * PermissionController.
 *
 * @param {{
 *   getAllAccounts: () => Promise<string[]>,
 *   getInternalAccounts: () => Record<string, import('@metamask/keyring-api').InternalAccount>,
 * }} options - Options bag.
 * @param options.getAllAccounts - A function that returns all Ethereum accounts
 * in the current MetaMask instance.
 * @param options.getInternalAccounts - A function that returns the
 * `AccountsController` internalAccount objects for all accounts in the
 * @param options.captureKeyringTypesWithMissingIdentities - A function that
 * captures extra error information about the "Missing identity for address"
 * error.
 * current MetaMask instance.
 */
export const getPermissionSpecifications = ({
  getInternalAccounts,
  findNetworkClientIdByChainId,
}) => {
  return {
    [caip25EndowmentBuilder.targetName]:
      caip25EndowmentBuilder.specificationBuilder({
        methodHooks: {
          findNetworkClientIdByChainId,
          getInternalAccounts,
        }
      }),
  };
};

/**
 * Unrestricted methods for Ethereum, see {@link unrestrictedMethods} for more details.
 */
export const unrestrictedEthSigningMethods = Object.freeze([
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
]);

/**
 * All unrestricted methods recognized by the PermissionController.
 * Unrestricted methods are ignored by the permission system, but every
 * JSON-RPC request seen by the permission system must correspond to a
 * restricted or unrestricted method, or the request will be rejected with a
 * "method not found" error.
 */
export const unrestrictedMethods = Object.freeze([
  'eth_blockNumber',
  'eth_call',
  'eth_chainId',
  'eth_coinbase',
  'eth_decrypt',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber',
  'eth_getCode',
  'eth_getEncryptionPublicKey',
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
  'eth_getUncleByBlockHashAndIndex',
  'eth_getUncleByBlockNumberAndIndex',
  'eth_getUncleCountByBlockHash',
  'eth_getUncleCountByBlockNumber',
  'eth_getWork',
  'eth_hashrate',
  'eth_mining',
  'eth_newBlockFilter',
  'eth_newFilter',
  'eth_newPendingTransactionFilter',
  'eth_protocolVersion',
  'eth_requestAccounts',
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_submitHashrate',
  'eth_submitWork',
  'eth_subscribe',
  'eth_syncing',
  'eth_uninstallFilter',
  'eth_unsubscribe',
  'metamask_getProviderState',
  'metamask_logWeb3ShimUsage',
  'metamask_sendDomainMetadata',
  'metamask_watchAsset',
  'net_listening',
  'net_peerCount',
  'net_version',
  'personal_ecRecover',
  'personal_sign',
  'wallet_addEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_revokePermissions',
  'wallet_registerOnboarding',
  'wallet_switchEthereumChain',
  'wallet_watchAsset',
  'web3_clientVersion',
  'web3_sha3',
  'wallet_getAllSnaps',
  'wallet_getSnaps',
  'wallet_requestSnaps',
  'wallet_invokeSnap',
  'wallet_invokeKeyring',
  'snap_getClientStatus',
  'snap_getFile',
  'snap_createInterface',
  'snap_updateInterface',
  'snap_getInterfaceState',
  'snap_resolveInterface',
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  'metamaskinstitutional_authenticate',
  'metamaskinstitutional_reauthenticate',
  'metamaskinstitutional_refresh_token',
  'metamaskinstitutional_supported',
  'metamaskinstitutional_portfolio',
  'metamaskinstitutional_open_swaps',
  'metamaskinstitutional_checkIfTokenIsPresent',
  'metamaskinstitutional_setAccountAndNetwork',
  'metamaskinstitutional_openAddHardwareWallet',
  ///: END:ONLY_INCLUDE_IF
]);
