import { constructPermission, PermissionType } from '@metamask/controllers';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';

/**
 * This file contains the specifications of the permissions and caveats
 * that are recognized by our permission system. See the PermissionController
 * README in @metamask/snap-controllers for details.
 */

/**
 * The "keys" of all of permissions recognized by the PermissionController.
 * Permission keys and names have distinct meanings in the permission system.
 */
const PermissionKeys = Object.freeze({
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
 * A PreferencesController identity object.
 *
 * @typedef {object} Identity
 * @property {string} address - The address of the identity.
 * @property {string} name - The name of the identity.
 * @property {number} [lastSelected] - Unix timestamp of when the identity was
 * last selected in the UI.
 */

/**
 * Gets the specifications for all caveats that will be recognized by the
 * PermissionController.
 *
 * @param {{
 *   getIdentities: () => Record<string, Identity>,
 * }} options - Options bag.
 */
export const getCaveatSpecifications = ({ getIdentities }) => {
  return {
    [CaveatTypes.restrictReturnedAccounts]: {
      type: CaveatTypes.restrictReturnedAccounts,

      decorator: (method, caveat) => {
        return async (args) => {
          const result = await method(args);
          return result
            .filter((account) => caveat.value.includes(account))
            .slice(0, 1);
        };
      },

      validator: (caveat, _origin, _target) =>
        validateCaveatAccounts(caveat.value, getIdentities),
    },
  };
};

/**
 * Gets the specifications for all permissions that will be recognized by the
 * PermissionController.
 *
 * @param {{
 *   getAllAccounts: () => Promise<string[]>,
 *   getIdentities: () => Record<string, Identity>,
 * }} options - Options bag.
 * @param options.getAllAccounts - A function that returns all Ethereum accounts
 * in the current MetaMask instance.
 * @param options.getIdentities - A function that returns the
 * `PreferencesController` identity objects for all Ethereum accounts in the
 * @param options.captureKeyringTypesWithMissingIdentities - A function that
 * captures extra error information about the "Missing identity for address"
 * error.
 * current MetaMask instance.
 */
export const getPermissionSpecifications = ({
  getAllAccounts,
  getIdentities,
  captureKeyringTypesWithMissingIdentities,
}) => {
  return {
    [PermissionKeys.eth_accounts]: {
      permissionType: PermissionType.RestrictedMethod,
      targetKey: PermissionKeys.eth_accounts,
      allowedCaveats: [CaveatTypes.restrictReturnedAccounts],

      factory: (permissionOptions, requestData) => {
        if (Array.isArray(permissionOptions.caveats)) {
          throw new Error(
            `${PermissionKeys.eth_accounts} error: Received unexpected caveats. Any permitted caveats will be added automatically.`,
          );
        }

        // This value will be further validated as part of the caveat.
        if (!requestData.approvedAccounts) {
          throw new Error(
            `${PermissionKeys.eth_accounts} error: No approved accounts specified.`,
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
        const identities = getIdentities();

        return accounts.sort((firstAddress, secondAddress) => {
          if (!identities[firstAddress]) {
            captureKeyringTypesWithMissingIdentities(identities, accounts);
            throw new Error(`Missing identity for address: "${firstAddress}".`);
          } else if (!identities[secondAddress]) {
            captureKeyringTypesWithMissingIdentities(identities, accounts);
            throw new Error(
              `Missing identity for address: "${secondAddress}".`,
            );
          } else if (
            identities[firstAddress].lastSelected ===
            identities[secondAddress].lastSelected
          ) {
            return 0;
          } else if (identities[firstAddress].lastSelected === undefined) {
            return 1;
          } else if (identities[secondAddress].lastSelected === undefined) {
            return -1;
          }

          return (
            identities[secondAddress].lastSelected -
            identities[firstAddress].lastSelected
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
            `${PermissionKeys.eth_accounts} error: Invalid caveats. There must be a single caveat of type "${CaveatTypes.restrictReturnedAccounts}".`,
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
 * @param {() => Record<string, Identity>} getIdentities - Gets all
 * PreferencesController identities.
 */
function validateCaveatAccounts(accounts, getIdentities) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error(
      `${PermissionKeys.eth_accounts} error: Expected non-empty array of Ethereum addresses.`,
    );
  }

  const identities = getIdentities();
  accounts.forEach((address) => {
    if (!address || typeof address !== 'string') {
      throw new Error(
        `${PermissionKeys.eth_accounts} error: Expected an array of Ethereum addresses. Received: "${address}".`,
      );
    }

    if (!identities[address]) {
      throw new Error(
        `${PermissionKeys.eth_accounts} error: Received unrecognized address: "${address}".`,
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
