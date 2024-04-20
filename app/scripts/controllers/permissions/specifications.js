import {
  constructPermission,
  PermissionType,
} from '@metamask/permission-controller';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import {
  caveatSpecifications as snapsCaveatsSpecifications,
  endowmentCaveatSpecifications as snapsEndowmentCaveatSpecifications,
} from '@metamask/snaps-rpc-methods';
///: END:ONLY_INCLUDE_IF
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';

import { methodsRequiringNetworkSwitch } from '../../../../shared/constants/methods-tags';

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

  [CaveatTypes.restrictNetworkSwitching]: (network) => {
    console.log("caveat factory function", network);
    return { type: CaveatTypes.restrictNetworkSwitching, value: network };
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
export const getCaveatSpecifications = ({ getInternalAccounts, findNetworkClientIdByChainId }) => {
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
    [CaveatTypes.restrictNetworkSwitching]: {
      type: CaveatTypes.restrictNetworkSwitching,

      decorator: (method, caveat) => {
        // not sure what the decorator ought to be here. We really dont need to remove anything from requests that dont have the requisite permissions...  the desired functionality is that in the absense of the correct permission, we prompt to acquire the permission, which is afaik the default behaviour of the permission controller anyways.
        console.log('inside caveat decorator: ', method);
        return method;
      },

      validator: (caveat, _origin, _target) =>
        validateCaveatNetworks(caveat.value, findNetworkClientIdByChainId),
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

    [PermissionNames.wallet_switchEthereumChain]: {
      permissionType: PermissionType.RestrictedMethod,
      targetName: PermissionNames.wallet_switchEthereumChain,
      allowedCaveats: [CaveatTypes.restrictNetworkSwitching],

      factory: (permissionOptions, requestData) => {
        console.log('factory called', permissionOptions, requestData);
        if (Array.isArray(permissionOptions.caveats)) {
          throw new Error(
            `${PermissionNames.eth_accounts} error: Received unexpected caveats. Any permitted caveats will be added automatically.`,
          );
        }

        debugger;
        // This value will be further validated as part of the caveat.
        if (!requestData.approvedNetworkConfiguration) {
          throw new Error(
            `${PermissionNames.wallet_switchEthereumChain} error: No approved networks specified.`,
          );
        }

        const caveat = CaveatFactories[CaveatTypes.restrictNetworkSwitching](
          requestData.approvedNetworkConfiguration,
        );

        debugger;

        return constructPermission({
          ...permissionOptions,
          caveats: [
            caveat
          ],
        });
      },
      methodImplementation: async (_args) => {
        // return list of possible networks given the _args (chainId)
        // In our case, it could be that 1 chain id ends up being more than 1 chain config.
        // Here, we should return all the network configurations with the given chainId.
        console.log("method implementation args: ", _args);

        //findNetworkClientIdByChainId();
        return [];
      },
      validator: (permission, _origin, _target) => {
        const { caveats } = permission;
        console.log('validator called: ', permission, _origin, _target);
        if (
          !caveats ||
          caveats.length !== 1 ||
          caveats[0].type !== CaveatTypes.restrictNetworkSwitching
        ) {
          throw new Error(
            `${PermissionNames.wallet_switchEthereumChain} error: Invalid caveats. There must be a single caveat of type "${CaveatTypes.restrictNetworkSwitching}".`,
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
 * This really should be the same validation / errors that are given from calling
 * switchEthereumChain.
 *
 * @param {string} chainId - The network associated with the caveat
 * @param {() => string} findNetworkClientIdByChainId - method to throw error if network is unknown
 *
 */
function validateCaveatNetworks(chainId, findNetworkClientIdByChainId) {
  console.log("validateCaveatNetworks called: ", chainId, findNetworkClientId);
  if (typeof chainId !== 'string') { // lets put better validation here tho
    throw new Error(
      `${PermissionNames.eth_accounts} error: Expected non-empty array of Ethereum addresses.`,
    );
  }

  const chainIdForCaveat = caveat.value;
  // I think we want to check that this chainId exists in the set of possible chainIds
  // in other words, we need to check if theres a networkConfiguration for this chainId
  // We could use a similar pattern to getInternalAccounts, where we pass another method in that will get the required info from the network controller.
  try {
    findNetworkClientIdByChainId(chainIdForCaveat);
  } catch (e) {
    throw new Error(
      `${PermissionNames.wallet_switchEthereumChain} error: Received unrecognized chainId: "${chainId}". Please try adding the network first via wallet_addEthereumChain.`,
    );
  }
}



/**
 * All unrestricted methods recognized by the PermissionController.
 * Unrestricted methods are ignored by the permission system, but every
 * JSON-RPC request seen by the permission system must correspond to a
 * restricted or unrestricted method, or the request will be rejected with a
 * "method not found" error.
 */
export const unrestrictedMethods = Object.freeze(
  [
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
  ].filter(
    (method) => methodsRequiringNetworkSwitch.includes(method) === false, // actually i dont think we need to do this. Only switchEthereumChain needs to be restricted
  ),
);
