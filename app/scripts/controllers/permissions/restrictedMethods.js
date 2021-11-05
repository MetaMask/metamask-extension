import {
  restrictedMethods as restrictedSnapMethods,
  selectHooks,
} from '@metamask/rpc-methods';

/**
 * @typedef RestrictedMethodHooks
 *
 * @property {Function} getIdentities - Gets all account identity abstractions,
 * containing account metadata.
 * @property {Function} getKeyringAccounts - Gets all current keyring accounts.
 * @property {Function} addSnap - Installs a requested snap.
 * @property {Function} getSnap - Gets metadata for a specific snap.
 * @property {Function} getSnapRpcHandler - Gets the RPC message handler for a specific snap.
 * @property {Function} showConfirmation - Displays a confirmation for user action.
 */

/**
 * @typedef SnapRestrictedMethodHooks
 *
 * @property {Function} addSnap - Installs a requested snap.
 * @property {Function} getSnap - Gets metadata for a specific snap.
 * @property {Function} getSnapRpcHandler - Gets the RPC message handler for a specific snap.
 * @property {Function} showConfirmation - Displays a confirmation for user action.
 */

/**
 * @param {RestrictedMethodHooks} hooks - Restricted method hooks.
 */
export default function getRestrictedMethods({
  addSnap,
  clearSnapState,
  getIdentities,
  getKeyringAccounts,
  getMnemonic,
  getSnap,
  getSnapRpcHandler,
  getSnapState,
  handleAssetRequest,
  showConfirmation,
  updateSnapState,
}) {
  return {
    ...getCommonRestrictedMethods({ getIdentities, getKeyringAccounts }),
    ...getSnapRestrictedMethods({
      addSnap,
      clearSnapState,
      getSnap,
      getSnapRpcHandler,
      getMnemonic,
      getSnapState,
      handleAssetRequest,
      showConfirmation,
      updateSnapState,
    }),
  };
}

/**
 * @param {SnapRestrictedMethodHooks} hooks - Snap restricted method hooks.
 */
export function getSnapRestrictedMethods(hooks) {
  return restrictedSnapMethods.reduce((restrictedMethods, handler) => {
    restrictedMethods[handler.methodNames[0]] = {
      description: handler.permissionDescription,
      method: handler.getImplementation(selectHooks(hooks, handler.hookNames)),
    };
    return restrictedMethods;
  }, {});
}

export function getCommonRestrictedMethods({
  getIdentities,
  getKeyringAccounts,
}) {
  return {
    eth_accounts: {
      description: 'View Ethereum accounts',
      method: async (_req, res, _next, end) => {
        try {
          const accounts = await getKeyringAccounts();
          const identities = getIdentities();
          res.result = accounts.sort((firstAddress, secondAddress) => {
            if (!identities[firstAddress]) {
              throw new Error(`Missing identity for address ${firstAddress}`);
            } else if (!identities[secondAddress]) {
              throw new Error(`Missing identity for address ${secondAddress}`);
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
          end();
        } catch (err) {
          res.error = err;
          end(err);
        }
      },
    },
  };
}
