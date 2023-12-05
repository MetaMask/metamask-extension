import {
  constructPermission,
  PermissionType,
} from '@metamask/permission-controller';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { endowmentCaveatSpecifications as snapsEndowmentCaveatSpecifications } from '@metamask/snaps-controllers';
import { caveatSpecifications as snapsCaveatsSpecifications } from '@metamask/snaps-rpc-methods';
///: END:ONLY_INCLUDE_IF
import {
  CaveatTypes,
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
const PermissionNames = Object.freeze({
  ...RestrictedMethods,
});

/**
 * Factory functions for all caveat types recognized by the
 * PermissionController.
 */
const CaveatFactories = Object.freeze({
  [CaveatTypes.restrictReturnedAccounts]: (accounts) => {
    return { type: CaveatTypes.restrictReturnedAccounts, value: accounts };
  },
});

/**
 * Gets the specifications for all caveats that will be recognized by the
 * PermissionController.
 *
 * @param {{
 *   getInternalAccounts: () => Record<string, import('@metamask/keyring-api').InternalAccount>,
 * }} options - Options bag.
 */
export const getCaveatSpecifications = ({ getInternalAccounts }) => {
  return {
    [CaveatTypes.restrictReturnedAccounts]: {
      type: CaveatTypes.restrictReturnedAccounts,

      decorator: (method, caveat) => {
        return async (args) => {
          const result = await method(args);
          return result.filter((account) => caveat.value.includes(account));
        };
      },

      validator: (caveat, _origin, _target) =>
        validateCaveatAccounts(caveat.value, getInternalAccounts),
    },

    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    ...snapsCaveatsSpecifications,
    ...snapsEndowmentCaveatSpecifications,
    ///: END:ONLY_INCLUDE_IF
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
  getAllAccounts,
  getInternalAccounts,
  captureKeyringTypesWithMissingIdentities,
}) => {
  return {
    [PermissionNames.eth_accounts]: {
      permissionType: PermissionType.RestrictedMethod,
      targetName: PermissionNames.eth_accounts,
      allowedCaveats: [CaveatTypes.restrictReturnedAccounts],

      factory: (permissionOptions, requestData) => {
        if (Array.isArray(permissionOptions.caveats)) {
          throw new Error(
            `${PermissionNames.eth_accounts} error: Received unexpected caveats. Any permitted caveats will be added automatically.`,
          );
        }

        // This value will be further validated as part of the caveat.
        if (!requestData.approvedAccounts) {
          throw new Error(
            `${PermissionNames.eth_accounts} error: No approved accounts specified.`,
          );
        }

        return constructPermission({
          ...permissionOptions,
          caveats: [
            CaveatFactories[CaveatTypes.restrictReturnedAccounts](
              requestData.approvedAccounts,
            ),
          ],
        });
      },

      methodImplementation: async (_args) => {
        const accounts = await getAllAccounts();
        const internalAccounts = getInternalAccounts();

        return accounts.sort((firstAddress, secondAddress) => {
          const firstAccount = internalAccounts.find(
            (internalAccount) =>
              internalAccount.address.toLowerCase() ===
              firstAddress.toLowerCase(),
          );

          const secondAccount = internalAccounts.find(
            (internalAccount) =>
              internalAccount.address.toLowerCase() ===
              secondAddress.toLowerCase(),
          );

          if (!firstAccount) {
            captureKeyringTypesWithMissingIdentities(
              internalAccounts,
              accounts,
            );
            throw new Error(`Missing identity for address: "${firstAddress}".`);
          } else if (!secondAccount) {
            captureKeyringTypesWithMissingIdentities(
              internalAccounts,
              accounts,
            );
            throw new Error(
              `Missing identity for address: "${secondAddress}".`,
            );
          } else if (
            firstAccount.metadata.lastSelected ===
            secondAccount.metadata.lastSelected
          ) {
            return 0;
          } else if (firstAccount.metadata.lastSelected === undefined) {
            return 1;
          } else if (secondAccount.metadata.lastSelected === undefined) {
            return -1;
          }

          return (
            secondAccount.metadata.lastSelected -
            firstAccount.metadata.lastSelected
          );
        });
      },

      validator: (permission, _origin, _target) => {
        const { caveats } = permission;
        if (
          !caveats ||
          caveats.length !== 1 ||
          caveats[0].type !== CaveatTypes.restrictReturnedAccounts
        ) {
          throw new Error(
            `${PermissionNames.eth_accounts} error: Invalid caveats. There must be a single caveat of type "${CaveatTypes.restrictReturnedAccounts}".`,
          );
        }
      },
    },
  };
};

/**
 * Validates the accounts associated with a caveat. In essence, ensures that
 * the accounts value is an array of non-empty strings, and that each string
 * corresponds to a PreferencesController identity.
 *
 * @param {string[]} accounts - The accounts associated with the caveat.
 * @param {() => Record<string, import('@metamask/keyring-api').InternalAccount>} getInternalAccounts -
 * Gets all AccountsController InternalAccounts.
 */
function validateCaveatAccounts(accounts, getInternalAccounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error(
      `${PermissionNames.eth_accounts} error: Expected non-empty array of Ethereum addresses.`,
    );
  }

  const internalAccounts = getInternalAccounts();
  accounts.forEach((address) => {
    if (!address || typeof address !== 'string') {
      throw new Error(
        `${PermissionNames.eth_accounts} error: Expected an array of Ethereum addresses. Received: "${address}".`,
      );
    }

    if (
      !internalAccounts.some(
        (internalAccount) =>
          internalAccount.address.toLowerCase() === address.toLowerCase(),
      )
    ) {
      throw new Error(
        `${PermissionNames.eth_accounts} error: Received unrecognized address: "${address}".`,
      );
    }
  });
}

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
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_submitHashrate',
  'eth_submitWork',
  'eth_syncing',
  'eth_uninstallFilter',
  'metamask_getProviderState',
  'metamask_watchAsset',
  'net_listening',
  'net_peerCount',
  'net_version',
  'personal_ecRecover',
  'personal_sign',
  'wallet_watchAsset',
  'web3_clientVersion',
  'web3_sha3',
]);
